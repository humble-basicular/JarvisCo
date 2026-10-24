#!/usr/bin/env node
/* Focused standalone regression. No live traffic or real submissions.
   node scripts/rytis-launch-check.mjs [previews/<slug>.json client-sites/<slug>]
   Optional private artifact checks read expected copy from the supplied input;
   no customer identities, prices, photos or generated JSON live in this test. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import vm from 'node:vm';
import { parse } from 'parse5';
import sharp from 'sharp';
import { normalize, validateSaved, checkLogoFile, toE164 } from './preview/normalize.mjs';
import { validateLaunchConfig } from '../src/templates/v3/build-config.mjs';
let passed = 0;
const check = async (name, fn) => { await fn(); console.log(`PASS ${name}`); passed++; };
const read = (p) => readFileSync(p, 'utf8');
const walk = (n) => [n, ...(n.childNodes ?? []).flatMap(walk)];
const attr = (n, name) => n.attrs?.find((a) => a.name === name)?.value;
const has = (n, cls) => (attr(n, 'class') ?? '').split(' ').includes(cls);
const text = (n) => n.nodeName === '#text' ? n.value : (n.childNodes ?? []).map(text).join('');
const nodes = (html) => walk(parse(html));
const v3 = {
  theme: { archetype: 'electric', base: '#10161d', base2: '#1a232d', accent: '#1d4ed8', accentHi: '#facc15', paper: '#f3f6f9', heading: 'archivo-black', divider: 'zigzag', hero: 'panel', services: 'tiles', logo: { shape: 'square', glyph: 'bolt', ring: 'Synthetic', line: 'Synthetic descriptor' } },
  h1: { lead: 'Synthetic', hot: 'Kaunas' }, heroChecks: ['Synthetic fact'], aboutTitle: 'Synthetic company', ctaTitle: 'Contact', ctaText: 'Synthetic text',
  trust: [1, 2, 3].map((n) => ({ icon: 'check', title: `Trust ${n}`, text: 'Synthetic fact' })), steps: [1, 2, 3].map((n) => ({ icon: 'check', title: `Step ${n}`, text: 'Synthetic step' })),
};
const base = { business: 'Synthetic fixture', phone: '+37060000000', city: 'Kaunas', areas: ['Kaunas'], services: ['Synthetic service'], photos: [], v3 };
const config = { mapMode: 'consent', privacy: { controller: { name: 'Synthetic controller', email: 'controller@example.lt' }, processor: { name: 'Synthetic processor', email: 'processor@example.lt' }, retention: 'Synthetic retention fact.', legalBasis: 'Synthetic basis fact.', hosting: 'Synthetic hosting fact.', rights: 'Synthetic rights fact.', updatedAt: '2026-10-23' }, worker: { configured: true, site: 'synthetic', origins: ['https://example.lt'], recipients: ['recipient@example.lt'] } };
const context = { code: 'synthetic', domain: 'example.lt' };
await check('new flags are opt-in and reject malformed values', () => {
  const defaults = normalize(base).data.v3;
  for (const k of ['hideTagline', 'largeWordmark', 'hidePendingGoogle', 'priceFootnote', 'clientLogo']) assert.equal(defaults[k], undefined);
  assert.throws(() => normalize({ ...base, v3: { ...v3, hideTagline: 'yes' } }), /boolean/);
  assert.throws(() => normalize({ ...base, logo: 'logo.jpg', v3: { ...v3, clientLogo: { width: 360, height: 360, formBadge: 'yes' } } }), /boolean/);
});
await check('supplied JPEG logos decode fully; fake/truncated JPEG refused', async () => {
  const jpeg = await sharp({ create: { width: 36, height: 36, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
  await checkLogoFile(jpeg, '.jpg');
  await assert.rejects(() => checkLogoFile(jpeg.subarray(0, 20), '.jpg'), /logo/);
  await assert.rejects(() => checkLogoFile(Buffer.from('fake'), '.jpg'), /JPEG/);
});
await check('production refuses missing privacy/Worker/recipients; test permits unresolved facts without fabricating them', () => {
  assert.throws(() => validateLaunchConfig(undefined, context), /requires --config/);
  assert.deepEqual(validateLaunchConfig(undefined, { ...context, test: true }), { mapMode: 'disabled' });
  for (const key of ['retention', 'legalBasis', 'hosting', 'rights', 'updatedAt']) assert.throws(() => validateLaunchConfig({ ...config, privacy: { ...config.privacy, [key]: null } }, context), /required/);
  assert.throws(() => validateLaunchConfig({ ...config, worker: { ...config.worker, origins: ['https://wrong.lt'] } }, context), /origins/);
  assert.throws(() => validateLaunchConfig({ ...config, worker: { ...config.worker, recipients: [] } }, context), /recipients/);
  assert.throws(() => validateLaunchConfig({ ...config, privacy: { ...config.privacy, controller: { ...config.privacy.controller, address: 'Private address' } } }, context), /address/);
  assert.equal(validateLaunchConfig(config, context).privacy.controller.name, config.privacy.controller.name);
});

// Exercise the actual browser form lifecycle against a local in-memory fetch stub.
function harness() {
  const posted = [], destinations = [], storage = new Map();
  let response = { status: 200, body: { ok: true, id: 'synthetic-receipt' } };
  const make = () => {
    const handlers = {}, fields = { name: { value: 'Synthetic' }, phone: { value: '860000000', setCustomValidity(v) { this.invalid = !!v; }, addEventListener() {} }, message: { value: 'Synthetic request' } };
    const input = { files: [], addEventListener(k, fn) { handlers['file:' + k] = fn; } };
    const button = { textContent: 'Send', disabled: false };
    const error = { hidden: true, focus() {} }, errorText = { textContent: '' };
    const form = { action: 'http://localhost:4433/t/form', classList: { add() {} }, fields, input, button, error, errorText, handlers,
      querySelector(s) { return ({ '[name=phone]': fields.phone, '[name=message]': fields.message, 'input[type="file"]': input, '[data-file-list]': null, '[data-file-sum]': null, '[data-form-error]': error, '[data-form-error-text]': errorText, 'button[type="submit"]': button })[s]; },
      querySelectorAll() { return []; }, reportValidity() { return !!fields.phone.value && !fields.phone.invalid; }, addEventListener(k, fn) { handlers[k] = fn; } };
    return form;
  };
  const forms = [make(), make()];
  const doc = { body: { getAttribute() { return 'synthetic'; } }, querySelectorAll(s) { return s.includes('button') ? forms.map((f) => f.button) : forms; } };
  class Data { constructor(form) { this.values = Object.fromEntries(Object.entries(form.fields).map(([k, v]) => [k, v.value])); this.values.site = 'synthetic'; this.values.kind = 'site_inquiry'; } set(k, v) { this.values[k] = v; } delete(k) { delete this.values[k]; } append(k, v) { (this.values[k] ??= []).push(v); } }
  vm.runInNewContext(read('src/templates/v3/form.js'), { document: doc, window: {}, sessionStorage: { removeItem(k) { storage.delete(k); }, setItem(k, v) { storage.set(k, v); } }, FormData: Data, Blob, Date, Math, location: { assign(url) { destinations.push(url); } }, fetch: async (url, options) => { posted.push(options.body.values); if (response instanceof Error) throw response; return { status: response.status, ok: response.status >= 200 && response.status < 300, json: async () => response.body }; } });
  return { forms, posted, destinations, storage, set(value) { response = value; }, async submit(n = 0) { forms[n].handlers.submit({ preventDefault() {} }); await new Promise((r) => setTimeout(r, 0)); } };
}
await check('phone validation and file limits block fetch', async () => {
  for (const bad of ['', '123', 'abcdefgh', '12345678x', '1'.repeat(21)]) { const h = harness(); h.forms[0].fields.phone.value = bad; await h.submit(); assert.equal(h.posted.length, 0); }
  for (const files of [[{ name: 'bad.exe', type: 'application/octet-stream', size: 5 }], [{ name: 'big.jpg', type: 'image/jpeg', size: 11 * 1024 * 1024 }], Array.from({ length: 9 }, (_, n) => ({ name: `${n}.jpg`, type: 'image/jpeg', size: 10 })), Array.from({ length: 3 }, (_, n) => ({ name: `${n}.pdf`, type: 'application/pdf', size: 9 * 1024 * 1024 }))]) {
    const h = harness(); h.forms[0].input.files = files; h.forms[0].handlers['file:change'](); await h.submit(); assert.equal(h.posted.length, 0); assert.equal(h.forms[0].error.hidden, false);
  }
});
await check('success requires a server receipt; rejected requests keep input and permit retry', async () => {
  const h = harness(); h.set({ status: 400, body: { error: 'invalid' } }); await h.submit();
  assert.equal(h.forms[0].error.hidden, false); assert.equal(h.forms[0].fields.message.value, 'Synthetic request'); assert.ok(h.forms.every((f) => !f.button.disabled));
  h.set({ status: 200, body: { ok: true, id: 'synthetic-receipt' } }); await h.submit();
  assert.equal(h.posted.length, 2); assert.equal(h.posted[1].kind, 'site_inquiry'); assert.match(h.destinations[0], /^\/aciu\/\?receipt=/); assert.ok(h.storage.get('hs-receipt:synthetic'));
});
await check('500, network failure and 200 without receipt lock both forms against duplicate POST', async () => {
  for (const result of [{ status: 500, body: {} }, new Error('offline'), { status: 200, body: { ok: true } }]) {
    const h = harness(); h.set(result); await h.submit(); await h.submit(1);
    assert.equal(h.posted.length, 1); assert.equal(h.destinations.length, 0); assert.ok(h.forms.every((f) => f.button.disabled)); assert.match(h.forms[0].errorText.textContent, /ar užklausa gauta/);
  }
  const h = harness(); h.forms[0].handlers.submit({ preventDefault() {} }); h.forms[1].handlers.submit({ preventDefault() {} }); await new Promise((r) => setTimeout(r, 0)); assert.equal(h.posted.length, 1);
});

const slug = Array.from(randomBytes(10), (n) => '23456789abcdefghjkmnpqrstuvwxyz'[n % 30]).join('');
const fixtureDir = resolve('client-sites', `regression-${slug}`); mkdirSync(fixtureDir, { recursive: true });
const photoDir = resolve('public/previews', slug); mkdirSync(photoDir, { recursive: true });
await sharp({ create: { width: 1600, height: 1000, channels: 3, background: '#8c9195' } }).jpeg().toFile(join(photoDir, '1.jpg'));
const fixture = { ...base, slug, towns: [{ name: 'Jonava', slug: 'jonava', loc: 'Jonavoje', text: 'Synthetic town-specific copy.', heading: 'Synthetic town' }], photos: [{ src: `/previews/${slug}/1.jpg`, width: 1600, height: 1000 }] };
const input = resolve('previews', `${slug}.json`); writeFileSync(input, JSON.stringify(fixture));
// The synthetic preview must never stay in previews/ or public/previews/ (a later site build would publish it).
process.on('exit', () => { rmSync(input, { force: true }); rmSync(photoDir, { recursive: true, force: true }); });
const cfg = join(fixtureDir, 'synthetic-config.json'); writeFileSync(cfg, JSON.stringify(config));
const out = resolve('client-sites', slug);
const build = (...args) => spawnSync(process.execPath, ['scripts/client-site.mjs', input, '--site', 'synthetic', '--domain', 'example.lt', ...args], { encoding: 'utf8' });
const deploy = () => spawnSync(process.execPath, ['scripts/client-site-deploy-check.mjs', out], { encoding: 'utf8' });
await check('test standalone remains v3; test artifact refused even if marker is ignored by caller', () => {
  const result = build('--test', 'http://localhost:4433'); assert.equal(result.status, 0, result.stderr); assert.match(read(join(out, 'index.html')), /class="v3 /); assert.notEqual(deploy().status, 0);
  assert.equal(build().status, 1); assert.ok(existsSync(join(out, 'TEST-BUILD-DO-NOT-DEPLOY.txt')), 'refusal must not overwrite existing build');
});
await check('synthetic production build has validated config, canonical towns, sitemap and named forms', () => {
  const result = build('--config', cfg); assert.equal(result.status, 0, result.stderr); assert.equal(deploy().status, 0, deploy().stderr);
  const html = read(join(out, 'index.html')); assert.doesNotMatch(html, /<form[^>]*data-inert-form|localhost|noindex/); assert.match(html, /data-map-src=/); assert.doesNotMatch(html, /<iframe[^>]*src=/);
  for (const route of ['', 'jonava/', 'privatumo-politika/']) { const h = read(join(out, route, 'index.html')); assert.ok(h.includes(`href="https://example.lt/${route}"`)); assert.ok(read(join(out, 'sitemap.xml')).includes(`<loc>https://example.lt/${route}</loc>`)); }
  for (const f of nodes(html).filter((n) => n.tagName === 'form')) {
    assert.equal(attr(f, 'action'), 'https://www.jarvisweb.lt/t/form'); const fields = walk(f).filter((n) => attr(n, 'name')).map((n) => attr(n, 'name')); assert.deepEqual(fields.sort(), ['files', 'kind', 'message', 'name', 'phone', 'site', 'website'].sort());
  }
  const thanks = read(join(out, 'aciu/index.html')); assert.match(thanks, /data-aciu-neutral/); assert.match(thanks, /data-aciu-ok hidden/); assert.match(thanks, /data-aciu-error hidden/); assert.match(thanks, /sessionStorage\.removeItem/);
});
await check('launch candidate (--pending-worker) is refused by deploy-check until the Worker site is registered; tracking + no AI footer note', () => {
  const pcfg = join(fixtureDir, 'synthetic-pending.json'); writeFileSync(pcfg, JSON.stringify({ ...config, worker: { ...config.worker, configured: false } }));
  assert.equal(build('--config', pcfg).status, 1, 'configured=false needs --pending-worker');
  assert.equal(build('--config', cfg, '--pending-worker').status, 1, 'configured=true is not a candidate');
  const result = build('--config', pcfg, '--pending-worker'); assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(read(join(out, 'build-manifest.json'))).workerRegistered, false);
  const strict = deploy(); assert.notEqual(strict.status, 0); assert.match(strict.stderr, /not registered/);
  const loose = spawnSync(process.execPath, ['scripts/client-site-deploy-check.mjs', out, '--allow-pending-worker'], { encoding: 'utf8' }); assert.equal(loose.status, 0, loose.stderr); assert.match(loose.stdout, /PENDING/);
  const html = read(join(out, 'index.html')); assert.match(html, /<meta name="jw-site" content="synthetic"/); assert.match(html, /<meta name="jw-endpoint" content="https:\/\/www\.jarvisweb\.lt\/t\/e"/); assert.doesNotMatch(html, /sukurta DI/);
});
await check('other previews and demo remain inert with their prior branding and Google behavior', () => {
  for (const f of readdirSync('previews').filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(read(join('previews', f))); const path = `dist/perziura/${d.slug}/index.html`;
    if (!d.v3 || d.v3.hideTagline || !existsSync(path)) continue;
    const html = read(path); assert.match(html, /data-inert-form/); assert.doesNotMatch(html, /<input[^>]*name=/); assert.ok(html.includes(d.v3.theme.logo.line)); assert.match(html, /Google profilis ruošiamas/);
  }
  const demo = read('dist/pavyzdys/sildymas/index.html'); assert.match(demo, /data-inert-form/); assert.doesNotMatch(demo, /href="tel:|<input[^>]*name=|id="atsiliepimai"/);
});
if (process.argv[2]) await check('private artifact exactly matches supplied price, hours, logo, process and form corrections on all towns', () => {
  const d = validateSaved(JSON.parse(read(process.argv[2]))), dir = resolve(process.argv[3]);
  for (const route of ['', ...(d.towns ?? []).filter((t) => t.text).map((t) => t.slug)]) {
    const html = read(join(dir, route, 'index.html')), ns = nodes(html);
    for (const price of d.prices) { const row = ns.find((n) => n.tagName === 'tr' && text(n).includes(price.name)); assert.ok(row); assert.ok(text(row).includes(price.price)); }
    assert.ok(html.includes(d.hours)); assert.ok(html.includes(d.v3.priceFootnote)); assert.ok(!ns.some((n) => has(n, 'v3-reviews__soon') || has(n, 'v3-reviews__google')));
    const brand = ns.find((n) => has(n, 'v3-brand')); assert.ok(text(brand).includes(d.business)); assert.ok(!text(brand).includes(d.v3.theme.logo.line));
    assert.equal(ns.filter((n) => has(n, 'v3-quote__badge--client')).length, 2);
    for (const step of d.v3.steps) assert.ok(html.includes(step.text));
    for (const a of ns.filter((n) => n.tagName === 'a' && attr(n, 'href')?.startsWith('tel:'))) assert.equal(attr(a, 'href'), `tel:${toE164(d.phone)}`);
    assert.match(html, /class="v3 /); assert.doesNotMatch(html, /PERŽIŪRA|<form[^>]*data-inert-form/);
    const local = ns.flatMap((n) => ['src', 'href'].map((key) => attr(n, key))).filter((v) => v?.startsWith('/') && !v.startsWith('//'));
    for (const path of local) assert.ok(existsSync(join(dir, path.split('#')[0].split('?')[0])) || existsSync(join(dir, path, 'index.html')), path);
  }
  assert.deepEqual(readFileSync(join(dir, 'foto/logo.jpg')), readFileSync(resolve('public/previews', d.slug, 'logo.jpg')));
});
console.log(`${passed} focused checks passed; synthetic artifacts retained at ${fixtureDir}`);
