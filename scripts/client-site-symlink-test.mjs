#!/usr/bin/env node
/* client-site.mjs must refuse symlinked input, photo, and output paths and must
   not touch what they point at. Creates only temporary entries (slug tstsymk222)
   inside previews/, public/previews/ and client-sites/, and removes them again.
   node scripts/client-site-symlink-test.mjs */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = 'tstsymk222';
const outside = mkdtempSync(join(tmpdir(), 'cs-symlink-'));
const sample = readdirSync(join(ROOT, 'previews')).find((f) => f.endsWith('.json') && !f.startsWith(SLUG));
const base = JSON.parse(readFileSync(join(ROOT, 'previews', sample), 'utf8'));
const preview = join(ROOT, 'previews', `${SLUG}.json`);
const photoDir = join(ROOT, 'public', 'previews', SLUG);
const siteDir = join(ROOT, 'client-sites', SLUG);
let failures = 0;
const ok = (cond, label) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failures++; };
const gone = (p) => rmSync(p, { recursive: true, force: true });
const run = (file) => spawnSync('node', ['scripts/client-site.mjs', file, '--site', 'testsite', '--domain', 'example.lt', '--test', 'http://localhost:4330'], { cwd: ROOT, encoding: 'utf8' });
const refused = (r, label) => ok(r.status === 1 && /symlink|outside/.test(r.stderr), `${label}: refused (${r.stderr.trim().slice(0, 90)})`);
const cleanup = () => { for (const p of [preview, photoDir, siteDir, join(ROOT, 'client-sites', `.build-${SLUG}`)]) gone(p); };

try {
  cleanup();
  const data = { ...base, slug: SLUG, photos: [{ src: `/previews/${SLUG}/1.jpg`, width: 10, height: 10 }] };
  const jpg = join(outside, 'secret.jpg');
  writeFileSync(jpg, 'not really a jpeg');

  // 1. symlinked input file
  const real = join(outside, 'real.json');
  writeFileSync(real, JSON.stringify(data));
  symlinkSync(real, preview);
  refused(run(`previews/${SLUG}.json`), 'symlinked input json');
  gone(preview);

  // 2. symlinked photo file
  writeFileSync(preview, JSON.stringify(data));
  mkdirSync(photoDir, { recursive: true });
  symlinkSync(jpg, join(photoDir, '1.jpg'));
  refused(run(`previews/${SLUG}.json`), 'symlinked photo file');
  gone(photoDir);

  // 3. symlinked photo directory
  symlinkSync(outside, photoDir);
  refused(run(`previews/${SLUG}.json`), 'symlinked photo directory');
  gone(photoDir);

  // 4. symlinked output dir: nothing may be written or deleted behind it
  mkdirSync(photoDir, { recursive: true });
  copyFileSync(jpg, join(photoDir, '1.jpg'));
  mkdirSync(join(ROOT, 'client-sites'), { recursive: true });
  const marker = join(outside, 'keep.txt');
  writeFileSync(marker, 'keep');
  symlinkSync(outside, siteDir);
  refused(run(`previews/${SLUG}.json`), 'symlinked output dir');
  ok(existsSync(marker) && readdirSync(outside).sort().join() === ['keep.txt', 'real.json', 'secret.jpg'].sort().join(), 'target of the output symlink untouched');
  gone(siteDir);

  // 5. symlinked stage dir
  symlinkSync(outside, join(ROOT, 'client-sites', `.build-${SLUG}`));
  refused(run(`previews/${SLUG}.json`), 'symlinked stage dir');
  ok(existsSync(marker), 'target of the stage symlink untouched');
} finally {
  cleanup();
  rmSync(outside, { recursive: true, force: true });
}
console.log(failures ? `${failures} check(s) failed` : 'all symlink checks passed');
process.exit(failures ? 1 : 0);
