/* Non-browser H1 acceptance. No deletes, network calls, or real business data. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync, symlinkSync, readdirSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { normalize, validateSaved } from './preview/normalize.mjs';

let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`PASS ${label}`); };
const base = { business: 'Sintetinis testas', phone: '+37060000000', city: 'Kaunas', areas: ['Kaunas'], services: ['Katilų remontas'], photos: [] };
check('optional claims are absent, supplied descriptions preserved', () => {
  const { data } = normalize({ ...base, services: [{ name: 'Katilų remontas', text: 'Tik pateiktas aprašymas.' }] });
  assert.equal(data.services[0].text, 'Tik pateiktas aprašymas.');
  for (const key of ['standout', 'about', 'hours', 'reviews', 'prices']) assert.equal(data[key], undefined);
  assert.deepEqual(data.qualifications, []);
});
check('client accent contrast is enforced', () => assert.throws(() => normalize({ ...base, accent: '#ffffff' }), /too light/));
check('unsafe review URL is rejected', () => assert.throws(() => normalize({ ...base, reviews: [{ name: 'Test', text: 'Test', url: 'javascript:alert(1)' }] }), /https/));
check('saved image dimensions are validated', () => assert.throws(() => validateSaved({ ...base, slug: 'test', photos: [{ src: '/x.jpg', width: 0, height: 10 }] }), /positive integer/));

// Both design directions under review (A at /pavyzdys/sildymas, B at /pavyzdys/sildymas-b).
for (const [label, file] of [['demo A', 'dist/pavyzdys/sildymas/index.html'], ['demo B', 'dist/pavyzdys/sildymas-b/index.html']]) {
  const html = readFileSync(file, 'utf8');
  check(`${label}: noindex, inert form, no callable contacts or schema`, () => {
    assert.match(html, /content="noindex,nofollow"/);
    assert.match(html, /data-inert-form/);
    assert.doesNotMatch(html, /href="(?:tel:|sms:|mailto:)|data-callback-form="|type="application\/ld\+json"/);
    assert.match(html, /PAVYZDYS/);
  });
  // One visible statement by the photos plus a tag on the hero image replace per-photo captions;
  // every image still says it is an AI illustration in its alt text.
  check(`${label}: five illustrations disclosed; no invented reviews or qualifications`, () => {
    const imgs = html.match(/<img [^>]*>/g) ?? [];
    assert.equal(imgs.length, 5);
    assert.ok(imgs.every((img) => /alt="[^"]*\bDI\b[^"]*iliustracija/.test(img)), 'every alt names the DI illustration');
    assert.equal((html.match(/class="hs-tag"[^>]*>DI iliustracija</g) ?? []).length, 1, 'hero tag');
    assert.equal((html.match(/class="[^"]*hs-disclose[^"]*"[^>]*>[^<]*DI sukurtos iliustracijos, ne atlikti darbai/g) ?? []).length, 1, 'photo note');
    assert.doesNotMatch(html, /id="(?:zodis|apie)"[^>]*aria-labelledby="hs-reviews"|Atestatas|gamintojų mokymai/);
  });
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
console.log(`${passed} checks passed. Retained symlink fixtures: ${evidence}`);
