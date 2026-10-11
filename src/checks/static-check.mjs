// Build-only verification. This does not measure layout, keyboard behaviour,
// actual network delivery, Lighthouse, or any browser acceptance criterion.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brand, form, arbcutProof, steps } from '../data/content.js';
import { BEACON_ENDPOINT, EVENT_TYPES, STORAGE_KEY, TRACKING_PREFIXES } from '../data/tracking.js';
import { pages, attr, text, normalized } from './html.mjs';

const built = pages();
const origin = brand.url;
const routeFor = (path) => path === 'index.html' ? '/' : `/${path.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`;
const routes = new Map(built.map((page) => [routeFor(page.path), page]));
const errors = [];
function check(condition, message) { if (!condition) errors.push(message); }
for (const [route, page] of routes) {
  if (route === '/arboristams') continue; // generated static fallback, host owns HTTP 301
  const elements = page.nodes;
  const ids = elements.map((node) => attr(node, 'id')).filter(Boolean);
  check(new Set(ids).size === ids.length, `${route}: duplicate IDs`);
  check(elements.filter((node) => node.tagName === 'h1').length === 1, `${route}: expected one H1`);
  check(elements.filter((node) => node.tagName === 'main').length === 1, `${route}: expected one main`);
  for (const node of elements) {
    if (node.tagName === 'img') {
      check(attr(node, 'alt') !== undefined, `${route}: image without alt`);
      if (!elements.some((n) => attr(n, 'data-zoom-dialog') !== undefined && n === node.parentNode?.parentNode)) {
        check(Number(attr(node, 'width')) > 0 && Number(attr(node, 'height')) > 0, `${route}: image without intrinsic dimensions`);
      }
    }
    for (const name of ['href', 'src']) {
      const value = attr(node, name);
      if (!value || !value.startsWith('/') && !value.startsWith('#')) continue;
      const url = new URL(value, `${origin}${route}`);
      const path = url.pathname.replace(/\/$/, '') || '/';
      const target = routes.get(path);
      check(Boolean(target) || existsSync(join('dist', path)), `${route}: missing ${value}`);
      if (url.hash && target) check(target.nodes.some((n) => attr(n, 'id') === decodeURIComponent(url.hash.slice(1))), `${route}: broken anchor ${value}`);
    }
    if (node.tagName === 'input' && attr(node, 'pattern')) {
      try { new RegExp(attr(node, 'pattern'), 'v'); }
      catch { check(false, `${route}: invalid native input pattern`); }
    }
    if (node.tagName === 'input' && !['hidden', 'checkbox'].includes(attr(node, 'type'))) {
      check(elements.some((label) => label.tagName === 'label' && attr(label, 'for') === attr(node, 'id')), `${route}: unlabelled form field`);
    }
  }
}
for (const route of ['/', '/rezultatai']) {
  const page = routes.get(route);
  check(Boolean(page), `Missing ${route}`);
  if (!page) continue;
  const el = page.nodes;
  const body = normalized(text(page.tree));
  const inquiries = el.filter((node) => attr(node, 'data-inquiry-form') !== undefined);
  check(inquiries.length === 1 && attr(inquiries[0], 'action') === form.endpoint, `${route}: inquiry form endpoint`);
  for (const field of ['name', 'phone', 'email']) {
    check(el.some((node) => node.tagName === 'input' && attr(node, 'name') === field && attr(node, 'required') !== undefined), `${route}: missing required field ${field}`);
  }
  check(el.some((node) => attr(node, 'name') === 'access_key' && attr(node, 'value') === form.web3formsKey), `${route}: Web3Forms key changed`);
  for (const [type, href] of [['cta_sms', brand.smsHref], ['cta_call', brand.telHref], ['pdf', arbcutProof.pdf.href], ['arbcut', arbcutProof.site.href]]) {
    const links = el.filter((node) => attr(node, 'data-track') === type);
    check(links.length > 0 && links.every((node) => attr(node, 'href') === href), `${route}: ${type} interface`);
  }
  check(el.some((node) => attr(node, 'data-proof-anchor') !== undefined), `${route}: proof beacon anchor missing`);
  check(el.filter((node) => attr(node, 'data-zoom-dialog') !== undefined).length === 1, `${route}: missing zoom dialog`);
  for (const shot of arbcutProof.items.flatMap((item) => item.shots)) {
    const link = el.find((node) => attr(node, 'data-zoom') !== undefined && attr(node, 'data-caption') === shot.caption);
    check(Boolean(link) && Number(attr(link, 'data-w')) > 0 && Number(attr(link, 'data-h')) > 0, `${route}: missing original proof ${shot.full}`);
    check(Boolean(link) && attr(link, 'href').includes(shot.full), `${route}: incorrect proof asset ${shot.full}`);
  }
  steps.items.forEach((step) => check(body.includes(step), `${route}: missing step ${step}`));
}
assert.equal(BEACON_ENDPOINT, '/t/e');
assert.equal(STORAGE_KEY, 'jw_proof_code');
assert.deepEqual(EVENT_TYPES, ['view', 'scroll_proof', 'cta_sms', 'cta_call', 'pdf', 'arbcut']);
assert.equal(TRACKING_PREFIXES.a, '/rezultatai');
const redirects = JSON.parse(readFileSync('vercel.json', 'utf8')).redirects;
for (const source of ['/arboristams', '/arboristams/']) {
  check(redirects.some((rule) => rule.source === source && rule.destination === '/rezultatai' && rule.statusCode === 301), `Missing exact 301: ${source}`);
}
const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
check(sitemap.includes(`${origin}/rezultatai`) && !sitemap.includes('/arboristams'), 'Sitemap routes incorrect');
errors.forEach((error) => console.error(error));
console.log(`static-check: ${built.length} pages, local links/assets, evidence, forms, tracking and redirect configuration: ${errors.length ? 'FAILED' : 'ok'}`);
console.log('Browser layout, interaction, performance and live redirects remain unverified.');
process.exitCode = errors.length ? 1 : 0;
