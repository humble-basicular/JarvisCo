#!/usr/bin/env node
/* Turn a showcase-capture.mjs run into the committed hero + showcase assets.
   node scripts/showcase-assets.mjs <capture-dir> <hero-v2.png>
   - copies the demo screenshots to src/assets/showcase/ (metadata stripped, pixels unchanged)
   - composites the hero-screen capture onto the phone's green screen in the
     AI-generated tool-belt photo (hero plan §4 D5, recipe in src/assets/hero/PROVENANCE.md)
   - writes src/assets/hero/RECEIPT-v2.json (hashes, corners, source commit)
   The source photo is never modified; pixels outside the feathered screen mask
   are checked to be unchanged. Versioned alpha/light maps sit beside the candidate. No deletions. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { compositeScreen } from './hero-composite.mjs';

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

// 2. Prepare a versioned candidate; current site hero is deliberately unchanged.
// The supplied capture includes a 146px example bar. For redesigned captures use
// the standalone hero-composite CLI with an explicit crop (see PROVENANCE.md).
const screenShot = shot('hero-screen');
const heroReceipt = await compositeScreen({
  source: hero, capture: screenShot.file,
  output: 'src/assets/hero/toolbelt-heating-v2.png',
  sourceSha256: HERO_SHA, captureSha256: screenShot.sha256, cropTop: 146,
});
const out = {
  createdAt: new Date().toISOString(),
  capture: { dir: relative(process.cwd(), capture), capturedAt: receipt.capturedAt, sourceCommit: receipt.sourceCommit, route: receipt.route, browser: receipt.browser },
  showcase: outputs,
  hero: heroReceipt,
};
writeFileSync('src/assets/hero/RECEIPT-v2.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
