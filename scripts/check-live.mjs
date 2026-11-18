#!/usr/bin/env node
/* Live readback after a deploy (S5, 18 Nov 2026). Read-only GETs against https://jarvisweb.lt (or BASE=...).
   node scripts/check-live.mjs [--perziura-only]
   1. all 83 /perziura pages equal the overlay tarball content. jarvisweb.lt sits behind Cloudflare, which rewrites e-mail
      addresses in HTML ("email-protection" + decode script), so that rewrite is reversed before comparing (proven 18 Nov:
      35 pages byte-identical raw, 48 identical after reversal, 0 other differences).
   2. /taisykles: 50 %, 48,50 €, 15 € one-time domain, 999 €, 0,08 €, no 60 % / 58,20 / "domenas įskaičiuotas".
   3. key pages 200, no 'TODO-ID', configured YouTube IDs present on their pages, no old card name.
   Exit 1 on any failure. Needs a prior `npm run videos:fill` build (reads src/data/o2-videos.js for the IDs). */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
const BASE = (process.env.BASE ?? 'https://jarvisweb.lt').replace(/\/$/, '');
const errors = [];
const get = async (p) => { const r = await fetch(BASE + p, { redirect: 'follow', headers: { 'accept-encoding': 'identity' } }); return { status: r.status, text: await r.text() }; };
const dec = (h) => { const k = parseInt(h.slice(0, 2), 16); let o = ''; for (let i = 2; i < h.length; i += 2) o += String.fromCharCode(parseInt(h.slice(i, i + 2), 16) ^ k); return o; };
const unCf = (s) => s.replace(/<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/a>/g, (_, h) => dec(h))
  .replace(/\/cdn-cgi\/l\/email-protection#([0-9a-f]+)/g, (_, h) => 'mailto:' + dec(h)).replace(/<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[^"]*email-decode[^"]*"><\/script>/g, '');
// 1. /perziura
const tgz = process.env.OVERLAY_TGZ ?? [`${process.env.HOME}/Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/management/site-s5-20261118/overlay/overlay-perziura-previews-83.tgz`].find(existsSync);
const tmp = join(tmpdir(), `check-live-${process.pid}`);
execSync(`mkdir -p "${tmp}" && tar -xzf "${tgz}" -C "${tmp}"`);
const pages = []; const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : n === 'index.html' && pages.push(p); } }; walk(join(tmp, 'dist/perziura'));
let same = 0;
for (const f of pages) {
  const url = f.slice(join(tmp, 'dist').length, -'index.html'.length);
  const r = await get(url);
  if (r.status === 200 && unCf(r.text) === readFileSync(f, 'utf8')) same++; else errors.push(`/perziura mismatch or non-200: ${url} (${r.status})`);
}
console.log(`/perziura: ${same}/${pages.length} pages identical to the overlay (Cloudflare e-mail rewrite reversed)`);
if (pages.length !== 83) errors.push(`expected 83 overlay pages, found ${pages.length}`);
execSync(`rm -rf "${tmp}"`);
if (!process.argv.includes('--perziura-only')) {
  // 2. terms
  const t = await get('/taisykles'); const tx = t.text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
  for (const [l, re] of [['50 % = 48,50 €', /grąžiname 50 % pirmo mokėjimo \(48,50 €\)/], ['domain 15 € one-time', /neturite, taikomas vienkartinis 15 € domeno mokestis/], ['999 €', /999 € vienkartinai/], ['0,08 €', /0,08 €/], ['97 €/mėn.', /97 €\/mėn\./], ['7 dienas', /per 7 dienas/]]) if (!re.test(tx)) errors.push(`/taisykles missing: ${l}`);
  if (t.status !== 200 || /60 ?% pirmo|58,20|domenas įskaičiuotas/i.test(tx)) errors.push('/taisykles status or old wording (60 % / 58,20 / domain included)');
  console.log('/taisykles: ' + (errors.some((e) => e.startsWith('/taisykles')) ? 'FAIL' : '50 % + all terms ok'));
  // 3. pages
  const vids = readFileSync('src/data/o2-videos.js', 'utf8');
  const id = (k) => (vids.match(new RegExp(`(?:'${k}'|${k}):\\s*\\{\\s*id:\\s*'([^']+)'`)) ?? [])[1];
  const fixing = (k) => new RegExp(`(?:'${k}'|${k}):\\s*\\{\\s*tvarkomas:\\s*true`).test(vids);
  const allIds = new Set([...vids.matchAll(/\bid:\s*'([A-Za-z0-9_-]{11})'/g)].map((m) => m[1]));
  const where = { '/': ['intro', 'svetaine', 'skambuciai', 'atsiliepimai-sistema', 'kampanijos', 'seo', 'dezute'], '/susisieksime': ['susisieksime'], '/kontaktai': ['susisieksime'], '/registracija': ['intro'],
    '/funkcijos/funkcionali-svetaine': ['svetaine'], '/funkcijos/praleistas-skambutis': ['skambuciai'], '/funkcijos/atsiliepimu-rinkimas': ['atsiliepimai-sistema'], '/funkcijos/kampanijos': ['kampanijos'], '/funkcijos/vietinis-seo': ['seo'] };
  for (const p of ['/', '/funkcijos', '/funkcijos/praleistas-skambutis', '/funkcijos/funkcionali-svetaine', '/funkcijos/atsiliepimu-rinkimas', '/funkcijos/kampanijos', '/funkcijos/vietinis-seo', '/kainos', '/atsiliepimai', '/musu-darbai', '/apie', '/kontaktai', '/susisieksime', '/registracija', '/pradzia', '/privatumo-politika', '/taisykles', '/rezultatai', '/sildymui']) {
    const r = await get(p);
    if (r.status !== 200) { errors.push(`${p}: ${r.status}`); continue; }
    if (r.text.includes('TODO-ID')) errors.push(`${p}: contains TODO-ID`);
    if (/JarvisCo|Žinutė po praleisto skambučio/.test(r.text.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ''))) errors.push(`${p}: old brand/card name`);
    for (const k of where[p] ?? []) if (fixing(k)) { if (!r.text.includes(p === '/' ? `data-demo-open="${k}"` : 'Video tvarkomas') || (p === '/' && !new RegExp(`data-demo-open="${k}"[^>]*data-demo-fix`).test(r.text))) errors.push(`${p}: ${k} should show Video tvarkomas`); }
    else if (!r.text.includes(id(k))) errors.push(`${p}: video ${k} (${id(k)}) not embedded`);
    for (const m of r.text.matchAll(/data-(?:demo-)?yt="([^"]+)"/g)) if (!allIds.has(m[1])) errors.push(`${p}: stale or unknown YouTube ID ${m[1]} (not in src/data/o2-videos.js)`);
  }
  const s = await get('/susisieksime'); if (!s.text.includes('>33<')) errors.push('/susisieksime: 33 enquiries missing');
  console.log('key pages, video IDs, 33 proof checked');
}
if (errors.length) { console.error(errors.map((e) => 'check-live: ' + e).join('\n')); process.exit(1); }
console.log('check-live: ok');
