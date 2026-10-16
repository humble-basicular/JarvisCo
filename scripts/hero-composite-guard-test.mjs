#!/usr/bin/env node
/* Write-guard regression for scripts/hero-composite.mjs (review R2 finding 2).
   Calls preflight() only: it throws before anything is written, so this test
   creates no files except one symlink in the OS temp folder (left in place).
   node scripts/hero-composite-guard-test.mjs <any existing capture png> */
import assert from 'node:assert/strict';
import { mkdtempSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { preflight } from './hero-composite.mjs';

const capture = resolve(process.argv[2] ?? 'src/assets/showcase/heating-mobile.png');
const hero = 'src/assets/hero/a1-knolling-finished.png';
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };

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
console.log(`${passed} guard checks passed (symlink fixture left at ${dir})`);
