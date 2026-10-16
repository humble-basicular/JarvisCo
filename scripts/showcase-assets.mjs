#!/usr/bin/env node
/* Turn a showcase-capture.mjs run into the committed hero + showcase assets.
   node scripts/showcase-assets.mjs <capture-dir> <a1-knolling-proportions-r2.png>
   - copies the demo screenshots to src/assets/showcase/ (metadata stripped, pixels unchanged)
   - composites the hero-screen capture onto the phone's green screen in the
     AI-generated flat lay A1 (Jarvis's pick 2026-10-16; recipe in src/assets/hero/PROVENANCE.md)
   - writes src/assets/hero/RECEIPT.json (hashes, corners, source commit)
   The source photo is never modified; pixels outside the feathered screen mask
   are checked to be unchanged. Versioned alpha/light maps sit beside the candidate. No deletions. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { compositeScreen } from './hero-composite.mjs';

const [captureArg, heroArg] = process.argv.slice(2);
if (!captureArg || !heroArg) { console.error('usage: showcase-assets.mjs <capture-dir> <a1-knolling-proportions-r2.png>'); process.exit(1); }
const capture = resolve(captureArg);
const hero = resolve(heroArg);
const receipt = JSON.parse(readFileSync(join(capture, 'capture.json'), 'utf8'));
const magick = (...args) => execFileSync('/opt/homebrew/bin/magick', args, { encoding: 'utf8' }).trim();
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const HERO_SHA = 'ea816ae494030ab46aa2ba58dd0d4ea247bb8a9f106d048961c5ddb2d4b7e8a0'; // Drive research/2026-10-16-hero-concepts/originals/a1-knolling-proportions-r2.png
if (sha(hero) !== HERO_SHA) throw new Error('hero source is not the original A1 flat lay');
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

// 2. The site hero: the hero-screen capture (example banner cropped by its measured
// height, see showcase-capture.mjs) composited onto the A1 flat lay's phone.
const screenShot = shot('hero-screen');
const heroReceipt = await compositeScreen({
  source: hero, capture: screenShot.file,
  output: 'src/assets/hero/a1-knolling-finished.png',
  sourceSha256: HERO_SHA, captureSha256: screenShot.sha256, cropTop: Math.round((screenShot.bannerCss ?? 0) * screenShot.dpr),
});
const out = {
  createdAt: new Date().toISOString(),
  capture: { dir: relative(process.cwd(), capture), capturedAt: receipt.capturedAt, sourceCommit: receipt.sourceCommit, route: receipt.route, browser: receipt.browser },
  showcase: outputs,
  hero: heroReceipt,
};
writeFileSync('src/assets/hero/RECEIPT.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
