#!/usr/bin/env node
/* VensLand WordPress theme packager.
   node scripts/wordpress-theme.mjs build --baseline <tar.gz> --expect-sha256 <hex> --manifest <baseline manifest.json> --out <NEW dir>
   Verifies the frozen baseline, generates recursive routes, and writes a deterministic theme ZIP + manifest.
   Default trial mode disables outbound forms/tracking. Explicit --mode live retains production behavior,
   with inert/noindex Customizer variants. Read docs/wordpress/VENSLAND-LAUNCH.md before activation. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateRawSync } from 'node:zlib';

export const SLUG = 'vensland-trial-20261025';
export const VERSION = '0.2.2';
export const LIVE_SLUG = 'vensland-launch-20261026';
const THEME_SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'wordpress-theme', 'theme');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const TRACK_SHA = '12d03974a79bf812e4096c00db700e899bd1514c73ac23382cb7925876410a40';
const FETCH_SHA = '7e273968e657df7fffe1300fd6824e502f56e9b89cab2c0d2ce0108915bbebe2';
const TEST_FORM_SHA = '9a24269726f19ff94f526073deabf7eb239287eb5ec9ace129d1534d3328b65e';
const FETCH_START = "    fetch(form.action, {";
const FETCH_END = "      .catch(function () { fail(UNKNOWN, true); });";
export const TRIAL_NOTICE = 'Bandomoji versija: užklausa nebuvo išsiųsta ir niekur nesaugoma. Paskambinkite tiesiai.';
const TRIAL_BLOCK = `    /* WordPress trial theme: no request is made, nothing is sent or stored. */
    state.inFlight = false;
    buttons.forEach(function (b) { b.disabled = false; });
    button.textContent = label;
    errorText.textContent = ${JSON.stringify(TRIAL_NOTICE)};
    errorBox.hidden = false;
    errorBox.focus();`;
/* Seam fix (reproduced in headless Chrome at fractional layout/zoom positions): the divider SVG paints after block backgrounds and is
   anti-aliased on its bottom edge over the divider's own background, leaving a lighter 1px row. A 2px strip in the target colour is
   laid over that edge (a positioned pseudo-element paints above the SVG); the divider also overlaps its predecessor by 1px.
   Grass silhouette, colours and heights are untouched. */
const POLISH_CSS = '<style id="vl-seam-fix">.v3-div{position:relative}.v3-div--from-photo{position:absolute}.v3-div:not(.v3-div--from-photo){margin-top:-1px}'
  + '.v3-div::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;pointer-events:none}'
  + '.v3-div--to-base::after{background:var(--v3-base)}.v3-div--to-accent::after{background:var(--v3-accent)}.v3-div--to-white::after{background:#fff}.v3-div--to-paper::after{background:var(--v3-paper)}</style>';
const LEGACY = { paslaugos: { route: 'home', fragment: 'paslaugos' }, kontaktai: { route: 'home', fragment: 'uzklausa' } };

function fail(m) { throw new Error(m); }

function listTheme(dir, base = dir, out = []) {
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) listTheme(p, base, out); else out.push(relative(base, p).split('\\').join('/'));
  }
  return out;
}

export function transformPage(html, route, slugs, mode = 'trial', testInput = false) {
  if (html.includes('<?') || html.includes('%%VL_')) fail(`${route.slug}: PHP tags or tokens already present`);
  // 1. Preserve production tracker bytes in live mode; remove from trial/Customizer.
  const track = html.match(/<script type="module">const u="https:\/\/jarvisweb\.lt\/t\/e"[\s\S]*?<\/script>/);
  if (route.slug !== 'not-found' && (!track || sha(track[0]) !== TRACK_SHA)) fail(`${route.slug}: tracking script drifted`);
  if (track && mode !== 'live') html = html.replace(track[0], '');
  const ep = `<meta name="jw-endpoint" content="${testInput ? 'http://localhost:4330' : 'https://www.jarvisweb.lt'}/t/e">`;
  if (route.slug !== 'not-found' && html.split(ep).length !== 2) fail(`${route.slug}: endpoint meta`);
  if (mode !== 'live') html = html.replace(ep, '');
  // 2. robots meta -> token (runtime: approved value, or noindex in Customizer preview).
  const rm = html.match(/<meta name="robots" content="([^"]*)">/);
  if (!rm || rm[1] !== route.robots) fail(`${route.slug}: robots meta`);
  html = html.replace(rm[0], '<meta name="robots" content="%%VL_ROBOTS%%">');
  // 3. Live retains the standalone form; trial/Customizer receives a local notice without fetch.
  const forms = (html.match(/data-callback-form(?:[\s=>])/g) || []).length;
  const act = `action="${testInput ? 'http://localhost:4330' : 'https://www.jarvisweb.lt'}/t/form"`;
  if (html.split(act).length - 1 !== forms) fail(`${route.slug}: form action count`);
  if (mode !== 'live') html = html.split(act).join('action="%%VL_SELF%%"').replace(/ data-widget-key="[^"]*"/g, '');
  if (testInput && forms) {
    const formScript = html.match(/<script>\/\* Form validation,[\s\S]*?<\/script>/);
    if (!formScript || sha(formScript[0]) !== TEST_FORM_SHA) fail(`${route.slug}: test form source drifted`);
    html = html.replace(formScript[0], `<script>document.querySelectorAll('[data-callback-form]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var b=f.querySelector('[data-form-error]');f.querySelector('[data-form-error-text]').textContent=${JSON.stringify(TRIAL_NOTICE)};b.hidden=false;b.focus();});});</script>`);
  } else if (forms && mode !== 'live') {
    const i = html.indexOf(FETCH_START); const j = html.indexOf(FETCH_END, i) + FETCH_END.length;
    if (i < 0 || j < FETCH_END.length || html.indexOf(FETCH_START, i + 1) >= 0 || sha(html.slice(i, j)) !== FETCH_SHA) fail(`${route.slug}: form script drifted`);
    html = html.slice(0, i) + TRIAL_BLOCK + html.slice(j);
  } else if (mode !== 'live' && !forms && html.includes('fetch(')) fail(`${route.slug}: unexpected fetch`);
  // 4. root-relative URLs: routes -> tokens, assets -> theme assets. Anything else root-relative fails the build.
  html = html.replace(/\b(href|src)="(\/[^"]*)"/g, (all, attr, v) => {
    if (/^\/(foto|_astro)\/[A-Za-z0-9._-]+$/.test(v)) return `${attr}="%%VL_ASSET%%${v}"`;
    const [path, fragment] = v.split('#');
    if (fragment !== undefined && !/^[a-z0-9-]+$/.test(fragment)) fail(`${route.slug}: unsafe fragment`);
    const s = slugs.get(path);
    if (s !== undefined && attr === 'href') return `href="%%VL_URL:${s}%%${fragment ? '#' + fragment : ''}"`;
    return fail(`${route.slug}: unmapped ${attr}="${v}"`);
  });
  html = html.replace(/\bsrcset="([^"]*)"/g, (all, values) => {
    const out = values.split(',').map(v => {
      const m = v.trim().match(/^(\/(?:foto|_astro)\/[A-Za-z0-9._-]+)( \d+w)?$/);
      if (!m) fail(`${route.slug}: unmapped srcset ${v}`);
      return `%%VL_ASSET%%${m[1]}${m[2] ?? ''}`;
    });
    return `srcset="${out.join(', ')}"`;
  });
  html = html.replace(/url\(\/_astro\/([A-Za-z0-9._-]+)\)/g, 'url(%%VL_ASSET%%/_astro/$1)');
  // 5. WordPress head/body/footer hooks (Customizer preview needs them).
  for (const [from, to] of [['</head>', (mode === 'trial' ? POLISH_CSS : '') + '%%VL_HEAD%%</head>'], ['</body>', '%%VL_FOOTER%%</body>']]) {
    if (html.split(from).length !== 2) fail(`${route.slug}: ${from}`);
    html = html.replace(from, to);
  }
  const body = html.match(/<body[^>]*>/);
  if (!body) fail(`${route.slug}: body`);
  html = html.replace(body[0], body[0] + '%%VL_BODY_OPEN%%');
  if (mode !== 'live' && /\/aciu\/\?receipt|jarvisweb\.lt\/t\/|sendBeacon/.test(html)) fail(`${route.slug}: outbound/receipt remnants`);
  return html;
}

function zipStore(entries) { // deterministic ZIP: sorted, fixed time, 0644
  const chunks = []; const central = []; let off = 0;
  const dos = { time: 0, date: ((2026 - 1980) << 9) | (10 << 5) | 25 };
  for (const [name, data] of [...entries].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const nm = Buffer.from(name); const c = crc32(data);
    let comp = deflateRawSync(data, { level: 9 }); let method = 8;
    if (comp.length >= data.length) { comp = data; method = 0; }
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(dos.time, 10); lh.writeUInt16LE(dos.date, 12); lh.writeUInt32LE(c, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26);
    chunks.push(lh, nm, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(0x031e, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(dos.time, 12); ch.writeUInt16LE(dos.date, 14); ch.writeUInt32LE(c, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nm.length, 28);
    ch.writeUInt32LE((0o100644 << 16) >>> 0, 38); ch.writeUInt32LE(off, 42);
    central.push(ch, nm); off += 30 + nm.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...chunks, cd, end]);
}

/** Independent reader of the central directory: names, sizes, methods. Used by verify and tests. */
export function readZipNames(zip) {
  const e = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (e < 0) fail('no end of central directory');
  const n = zip.readUInt16LE(e + 10); let p = zip.readUInt32LE(e + 16); const out = [];
  for (let i = 0; i < n; i++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) fail('bad central entry');
    const nl = zip.readUInt16LE(p + 28), xl = zip.readUInt16LE(p + 30), cl = zip.readUInt16LE(p + 32);
    out.push({ name: zip.toString('utf8', p + 46, p + 46 + nl), attr: zip.readUInt32LE(p + 38) >>> 16, size: zip.readUInt32LE(p + 24) });
    p += 46 + nl + xl + cl;
  }
  return out;
}

export function verifyZipNames(entries, slug = SLUG) {
  const seen = new Set();
  for (const { name, attr } of entries) {
    if (!name.startsWith(`${slug}/`) || name.includes('..') || name.includes('\\') || name.startsWith('/') || !/^[A-Za-z0-9._\/-]+$/.test(name)) fail(`unsafe zip path ${name}`);
    if (seen.has(name)) fail(`duplicate ${name}`); seen.add(name);
    if ((attr & 0o170000) !== 0o100000) fail(`non-regular entry ${name}`);
    if (/\.php$/.test(name) && !/^[^/]+\/(index\.php|functions\.php|inc\/[a-z]+\.php)$/.test(name)) fail(`php outside allowlist ${name}`);
    if (/(^|\/)\.|\.(env|pem|key|sh)$/.test(name)) fail(`hidden/secret-like file ${name}`);
  }
}

/** Explicit, narrow asset override: one approved-by-hash PNG replaces one asset path. Dimensions must match the page markup. */
export function loadLogoOverride({ path, sha256 }) {
  const b = readFileSync(path);
  if (sha(b) !== sha256) fail('logo override sha256 mismatch');
  if (b.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || b.subarray(12, 16).toString() !== 'IHDR') fail('logo override is not a PNG');
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  if (w !== 2172 || h !== 724 || b[24] !== 8 || b[25] !== 6) fail(`logo override must be 2172x724 8-bit RGBA, got ${w}x${h} depth ${b[24]} type ${b[25]}`);
  return { file: 'assets/foto/logo.png', data: b, sha256, bytes: b.length };
}

export function build({ baseline, expectSha256, manifestPath, outDir, inputDir, logo, mode = 'trial', migrations = {}, testInput = false }) {
  if (testInput && mode !== 'trial') fail('test input is trial-only');
  if (!['trial', 'live'].includes(mode)) fail('mode must be trial or live');
  const themeSlug = mode === 'live' ? LIVE_SLUG : SLUG;
  if (existsSync(outDir) && readdirSync(outDir).length) fail(`out dir not empty: ${outDir}`);
  let siteRoot = inputDir; let tmp;
  const baseManifest = manifestPath ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
  if (!siteRoot) {
    const buf = readFileSync(baseline);
    if (sha(buf) !== expectSha256) fail('baseline archive sha256 mismatch');
    const lines = execFileSync('tar', ['-tzvf', baseline], { encoding: 'utf8' }).trim().split('\n');
    for (const l of lines) {
      const name = l.split(/\s+/).slice(8).join(' ');
      if (l[0] !== '-' || !name || name.startsWith('/') || name.split('/').includes('..')) fail(`unsafe archive member: ${l}`);
    }
    tmp = mkdtempSync(join(tmpdir(), 'vensland-in-'));
    execFileSync('tar', ['-xzf', baseline, '-C', tmp, '--no-same-owner']);
    siteRoot = tmp;
  }
  try {
    if (baseManifest) {
      for (const f of baseManifest.files) {
        const b = readFileSync(join(siteRoot, f.path));
        if (sha(b) !== f.sha256 || b.length !== f.bytes) fail(`input mismatch: ${f.path}`);
      }
    }
    const site = join(siteRoot, 'site');
    const htmlFiles = listTheme(site).filter(f => f === 'index.html' || f.endsWith('/index.html') || f === '404.html');
    const routes = {};
    for (const f of htmlFiles) {
      const path = f === 'index.html' ? '' : f === '404.html' ? '404.html' : f.slice(0, -11);
      if (path !== '404.html' && !/^(|[a-z0-9-]+(?:\/[a-z0-9-]+)*)$/.test(path)) fail(`bad page path ${path}`);
      const slug = path === '' ? 'home' : path === '404.html' ? 'not-found' : path.replaceAll('/', '--');
      if (routes[slug]) fail(`duplicate route ${slug}`);
      routes[slug] = { slug, path, input: f };
    }
    if (!routes.home) fail('missing home page');
    if (mode === 'live' && !routes['not-found']) fail('live mode needs approved 404.html');
    const slugs = new Map(Object.values(routes).map((r) => [r.path === '' ? '/' : r.path === '404.html' ? '/404.html' : `/${r.path}/`, r.slug]));
    const files = new Map(); const routeTable = {};
    for (const r of Object.values(routes)) {
      const html = readFileSync(join(site, r.input), 'utf8');
      r.robots = html.match(/<meta name="robots" content="([^"]*)">/)[1];
      const canonical = html.match(/<link rel="canonical" href="([^"]*)">/)?.[1] ?? '';
      if (r.slug !== 'not-found' && canonical !== `https://vensland.lt/${r.path}${r.path ? '/' : ''}`) fail(`canonical drift ${r.slug}`);
      files.set(`pages/${r.slug}.html`, Buffer.from(transformPage(html, r, slugs, mode, testInput)));
      routeTable[r.slug] = { path: r.path, file: `${r.slug}.html`, robots: r.robots, canonical, status: r.slug === 'not-found' ? 404 : 200 };
      if (mode === 'live') {
        files.set(`pages/${r.slug}-preview.html`, Buffer.from(transformPage(html, r, slugs, 'preview')));
        routeTable[r.slug].previewFile = `${r.slug}-preview.html`;
      }
    }
    for (const sub of ['foto', '_astro']) for (const n of readdirSync(join(site, sub)).sort()) files.set(`assets/${sub}/${n}`, readFileSync(join(site, sub, n)));
    const overrides = [];
    if (logo) {
      const o = loadLogoOverride(logo); const was = files.get(o.file);
      if (!was) fail('logo override target missing');
      overrides.push({ path: o.file, replacesSha256: sha(was), sha256: o.sha256, bytes: o.bytes, reason: 'user-requested upright (non-italic) VensLand logo, version4' });
      files.set(o.file, o.data);
    }
    files.set('data/sitemap.xml', readFileSync(join(site, 'sitemap.xml')));
    files.set('data/robots.txt', readFileSync(join(site, 'robots.txt')));
    files.set('routes.json', Buffer.from(JSON.stringify({ version: 1, mode, routes: routeTable, legacy: LEGACY, migrations, sitemap: true }, null, 2) + '\n'));
    for (const [from, to] of Object.entries(migrations)) {
      if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(from) || !routeTable[to.route] || !/^[a-z0-9-]*$/.test(to.fragment ?? '') || routeTable[to.route].status === 404) fail(`invalid migration ${from}`);
    }
    for (const f of listTheme(THEME_SRC)) files.set(f, readFileSync(join(THEME_SRC, f)));
    if (mode === 'live') files.set('style.css', Buffer.from(`/*\nTheme Name: VensLand Launch 2026-10-26\nVersion: ${VERSION}\nRequires at least: 5.8\nRequires PHP: 7.4\nDescription: Approved static VensLand site. Live Worker forms and tracking; activation gates in VENSLAND-LAUNCH.md.\nText Domain: ${themeSlug}\n*/\n`));
    const inner = Object.fromEntries([...files].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => [k, { bytes: v.length, sha256: sha(v) }]));
    files.set('vensland-build.json', Buffer.from(JSON.stringify({ theme: themeSlug, version: VERSION, mode, overrides, sourceCommit: baseManifest?.sourceCommit ?? null, files: inner }, null, 2) + '\n'));
    const entries = [...files].map(([k, v]) => [`${themeSlug}/${k}`, v]);
    const zip = zipStore(entries);
    verifyZipNames(readZipNames(zip), themeSlug);
    mkdirSync(outDir, { recursive: true });
    const zipPath = join(outDir, `${themeSlug}.zip`);
    writeFileSync(zipPath, zip);
    const manifest = { theme: themeSlug, version: VERSION, mode, zip: { file: `${themeSlug}.zip`, bytes: zip.length, sha256: sha(zip) },
      baseline: { archiveSha256: expectSha256 ?? null, sourceCommit: baseManifest?.sourceCommit ?? null, files: baseManifest?.files.length ?? null },
      routes: routeTable, legacy: LEGACY, migrations, overrides, entries: entries.length, files: inner };
    writeFileSync(join(outDir, `${themeSlug}.manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
    return { zipPath, manifest };
  } finally { if (tmp) rmSync(tmp, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  const a = {}; for (let i = 0; i < rest.length; i += 2) a[rest[i].replace(/^--/, '')] = rest[i + 1];
  if (cmd === 'build' && a.out && (a.baseline || a['input-dir'])) {
    const r = build({ baseline: a.baseline, expectSha256: a['expect-sha256'], manifestPath: a.manifest, outDir: resolve(a.out), mode: a.mode ?? 'trial', testInput: a['test-input'] === 'true', migrations: a.migrations ? JSON.parse(readFileSync(a.migrations, 'utf8')) : {}, logo: a.logo ? { path: resolve(a.logo), sha256: a['logo-sha256'] } : undefined, inputDir: a['input-dir'] && resolve(a['input-dir']) });
    console.log(JSON.stringify({ zip: r.zipPath, sha256: r.manifest.zip.sha256, bytes: r.manifest.zip.bytes, entries: r.manifest.entries }, null, 2));
  } else if (cmd === 'verify' && a.zip) {
    const e = readZipNames(readFileSync(a.zip)); verifyZipNames(e, e[0]?.name.split('/')[0]); console.log(`ok ${e.length} entries`);
  } else { console.error('usage: build --baseline <tar.gz> --expect-sha256 <hex> --manifest <json> --out <new dir> [--mode trial|live --migrations <json>] [--logo <png> --logo-sha256 <hex>] | verify --zip <zip>'); process.exit(2); }
}
