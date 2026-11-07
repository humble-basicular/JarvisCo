#!/usr/bin/env node
/* Derive pixel-exact glass masks for the approved device art (originals are read-only inputs).
   For each frame: flood-fill the screen glass from its centre (luminance above the black bezel line),
   give the boundary row a soft alpha from the frame's own luminance (anti-aliased edge, no halo),
   fit straight lines to the four glass edges and intersect them -> projection quad, pushed out by PAD px
   so the projected screen fully covers the glass and the mask alone trims it.
   Writes public/jarvis-systems/device/<name>-glass.webp (white + alpha, 1080x1336) and prints quads.
   node scripts/o2-device-masks.mjs */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
const FRAMES = [
  { name: 'phone-left', src: 'public/jarvis-systems/phone.webp', seed: [600, 640], lo: 6, hi: 30 },
  { name: 'phone-right', src: 'public/jarvis-systems/phone-right-mascot.webp', seed: [470, 640], lo: 6, hi: 30 },
  { name: 'laptop', src: 'public/jarvis-systems/laptop-blank.webp', seed: [540, 620], lo: 11, hi: 26 },
];
const PAD = 3;
mkdirSync('public/jarvis-systems/device', { recursive: true });
const out = {};
for (const F of FRAMES) {
  const { data, info } = await sharp(F.src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const L = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) L[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
  const thr = (F.lo + F.hi) / 2;
  const inside = new Uint8Array(W * H);
  const st = [F.seed[1] * W + F.seed[0]];
  inside[st[0]] = 1;
  while (st.length) {
    const p = st.pop(); const x = p % W, y = (p / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const q = ny * W + nx; if (inside[q] || L[q] < thr) continue; inside[q] = 1; st.push(q);
    }
  }
  // alpha: interior 255; pixels next to the region get partial alpha from their luminance (edge AA)
  const A = new Uint8Array(W * H);
  let area = 0, minX = W, maxX = 0, minY = H, maxY = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const p = y * W + x;
    if (inside[p]) { A[p] = 255; area++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; continue; }
    if (inside[p - 1] || inside[p + 1] || inside[p - W] || inside[p + W]) {
      const a = Math.max(0, Math.min(1, (L[p] - F.lo) / (F.hi - F.lo)));
      A[p] = Math.round(a * 255);
    }
  }
  // edge lines from the straight middle portions
  const edge = (axis, from, to, scan) => {
    const pts = [];
    for (let t = Math.round(from); t <= to; t += 2) {
      if (axis === 'row') { const xs = scan > 0 ? [...Array(W).keys()] : [...Array(W).keys()].reverse(); const x = xs.find((xx) => inside[t * W + xx]); if (x !== undefined) pts.push([t, x]); }
      else { const ys = scan > 0 ? [...Array(H).keys()] : [...Array(H).keys()].reverse(); const y = ys.find((yy) => inside[yy * W + t]); if (y !== undefined) pts.push([t, y]); }
    }
    const n = pts.length, sx = pts.reduce((s, p) => s + p[0], 0), sy = pts.reduce((s, p) => s + p[1], 0);
    const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0), sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
    const a = (n * sxy - sx * sy) / (n * sxx - sx * sx); const b = (sy - a * sx) / n;
    return { a, b }; // value = a*t + b
  };
  const h = maxY - minY, w = maxX - minX;
  const left = edge('row', minY + 0.2 * h, maxY - 0.2 * h, 1);   // x = a*y + b
  const right = edge('row', minY + 0.2 * h, maxY - 0.2 * h, -1);
  const top = edge('col', minX + 0.3 * w, maxX - 0.3 * w, 1);    // y = a*x + b
  const bot = edge('col', minX + 0.3 * w, maxX - 0.3 * w, -1);
  left.b -= PAD; right.b += PAD; top.b -= PAD; bot.b += PAD;
  const meet = (v, hz) => { // v: x = a*y+b ; hz: y = c*x+d
    const y = (hz.a * v.b + hz.b) / (1 - hz.a * v.a); const x = v.a * y + v.b; return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  };
  const quad = [meet(left, top), meet(right, top), meet(right, bot), meet(left, bot)];
  const rgba = Buffer.alloc(W * H * 4, 255);
  for (let i = 0; i < W * H; i++) rgba[i * 4 + 3] = A[i];
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).webp({ lossless: true }).toFile(`public/jarvis-systems/device/${F.name}-glass.webp`);
  out[F.name] = { quad, bbox: [minX, minY, maxX, maxY], area };
}
console.log(JSON.stringify(out, null, 1));
