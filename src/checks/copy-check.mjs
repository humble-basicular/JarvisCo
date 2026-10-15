// Checks rendered copy, metadata, accessible labels and form messages. Script
// operators, CSS and comments are excluded; offer comparison remains allowed.
import { arbcutProof, faq, offer, resultsPage } from '../data/content.js';
import * as v4 from '../data/v4.js';
import { pages, text, textContent, normalized } from './html.mjs';

const banned = [
  /NUOTRAUKA\s*:|CITATA\s*:/iu,
  /500\s*€|47\s*€/u, /11[\s,.]*362/u, /prenumerat|mėnesiniai planai/iu,
  /atsiliepim|\/atsiliepimas/iu, /Kazlausk|Vaitkut|Petrausk|Stankevič|Jankausk/u,
  /TOP pozicij|5[,.]0\s*★|100\+|<\s*1\s*s/iu,
  /praleist[oaų]\s+skambuči|automatiz|automatinės SMS/iu,
  /three\.js|gsap|geriausi|revoliucin/iu, /!/u,
  /20\s+(?:formos\s+)?užklausų\s+per\s+3/iu,
  // Old monthly offer; the Paslaugos.lt "~50 € kas mėnesį" comparison stays allowed.
  // Offer v2 (plan §1) allows exactly one monthly price: 39 €.
  /(?<!\b39\s?)€\s?\/\s?mėn/u, /mėnesin\w*\s+plan/iu,
  // No rank guarantees (plan §1).
  /garantuo\w*\s+(?:pirm|TOP|viet)/iu,
  // The 20 form inquiries are not attributed to Google (proof spec §9).
  /20\s+(?:formos\s+)?užklausų[^.\d]{0,40}(?:iš|per)\s+Google/iu,
];
const allowed = [`${v4.price.amount} ${v4.price.unit}`, offer.comparison, offer.year.lead, `${offer.year.rows[0].value} ${offer.year.rows[0].detail}`];
const mustBlock = ['NUOTRAUKA: trūksta', 'CITATA: trūksta', '47 €/mėn.', '49 € / mėn.', 'garantuojame pirmą vietą', '20 užklausų iš Google', 'mėnesinis planas'];
for (const value of allowed) {
  const re = banned.find((pattern) => pattern.test(value));
  if (re) throw new Error(`copy-check: ${re} blocks allowed copy ${JSON.stringify(value)}`);
}
for (const value of mustBlock) {
  if (!banned.some((pattern) => pattern.test(value))) throw new Error(`copy-check: nothing blocks ${JSON.stringify(value)}`);
}
// /rezultatai keeps the pre-v4 arborist proof and offer (frozen 2026-10-09 numbers).
const legacy = [
  '199 €', '20', '573', '11,4 tūkst.', '5 %', '8,2',
  '2026-07-05 – 2026-10-04', '2026-10-09',
  ...arbcutProof.items.map((item) => item.note), ...arbcutProof.notes,
  ...offer.includes, ...offer.costs.flatMap((row) => [row.label, row.value]),
  offer.ownership, ...faq.items.flatMap((item) => [item.q, item.a]),
  offer.year.lead,
];
// v4 pages (plan §4.2): offer facts, proof numbers (PROVENANCE.md), price, FAQ, form consent.
const v4Shared = [
  ...v4.offerRow.map((f) => `${f.big} ${f.text}`),
  ...v4.proof.gsc.stats.map((s) => s.value), ...v4.proof.gsc.stats.map((s) => s.label),
  ...v4.proof.forms.stats.flatMap((s) => [s.value, s.label]),
  v4.proof.gsc.caption, v4.proof.gsc.meta, v4.proof.forms.caption, v4.proof.forms.meta, v4.proof.honest,
  v4.price.amount, v4.price.before, ...v4.price.includes, v4.price.inquiry, v4.price.cancel,
  ...v4.faq.items.flatMap((item) => [item.q, item.a]),
  ...v4.how.steps.map((s) => s.title), v4.steps.consent,
];
const h1 = (lines) => lines.join(' ');
const headings = new Map([
  ['index.html', h1(v4.hero.home.lines)],
  ['sildymui/index.html', h1(v4.hero.heating.lines)],
  ['noriu/index.html', h1(v4.hero.heating.lines)],
  ['rezultatai/index.html', `${resultsPage.hero.figure} ${resultsPage.hero.h1}`],
]);
const required = new Map([...headings].map(([path, title]) => [path, [...(path.startsWith('rezultatai') ? legacy : v4Shared), title]]));
// Honest wording rule (plan §1): every "0 €" is followed by its limit, and the page names the domain fee.
const ZERO = /(?<![\d,.])0\s?€/gu;
const V4_PAGES = new Set(['index.html', 'sildymui/index.html', 'noriu/index.html', '404.html']);
const built = pages();
const errors = [];
for (const page of built) {
  const visible = normalized(text(page.tree));
  const labels = page.nodes.flatMap((node) => (node.attrs ?? [])
    .filter((a) => ['alt', 'aria-label', 'title', 'placeholder', 'data-caption', 'data-messages', 'content'].includes(a.name))
    .map((a) => a.value)).join(' ');
  for (const re of banned) {
    const match = normalized(`${visible} ${labels}`).match(re);
    if (match) errors.push(`${page.file}: forbidden ${JSON.stringify(match[0])}`);
  }
  const title = page.nodes.find((node) => node.tagName === 'h1');
  if (headings.has(page.path) && normalized(title ? textContent(title) : '') !== headings.get(page.path)) {
    errors.push(`${page.file}: H1 textContent ${JSON.stringify(title && normalized(textContent(title)))}`);
  }
  if (V4_PAGES.has(page.path)) {
    const flat = normalized(visible);
    for (const m of flat.matchAll(ZERO)) {
      if (!flat.slice(m.index, m.index + 60).includes('iki pirmos užklausos, ne ilgiau kaip 3 mėn.')) errors.push(`${page.file}: "0 €" without "iki pirmos užklausos, ne ilgiau kaip 3 mėn." at …${flat.slice(m.index, m.index + 50)}`);
    }
    if (flat.match(ZERO) && !flat.includes('~15 € per metus')) errors.push(`${page.file}: "0 €" claim without the domain fee`);
  }
  for (const value of required.get(page.path) ?? []) {
    if (!visible.includes(normalized(value))) errors.push(`${page.file}: missing ${JSON.stringify(value)}`);
  }
}
for (const path of required.keys()) {
  if (!built.some((page) => page.path === path)) errors.push(`Missing required page: ${path}`);
}
errors.forEach((error) => console.error(error));
console.log(`copy-check: ${built.length} pages, ${errors.length ? 'FAILED' : 'ok'}`);
process.exitCode = errors.length ? 1 : 0;
