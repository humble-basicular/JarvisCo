/* Heating template acceptance: data rules, the demo page, generator symlink
   safety, and client accents rendered in headless Chrome (every visible text
   measured against its background). No deletes, no network calls beyond
   localhost, no real business data. Run after `npm run build`. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync, symlinkSync, readdirSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { checkLogoFile, normalize, townSlug, validateSaved } from './preview/normalize.mjs';
import { accentTokens, contrast, BG, INK } from '../src/templates/heating/accent.ts';
import { CONTRAST_AUDIT as AUDIT, chrome, serve, sleep } from './heating-cdp.mjs';

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

// Optional `logo` and `towns` (both absent → nothing changes).
check('logo: path or {path, line}; only .svg/.png; saved src must be the generator path', () => {
  assert.deepEqual(normalize({ ...base, logo: 'logo.svg' }).data.logo, { path: 'logo.svg' });
  assert.deepEqual(normalize({ ...base, logo: { path: 'x/logo.png', line: 'Šildymas · Kaunas' } }).data.logo, { path: 'x/logo.png', line: 'Šildymas · Kaunas' });
  assert.throws(() => normalize({ ...base, logo: 'logo.gif' }), /\.svg or \.png/);
  assert.equal(normalize(base).data.logo, undefined);
  const saved = { ...base, slug: 'abcdefghjk', photos: [] };
  assert.deepEqual(validateSaved({ ...saved, logo: { src: '/previews/abcdefghjk/logo.svg', line: 'L' } }).logo, { src: '/previews/abcdefghjk/logo.svg', line: 'L' });
  assert.throws(() => validateSaved({ ...saved, logo: { src: '/previews/other/logo.svg' } }), /logo\.src/);
  assert.throws(() => validateSaved({ ...saved, logo: { src: 'https://evil.example/logo.svg' } }), /logo\.src/);
});
check('logo files: plain SVG/PNG pass; scripts, handlers, external refs and fake PNGs are refused', () => {
  const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#1f5f8b"/><path d="M1 1h2" stroke="url(#g)"/></svg>';
  checkLogoFile(Buffer.from(ok), '.svg');
  checkLogoFile(Buffer.from(`<?xml version="1.0"?>\n<!-- mark -->\n${ok}`), '.svg');
  checkLogoFile(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]), '.png');
  for (const bad of [
    '<svg><script>alert(1)</script></svg>', '<svg onload="alert(1)"></svg>', '<svg><a href="https://x.example">x</a></svg>',
    '<svg><image xlink:href="http://x.example/a.png"/></svg>', '<svg><a href="javascript:alert(1)">x</a></svg>',
    '<svg><foreignObject><p>x</p></foreignObject></svg>', '<!DOCTYPE svg [<!ENTITY x "y">]><svg></svg>',
    '<svg><style>@import "https://x.example/a.css";</style></svg>', '<svg><rect fill="url(https://x.example/p)"/></svg>',
    '<html><svg></svg></html>',
  ]) assert.throws(() => checkLogoFile(Buffer.from(bad), '.svg'), /logo/, bad);
  assert.throws(() => checkLogoFile(Buffer.from('<svg></svg>'), '.png'), /not a PNG/);
  assert.throws(() => checkLogoFile(Buffer.alloc(201 * 1024, 32), '.svg'), /200 KB/);
});
check('towns: ASCII slugs, unique, not reserved; only towns with text get a page', () => {
  assert.equal(townSlug('Kėdainiai'), 'kedainiai');
  assert.equal(townSlug('Kauno r.'), 'kauno-r');
  assert.equal(townSlug('Nemunėlio Radviliškis'), 'nemunelio-radviliskis');
  const { data } = normalize({ ...base, towns: ['Kaunas', { name: 'Jonava', text: 'Savas tekstas.', places: ['Rukla'], distance: 'Apie 30 km' }] });
  assert.deepEqual(data.towns, [{ name: 'Kaunas', slug: 'kaunas' }, { name: 'Jonava', slug: 'jonava', text: 'Savas tekstas.', distance: 'Apie 30 km', places: ['Rukla'] }]);
  assert.throws(() => normalize({ ...base, towns: ['Kaunas', { name: 'Kaunas!' }] }), /two towns/);
  assert.throws(() => normalize({ ...base, towns: [{ name: 'Ačiū' }] }), /reserved/);
  assert.throws(() => normalize({ ...base, towns: [{ name: 'X', slug: '../x' }] }), /slug/);
  assert.throws(() => normalize({ ...base, towns: [{ name: 'Kaunas', faq: Array(5).fill({ q: 'K?', a: 'A.' }) }] }), /more than 4/);
  assert.equal(normalize(base).data.towns, undefined);
});

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
    // The logo mark (header, footer) is decorative (alt=""), so only the photos count here.
    const all = html.match(/<img [^>]*>/g) ?? [];
    assert.ok(all.filter((img) => /alt=""/.test(img)).every((img) => /class="[^"]*(?:__mark--img|hs-hero__seal)/.test(img)), 'only the logo mark and seal are decorative');
    const imgs = all.filter((img) => !/alt=""/.test(img));
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
  check(`accent ${name}: test build is marked, noindex, robots-blocked and refused by deploy-check`, () => {
    const dir = resolve('client-sites', id);
    assert.ok(existsSync(resolve(dir, 'TEST-BUILD-DO-NOT-DEPLOY.txt')));
    for (const page of ['index.html', 'privatumo-politika/index.html', 'aciu/index.html']) assert.match(readFileSync(resolve(dir, page), 'utf8'), /name="robots" content="noindex,nofollow"/, page);
    assert.match(readFileSync(resolve(dir, 'index.html'), 'utf8'), /hs-banner__tag">TESTAS</);
    assert.equal(readFileSync(resolve(dir, 'robots.txt'), 'utf8'), 'User-agent: *\nDisallow: /\n');
    const verdict = spawnSync(process.execPath, ['scripts/client-site-deploy-check.mjs', dir], { cwd: root, encoding: 'utf8' });
    assert.equal(verdict.status, 1, verdict.stdout);
    assert.match(verdict.stderr, /TEST-BUILD-DO-NOT-DEPLOY/);
  });
  // Same as above: inputs leave previews/ (renamed, not deleted) so the main build ignores them.
  const { renameSync } = await import('node:fs');
  renameSync(input, resolve(accentEvidence, `${name}-${id}.json`));
  if (withPhotos) renameSync(resolve('public/previews', id), resolve(accentEvidence, `${name}-${id}-photos`));
  built[name] = resolve('client-sites', id);
}
writeFileSync(resolve(accentEvidence, 'fixtures.json'), JSON.stringify(built, null, 2));

// Logo + towns on a live client site (local --test build, never deployed): header mark, hero seal,
// footer mark; one page per town with text, canonical, sitemap entry and links from home and footer.
{
  const id = slug();
  mkdirSync(resolve('public/previews', id), { recursive: true });
  copyFileSync(resolve('scripts/preview/example/photos', 'katiline.jpg'), resolve('public/previews', id, '1.jpg'));
  writeFileSync(resolve('public/previews', id, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#1f5f8b"/></svg>');
  const towns = [
    { name: 'Jonava', slug: 'jonava', text: 'Sintetinis Jonavos tekstas: kelias iš Kauno, kaimai aplink.', tagline: 'Šildymas Jonavoje', distance: 'Apie 30 km nuo Kauno', places: ['Rukla', 'Upninkai'], services: ['Katilų remontas'], faq: [{ q: 'Ar atvykstate į Ruklą?', a: 'Sintetinis atsakymas.' }] },
    { name: 'Kėdainiai', slug: 'kedainiai', text: 'Sintetinis Kėdainių tekstas: kitas atstumas, kiti darbai.' },
    { name: 'Garliava', slug: 'garliava' }, // no text → no page, no link
  ];
  const input = resolve('previews', `${id}.json`);
  writeFileSync(input, JSON.stringify({ ...fixtureBase, slug: id, accent: '#1f5f8b', logo: { src: `/previews/${id}/logo.svg`, line: 'Sintetinė eilutė' }, towns, photos: [{ src: `/previews/${id}/1.jpg`, width: 1200, height: 900 }] }));
  const result = spawnSync(process.execPath, ['scripts/client-site.mjs', input, '--site', 'towns-fixture', '--domain', 'example.lt', '--test', 'http://localhost:4433', '--retain-build'], { cwd: root, encoding: 'utf8' });
  check('logo + towns client site builds', () => assert.equal(result.status, 0, result.stderr));
  const dir = resolve('client-sites', id);
  const page = (p) => readFileSync(resolve(dir, p), 'utf8');
  check('logo: header mark, hero seal, footer mark and favicon, copied to /foto/logo.svg', () => {
    const html = page('index.html');
    assert.ok(existsSync(resolve(dir, 'foto/logo.svg')));
    for (const cls of ['hs-logo__mark--img', 'hs-hero__seal', 'hs-foot__mark--img']) assert.match(html, new RegExp(`<img class="[^"]*${cls}[^"]*" src="/foto/logo\\.svg"`), cls);
    assert.match(html, /<link rel="icon" href="\/foto\/logo\.svg"/);
    assert.match(html, /class="hs-logo__line">Sintetinė eilutė</);
    assert.doesNotMatch(html, /\/previews\//);
  });
  check('towns: a page per town with text; own canonical, H1, text; listed in sitemap; linked from home', () => {
    const sitemap = page('sitemap.xml');
    const index = page('index.html');
    const h1s = new Set();
    for (const t of ['jonava', 'kedainiai']) {
      const html = page(`${t}/index.html`);
      assert.match(html, new RegExp(`<link rel="canonical" href="https://example\\.lt/${t}/">`));
      assert.ok(sitemap.includes(`<loc>https://example.lt/${t}/</loc>`), `sitemap ${t}`);
      assert.match(index, new RegExp(`href="/${t}/"`));
      assert.match(html, /id="aptarnavimas"/);
      assert.match(html, /<a class="hs-logo" href="\/"/, 'logo goes home');
      h1s.add(html.match(/<h1[^>]*>([^<]*)</)[1]);
    }
    assert.equal(h1s.size, 2);
    assert.match(page('jonava/index.html'), /Sintetinis Jonavos tekstas/);
    assert.match(page('jonava/index.html'), /Ar atvykstate į Ruklą\?/);
    assert.doesNotMatch(page('kedainiai/index.html'), /Sintetinis Jonavos tekstas/);
    assert.ok(!existsSync(resolve(dir, 'garliava/index.html')), 'no page without text');
    assert.doesNotMatch(index, /href="\/garliava\/"/);
    assert.doesNotMatch(index, /Šildymo meistrai/, 'demo wording stays on the demo');
  });
  const { renameSync } = await import('node:fs');
  renameSync(input, resolve(accentEvidence, `towns-${id}.json`));
  renameSync(resolve('public/previews', id), resolve(accentEvidence, `towns-${id}-photos`));
  built.towns = dir;
  FIXTURES.towns = '#1f5f8b';
}

// Real local previews with towns (git-ignored data, when present in dist/): noindex, banner, logo, own H1s, not in the sitemap.
{
  const files = existsSync('previews') ? readdirSync('previews').filter((f) => f.endsWith('.json')) : [];
  const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
  let seen = 0;
  for (const f of files) {
    const data = validateSaved(JSON.parse(readFileSync(resolve('previews', f), 'utf8')));
    const paged = (data.towns ?? []).filter((t) => t.text);
    if (!paged.length || !existsSync(`dist/perziura/${data.slug}/index.html`)) continue;
    seen++;
    check(`preview ${data.slug}: ${paged.length} town pages noindex, PERŽIŪRA, logo, unique H1, linked, not in sitemap`, () => {
      const home = readFileSync(`dist/perziura/${data.slug}/index.html`, 'utf8');
      const h1s = new Set();
      for (const t of paged) {
        const html = readFileSync(`dist/perziura/${data.slug}/${t.slug}/index.html`, 'utf8');
        assert.match(html, /content="noindex,nofollow"/);
        assert.match(html, /hs-banner__tag">PERŽIŪRA</);
        assert.doesNotMatch(html, /href="(?:tel:|mailto:)/);
        if (data.logo) assert.ok(html.includes(`src="${data.logo.src}"`));
        assert.match(home, new RegExp(`href="/perziura/${data.slug}/${t.slug}"`));
        h1s.add(html.match(/<h1[^>]*>([^<]*)</)[1]);
      }
      assert.equal(h1s.size, paged.length);
      assert.doesNotMatch(sitemap, new RegExp(data.slug));
    });
  }
  if (!seen) console.log('SKIP no local preview with towns in dist/');
}

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
        // Hover states: force :hover on every link/button/label (CDP), let transitions
        // finish, then measure everything again.
        await browser.cdp('DOM.enable');
        await browser.cdp('CSS.enable');
        const { root } = await browser.cdp('DOM.getDocument', { depth: -1 });
        const { nodeIds } = await browser.cdp('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'a, button, label' });
        for (const nodeId of nodeIds) await browser.cdp('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
        await sleep(400);
        const hovered = await browser.evaluate(AUDIT);
        check(`accent ${name} at ${vp.width}: ${nodeIds.length} hover states readable`, () => {
          assert.ok(nodeIds.length > 10, `only ${nodeIds.length} hover targets`);
          assert.deepEqual(hovered.fails, []);
        });
      }
    } finally { server.close(); }
  }
} finally { browser.close(); }

console.log(`Accent fixture sites (screenshots): ${Object.entries(built).map(([n, d]) => `${n}=${d}`).join(' ')}`);
console.log(`${passed} checks passed. Retained symlink fixtures: ${evidence}; accent inputs: ${accentEvidence}. Chrome profile left at ${browser.profile}`);
