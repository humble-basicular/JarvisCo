#!/usr/bin/env node
// Offline, deterministic chroma replacement. No browser, network or paid APIs.
// See src/assets/hero/PROVENANCE.md. The source photograph is never rewritten.
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

/* Every file this engine writes must land inside src/assets, be a regular file
   (or not exist yet) and never alias an input: checked BEFORE anything is
   written, through symlinked folders too (realpath of the nearest existing parent). */
const ASSET_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets');
export function outputPaths(output) {
  if (!/\.png$/i.test(output)) throw new Error('Output must be a .png file');
  const stem = output.replace(/\.png$/i, '');
  return [output, `${stem}-alpha.png`, `${stem}-light.png`, `${stem}-receipt.json`];
}
function realOrParent(path) {
  let p = path, tail = [];
  while (!existsSync(p)) { tail.unshift(basename(p)); const up = dirname(p); if (up === p) break; p = up; }
  return resolve(realpathSync(p), ...tail);
}
export function preflight({ source, capture, output }) {
  for (const input of [source, capture]) if (lstatSync(input).isSymbolicLink()) throw new Error(`Input must not be a symlink: ${input}`);
  const root = realpathSync(ASSET_ROOT);
  const inputs = [realpathSync(source), realpathSync(capture)];
  for (const file of outputPaths(output)) {
    if (existsSync(file) && lstatSync(file).isSymbolicLink()) throw new Error(`Output must not be a symlink: ${file}`);
    const real = realOrParent(file);
    if (!real.startsWith(root + sep)) throw new Error(`Output must stay inside src/assets: ${file}`);
    if (inputs.includes(real)) throw new Error(`Output would overwrite an input: ${file}`);
  }
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const round = (x) => +x.toFixed(4);
const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function lineFit(points, independent) {
  if (points.length < 12) throw new Error('Too few straight-edge samples; inspect screen geometry');
  const dependent = 1 - independent;
  function fit(p) {
    const x = p.reduce((s, a) => s + a[independent], 0) / p.length;
    const y = p.reduce((s, a) => s + a[dependent], 0) / p.length;
    let xx = 0, xy = 0;
    for (const a of p) { xx += (a[independent] - x) ** 2; xy += (a[independent] - x) * (a[dependent] - y); }
    if (xx < 1) throw new Error('Degenerate screen edge');
    return { slope: xy / xx, intercept: y - xy / xx * x };
  }
  let kept = points, model;
  for (let pass = 0; pass < 3; pass++) {
    model = fit(kept);
    const residuals = kept.map((p) => Math.abs(p[dependent] - model.slope * p[independent] - model.intercept));
    const tolerance = Math.max(0.6, median(residuals) * 3.5);
    kept = kept.filter((_, i) => residuals[i] <= tolerance);
  }
  model = fit(kept);
  const rms = Math.sqrt(kept.reduce((s, p) => s + (p[dependent] - model.slope * p[independent] - model.intercept) ** 2, 0) / kept.length);
  return { ...model, rms, samples: kept.length };
}

function intersection(side, cap) {
  // side x=a*y+b; cap y=c*x+d
  const x = (side.slope * cap.intercept + side.intercept) / (1 - side.slope * cap.slope);
  return [x, cap.slope * x + cap.intercept];
}

function solve(matrix, values) {
  const a = matrix.map((row, i) => [...row, values[i]]);
  const n = values.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    [a[pivot], a[col]] = [a[col], a[pivot]];
    if (Math.abs(a[col][col]) < 1e-10) throw new Error('Degenerate homography');
    const divisor = a[col][col];
    for (let j = col; j <= n; j++) a[col][j] /= divisor;
    for (let row = 0; row < n; row++) if (row !== col) {
      const factor = a[row][col];
      for (let j = col; j <= n; j++) a[row][j] -= factor * a[col][j];
    }
  }
  return a.map((row) => row[n]);
}

function inverseHomography(corners) {
  const rows = [], values = [];
  const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  corners.forEach(([x, y], i) => {
    const [u, v] = uv[i];
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); values.push(u);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y]); values.push(v);
  });
  return solve(rows, values);
}

function sample(data, w, h, x, y, c) {
  x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
  const tx = x - x0, ty = y - y0;
  const a = data[(y0 * w + x0) * 3 + c] * (1 - tx) + data[(y0 * w + x1) * 3 + c] * tx;
  const b = data[(y1 * w + x0) * 3 + c] * (1 - tx) + data[(y1 * w + x1) * 3 + c] * tx;
  return a * (1 - ty) + b * ty;
}

function smooth(field, w, h, radius) {
  let a = field;
  // Three separable box passes approximate a low-pass Gaussian; no edge-mask dilation.
  for (let pass = 0; pass < 3; pass++) {
    const b = new Float32Array(a.length), c = new Float32Array(a.length);
    for (let y = 0; y < h; y++) {
      let sum = 0;
      for (let x = -radius; x <= radius; x++) sum += a[y * w + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        b[y * w + x] = sum / (radius * 2 + 1);
        sum += a[y * w + clamp(x + radius + 1, 0, w - 1)] - a[y * w + clamp(x - radius, 0, w - 1)];
      }
    }
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let y = -radius; y <= radius; y++) sum += b[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        c[y * w + x] = sum / (radius * 2 + 1);
        sum += b[clamp(y + radius + 1, 0, h - 1) * w + x] - b[clamp(y - radius, 0, h - 1) * w + x];
      }
    }
    a = c;
  }
  return a;
}

export async function compositeScreen({ source, capture, output, sourceSha256, captureSha256, cropTop = 0, cropBottom = 0, bottomOcclusion = false }) {
  source = resolve(source); capture = resolve(capture); output = resolve(output);
  preflight({ source, capture, output });
  const beforeSource = sha256(source), beforeCapture = sha256(capture);
  if (!sourceSha256 || beforeSource !== sourceSha256) throw new Error('Source SHA-256 mismatch (or missing --source-sha)');
  if (!captureSha256 || beforeCapture !== captureSha256) throw new Error('Capture SHA-256 mismatch (or missing --capture-sha)');
  const { data: photo, info } = await sharp(source).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info, n = w * h;
  const candidates = new Uint8Array(n), core = [];
  for (let p = 0; p < n; p++) {
    const [r, g, b] = photo.subarray(p * 3, p * 3 + 3);
    const excess = g - Math.max(r, b);
    if (excess > 2 && g > 12) candidates[p] = 1;
    if (g > 140 && r < 80 && b < 80 && excess > 100) core.push(p);
  }
  if (core.length < 500) throw new Error('No sufficiently large chroma screen detected');
  // Select the connected green component containing the centre of the strong key.
  const cx = median(core.map((p) => p % w)), cy = median(core.map((p) => Math.floor(p / w)));
  const seed = core.reduce((best, p) => (p % w - cx) ** 2 + (Math.floor(p / w) - cy) ** 2 < (best % w - cx) ** 2 + (Math.floor(best / w) - cy) ** 2 ? p : best);
  const connected = new Uint8Array(n), queue = new Int32Array(n);
  let head = 0, tail = 1; queue[0] = seed; connected[seed] = 1;
  while (head < tail) {
    const p = queue[head++], x = p % w, y = Math.floor(p / w);
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (q >= 0 && candidates[q] && !connected[q]) { connected[q] = 1; queue[tail++] = q; }
    }
  }
  const selectedCore = core.filter((p) => connected[p]);
  if (selectedCore.length / core.length < 0.98) throw new Error('Multiple green regions found; cannot safely infer screen');
  const key = [0, 1, 2].map((c) => median(selectedCore.map((p) => photo[p * 3 + c])));
  const keyExcess = key[1] - Math.max(key[0], key[2]);
  const alpha = new Float32Array(n);
  let x0 = w, y0 = h, x1 = 0, y1 = 0, softPixels = 0;
  for (let i = 0; i < tail; i++) {
    const p = queue[i], offset = p * 3, x = p % w, y = Math.floor(p / w);
    const excess = photo[offset + 1] - Math.max(photo[offset], photo[offset + 2]);
    // Chroma unmixing estimates fractional screen coverage; fully keyed interior.
    const a = clamp(excess / (keyExcess * 0.985));
    alpha[p] = a; if (a > 0 && a < 1) softPixels++;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  // Subpixel 50% alpha crossings along rows/columns; only central straight runs
  // enter robust line fits. Rounded corners and occlusions never define a corner.
  const vertical = [], horizontal = [];
  const at = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? 0 : alpha[y * w + x];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const a = at(x, y), ax = at(x + 1, y), ay = at(x, y + 1);
    if ((a < 0.5) !== (ax < 0.5)) vertical.push([x + (0.5 - a) / (ax - a), y]);
    if ((a < 0.5) !== (ay < 0.5)) horizontal.push([x, y + (0.5 - a) / (ay - a)]);
  }
  // Include left/top transitions immediately outside the nonzero support.
  for (let y = y0; y <= y1; y++) if (at(x0, y) >= 0.5) vertical.push([x0 - 1 + 0.5 / at(x0, y), y]);
  for (let x = x0; x <= x1; x++) if (at(x, y0) >= 0.5) horizontal.push([x, y0 - 1 + 0.5 / at(x, y0)]);
  let xx = 0, xy = 0, yy = 0;
  for (const p of selectedCore) { const x = p % w - cx, y = Math.floor(p / w) - cy; xx += x * x; xy += x * y; yy += y * y; }
  const theta = 0.5 * Math.atan2(2 * xy, yy - xx);
  const u = [Math.cos(theta), -Math.sin(theta)], v = [Math.sin(theta), Math.cos(theta)];
  const project = ([x, y], axis) => (x - cx) * axis[0] + (y - cy) * axis[1];
  const up = selectedCore.map((p) => project([p % w, Math.floor(p / w)], u));
  const vp = selectedCore.map((p) => project([p % w, Math.floor(p / w)], v));
  const stdU = Math.sqrt(up.reduce((s, x) => s + x * x, 0) / up.length);
  const stdV = Math.sqrt(vp.reduce((s, x) => s + x * x, 0) / vp.length);
  const sides = vertical.filter((p) => Math.abs(project(p, v)) < stdV * 0.95);
  const caps = horizontal.filter((p) => Math.abs(project(p, u)) < stdU * 0.95);
  const left = lineFit(sides.filter((p) => project(p, u) < 0), 1);
  const right = lineFit(sides.filter((p) => project(p, u) > 0), 1);
  const top = lineFit(caps.filter((p) => project(p, v) < 0), 0);
  const bottom = lineFit(caps.filter((p) => project(p, v) > 0), 0);
  if (Math.max(left.rms, right.rms, top.rms) > 1.2 || (!bottomOcclusion && bottom.rms > 1.2)) throw new Error('Screen edge fit is unreliable; inspect geometry or declare --bottom-occlusion');
  const corners = [intersection(left, top), intersection(right, top), intersection(right, bottom), intersection(left, bottom)];
  const homography = inverseHomography(corners);
  const meta = await sharp(capture).metadata();
  if (!Number.isInteger(cropTop) || !Number.isInteger(cropBottom) || cropTop < 0 || cropBottom < 0 || cropTop + cropBottom >= meta.height) throw new Error('Invalid capture crop');
  const ch = meta.height - cropTop - cropBottom, cw = meta.width;
  const crop = { left: 0, top: cropTop, width: cw, height: ch };
  // Antialias at the photographed screen's actual pixel footprint before warping.
  // Direct bilinear sampling of a 780px capture into a 135px screen aliases text.
  const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const rw = Math.max(2, Math.round((distance(corners[0], corners[1]) + distance(corners[3], corners[2])) / 2));
  const rh = Math.max(2, Math.round((distance(corners[0], corners[3]) + distance(corners[1], corners[2])) / 2));
  if (rw > cw || rh > ch) throw new Error('Capture resolution too small for this screen; provide a larger capture');
  const captureCorner = await sharp(capture).extract({ left: 0, top: cropTop, width: 1, height: 1 }).removeAlpha().toColourspace('srgb').raw().toBuffer();
  const capturePaper = { r: captureCorner[0], g: captureCorner[1], b: captureCorner[2] };
  // Preserve website proportions. Quiet paper padding accommodates a handset
  // whose screen ratio differs from the supplied viewport; never stretch type.
  const screen = await sharp(capture).extract(crop).removeAlpha().toColourspace('srgb').resize(rw, rh, { fit: 'contain', position: 'centre', background: capturePaper, kernel: 'lanczos3' }).blur(0.35).raw().toBuffer();
  const weights = new Float32Array(n), light = new Float32Array(n);
  for (const p of selectedCore) { if (alpha[p] < 0.98) continue; weights[p] = 1; light[p] = luminance(...photo.subarray(p * 3, p * 3 + 3)); }
  const radius = Math.max(2, Math.round((x1 - x0) / 45));
  const smoothedWeights = smooth(weights, w, h, radius), smoothedLight = smooth(light, w, h, radius);
  const referenceY = median(selectedCore.map((p) => luminance(...photo.subarray(p * 3, p * 3 + 3))));
  // Match the photograph's warm diffuse paper white from quiet border patches.
  const border = [[], [], []];
  for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {
    if (x > w * 0.04 && x < w * 0.96 && y > h * 0.04 && y < h * 0.96) continue;
    const p = (y * w + x) * 3, rgb = [...photo.subarray(p, p + 3)];
    if (Math.min(...rgb) < 220 || Math.max(...rgb) - Math.min(...rgb) > 22) continue;
    rgb.forEach((value, c) => border[c].push(value));
  }
  if (!border[0].length) throw new Error('No neutral paper samples for white-point match');
  const paperWhite = border.map((a) => median(a));
  const white = paperWhite.map((x) => Math.min(245, x - 7));
  const result = Buffer.from(photo), matte = Buffer.alloc(n), map = Buffer.alloc(n);
  let lightMin = Infinity, lightMax = -Infinity, outsideChanged = 0, residualGreen = 0;
  for (let p = 0; p < n; p++) {
    if (!alpha[p]) continue;
    const a = alpha[p], x = p % w, y = Math.floor(p / w), q = p * 3;
    const denominator = homography[6] * x + homography[7] * y + 1;
    const u0 = (homography[0] * x + homography[1] * y + homography[2]) / denominator;
    const v0 = (homography[3] * x + homography[4] * y + homography[5]) / denominator;
    // Extend content 0.75% under the original glass/body; never expand the matte.
    const su = clamp((u0 - 0.5) / 1.015 + 0.5), sv = clamp((v0 - 0.5) / 1.015 + 0.5);
    const illumination = clamp(smoothedWeights[p] > 0.001 ? smoothedLight[p] / smoothedWeights[p] / referenceY : 1, 0.86, 1.08);
    lightMin = Math.min(lightMin, illumination); lightMax = Math.max(lightMax, illumination);
    const falloff = 1 - 0.025 * sv - 0.014 * ((su - 0.5) ** 2 * 4);
    const glare = 0.021 * Math.exp(-(((su - (0.13 + 0.25 * sv)) / 0.36) ** 2)) * (1 - 0.45 * sv);
    const grain = (((Math.imul(p + 1, 1664525) + 1013904223) >>> 8) % 1024 / 1023 - 0.5) * 0.65;
    for (let c = 0; c < 3; c++) {
      const captured = sample(screen, rw, rh, su * (rw - 1), sv * (rh - 1), c);
      // Raised black floor, slightly reduced contrast and photographed white.
      let value = (9 + Math.pow(captured / 255, 0.99) * (white[c] - 9)) * illumination * falloff;
      value = value * (1 - glare) + white[c] * glare + grain;
      // Foreground recovery: original = a*green + (1-a)*phone/glass/pocket.
      // Subtract keyed green (despill), retain recovered original foreground,
      // then put the photographed website underneath fractional edge coverage.
      const residual = Math.max(0, photo[q + c] - a * key[c] * illumination);
      result[q + c] = Math.round(clamp(residual + a * value, 0, 255));
    }
    // Despill only keyed mixed pixels, retaining their neutral foreground light.
    if (a < 1) result[q + 1] = Math.min(result[q + 1], Math.max(result[q], result[q + 2]) + 1);
    matte[p] = Math.round(a * 255); map[p] = Math.round(clamp(illumination / 1.08) * 255);
  }
  for (let p = 0; p < n; p++) {
    const q = p * 3;
    if (!alpha[p] && (result[q] !== photo[q] || result[q + 1] !== photo[q + 1] || result[q + 2] !== photo[q + 2])) outsideChanged++;
    if (result[q + 1] > 140 && result[q] < 64 && result[q + 2] < 64) residualGreen++;
  }
  if (outsideChanged || residualGreen) throw new Error(`Safety check failed: outside=${outsideChanged}, green=${residualGreen}`);
  preflight({ source, capture, output }); // again, right before writing
  mkdirSync(dirname(output), { recursive: true });
  const stem = output.replace(/\.png$/i, '');
  await sharp(result, { raw: { width: w, height: h, channels: 3 } }).png().toFile(output);
  await sharp(matte, { raw: { width: w, height: h, channels: 1 } }).png().toFile(`${stem}-alpha.png`);
  await sharp(map, { raw: { width: w, height: h, channels: 1 } }).png().toFile(`${stem}-light.png`);
  // Verify the encoded file, not just the working buffer.
  const saved = await sharp(output).removeAlpha().raw().toBuffer();
  if (!saved.equals(result)) throw new Error('Encoded PNG pixels do not match verified composite');
  if (sha256(source) !== beforeSource || sha256(capture) !== beforeCapture) throw new Error('Input changed during composite');
  const receipt = {
    version: 2, createdAt: new Date().toISOString(), source: basename(source), sourceSha256: beforeSource,
    capture: basename(capture), captureSha256: beforeCapture, output: basename(output), outputSha256: sha256(output),
    pixels: { width: w, height: h, upscaled: false }, capturePixels: { width: cw, height: meta.height }, crop,
    captureFit: { mode: 'contain', padding: capturePaper, note: 'Website aspect ratio retained; paper padding centred when viewport and handset ratios differ' },
    cropReason: cropTop ? 'Top example banner cropped (its measured height; capture shot taller by the same amount)' : 'No top crop requested',
    key: { rgb: key, componentPixels: tail, softPixels, alpha: 'continuous excess-green unmix; no dilation; original foreground recovered and despilled' },
    edges: Object.fromEntries(Object.entries({ left, right, top, bottom }).map(([k, a]) => [k, Object.fromEntries(Object.entries(a).map(([key, value]) => [key, round(value)]))])),
    corners: corners.map((a) => a.map(round)), contentOversize: 1.015, bottomOcclusion,
    bottomGeometry: bottomOcclusion ? 'Visible pocket boundary fitted for content extent; physical lower glass corners are hidden and not recoverable. Original pocket retained by alpha.' : 'Four straight screen edge fits intersected',
    photoMatch: { paperWhite, screenWhite: white, blackFloor: 9, luminanceMapRange: [round(lightMin), round(lightMax)], antialiasResamplePixels: [rw, rh], resampleKernel: 'lanczos3', opticalBlur: 0.35, glassGlarePeak: 0.021, grainPeakToPeak: 0.65 },
    checks: { outsideScreenChangedPixels: outsideChanged, greenPixelsLeft: residualGreen, encodedPixelsMatch: true, inputHashesUnchanged: true },
  };
  writeFileSync(`${stem}-receipt.json`, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [source, capture, output, ...args] = process.argv.slice(2);
  if (!source || !capture || !output) throw new Error('Usage: node scripts/hero-composite.mjs source.png capture.png output.png --source-sha SHA --capture-sha SHA [--crop-top PX] [--crop-bottom PX] [--bottom-occlusion]');
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bottom-occlusion') { options.bottomOcclusion = true; continue; }
    const name = { '--source-sha': 'sourceSha256', '--capture-sha': 'captureSha256', '--crop-top': 'cropTop', '--crop-bottom': 'cropBottom' }[args[i]];
    if (!name || !args[i + 1]) throw new Error(`Unknown/missing argument: ${args[i]}`);
    options[name] = name.startsWith('crop') ? Number(args[++i]) : args[++i];
  }
  console.log(JSON.stringify(await compositeScreen({ source, capture, output, ...options }), null, 2));
}
