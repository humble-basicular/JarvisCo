// Checks rendered copy, metadata, accessible labels and form messages. Script
// operators, CSS and comments are excluded; offer comparison remains allowed.
import { arbcutProof, faq, offer, resultsPage } from '../data/content.js';
import * as v4 from '../data/v4.js';
import { pages, text, textContent, normalized } from './html.mjs';

const banned = [
  /NUOTRAUKA\s*:|CITATA\s*:/iu,
  /500\s*€|47\s*€/u, /11[\s,.]*362/u, /prenumerat|mėnesiniai planai/iu,
  /Kazlausk|Vaitkut|Petrausk|Stankevič|Jankausk/u,
  /TOP pozicij|5[,.]0\s*★|100\+|<\s*1\s*s/iu,
  /praleist[oaų]\s+skambuči|automatiz|automatinės SMS/iu,
  /three\.js|gsap|geriausi|revoliucin/iu, /!/u,
  /20\s+(?:formos\s+)?užklausų\s+per\s+3/iu,
  // Old monthly offer; the Paslaugos.lt "~50 € kas mėnesį" comparison stays allowed.
  // Offer v2 (plan §1) allows exactly one standard monthly price: 49 € (39 € only as the founder price for the first five).
  /(?<!\b(?:39|49)\s?)€\s?\/\s?mėn/u, /mėnesin\w*\s+plan/iu,
  // No rank guarantees (plan §1).
  /garantuo\w*\s+(?:pirm|TOP|viet)/iu,
  // 1551.lt is a business directory, not an inquiry portal (hero plan D7).
  /1551/u,
  // The 20 form inquiries are not attributed to Google (proof spec §9).
  /20\s+(?:formos\s+)?užklausų[^.\d]{0,40}(?:iš|per)\s+Google/iu,
];
// The agency's own pages carry no testimonials. Client previews (/perziura/) may: the generator renders
// only real quotes supplied by the client, plus the Google Business Profile review section (2026-10-21).
const agencyOnly = [/atsiliepim|\/atsiliepimas/iu];
const allowed = [`${v4.price.amount} ${v4.price.unit}`, v4.price.launch, offer.comparison, offer.year.lead, `${offer.year.rows[0].value} ${offer.year.rows[0].detail}`];
const mustBlock = ['NUOTRAUKA: trūksta', 'CITATA: trūksta', '47 €/mėn.', '59 € / mėn.', 'garantuojame pirmą vietą', '20 užklausų iš Google', 'mėnesinis planas', 'Paslaugos.lt, 1551.lt'];
for (const value of allowed) {
  const re = banned.find((pattern) => pattern.test(value));
  if (re) throw new Error(`copy-check: ${re} blocks allowed copy ${JSON.stringify(value)}`);
}
for (const value of mustBlock) {
  if (!banned.some((pattern) => pattern.test(value))) throw new Error(`copy-check: nothing blocks ${JSON.stringify(value)}`);
}
// v4 pages (plan §4.2): offer facts, proof numbers (PROVENANCE.md), price, FAQ, form consent.
const v4Shared = [
  ...v4.offerRow.map((f) => `${f.big} ${f.text}`),
  ...v4.proof.gsc.stats.map((s) => s.value), ...v4.proof.gsc.stats.map((s) => s.label),
  ...v4.proof.forms.stats.flatMap((s) => [s.value, s.label]),
  v4.proof.gsc.caption, v4.proof.gsc.meta, v4.proof.forms.caption, v4.proof.forms.meta, v4.proof.zoom, v4.proof.formsOnly.title, v4.proof.formsOnly.text, v4.proof.honest,
  v4.price.amount, v4.price.launch, v4.price.before, ...v4.price.includes, v4.price.inquiry, v4.price.cancel,
  ...v4.faq.items.flatMap((item) => [item.q, item.a]),
  ...v4.how.steps.map((s) => s.title), v4.steps.consent,
];
const h1 = (lines) => lines.join(' ');
const headings = new Map([
  ['svetaines/index.html', h1(v4.hero.home.lines)],
  ['sildymui/index.html', h1(v4.hero.heating.lines)],
  ['noriu/index.html', h1(v4.hero.heating.lines)],
  ['rezultatai/index.html', h1(v4.hero.results.lines)],
]);
const required = new Map([...headings].map(([path, title]) => [path, [...v4Shared, title]]));
// Honest wording rule (plan §1): every "0 €" is followed by its limit, and the page names the domain fee.
const ZERO = /(?<![\d,.])0\s?€/gu;
const V4_PAGES = new Set(['svetaines/index.html', 'sildymui/index.html', 'noriu/index.html', 'rezultatai/index.html']);
// Offer2 homepage (index.html, 2026-11-05): its own claims rules. It legitimately talks about missed calls,
// automatic SMS and Google reviews, so the website-offer bans above do not apply to it.
// USER13 (2026-11-08): the separate Jarvis Systems pages share the homepage's facts and therefore its rules —
// exactly these 13 routes, no prefix wildcard, so every other page keeps the stricter agency rules.
const O2_SUBPAGES = ['funkcijos', ...['funkcionali-svetaine', 'atsiliepimu-rinkimas', 'praleistas-skambutis', 'kampanijos', 'vietinis-seo'].map((s) => `funkcijos/${s}`),
  'kainos', 'atsiliepimai', 'musu-darbai', 'apie', 'kaip-dirbame', 'sritys', 'kontaktai', 'susisieksime', 'registracija', 'pradzia'].map((r) => `${r}/index.html`);
// Shared terms now describe the same full O2 package; legacy content pages retain their own rules.
// 2026-11-16 (75d538b2): 404 and privacy moved into the O2 shell (its nav/footer name the features), so O2 rules apply.
const O2_PAGES = new Set(['index.html', 'taisykles/index.html', 'privatumo-politika/index.html', '404.html', 'pavyzdys/pokalbis/index.html', ...O2_SUBPAGES]);
const o2Banned = [
  /197\s?€/u, /\b49\s?€/u, /39\s?€/u,                 // current O2 offer: one full 97 €/month package
  /50\s?€|pirm(?:iems|iesiems)\s+5|30\s+(?:dienų|d\.)\s+nemokamai|tik\s+(?:jei|pasakę)[^.]*tęsi/iu, // superseded pilot terms
  /garantuoj(?:ame|u)\b/iu,                           // no result guarantees ("Ar garantuojate" question stays allowed)
  /penkių žvaigždučių|tik geri atsiliepim/iu,        // review filter decided 2026-11-10 (OFFER.md §1); still no 'only good reviews' claim
  /revoliucin|geriausi|dirbtin\w+ intelekt|\bDI\b/iu,
  /NUOTRAUKA\s*:|CITATA\s*:/iu,
];
const o2SubBanned = [/iš 5 · Google|Pažiūrėkite, ką apie mus sako Google/u];
const built = pages();
const errors = [];
for (const page of built) {
  const visible = normalized(text(page.tree));
  const labels = page.nodes.flatMap((node) => (node.attrs ?? [])
    .filter((a) => ['alt', 'aria-label', 'title', 'placeholder', 'data-caption', 'data-messages', 'content'].includes(a.name))
    .map((a) => a.value)).join(' ');
  const rules = O2_SUBPAGES.includes(page.path) ? [...o2Banned, ...o2SubBanned] : O2_PAGES.has(page.path) ? o2Banned : page.path.startsWith('perziura/') ? banned : [...banned, ...agencyOnly];
  for (const re of rules) {
    const match = normalized(`${visible} ${labels}`).match(re);
    if (match) errors.push(`${page.file}: forbidden ${JSON.stringify(match[0])}`);
  }
  const title = page.nodes.find((node) => node.tagName === 'h1');
  if (headings.has(page.path) && normalized(title ? textContent(title) : '') !== headings.get(page.path)) {
    errors.push(`${page.file}: H1 textContent ${JSON.stringify(title && normalized(textContent(title)))}`);
  }
  // 39 € is the founder price for the first five only: every mention must say so, and 49 € is the standard price shown (2026-10-22).
  if (!page.path.startsWith('perziura/')) {
    const flat39 = normalized(visible);
    for (const m of flat39.matchAll(/(?<![\d,.])39\s?(?:€|eur)/giu)) {
      if (!/steigėj|pirmiems 5|pirmiesiems 5/iu.test(flat39.slice(Math.max(0, m.index - 80), m.index + 80))) errors.push(`${page.file}: "39 €" without founder-price context at …${flat39.slice(m.index, m.index + 50)}`);
    }
  }
  if (V4_PAGES.has(page.path)) {
    const flat = normalized(visible);
    for (const m of flat.matchAll(ZERO)) {
      if (!flat.slice(m.index, m.index + 60).includes('60 dienų')) errors.push(`${page.file}: "0 €" without "60 dienų" at …${flat.slice(m.index, m.index + 50)}`);
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
