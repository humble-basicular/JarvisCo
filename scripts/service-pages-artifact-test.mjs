/* Synthetic only. Retains ignored fixtures/builds for inspection; never sends a form. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, renameSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from 'parse5';
import sharp from 'sharp';
import { validateSaved } from './preview/normalize.mjs';
import { checkSeoArtifacts } from './service-artifacts.mjs';
const slug = '23456789ab', input = `previews/${slug}.json`, out = `client-sites/${slug}`;
const nodes = (n) => [n, ...(n.childNodes ?? []).flatMap(nodes)];
const attr = (n, key) => n.attrs?.find((a) => a.name === key)?.value;
const text = (n) => n.value ?? (n.childNodes ?? []).map(text).join('');
const read = (file) => { const html = readFileSync(file, 'utf8'); return { html, nodes: nodes(parse(html)) }; };
const run = (args, ok = true) => {
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (ok && r.status !== 0) throw new Error(`${args.join(' ')}\n${r.stdout}\n${r.stderr}`);
  return r;
};
const theme = { archetype: 'heat', base: '#142a37', base2: '#203d4d', accent: '#b8430a', accentHi: '#ffcc66', paper: '#f4f4f4', heading: 'archivo-black', divider: 'angle', hero: 'photo', services: 'tiles', logo: { shape: 'round', glyph: 'flame', ring: 'Synthetic', line: 'Test fixture' } };
const page = { slug: 'service-one', serviceNames: ['A', 'B'], heading: 'Synthetic service in Town', description: 'Scope </script><script>bad()</script> & details', lead: 'Synthetic service description.', sections: [{ heading: 'Scope', text: 'Literal <img src=x onerror=bad()> text.' }], included: ['Only synthetic work'], preparation: ['A description'], priceFactors: ['Scope'], faq: [{ q: 'What to send?', a: 'A description.' }], photoIndexes: [0] };
const data = { syntheticSeoFixture: true, slug, business: 'Synthetic SEO test', phone: '+37060000000', city: 'Kaunas', areas: ['Kaunas', 'Jonava'], services: ['A', { name: 'B', text: 'B description' }, 'C'], tagline: 'Synthetic activity in Kaunas', lead: 'Synthetic lead', photos: [{ src: `/previews/${slug}/1.jpg`, width: 1600, height: 1000, alt: 'Synthetic test photo' }], towns: [{ name: 'Jonava', slug: 'jonava', text: 'Synthetic local scope.', tagline: 'Synthetic service Jonavoje', lead: 'Synthetic town lead.' }], v3: { theme, h1: { lead: 'Synthetic service', hot: 'Kaune' }, heroChecks: ['Synthetic'], trust: [1, 2, 3].map((i) => ({ icon: 'check', title: `T${i}`, text: 'Synthetic' })), aboutTitle: 'Synthetic about', steps: [1, 2, 3].map((i) => ({ icon: 'check', title: `S${i}`, text: 'Synthetic' })), ctaTitle: 'Synthetic contact', ctaText: 'Synthetic description.', servicePages: [page, { ...page, slug: 'service-two', serviceNames: ['C'], heading: 'Second synthetic service', description: 'Second scope', photoIndexes: [] }] } };
data.v3.map = { query: 'PRIVATE ADDRESS SHOULD NOT LEAK', embedUrl: 'https://www.google.com/maps/embed?pb=synthetic' };
data.v3.gbp = { url: 'https://www.google.com/maps?cid=123', reviewUrl: 'https://g.page/r/synthetic/review' };
if (existsSync(input)) assert.equal(JSON.parse(readFileSync(input)).syntheticSeoFixture, true, 'refuse overwriting another fixture');
mkdirSync(`public/previews/${slug}`, { recursive: true });
await sharp({ create: { width: 1600, height: 1000, channels: 3, background: '#395664' } }).jpeg().toFile(`public/previews/${slug}/1.jpg`);
writeFileSync(input, JSON.stringify(data));
assert.equal(validateSaved(data).v3.servicePages.length, 2, 'saved input retains validated contract');
const configPath = `previews/staging/seo-synthetic-config.json`;
mkdirSync('previews/staging', { recursive: true });
writeFileSync(configPath, JSON.stringify({ mapMode: 'consent', privacy: { controller: { name: 'Synthetic', email: 'synthetic@example.lt' }, processor: { name: 'Synthetic', email: 'synthetic@example.lt' }, retention: 'Synthetic fixture only', legalBasis: 'Synthetic fixture only', rights: 'Synthetic fixture only', hosting: 'Synthetic fixture only', updatedAt: '2026-10-26' }, worker: { configured: true, site: 'seo-synthetic', origins: ['https://synthetic.example.lt', 'https://www.synthetic.example.lt'], recipients: ['synthetic@example.lt'] } }));
const args = ['scripts/client-site.mjs', input, '--site', 'seo-synthetic', '--domain', 'synthetic.example.lt'];
// First build the original optional-interface shape: no servicePages.
writeFileSync(input, JSON.stringify({ ...data, v3: { ...data.v3, servicePages: undefined } }));
run([...args, '--test', 'http://localhost:4330']);
assert.ok(existsSync(`${out}/404.html`));
assert.ok(!existsSync(`${out}/paslaugos/service-one/index.html`));
writeFileSync(input, JSON.stringify(data));
run([...args, '--test', 'http://localhost:4330']);
assert.deepEqual(checkSeoArtifacts(out, { domain: 'synthetic.example.lt', test: true, services: data.v3.servicePages }), []);
assert.notEqual(run(['scripts/client-site-deploy-check.mjs', out], false).status, 0, 'test build cannot deploy');
run([...args, '--config', configPath]);
assert.deepEqual(checkSeoArtifacts(out, { domain: 'synthetic.example.lt', services: data.v3.servicePages }), []);
run(['scripts/client-site-deploy-check.mjs', out]);
const home = read(`${out}/index.html`);
assert.equal(attr(home.nodes.find((n) => attr(n, 'property') === 'og:site_name'), 'content'), data.business);
const homeSchema = JSON.parse(text(home.nodes.find((n) => attr(n, 'type') === 'application/ld+json')))['@graph'];
assert.equal(homeSchema.find((n) => n['@type'] === 'WebSite').name, data.business);
assert.deepEqual(homeSchema.find((n) => n['@type'] === 'LocalBusiness').sameAs, [data.v3.gbp.url]);
assert.ok(home.nodes.some((n) => attr(n, 'href') === data.v3.gbp.reviewUrl));
assert.ok(home.nodes.filter((n) => [data.v3.gbp.url, data.v3.gbp.reviewUrl].includes(attr(n, 'href'))).every((n) => (attr(n, 'rel') ?? '').split(' ').includes('noopener')));
assert.ok(home.nodes.some((n) => attr(n, 'href') === data.v3.gbp.url));
assert.ok(!home.html.includes(data.v3.map.query), 'private map query stays out of standalone output');
assert.ok(home.nodes.some((n) => attr(n, 'data-map-src') === data.v3.map.embedUrl));
assert.equal(home.nodes.filter((n) => n.tagName === 'iframe').length, 0, 'map requires consent before loading');
for (const [i, expected] of ['service-one', 'service-one', 'service-two'].entries()) {
  const tile = home.nodes.filter((n) => n.tagName === 'li' && (attr(n, 'class') ?? '').split(' ').includes('v3-tile'))[i];
  const links = nodes(tile).filter((n) => n.tagName === 'a');
  assert.equal(attr(links[0], 'href'), `/paslaugos/${expected}/`);
  assert.equal(attr(links[0], 'data-quote'), undefined);
  assert.equal(attr(links[1], 'href'), '#uzklausa');
  assert.notEqual(attr(links[1], 'data-quote'), undefined);
}
const service = read(`${out}/paslaugos/service-one/index.html`);
assert.ok(service.nodes.some((n) => n.tagName === 'h1' && text(n) === page.heading));
assert.equal(service.nodes.filter((n) => n.tagName === 'h1').length, 1);
assert.ok(service.html.includes('&lt;img'));
assert.ok(!service.nodes.some((n) => attr(n, 'onerror') !== undefined));
const schema = JSON.parse(text(service.nodes.find((n) => attr(n, 'type') === 'application/ld+json')));
assert.equal(schema['@graph'].find((n) => n['@type'] === 'Service').description, page.description);
assert.ok(service.nodes.some((n) => attr(n, 'href') === 'tel:+37060000000'));
assert.ok(service.nodes.some((n) => n.tagName === 'form' && attr(n, 'action') === 'https://www.jarvisweb.lt/t/form'));
const noPhoto = read(`${out}/paslaugos/service-two/index.html`);
assert.ok(!noPhoto.nodes.some((n) => (attr(n, 'class') ?? '').includes('v3-hero__bg')));
const town = read(`${out}/jonava/index.html`);
assert.equal(text(town.nodes.find((n) => n.tagName === 'title')), 'Synthetic service Jonavoje – Synthetic SEO test');
assert.ok(attr(town.nodes.find((n) => n.tagName === 'a' && text(n) === 'Atidaryti Google Maps'), 'href').includes('query=Jonava'), 'town map keeps its own area');
for (const candidate of [home, town, service, noPhoto]) assert.ok(!candidate.html.includes(data.v3.map.query), 'private query absent from every page type');
// Mutating only our synthetic output verifies a deploy guard catches accidental service noindex.
const serviceFile = `${out}/paslaugos/service-one/index.html`, saved = readFileSync(serviceFile, 'utf8');
writeFileSync(serviceFile, saved.replace('content="index,follow"', 'content="noindex,nofollow"'));
assert.notEqual(run(['scripts/client-site-deploy-check.mjs', out], false).status, 0);
writeFileSync(serviceFile, saved);
// Build the actual preview wrapper and run the repository's full acceptance checks.
run(['node_modules/astro/astro.js', 'build']);
const preview = read(`dist/perziura/${slug}/paslaugos/service-one/index.html`);
assert.ok(preview.nodes.some((n) => attr(n, 'name') === 'robots' && attr(n, 'content') === 'noindex,nofollow'));
assert.ok(!preview.nodes.some((n) => n.tagName === 'form' && attr(n, 'method') === 'post'));
assert.ok(!preview.nodes.some((n) => n.tagName === 'input' && attr(n, 'name')));
assert.ok(!preview.nodes.some((n) => attr(n, 'type') === 'application/ld+json'));
assert.ok(preview.nodes.some((n) => attr(n, 'href') === 'tel:+37060000000'));
assert.ok(!readFileSync('dist/sitemap-0.xml', 'utf8').includes('/perziura/'));
for (const f of ['src/checks/copy-check.mjs', 'src/checks/js-budget.mjs', 'src/checks/static-check.mjs']) run([f]);
// Check every generated same-site link/fragment and local asset, not just status 200.
function checkLinks(root, file) {
  const page = read(file);
  const ids = page.nodes.map((n) => attr(n, 'id')).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate ids`);
  for (const n of page.nodes) for (const key of ['href', 'src']) {
    const value = attr(n, key);
    if (!value || !/^[#/]/.test(value)) continue;
    const url = new URL(value, `https://synthetic.example.lt/${file.slice(root.length + 1).replace(/index.html$/, '')}`);
    const path = join(root, decodeURIComponent(url.pathname));
    const target = existsSync(path) && !url.pathname.endsWith('/') && /\.[a-z0-9]+$/i.test(path) ? path : join(path, 'index.html');
    assert.ok(existsSync(target), `${file}: missing ${value}`);
    if (url.hash && target.endsWith('.html')) assert.ok(read(target).nodes.some((n) => attr(n, 'id') === decodeURIComponent(url.hash.slice(1))), `${file}: broken anchor ${value}`);
  }
}
for (const p of data.v3.servicePages) { checkLinks(out, `${out}/paslaugos/${p.slug}/index.html`); checkLinks('dist', `dist/perziura/${slug}/paslaugos/${p.slug}/index.html`); }
run(['scripts/client-site-deploy-check.mjs', out]);
// An identified Google embed must never override disabled-map policy.
const disabledConfig = { ...JSON.parse(readFileSync(configPath, 'utf8')), mapMode: 'disabled' };
writeFileSync(configPath, JSON.stringify(disabledConfig));
run([...args, '--config', configPath]);
for (const path of ['index.html', 'jonava/index.html', 'paslaugos/service-one/index.html', 'paslaugos/service-two/index.html']) {
  const disabled = read(`${out}/${path}`);
  assert.ok(!disabled.nodes.some((n) => n.tagName === 'iframe' || attr(n, 'data-map-src') !== undefined), `${path}: disabled map must stay disabled`);
  assert.ok(!disabled.html.includes(data.v3.map.query));
}
run(['scripts/client-site-deploy-check.mjs', out]);
const archive = `previews/staging/seo-synthetic-${Date.now()}`;
mkdirSync(archive);
renameSync(input, `${archive}/input.json`);
renameSync(`public/previews/${slug}`, `${archive}/photos`);
console.log('PASS synthetic production/test/preview routes, grouped links, schema/HTML escaping, activity+town title, real/no-photo layouts, forms, sitemap, top-level 404, deploy guards and all local links. No requests sent. Fixtures retained, ignored.');
