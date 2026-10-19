#!/usr/bin/env node
/* Grab one Paslaugos.lt profile for a lead preview: texts → profile.json, gallery photos → 01.jpg, 02.jpg …
   node scripts/grab-paslaugos-profile.mjs <profile-url> <out-dir>

   - Headed Chrome with the CRM scraper's persistent profile (same launch and bot-check test as
     ~/MultiPurpose CRM/apps/server/src/scraper.ts). Playwright comes from the CRM's node_modules
     (override the folder with CRM_DIR); nothing is installed here.
   - Refuses to start while the CRM scraper holds that profile (live SingletonLock).
   - A bot check / CAPTCHA is never worked around: it prints "Solve the check in the Chrome window,
     then press Enter" and waits for a person (it also continues once the check is gone).
   - Only the given profile page is opened; images are downloaded one by one, ≥ 0.5 s apart.
   - Writes into <out-dir>: NN.jpg, profile.json and page-snapshot.html (the rendered page, for
     re-checking what was read). Keep <out-dir> outside the repo: it is real lead data. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const [url, outArg] = process.argv.slice(2);
const fail = (msg) => { console.error(`grab-paslaugos-profile: ${msg}`); process.exit(1); };
if (!url || !outArg) fail('usage: node scripts/grab-paslaugos-profile.mjs <https://paslaugos.lt/profile> <out-dir>');

/* Same source rule as the CRM scraper: https://paslaugos.lt only, no admin/review/chat paths. */
let source;
try { source = new URL(url); } catch { fail(`not a URL: ${url}`); }
if (source.protocol !== 'https:' || source.hostname !== 'paslaugos.lt' || source.username || source.password || source.port) fail('only https://paslaugos.lt/<profile> is allowed');
if (['destination', 'chat', 'rikiavimas'].some((k) => source.searchParams.has(k)) || /^\/(admin|atsiliepimas|rekomenduoti|isiminti)(\/|$)/.test(source.pathname)) fail('this path is excluded by the source robots rules');
source.hash = '';

const CRM_DIR = process.env.CRM_DIR ?? join(homedir(), 'MultiPurpose CRM');
const PROFILE = join(homedir(), 'Library/Application Support/MultiPurpose CRM/scraper-profile');
const out = resolve(outArg);
const IMG_HOST = 'paslaugos-img.dgn.lt';
const GAP_MS = 600;

/* The CRM scraper keeps Chrome open on this profile while it runs. Busy = a live process uses the
   profile, or Chrome's SingletonLock ("<host>-<pid>"; the host part is not always os.hostname()) names a live pid. */
function lockHolder() {
  const ps = spawnSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8' }).stdout ?? '';
  const user = ps.split('\n').find((l) => l.includes(`--user-data-dir=${PROFILE}`));
  if (user) return `process ${user.trim().split(/\s+/)[0]}`;
  let target;
  try { target = readlinkSync(join(PROFILE, 'SingletonLock')); } catch { return null; }
  const pid = Number(target.match(/-(\d+)$/)?.[1]);
  if (!pid) return target;
  try { process.kill(pid, 0); return `SingletonLock → ${target}`; } catch (e) { return e.code === 'EPERM' ? `SingletonLock → ${target}` : null; }
}
const busy = lockHolder();
if (busy) fail(`the CRM scraper profile is in use (${busy}). Stop the CRM scrape first, then run this again.`);

let chromium;
try { ({ chromium } = createRequire(join(CRM_DIR, 'package.json'))('playwright')); } catch { fail(`Playwright not found in ${CRM_DIR}/node_modules (set CRM_DIR)`); }

/* isChallenge() from apps/server/src/scraper.ts + isBotCheck() from packages/scraper, run on the live DOM. */
const challengeScript = () => {
  const clean = (s) => s.replace(/\s+/g, ' ').trim();
  const html = document.documentElement.outerHTML.toLowerCase();
  const title = document.title;
  const body = clean(document.body?.innerText ?? '');
  const hasContent = !!document.querySelector('.bp-listing,[itemtype*="LocalBusiness"],[itemprop="description"],.page-description,.bp-description,.service-description,.description,.body-description');
  const botCheck = ['bando naudotis automatin', 'g-recaptcha', 'h-captcha', 'cf-challenge', 'captcha-container'].some((s) => html.includes(s));
  return /just a moment|attention required|checking your browser/i.test(title)
    || /verify (that )?you are human|patvirtinkite.*nesate robotas|bando naudotis automatin/i.test(body)
    || (botCheck && !hasContent)
    || !!document.querySelector('iframe[src*="challenges.cloudflare.com"],#challenge-running,#cf-challenge-running');
};

async function waitForPerson(page) {
  console.log('\nSolve the check in the Chrome window, then press Enter.');
  const rl = createInterface({ input: process.stdin });
  const enter = new Promise((done) => rl.once('line', done));
  // Also continue by itself once the page no longer shows the check (the person solved it).
  const cleared = (async () => { for (;;) { await page.waitForTimeout(2000); if (!(await page.evaluate(challengeScript).catch(() => true))) return; } })();
  await Promise.race([enter, cleared]);
  rl.close();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  if (await page.evaluate(challengeScript)) fail('the bot check is still showing; nothing was saved');
}

/* Everything readable on the page, collected in the browser: the raw visible text plus the fields the
   profile markup names (seen 2026-10-19: .body-name, .body-badges, .body-description, .body-services,
   .pv-rec). Nothing is guessed: a field the page does not show stays empty. */
const readScript = () => {
  const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
  const lines = (el) => (el?.innerText ?? '').split('\n').map(clean).filter(Boolean);
  const all = (sel, root = document) => [...root.querySelectorAll(sel)];
  const one = (sel, root = document) => root.querySelector(sel);
  const ld = all('script[type="application/ld+json"]').flatMap((s) => {
    try { const j = JSON.parse(s.textContent); return Array.isArray(j) ? j : j['@graph'] ?? [j]; } catch { return []; }
  });
  const meta = (name) => one(`meta[property="${name}"],meta[name="${name}"]`)?.getAttribute('content') ?? '';
  const idOf = (u) => u?.match(/\/gallery_\d+_(\d+)\//)?.[1];

  /* Gallery: lightbox targets (a[href][data-size]) are the full-size files; thumbnails are only a fallback. */
  const images = [];
  const seen = new Set();
  const add = (url, el, size) => {
    const id = idOf(url);
    if (!id || seen.has(id)) return;
    seen.add(id);
    images.push({ id, url: new URL(url, location.href).href, size: size ?? '', title: clean(el.getAttribute('title') ?? one('img', el)?.getAttribute('title') ?? '') });
  };
  for (const a of all('a[href*="paslaugos-img.dgn.lt/gallery_"][data-size]')) add(a.getAttribute('href'), a, a.getAttribute('data-size'));
  for (const d of all('[data-src*="paslaugos-img.dgn.lt/gallery_"][data-size]')) add(d.getAttribute('data-src'), d, d.getAttribute('data-size'));
  for (const img of all('img[src*="paslaugos-img.dgn.lt/gallery_"]')) add(img.getAttribute('src'), img);

  /* Services with the price line and the short note the owner wrote; their photos give a caption per id. */
  const services = all('.body-services__box').map((box) => {
    const info = one('.body-services__content-info', box);
    const name = clean(one('.body-services__content-info-title', info)?.innerText);
    const note = clean(one('.body-services__content-info-description', info)?.innerText);
    const price = all(':scope > span', info).map((x) => clean(x.innerText)).filter(Boolean).join(' ');
    const photoIds = [...new Set(all('[data-src*="/gallery_"],img[src*="/gallery_"]', box).map((x) => idOf(x.getAttribute('data-src') ?? x.getAttribute('src'))).filter(Boolean))];
    return { name, ...(note ? { note } : {}), ...(price ? { price } : {}), ...(photoIds.length ? { photo_ids: photoIds } : {}) };
  }).filter((x) => x.name);

  const reviews = all('.pv-rec__item').map((r) => ({
    author: clean(one('.pv-rec__item-name', r)?.innerText),
    service: clean(one('.pv-rec__item-service', r)?.innerText),
    text: (one('.pv-rec__item-comment', r)?.innerText ?? '').trim(),
    date: clean(one('.pv-rec__item-date', r)?.innerText),
    stars: all('.review-rating__star--full', r).length || undefined,
    has_customer_photos: all('.pv-rec__item-images a', r).length || undefined,
  })).filter((r) => r.text);

  const shortDescription = (one('.body-description .description')?.innerText ?? '').trim();
  return {
    title: document.title,
    h1: clean(one('h1')?.innerText),
    displayName: clean(one('.body-name__title')?.innerText),
    area: clean(one('.body-name__subtitle')?.innerText),
    badges: all('.body-badges li').map((x) => clean(x.innerText)),
    metrics: all('.pv-metrics:not(.pv-metrics--mobile) .pv-metrics__item').map((x) => clean(x.innerText)),
    // The visible block is cut ("…"); the page's meta description carries the full owner text.
    description: (meta('og:description') || meta('description') || shortDescription).replace(/​/g, '').trim(),
    services,
    reviews,
    jsonLd: ld,
    bodyText: lines(one('main') ?? document.body),
    images,
  };
};

mkdirSync(out, { recursive: true });
const context = await chromium.launchPersistentContext(PROFILE, { headless: false, channel: 'chrome' });
try {
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto(source.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await page.evaluate(challengeScript)) await waitForPerson(page);

  // Open the gallery on this page (a "show all photos" control), never another URL.
  const before = (await page.evaluate(readScript)).images.length;
  const more = page.getByRole('button', { name: /(visas|visos|daugiau|rodyti).*(nuotrauk|foto)|galerij/i }).or(page.getByRole('link', { name: /(visas|visos|daugiau|rodyti).*(nuotrauk|foto)/i })).first();
  if (await more.count()) {
    const href = await more.getAttribute('href').catch(() => null);
    if (!href || href.startsWith('#') || href.startsWith('javascript')) { await more.click().catch(() => {}); await page.waitForTimeout(1200); }
  }
  // Lazy galleries: scroll to the end once so every thumbnail gets its real src.
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
  await page.waitForTimeout(800);
  if (await page.evaluate(challengeScript)) await waitForPerson(page);

  const read = await page.evaluate(readScript);
  writeFileSync(join(out, 'page-snapshot.html'), await page.content());
  const photos = read.images;
  const captions = new Map(read.services.flatMap((sv) => (sv.photo_ids ?? []).map((id) => [id, [sv.name, sv.note].filter(Boolean).join(' – ')])));
  console.log(`Read "${read.h1 || read.title}": ${photos.length} gallery photo(s) (${before} before opening the gallery).`);

  const files = [];
  for (const [i, p] of photos.entries()) {
    if (i) await page.waitForTimeout(GAP_MS);
    const name = `${String(i + 1).padStart(2, '0')}.jpg`;
    const res = await context.request.get(p.url, { headers: { Referer: source.href } });
    if (!res.ok()) { console.warn(`  ${name}: HTTP ${res.status()} for ${p.url}`); continue; }
    const type = res.headers()['content-type'] ?? '';
    if (!type.startsWith('image/')) { console.warn(`  ${name}: not an image (${type}) for ${p.url}`); continue; }
    writeFileSync(join(out, name), await res.body());
    files.push({ file: name, id: p.id, url: p.url, ...(p.size ? { size: p.size } : {}), ...(captions.has(p.id) ? { service_caption: captions.get(p.id) } : {}) });
    console.log(`  ${name} ← ${p.url}`);
  }

  const profile = {
    source_url: source.href,
    grabbed_at: new Date().toISOString(),
    page_title: read.title,
    profile_title: read.h1,
    display_name: read.displayName,
    area: read.area,
    badges: read.badges,
    metrics: read.metrics,
    description: read.description,
    services: read.services,
    reviews: read.reviews,
    photos: files,
    json_ld: read.jsonLd,
    page_text: read.bodyText,
    note: 'Read from the page as shown; nothing is inferred. Badges/metrics are Paslaugos.lt figures, not claims to repeat.',
  };
  writeFileSync(join(out, 'profile.json'), `${JSON.stringify(profile, null, 2)}\n`);
  console.log(`Wrote ${files.length} photo(s), profile.json and page-snapshot.html to ${out}`);
  if (!existsSync(join(out, '01.jpg'))) console.warn('No photos were saved: check page-snapshot.html for the gallery markup.');
} finally {
  await context.close();
}
