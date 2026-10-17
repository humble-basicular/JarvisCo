// Build-only verification. This does not measure layout, keyboard behaviour,
// actual network delivery, Lighthouse, or any browser acceptance criterion.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brand, form, arbcutProof, steps, funnel } from '../data/content.js';
import { MAIN_CTA } from '../data/v4.js';
import arbcut from '../data/arbcut-proof.json' with { type: 'json' };
import { BEACON_ENDPOINT, EVENT_TYPES, FORM_ENDPOINT, STORAGE_KEY, TRACKING_PREFIXES } from '../data/tracking.js';
import { pages, attr, text, textContent, normalized, nodes } from './html.mjs';

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
// Pre-v4 arborist landing (kept as is until Jarvis decides its offer).
for (const route of ['/rezultatai']) {
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
// v4 pages with the step-by-step preview form (funnel spec §2–§4, plan §4.2–§4.3).
const WIRE = ['code', 'name', 'phone', 'services', 'services_other', 'area', 'area_other', 'photos_ok', 'standout', 'contact_time', 'files', 'website', 'email', 'preview_via'];
for (const route of ['/', '/sildymui', '/noriu']) {
  const page = routes.get(route);
  check(Boolean(page), `Missing ${route}`);
  if (!page) continue;
  const el = page.nodes;
  const forms = el.filter((node) => attr(node, 'data-preview-form') !== undefined);
  const f = forms[0];
  check(forms.length === 1 && attr(f, 'action') === FORM_ENDPOINT && attr(f, 'method') === 'post' && attr(f, 'enctype') === 'multipart/form-data', `${route}: preview form must POST multipart to /t/form`);
  if (!f) continue;
  const inForm = nodes(f);
  const named = (name) => inForm.filter((node) => attr(node, 'name') === name && attr(node, 'form') === undefined);
  for (const name of WIRE) check(named(name).length > 0, `${route}: missing form field ${name}`);
  // Exactly the spec's wire fields: anything else that has a name must belong to no form.
  const extra = inForm.filter((node) => ['input', 'select', 'textarea', 'button'].includes(node.tagName) && attr(node, 'name') && attr(node, 'form') === undefined && ![...WIRE, 'kind'].includes(attr(node, 'name')));
  check(extra.length === 0, `${route}: non-wire form fields ${extra.map((n) => attr(n, 'name'))}`);
  check(named('email').length === 1 && attr(named('email')[0], 'type') === 'email', `${route}: expected name="email" input`);
  check(named('preview_via').map((n) => attr(n, 'value')).join() === 'sms,email', `${route}: expected name="preview_via" SMS/email choices`);
  check(inForm.some((node) => attr(node, 'data-profile') !== undefined && attr(node, 'form') === 'pf-none'), `${route}: profile URL must be composed into standout, never a wire field`);
  const lastStep = inForm.filter((node) => attr(node, 'data-step') !== undefined).at(-1);
  check(nodes(lastStep).filter((node) => attr(node, 'name') === 'kind').length === 2, `${route}: both submit buttons must be in the last step`);
  check(!el.some((node) => node.tagName === 'blockquote'), `${route}: no testimonial quotes`);
  for (const container of ['header', '#apie', '#forma', 'footer']) {
    const block = el.find((node) => container.startsWith('#') ? attr(node, 'id') === container.slice(1) : node.tagName === container);
    check(block && nodes(block).some((node) => attr(node, 'href') === brand.emailHref), `${route}: missing email in ${container}`);
  }
  check(el.some((node) => attr(node, 'href') === brand.emailHref && normalized(text(node)) === brand.email), `${route}: email address must be readable`);
  check(/<noscript>(?:(?!<\/noscript>)[\s\S])*mailto:jarvisworks\.co@gmail\.com/.test(page.html), `${route}: noscript email fallback`);
  check(attr(named('name')[0], 'value') === undefined, `${route}: name must not be prefilled`);
  check(attr(named('phone')[0], 'required') !== undefined, `${route}: phone must be required without JS (no code)`);
  check(attr(named('files')[0], 'multiple') !== undefined && attr(named('files')[0], 'capture') === undefined, `${route}: files must be multiple and not camera-only`);
  const kinds = named('kind').map((node) => attr(node, 'value'));
  check(kinds.join() === 'preview_request,callback_request', `${route}: submit buttons kind ${kinds}`);
  // No JS: the form stays hidden (it must not navigate to the Worker's JSON); call / SMS are the fallback.
  check(attr(f, 'hidden') !== undefined, `${route}: preview form must render hidden (script reveals it)`);
  check(/<noscript>(?:(?!<\/noscript>)[\s\S])*tel:(?:(?!<\/noscript>)[\s\S])*sms:/.test(page.html), `${route}: noscript call + SMS fallback`);
  check(!named('kind').some((node) => attr(node, 'formnovalidate') !== undefined), `${route}: no formnovalidate (native validation without JS)`);
  check(named('contact_time').map((n) => attr(n, 'value')).join() === 'morning,day,evening,sms', `${route}: contact_time values`);
  check(named('photos_ok').map((n) => attr(n, 'value')).join() === 'yes,send_other', `${route}: photos_ok values`);
  check(named('services').length <= 12 * Object.keys(funnel.services).length && named('area').length <= 12, `${route}: max 12 options`);
  check(normalized(text(f)).includes(MAIN_CTA), `${route}: main CTA in form`);
  const ctas = el.filter((node) => attr(node, 'data-track') === 'preview_cta');
  check(ctas.length > 0 && ctas.every((node) => attr(node, 'href') === '#forma'), `${route}: preview_cta links must open #forma`);
  for (const [type, href] of [['cta_sms', brand.smsHref], ['cta_call', brand.telHref], ['arbcut', arbcutProof.site.href]]) {
    const links = el.filter((node) => attr(node, 'data-track') === type);
    check(links.length > 0 && links.every((node) => attr(node, 'href') === href), `${route}: ${type} interface`);
  }
  check(el.some((node) => attr(node, 'data-proof-anchor') !== undefined), `${route}: proof beacon anchor missing`);
  check(el.some((node) => attr(node, 'href') === funnel.example.href), `${route}: example link missing`);
  // Every screenshot named in arbcut-proof.json (scripts/proof-refresh.mjs) must be on the page.
  for (const proof of [arbcut.gsc.file, ...arbcut.forms.months.slice(-3).map((m) => m.file)].map((f) => f.replace(/\.\w+$/, ''))) {
    check(el.some((node) => (attr(node, 'src') ?? attr(node, 'href') ?? '').includes(proof)), `${route}: proof screenshot ${proof} missing`);
  }
}
{
  const canonical = routes.get('/noriu')?.nodes.find((node) => node.tagName === 'link' && attr(node, 'rel') === 'canonical');
  check(attr(canonical, 'href') === `${origin}/sildymui`, '/noriu: canonical must be /sildymui');
}

for (const [route, page] of routes) {
  const robots = page.nodes.find((node) => node.tagName === 'meta' && attr(node, 'name') === 'robots');
  const isPreview = /^\/(perziura|pavyzdys)\//.test(route);
  if (isPreview) {
    check(attr(robots, 'content') === 'noindex,nofollow', `${route}: preview must be noindex,nofollow`);
    check(!page.nodes.some((node) => node.tagName === 'form' && (attr(node, 'method') ?? 'get').toLowerCase() === 'post'), `${route}: preview form must not post`);
    const dial = page.nodes.filter((node) => /^(tel|sms):/.test(attr(node, 'href') ?? ''));
    check(dial.every((node) => attr(node, 'href') === brand.smsHref), `${route}: preview may only link to Matas's SMS, never dial the business`);
  }
}
// Demo town (GEO) pages: three pages, each with its own title, description and H1, all noindex + PAVYZDYS,
// linked from the demo homepage ("Aptarnaujame") and from every demo footer.
{
  const TOWNS = ['kaunas', 'jonava', 'kedainiai'];
  const meta = (page, name) => attr(page.nodes.find((n) => n.tagName === 'meta' && attr(n, 'name') === name), 'content');
  const seen = { title: new Set(), description: new Set(), h1: new Set() };
  for (const slug of TOWNS) {
    const route = `/pavyzdys/sildymas/${slug}`;
    const page = routes.get(route);
    check(Boolean(page), `Missing ${route}`);
    if (!page) continue;
    seen.title.add(normalized(textContent(page.nodes.find((n) => n.tagName === 'title'))));
    seen.description.add(meta(page, 'description'));
    seen.h1.add(normalized(textContent(page.nodes.find((n) => n.tagName === 'h1'))));
    check(meta(page, 'robots') === 'noindex,nofollow', `${route}: must be noindex,nofollow`);
    check(normalized(text(page.tree)).includes('PAVYZDYS'), `${route}: missing PAVYZDYS banner`);
    check(page.nodes.some((n) => attr(n, 'id') === 'aptarnavimas') && page.nodes.some((n) => attr(n, 'id') === 'uzklausa'), `${route}: town section and form`);
    for (const other of TOWNS) check(page.nodes.some((n) => n.tagName === 'a' && attr(n, 'href') === `/pavyzdys/sildymas/${other}`), `${route}: footer link to ${other}`);
  }
  for (const key of Object.keys(seen)) check(seen[key].size === TOWNS.length, `Town pages must have unique ${key}`);
  const home = routes.get('/pavyzdys/sildymas');
  check(home?.nodes.some((n) => attr(n, 'id') === 'miestai') ?? false, 'Demo homepage: missing "Aptarnaujame" block');
  for (const slug of TOWNS) check(home?.nodes.some((n) => n.tagName === 'a' && attr(n, 'href') === `/pavyzdys/sildymas/${slug}`) ?? false, `Demo homepage: missing link to ${slug}`);
}
check(routes.has('/pavyzdys/sildymas'), 'Missing /pavyzdys/sildymas');
assert.equal(FORM_ENDPOINT, '/t/form');
assert.equal(TRACKING_PREFIXES.p, '/noriu');
assert.equal(BEACON_ENDPOINT, '/t/e');
assert.equal(STORAGE_KEY, 'jw_proof_code');
assert.deepEqual(EVENT_TYPES, ['view', 'scroll_proof', 'cta_sms', 'cta_call', 'pdf', 'arbcut', 'preview_cta']);
assert.equal(TRACKING_PREFIXES.a, '/rezultatai');
const redirects = JSON.parse(readFileSync('vercel.json', 'utf8')).redirects;
for (const source of ['/arboristams', '/arboristams/']) {
  check(redirects.some((rule) => rule.source === source && rule.destination === '/rezultatai' && rule.statusCode === 301), `Missing exact 301: ${source}`);
}
const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
check(sitemap.includes(`${origin}/rezultatai`) && !sitemap.includes('/arboristams'), 'Sitemap routes incorrect');
check(!/\/(perziura|pavyzdys)\//.test(sitemap), 'Sitemap lists a preview page');
errors.forEach((error) => console.error(error));
console.log(`static-check: ${built.length} pages, local links/assets, evidence, forms, tracking and redirect configuration: ${errors.length ? 'FAILED' : 'ok'}`);
console.log('Browser layout, interaction, performance and live redirects remain unverified.');
process.exitCode = errors.length ? 1 : 0;
