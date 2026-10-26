import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, validateSaved } from './preview/normalize.mjs';
import { validateServicePages, serviceHref, pageForService, serviceTitle, townTitle, safeJsonLd, businessSchema } from '../src/templates/v3/service-pages.mjs';
const page = { slug: 'service-one', serviceNames: ['A', 'B'], heading: 'Service in Town', description: 'Description', lead: 'Lead', sections: [{ heading: 'Scope', text: 'Plain text' }], photoIndexes: [0] };
const photos = [{ width: 1600, height: 1000, src: '/test.jpg' }, { ai: true }];
const validate = (pages) => validateServicePages(pages, ['A', { name: 'B' }], photos);
test('grouped mapping covers every service once and keeps optional fields absent', () => { const out = validate([page]); assert.deepEqual(out, [page]); assert.equal(pageForService(out, 'B').slug, page.slug); });
test('rejects missing, unknown and duplicate mappings and pages', () => {
  for (const pages of [[{ ...page, serviceNames: ['A'] }], [{ ...page, serviceNames: ['A', 'X'] }], [{ ...page, serviceNames: ['A', 'A'] }], [page, page], []]) assert.throws(() => validate(pages));
  assert.throws(() => validate([{ ...page, serviceNames: ['A'] }, { ...page, serviceNames: ['B'] }]), /slug is duplicated/);
});
test('rejects reserved, traversal, encoded, Unicode and malformed slugs', () => {
  for (const slug of ['404', 'index', 'paslaugos', '../x', '%2f', 'A', 'ąžuolas', 'a--b', '-abc', 'abc/', 'a'.repeat(81)]) assert.throws(() => validate([{ ...page, slug }]));
});
test('enforces frozen text, list, section, FAQ and photo limits', () => {
  for (const [key, max] of [['heading', 140], ['description', 260], ['lead', 800]]) assert.throws(() => validate([{ ...page, [key]: 'x'.repeat(max + 1) }]));
  for (const change of [{ sections: Array(7).fill(page.sections[0]) }, { sections: [{ heading: 'x', text: 'x'.repeat(2001) }] }, { preparation: Array(9).fill('x') }, { included: ['x'.repeat(301)] }, { faq: [{ q: 'x', a: 'x'.repeat(601) }] }, { photoIndexes: [1] }, { photoIndexes: [99] }, { photoIndexes: [-1] }, { photoIndexes: [0.1] }, { photoIndexes: [0, 0] }]) assert.throws(() => validate([{ ...page, ...change }]));
});
test('links distinguish preview and standalone; title preserves activity + town', () => {
  assert.equal(serviceHref('service-one', '/perziura/abcdefghjk'), '/perziura/abcdefghjk/paslaugos/service-one');
  assert.equal(serviceHref('service-one'), '/paslaugos/service-one/');
  assert.equal(serviceTitle(page, 'Business', true), 'Service in Town – Business – peržiūra');
  assert.equal(townTitle({ business: 'Business', tagline: 'Service in Town' }, {}, {}), 'Service in Town – Business');
  assert.equal(townTitle({ business: 'Business' }, { h1: { lead: 'Service', hot: 'Base' } }, { loc: 'Town' }), 'Service Town – Business');
});
test('JSON-LD escapes script terminators, HTML and JS separators losslessly', () => {
  const value = { text: '</script><script>&\u2028\u2029' }, encoded = safeJsonLd(value);
  assert.ok(!/[<>&\u2028\u2029]/.test(encoded)); assert.deepEqual(JSON.parse(encoded), value);
});
test('truthful schema shares stable business identity and invents no claims', () => {
  const data = { business: 'Test', phone: '+37060000000', city: 'Town', areas: ['Town', 'Area'], photos: [] };
  const graph = businessSchema(data, 'example.lt', { page, canonical: 'https://example.lt/paslaugos/service-one/' })['@graph'];
  assert.deepEqual(graph.map((n) => n['@type']), ['LocalBusiness', 'Service', 'BreadcrumbList']);
  assert.equal(graph[1].provider['@id'], graph[0]['@id']);
  for (const key of ['address', 'aggregateRating', 'review', 'openingHours', 'geo', 'priceRange']) assert.equal(graph[0][key], undefined);
});
test('generic inputs without v3 or servicePages stay valid', () => {
  const base = { business: 'Synthetic', phone: '+37060000000', city: 'Town', areas: ['Town'], services: ['A'], photos: [] };
  assert.equal(normalize(base).data.v3, undefined); assert.equal(validateSaved({ ...base, slug: '23456789ab' }).services[0], 'A');
});
