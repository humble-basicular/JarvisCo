// Checks rendered copy, metadata, accessible labels and form messages. Script
// operators, CSS and comments are excluded; offer comparison remains allowed.
import { arbcutProof, faq, home, offer, resultsPage } from '../data/content.js';
import { pages, text, textContent, normalized } from './html.mjs';

const banned = [
  /500\s*€|47\s*€/u, /11[\s,.]*362/u, /prenumerat|mėnesiniai planai/iu,
  /atsiliepim|\/atsiliepimas/iu, /Kazlausk|Vaitkut|Petrausk|Stankevič|Jankausk/u,
  /TOP pozicij|5[,.]0\s*★|100\+|<\s*1\s*s/iu,
  /praleist[oaų]\s+skambuči|automatiz|automatinės SMS/iu,
  /three\.js|gsap|geriausi|revoliucin/iu, /!/u,
  /20\s+(?:formos\s+)?užklausų\s+per\s+3/iu,
  // Old monthly offer; the Paslaugos.lt "~50 € kas mėnesį" comparison stays allowed.
  /€\s?\/\s?mėn/u, /mėnesin\w*\s+plan/iu,
  // The 20 form inquiries are not attributed to Google (proof spec §9).
  /20\s+(?:formos\s+)?užklausų[^.\d]{0,40}(?:iš|per)\s+Google/iu,
];
const allowed = [offer.comparison, offer.year.lead, `${offer.year.rows[0].value} ${offer.year.rows[0].detail}`];
const mustBlock = ['47 €/mėn.', '20 užklausų iš Google', 'mėnesinis planas'];
for (const value of allowed) {
  const re = banned.find((pattern) => pattern.test(value));
  if (re) throw new Error(`copy-check: ${re} blocks allowed copy ${JSON.stringify(value)}`);
}
for (const value of mustBlock) {
  if (!banned.some((pattern) => pattern.test(value))) throw new Error(`copy-check: nothing blocks ${JSON.stringify(value)}`);
}
const shared = [
  '199 €', '20', '573', '11,4 tūkst.', '5 %', '8,2',
  '2026-07-05 – 2026-10-04', '2026-10-09',
  ...arbcutProof.items.map((item) => item.note), ...arbcutProof.notes,
  ...offer.includes, ...offer.costs.flatMap((row) => [row.label, row.value]),
  offer.ownership, ...faq.items.flatMap((item) => [item.q, item.a]),
];
const headings = new Map([
  ['index.html', `${home.hero.h1.before}${home.hero.h1.highlight}${home.hero.h1.after}`],
  ['rezultatai/index.html', `${resultsPage.hero.figure} ${resultsPage.hero.h1}`],
]);
const required = new Map([...headings].map(([path, h1]) => [path, [...shared, offer.year.lead, h1]]));
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
  const h1 = page.nodes.find((node) => node.tagName === 'h1');
  if (headings.has(page.path) && normalized(h1 ? textContent(h1) : '') !== headings.get(page.path)) {
    errors.push(`${page.file}: H1 textContent ${JSON.stringify(h1 && normalized(textContent(h1)))}`);
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
