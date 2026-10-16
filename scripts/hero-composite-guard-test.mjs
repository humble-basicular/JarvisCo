#!/usr/bin/env node
/* Write-guard regression for scripts/hero-composite.mjs (review R2 findings).
   The repo cases call preflight() only: it throws before anything is written.
   The alias/link cases run the real compositeScreen() against copies in a
   fresh OS temp folder (left in place, nothing deleted) and prove that the
   rejected run changed no input and wrote nothing, inside or outside.
   node scripts/hero-composite-guard-test.mjs <any existing capture png> */
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { compositeScreen, preflight, sha256 } from './hero-composite.mjs';

const capture = resolve(process.argv[2] ?? 'src/assets/showcase/heating-mobile.png');
const hero = 'src/assets/hero/a1-knolling-finished.png';
let passed = 0, skipped = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const checkAsync = async (name, fn) => { await fn(); passed++; console.log(`PASS ${name}`); };

check('a diagnostic sibling may not overwrite the source', () =>
  assert.throws(() => preflight({ source: 'src/assets/hero/a1-knolling-finished-alpha.png', capture, output: hero }), /overwrite an input/));
check('the output may not be the capture', () =>
  assert.throws(() => preflight({ source: 'src/assets/hero/a1-knolling-finished-light.png', capture: hero, output: hero }), /overwrite an input/));
check('outputs must stay inside src/assets', () =>
  assert.throws(() => preflight({ source: hero, capture, output: join(tmpdir(), 'escape.png') }), /inside src\/assets/));
check('relative escapes are resolved first', () =>
  assert.throws(() => preflight({ source: hero, capture, output: 'src/assets/../../escape.png' }), /inside src\/assets/));
check('only .png outputs', () =>
  assert.throws(() => preflight({ source: hero, capture, output: 'src/assets/hero/x.jpg' }), /\.png/));
const dir = mkdtempSync(join(tmpdir(), 'composite-guard-'));
const link = join(dir, 'source.png');
symlinkSync(resolve(hero), link);
check('symlinked inputs are rejected', () =>
  assert.throws(() => preflight({ source: link, capture, output: 'src/assets/hero/new-candidate.png' }), /symlink/));
check('a fresh output inside src/assets passes', () =>
  assert.doesNotThrow(() => preflight({ source: hero, capture, output: 'src/assets/hero/new-candidate.png' })));

// Temp fixture tree: <dir>/assets is the asset root, <dir>/outside must stay untouched.
const root = join(dir, 'assets'), outside = join(dir, 'outside');
mkdirSync(root); mkdirSync(outside);
const source = join(root, 'r2-source.png'), shot = join(root, 'r2-capture.png');
copyFileSync(resolve(hero), source); copyFileSync(capture, shot);
const sourceSha256 = sha256(source), captureSha256 = sha256(shot);
const listing = () => JSON.stringify([readdirSync(root).sort(), readdirSync(outside).sort()]);
async function rejects(output, pattern, assetRoot = root) {
  const before = listing();
  await assert.rejects(compositeScreen({ source, capture: shot, output, sourceSha256, captureSha256, assetRoot }), pattern);
  assert.equal(sha256(source), sourceSha256, 'source changed on rejection');
  assert.equal(sha256(shot), captureSha256, 'capture changed on rejection');
  assert.equal(listing(), before, 'files appeared on rejection');
}

if (existsSync(join(root, 'R2-SOURCE.PNG'))) {
  await checkAsync('a case-variant name of the source is rejected, inputs unchanged', () =>
    rejects(join(root, 'R2-SOURCE.PNG'), /overwrite an input/));
  await checkAsync('a case-variant sibling (-alpha) of the capture is rejected', async () => {
    const capAlpha = join(root, 'cap-alpha.png'); copyFileSync(shot, capAlpha);
    const before = sha256(capAlpha);
    await assert.rejects(compositeScreen({ source, capture: capAlpha, output: join(root, 'CAP.png'), sourceSha256, captureSha256: before, assetRoot: root }), /overwrite an input/);
    assert.equal(sha256(capAlpha), before);
  });
} else { skipped += 2; console.log('SKIP case-variant aliases (case-sensitive filesystem)'); }
const hardlink = join(root, 'hardlink.png');
linkSync(source, hardlink);
await checkAsync('a hardlink of the source is rejected, inputs unchanged', () => rejects(hardlink, /overwrite an input/));
symlinkSync(join(outside, 'target.png'), join(root, 'dangling.png'));
await checkAsync('a dangling output symlink is rejected, no outside write', () => rejects(join(root, 'dangling.png'), /symlink/));
symlinkSync(join(outside, 'sib-alpha.png'), join(root, 'sib-alpha.png'));
await checkAsync('a dangling symlinked sibling (-alpha) is rejected', () => rejects(join(root, 'sib.png'), /symlink/));
symlinkSync(join(outside, 'missing-dir'), join(root, 'dangling-dir'));
await checkAsync('a dangling symlinked folder on the path is rejected', () => rejects(join(root, 'dangling-dir', 'x.png'), /symlink/));
symlinkSync(outside, join(root, 'outside-dir'));
await checkAsync('a live symlinked folder pointing outside is rejected', () => rejects(join(root, 'outside-dir', 'x.png'), /symlink/));
const linkedRoot = join(dir, 'linked-assets');
symlinkSync(outside, linkedRoot);
await checkAsync('a symlinked assets root is rejected', () => rejects(join(linkedRoot, 'x.png'), /real directory/, linkedRoot));
assert.equal(readdirSync(outside).length, 0, 'something was written outside the asset root');
check('a fresh output inside the temp root passes', () =>
  assert.doesNotThrow(() => preflight({ source, capture: shot, output: join(root, 'fresh.png') }, root)));
console.log(`${passed} guard checks passed${skipped ? `, ${skipped} skipped` : ''} (fixtures left at ${dir})`);
