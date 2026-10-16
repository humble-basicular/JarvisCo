/* Heating template acceptance: data rules, the demo page, generator symlink
   safety, and client accents rendered in headless Chrome (every visible text
   measured against its background). No deletes, no network calls beyond
   localhost, no real business data. Run after `npm run build`. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync, symlinkSync, readdirSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { normalize, validateSaved } from './preview/normalize.mjs';
import { accentTokens, contrast, BG, INK } from '../src/templates/heating/accent.ts';
import { CONTRAST_AUDIT as AUDIT, chrome, serve } from './heating-cdp.mjs';

let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`PASS ${label}`); };
const base = { business: 'Sintetinis testas', phone: '+37060000000', city: 'Kaunas', areas: ['Kaunas'], services: ['Katilų remontas'], photos: [] };
check('optional claims are absent, supplied descriptions preserved', () => {
  const { data } = normalize({ ...base, services: [{ name: 'Katilų remontas', text: 'Tik pateiktas aprašymas.' }] });
  assert.equal(data.services[0].text, 'Tik pateiktas aprašymas.');
  for (const key of ['standout', 'about', 'hours', 'reviews', 'prices']) assert.equal(data[key], undefined);
  assert.deepEqual(data.qualifications, []);
});
check('any #rrggbb accent is accepted, malformed ones refused', () => {
  assert.equal(normalize({ ...base, accent: '#F5C400' }).data.accent, '#f5c400');
  assert.throws(() => normalize({ ...base, accent: 'orange' }), /#rrggbb/);
});
// Every pair the template paints with the accent, for a sweep of 4 913 colours (each channel in steps of 16).
check('accent tokens reach 4.5:1 for every colour', () => {
  const steps = Array.from({ length: 17 }, (_, i) => Math.min(255, i * 16).toString(16).padStart(2, '0'));
  for (const r of steps) for (const g of steps) for (const b of steps) {
    const t = accentTokens(`#${r}${g}${b}`);
    const pairs = [[t.on, t.field], [t.text, BG], [t.text, '#ffffff'], [t.onInk, INK], [t.fieldBtn.fg, t.fieldBtn.bg], [t.fieldBtn.num, t.fieldBtn.bg], [t.on, t.hover], [t.field, t.on]];
    for (const [a, c] of pairs) assert.ok(contrast(a, c) >= 4.5, `#${r}${g}${b}: ${a} on ${c} = ${contrast(a, c).toFixed(2)}`);
  }
});
const FIXTURES = { dark: '#b8430a', light: '#f5c400', blue: '#2f6fd6' };
check('fixture accents: dark and blue keep white text, light switches to ink', () => {
  assert.equal(accentTokens(FIXTURES.dark).on, '#ffffff');
  assert.equal(accentTokens(FIXTURES.blue).on, '#ffffff');
  assert.equal(accentTokens(FIXTURES.light).on, INK);
  assert.equal(accentTokens(FIXTURES.light).field, FIXTURES.light, 'light accent keeps its colour');
});
check('unsafe review URL is rejected', () => assert.throws(() => normalize({ ...base, reviews: [{ name: 'Test', text: 'Test', url: 'javascript:alert(1)' }] }), /https/));
check('saved image dimensions are validated', () => assert.throws(() => validateSaved({ ...base, slug: 'test', photos: [{ src: '/x.jpg', width: 0, height: 10 }] }), /positive integer/));

// The demo: one template (direction B), the old review URL only redirects.
{
  const html = readFileSync('dist/pavyzdys/sildymas/index.html', 'utf8');
  check('demo: noindex, inert form, no callable contacts or schema', () => {
    assert.match(html, /content="noindex,nofollow"/);
    assert.match(html, /data-inert-form/);
    assert.doesNotMatch(html, /href="(?:tel:|sms:|mailto:)|data-callback-form="|type="application\/ld\+json"/);
    assert.match(html, /PAVYZDYS/);
  });
  // One visible statement by the photos plus a tag on the hero image replace per-photo captions;
  // every image still says it is an AI illustration in its alt text.
  check('demo: five illustrations disclosed; no invented reviews or qualifications', () => {
    const imgs = html.match(/<img [^>]*>/g) ?? [];
    assert.equal(imgs.length, 5);
    assert.ok(imgs.every((img) => /alt="[^"]*\bDI\b[^"]*iliustracija/.test(img)), 'every alt names the DI illustration');
    assert.equal((html.match(/class="hs-tag"[^>]*>DI iliustracija</g) ?? []).length, 1, 'hero tag');
    assert.equal((html.match(/class="[^"]*hs-disclose[^"]*"[^>]*>[^<]*DI sukurtos iliustracijos, ne atlikti darbai/g) ?? []).length, 1, 'photo note');
    assert.doesNotMatch(html, /id="zodis"|Atestatas|gamintojų mokymai|★|class="hs-quals"/);
  });
  check('demo: large gallery (2×2) and responsive images', () => {
    assert.equal((html.match(/class="hs-works__half"/g) ?? []).length, 4);
    assert.ok((html.match(/<img [^>]*srcset="[^"]*768w/g) ?? []).length === 5, 'every image has a 768w source');
  });
  check('demo: single template, no direction-A markup', () => assert.doesNotMatch(html, /class="[^"]*\bhs-[ab]\b/));
  check('no leftover direction-B review route', () => assert.ok(!existsSync('dist/pavyzdys/sildymas-b/index.html')));
}
check('demo and previews excluded from sitemap', () => assert.doesNotMatch(readFileSync('dist/sitemap-0.xml', 'utf8'), /\/(?:pavyzdys|perziura)\//));

// Each symlink case uses its own fresh slug, so no cleanup/removal is needed.
const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
const slug = () => [...randomBytes(10)].map(x => alphabet[x % alphabet.length]).join('');
const root = resolve('.');
const evidence = resolve('client-sites', `h1-symlink-${Date.now()}`);
mkdirSync(evidence, { recursive: true });
const secret = resolve(evidence, 'secret.jpg');
writeFileSync(secret, 'not a photo; must never be read');
const marker = resolve(evidence, 'keep.txt'); writeFileSync(marker, 'keep');
const records = [];
for (const kind of ['input', 'photo-file', 'photo-directory', 'output', 'stage']) {
  const id = slug();
  const input = resolve('previews', `${id}.json`);
  const photos = resolve('public/previews', id);
  const output = resolve('client-sites', id);
  const stage = resolve('client-sites', `.build-${id}`);
  mkdirSync('previews', { recursive: true });
  mkdirSync('public/previews', { recursive: true });
  const data = { ...base, slug: id, photos: [{ src: `/previews/${id}/1.jpg`, width: 10, height: 10 }] };
  if (kind === 'input') {
    const real = resolve(evidence, `${id}.json`); writeFileSync(real, JSON.stringify(data)); symlinkSync(real, input);
  } else {
    writeFileSync(input, JSON.stringify(data));
    if (kind === 'photo-directory') symlinkSync(evidence, photos);
    else {
      mkdirSync(photos);
      if (kind === 'photo-file') symlinkSync(secret, resolve(photos, '1.jpg'));
      else copyFileSync(secret, resolve(photos, '1.jpg'));
    }
    if (kind === 'output') symlinkSync(evidence, output);
    if (kind === 'stage') symlinkSync(evidence, stage);
  }
  const before = readdirSync(evidence).sort();
  const result = spawnSync(process.execPath, ['scripts/client-site.mjs', input, '--site', 'testsite', '--domain', 'example.lt', '--test', 'http://localhost:4433', '--retain-build'], { cwd: root, encoding: 'utf8' });
  check(`symlink ${kind} refused before writes`, () => { assert.equal(result.status, 1); assert.match(result.stderr, /symlink/); });
  check(`symlink ${kind} target unchanged`, () => { assert.equal(readFileSync(marker, 'utf8'), 'keep'); assert.deepEqual(readdirSync(evidence).sort(), before); });
  // Keep inputs outside previews afterwards so Astro does not ingest adversarial fixtures.
  // Rename preserves the evidence; nothing is deleted.
  const { renameSync } = await import('node:fs');
  renameSync(input, resolve(evidence, `${id}-input.json`));
  if (existsSync(photos)) renameSync(photos, resolve(evidence, `${id}-photos`));
  records.push({ kind, id, photos, output, stage });
}
writeFileSync(resolve(evidence, 'fixtures.json'), JSON.stringify(records, null, 2));

// Client accents rendered: one live client site per fixture accent (built against a
// local stub, never deployed), every visible text measured in Chrome at 390 and 1440.
const accentEvidence = resolve('client-sites', `accent-fixtures-${Date.now()}`);
mkdirSync(accentEvidence, { recursive: true });
const fixtureBase = {
  ...base, business: 'Spalvų bandymas', phone: '+370 600 00000', areas: ['Kaunas', 'Kauno r.', 'Garliava'],
  services: ['Dujinių katilų remontas', 'Dujinių katilų priežiūra', 'Katilų keitimas ir montavimas', 'Šilumos siurbliai'],
  standout: 'Sintetinis bandymas\nKainą pasakome prieš darbus', hours: 'I–V 8:00–18:00', brands: ['Bosch', 'Vaillant'],
  about: 'Sintetinis tekstas spalvų bandymui: šio verslo nėra.',
  prices: [{ name: 'Iškvietimas', price: 'nuo 40 €' }], priceNote: 'Tiksli remonto kaina – nustačius gedimą ir suderinus su Jumis.',
};
const built = {};
for (const [name, accent] of Object.entries(FIXTURES)) {
  const id = slug();
  const withPhotos = name !== 'light'; // the light fixture covers the no-photo identity card
  const photos = withPhotos ? ['katiline.jpg', 'radiatorius.jpg'].map((f, i) => {
    mkdirSync(resolve('public/previews', id), { recursive: true });
    copyFileSync(resolve('scripts/preview/example/photos', f), resolve('public/previews', id, `${i + 1}.jpg`));
    return { src: `/previews/${id}/${i + 1}.jpg`, width: 1200, height: 900 };
  }) : [];
  const input = resolve('previews', `${id}.json`);
  writeFileSync(input, JSON.stringify({ ...fixtureBase, slug: id, accent, photos }));
  const result = spawnSync(process.execPath, ['scripts/client-site.mjs', input, '--site', `accent-${name}`, '--domain', 'example.lt', '--test', 'http://localhost:4433', '--retain-build'], { cwd: root, encoding: 'utf8' });
  check(`accent ${name} (${accent}) client site builds`, () => assert.equal(result.status, 0, result.stderr));
  // Same as above: inputs leave previews/ (renamed, not deleted) so the main build ignores them.
  const { renameSync } = await import('node:fs');
  renameSync(input, resolve(accentEvidence, `${name}-${id}.json`));
  if (withPhotos) renameSync(resolve('public/previews', id), resolve(accentEvidence, `${name}-${id}-photos`));
  built[name] = resolve('client-sites', id);
}
writeFileSync(resolve(accentEvidence, 'fixtures.json'), JSON.stringify(built, null, 2));

const browser = await chrome();
try {
  for (const [name, dir] of Object.entries(built)) {
    const server = await serve(dir);
    try {
      for (const vp of [{ width: 390, height: 844, dpr: 2, mobile: true }, { width: 1440, height: 900 }]) {
        await browser.open(`${server.origin}/`, vp);
        const audit = await browser.evaluate(AUDIT);
        const overflow = await browser.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
        check(`accent ${name} at ${vp.width}: ${audit.checked} texts/icons readable (text on accent ${audit.on}), no overflow`, () => {
          assert.deepEqual(audit.fails, []);
          assert.ok(audit.checked > 80, `only ${audit.checked} elements measured`);
          assert.equal(audit.on, accentTokens(FIXTURES[name]).on);
          assert.equal(overflow, 0);
        });
      }
    } finally { server.close(); }
  }
} finally { browser.close(); }

console.log(`Accent fixture sites (screenshots): ${Object.entries(built).map(([n, d]) => `${n}=${d}`).join(' ')}`);
console.log(`${passed} checks passed. Retained symlink fixtures: ${evidence}; accent inputs: ${accentEvidence}. Chrome profile left at ${browser.profile}`);
