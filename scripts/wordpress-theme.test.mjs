/* node --test scripts/wordpress-theme.test.mjs
   Needs the frozen baseline (path via VENSLAND_BASELINE_DIR, default: the private Drive baseline folder). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLUG, build, readZipNames, verifyZipNames } from './wordpress-theme.mjs';

const BASE = process.env.VENSLAND_BASELINE_DIR ?? join(homedir(), 'Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/previews/vensland/wordpress-trial-20261025/baseline');
const ARCHIVE = join(BASE, 'vensland-approved-static-f43736a.tar.gz');
const ARCHIVE_SHA = '3ec1686a334e80c25f7233b6ac6bd20228b43c96c92c5fb8bd919b3e9ffe9240';
const MANIFEST = join(BASE, 'manifest.json');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const opts = () => ({ baseline: ARCHIVE, expectSha256: ARCHIVE_SHA, manifestPath: MANIFEST, outDir: join(mkdtempSync(join(tmpdir(), 'vl-out-')), 'o') });

const a = build(opts());
const b = build(opts());
const root = mkdtempSync(join(tmpdir(), 'vl-x-'));
execFileSync('/usr/bin/unzip', ['-q', a.zipPath, '-d', root]);
const theme = join(root, SLUG);

test('deterministic ZIP, safe paths, unzip -t passes', () => {
  assert.equal(a.manifest.zip.sha256, b.manifest.zip.sha256);
  verifyZipNames(readZipNames(readFileSync(a.zipPath)));
  execFileSync('/usr/bin/unzip', ['-tq', a.zipPath]);
  assert.equal(a.manifest.entries, 47);
});

test('wrong archive hash and tampered input are rejected', () => {
  assert.throws(() => build({ ...opts(), expectSha256: '0'.repeat(64) }), /sha256 mismatch/);
});

test('13 routes, canonical/robots verbatim, assets byte-identical to baseline manifest', () => {
  assert.equal(Object.keys(a.manifest.routes).length, 13);
  assert.equal(a.manifest.routes.aciu.robots, 'noindex,follow');
  const base = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  let n = 0;
  for (const f of base.files.filter((x) => /^site\/(foto|_astro)\//.test(x.path))) {
    assert.equal(sha(readFileSync(join(theme, 'assets', f.path.slice(5)))), f.sha256, f.path); n++;
  }
  assert.equal(n, 23);
  assert.equal(readFileSync(join(theme, 'data/sitemap.xml'), 'utf8').match(/<loc>/g).length, 12);
});

test('pages: tracking, endpoints and live form delivery are gone; trial notice present on form pages', () => {
  for (const f of readdirSync(join(theme, 'pages'))) {
    const h = readFileSync(join(theme, 'pages', f), 'utf8');
    assert.ok(!/jarvisweb\.lt\/t\/|sendBeacon|fetch\(|\/aciu\/\?receipt|<\?/.test(h), f);
    assert.ok(!/(?:href|src)="\/(?!\/)/.test(h), `root-relative URL left in ${f}`);
    if (h.includes('<form')) assert.ok(h.includes('nebuvo išsiųsta ir niekur nesaugoma') && h.includes('action="%%VL_SELF%%"'), f);
  }
});

test('only PHP allowlist inside the ZIP and no secret-like strings', () => {
  const names = readZipNames(readFileSync(a.zipPath)).map((e) => e.name);
  assert.deepEqual(names.filter((n) => n.endsWith('.php')).map((n) => n.slice(SLUG.length + 1)).sort(),
    ['functions.php', 'inc/hooks.php', 'inc/isolation.php', 'inc/render.php', 'inc/routing.php', 'index.php']);
  for (const f of readdirSync(join(theme, 'pages'))) assert.ok(!/BEGIN [A-Z ]*PRIVATE KEY|api[_-]?key|secret|password/i.test(readFileSync(join(theme, 'pages', f), 'utf8')), f);
});

test('PHP lint (all theme files) and stub routing/render harness', () => {
  for (const f of ['index.php', 'functions.php', 'inc/hooks.php', 'inc/isolation.php', 'inc/render.php', 'inc/routing.php']) {
    assert.equal(spawnSync('php', ['-l', join(theme, f)]).status, 0, f);
  }
  const r = spawnSync('php', [fileURLToPath(new URL('../src/wordpress-theme/tests/stub-routing.php', import.meta.url)), theme], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

const LOGO = join(BASE, '..', '..', 'logo-proposals-20261025', 'version4', 'vensland-upright-v4.png');
const LOGO_SHA = '259fb13675f523acb98c37f7f4fbe2d710ffe53957d5b0db9e8e8525bb4b2c6e';

test('polish: seam-fix CSS is injected once per page and does not touch the base build otherwise', () => {
  for (const f of readdirSync(join(theme, 'pages'))) {
    const h = readFileSync(join(theme, 'pages', f), 'utf8');
    assert.equal(h.split('id="vl-seam-fix"').length, 2, f);
  }
});

test('polish: explicit logo override is hash-pinned, replaces only assets/foto/logo.png and is recorded in the manifest', () => {
  const o = build({ ...opts(), logo: { path: LOGO, sha256: LOGO_SHA } });
  assert.equal(o.manifest.overrides.length, 1);
  assert.equal(o.manifest.overrides[0].path, 'assets/foto/logo.png');
  assert.equal(o.manifest.overrides[0].sha256, LOGO_SHA);
  assert.notEqual(o.manifest.overrides[0].replacesSha256, LOGO_SHA);
  const changed = Object.keys(o.manifest.files).filter((k) => o.manifest.files[k].sha256 !== a.manifest.files[k]?.sha256).filter((k) => k !== 'vensland-build.json');
  assert.deepEqual(changed, ['assets/foto/logo.png']);
  assert.equal(o.manifest.files['assets/foto/logo.png'].sha256, LOGO_SHA);
  assert.throws(() => build({ ...opts(), logo: { path: LOGO, sha256: '0'.repeat(64) } }), /logo override sha256 mismatch/);
  assert.equal(build({ ...opts(), logo: { path: LOGO, sha256: LOGO_SHA } }).manifest.zip.sha256, o.manifest.zip.sha256, 'deterministic');
});
