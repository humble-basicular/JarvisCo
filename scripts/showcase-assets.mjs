#!/usr/bin/env node
/* Turn a showcase-capture.mjs run into the committed hero + showcase assets.
   node scripts/showcase-assets.mjs <capture-dir> <hero-v2.png>
   - copies the demo screenshots to src/assets/showcase/ (metadata stripped, pixels unchanged)
   - composites the hero-screen capture onto the phone's green screen in the
     AI-generated tool-belt photo (hero plan §4 D5, recipe in src/assets/hero/PROVENANCE.md)
   - writes src/assets/hero/RECEIPT.json (hashes, corners, source commit)
   The source photo is never modified; pixels outside the feathered screen mask
   are checked to be unchanged. Work files stay in <capture-dir>/composite/. No deletions. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import sharp from 'sharp';

const [captureArg, heroArg] = process.argv.slice(2);
if (!captureArg || !heroArg) { console.error('usage: showcase-assets.mjs <capture-dir> <hero-v2.png>'); process.exit(1); }
const capture = resolve(captureArg);
const hero = resolve(heroArg);
const receipt = JSON.parse(readFileSync(join(capture, 'capture.json'), 'utf8'));
const magick = (...args) => execFileSync('/opt/homebrew/bin/magick', args, { encoding: 'utf8' }).trim();
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const HERO_SHA = '46da694eba0555f1e349879b2247c6226c48374d14a137b8c4f9d3bbf4468545'; // Drive research/2026-10-15-hero-variants/hero-v2.png
if (sha(hero) !== HERO_SHA) throw new Error('hero source is not the original hero-v2.png');
if (!receipt.demoSourcesClean) throw new Error('capture was taken with uncommitted demo template changes');
const shot = (name) => receipt.shots.find((s) => s.name === name);
for (const s of receipt.shots) if (sha(s.file) !== s.sha256) throw new Error(`${s.name}: capture changed since capture.json`);

// 1. Showcase screenshots: same pixels, metadata stripped.
const showcase = 'src/assets/showcase';
mkdirSync(showcase, { recursive: true });
const outputs = {};
for (const [name, file] of [['mobile', 'heating-mobile.png'], ['desktop', 'heating-desktop.png'], ['tall', 'heating-mobile-tall.png']]) {
  const target = join(showcase, file);
  magick(shot(name).file, '-strip', target);
  if (Number(magick(shot(name).file, target, '-compose', 'Difference', '-composite', '-format', '%[fx:maxima]', 'info:')) !== 0) throw new Error(`${file}: pixels changed`);
  outputs[file] = { from: name, cssViewport: shot(name).cssViewport, dpr: shot(name).dpr, fullPage: shot(name).fullPage, pixels: magick('identify', '-format', '%wx%h', target), sha256: sha(target) };
}

// 2. Hero composite.
const work = join(capture, 'composite');
mkdirSync(work, { recursive: true });
const [W, H] = magick('identify', '-format', '%w %h', hero).split(' ').map(Number);
if (`${W}x${H}` !== '1536x1024') throw new Error('expected the native 1536×1024 hero-v2 (never upscaled)');
const mask = join(work, 'mask.png');
magick(hero, '-fx', '(g>0.55 && r<0.25 && b<0.25) ? 1 : 0', '-threshold', '50%', mask);
// Screen corners = extremes of x+y and x−y over the mask (as corners.py).
const { data, info } = await sharp(mask).greyscale().raw().toBuffer({ resolveWithObject: true });
let tl, tr, br, bl, count = 0;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  if (data[y * info.width + x] < 128) continue;
  count++;
  if (!tl || x + y < tl[0] + tl[1]) tl = [x, y];
  if (!br || x + y > br[0] + br[1]) br = [x, y];
  if (!tr || x - y > tr[0] - tr[1]) tr = [x, y];
  if (!bl || x - y < bl[0] - bl[1]) bl = [x, y];
}
const corners = [tl, tr, br, bl];
const centre = corners.reduce(([x, y], [a, b]) => [x + a / 4, y + b / 4], [0, 0]);
// Rounded display corners: push the quad 4% outwards; the mask clips it back.
const expanded = corners.map(([x, y]) => [+(x + (x - centre[0]) * 0.04).toFixed(1), +(y + (y - centre[1]) * 0.04).toFixed(1)]);
const screenShot = shot('hero-screen');
const [sw, sh] = magick('identify', '-format', '%w %h', screenShot.file).split(' ').map(Number);
const src = [[0, 0], [sw - 1, 0], [sw - 1, sh - 1], [0, sh - 1]];
const pairs = src.map((p, i) => `${p.join(',')} ${expanded[i].join(',')}`).join(' ');
const warped = join(work, 'warped.png');
magick(screenShot.file, '-alpha', 'set', '-virtual-pixel', 'transparent', '-define', `distort:viewport=${W}x${H}+0+0`, '-distort', 'Perspective', pairs, warped);
const alpha = join(work, 'alpha.png');
magick(mask, '-morphology', 'Dilate', 'Disk:1.5', '-blur', '0x0.6', alpha);
const screen = join(work, 'screen.png');
magick(warped, alpha, '-compose', 'CopyOpacity', '-composite', screen);
mkdirSync('src/assets/hero', { recursive: true });
const composite = 'src/assets/hero/toolbelt-heating.png';
magick(hero, screen, '-compose', 'Over', '-composite', '-strip', composite);
const outside = Number(magick(hero, composite, '-compose', 'Difference', '-composite', '(', alpha, '-threshold', '0', '-negate', ')', '-compose', 'Multiply', '-composite', '-format', '%[fx:maxima]', 'info:'));
if (outside !== 0) throw new Error(`pixels changed outside the screen mask: ${outside}`);
const greenLeft = Number(magick(composite, '-fx', '(g>0.55 && r<0.25 && b<0.25) ? 1 : 0', '-format', '%[fx:int(mean*w*h)]', 'info:'));
if (greenLeft > 0) throw new Error(`${greenLeft} green-screen pixels left uncovered`);

const out = {
  createdAt: new Date().toISOString(),
  capture: { dir: relative(process.cwd(), capture), capturedAt: receipt.capturedAt, sourceCommit: receipt.sourceCommit, route: receipt.route, browser: receipt.browser },
  showcase: outputs,
  hero: {
    source: 'Drive Personal Everything/research/2026-10-15-hero-variants/hero-v2.png (AI-generated, ChatGPT Images via Codex; prompts in PROMPTS.md there)',
    sourceSha256: HERO_SHA,
    pixels: `${W}x${H} (tool's native size; not upscaled)`,
    screenCapture: { cssViewport: screenShot.cssViewport, dpr: screenShot.dpr, sha256: screenShot.sha256 },
    maskPixels: count,
    corners,
    expanded,
    mask: 'near-green g>0.55,r<0.25,b<0.25 · Dilate Disk:1.5 · blur 0x0.6',
    composite,
    compositeSha256: sha(composite),
    outsideMaskDifference: outside,
    greenPixelsLeft: greenLeft,
    work: relative(process.cwd(), work), // repo-relative: the repo is public
  },
};
writeFileSync('src/assets/hero/RECEIPT.json', `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify(out, null, 2));
