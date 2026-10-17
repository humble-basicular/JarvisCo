#!/usr/bin/env node
/* Checks for scripts/proof-refresh.mjs parsing and the copy derived from
   src/data/arbcut-proof.json. The page texts below are transcribed from the
   2026-10-14 screenshots (src/assets/proof/), not from a live run: the first
   real run must still be checked by eye (its page text is kept in .proof-runs/).
   node scripts/proof-refresh-test.mjs */
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkForms, loadImport, parseGsc, parseTooltip, parseW3f, publishScreenshots } from './proof-refresh.mjs';
import { formsProof, gscProof, ltPlural, proof } from '../src/data/v4.js';

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };

const GSC = `Performance\nEXPORT\n24 hours\n7 days\n28 days\n3 months\nMore\nSearch type: Web\nAdd filter\nLast update: 8 hours ago\nTotal clicks\n595\nTotal impressions\n11.9K\nAverage CTR\n5%\nAverage position\n8.1\nDaily\nClicks\n45\n30\n15\n0\n7/12/26\n7/18/26\n8/23/26\n10/4/26\n10/10/26\nImpressions`;
const W3F = `Dashboard\nHere's an overview of your account!\nSubmissions this month\n1 out of 250\nResets 1st Nov\nTotal Submissions\n28\nTotal Spam Blocked\n0\nForms Overview\nArbCut\nCreated Apr 19, 2026\nBilling Details\nCURRENT PLAN\nFree\nEmail Submission History\nShowing submissions for the last 3 months\nLast 3 months\nSep 26\nOct 26`;

check('Search Console figures and period', () => assert.deepEqual(parseGsc(GSC), { clicks: '595', impressions: '11.9K', ctr: '5%', position: '8.1', from: '2026-07-12', to: '2026-10-10' }));
check('thousands separators are dropped', () => assert.equal(parseGsc(GSC.replace('595', '1,204')).clicks, '1204'));
check('a missing figure refuses', () => assert.throws(() => parseGsc(GSC.replace('Average position\n8.1', '')), /Average position/));
check('a period that is not 3 months refuses', () => assert.throws(() => parseGsc(GSC.replace('7/12/26', '9/12/26')), /not 3 months/));
check('Web3Forms totals and creation date', () => assert.deepEqual(parseW3f(W3F), { thisMonth: 1, total: 28, spam: 0, created: '2026-04-19' }));
check('Web3Forms without the ArbCut form refuses', () => assert.throws(() => parseW3f(W3F.replace('ArbCut', 'Other')), /ArbCut/));
check('chart tooltip', () => assert.deepEqual(parseTooltip(`${W3F}\nOctober 2026\nSubmissions\n1`), { month: '2026-10', submissions: 1 }));
check('no tooltip → null (axis labels are not months)', () => assert.equal(parseTooltip(W3F), null));

// The committed JSON (2026-10-17 screenshots) must render exactly this copy.
check('current Search Console copy unchanged', () => assert.deepEqual({ ...proof.gsc, file: undefined }, {
  file: undefined,
  stats: [
    { value: '613', label: 'paspaudimų iš Google paieškos' },
    { value: '12', unit: 'tūkst.', label: 'parodymų Google paieškoje' },
    { value: '5,1 %', label: 'vidutinis paspaudimų rodiklis' },
    { value: '8', label: 'vidutinė pozicija' },
  ],
  alt: 'Google Search Console ataskaita: 613 paspaudimų, 12 tūkst. parodymų, 5,1 % CTR, vidutinė pozicija 8, laikotarpis 2026-07-15 – 2026-10-14',
  caption: 'Google paieška per 3 mėnesius, 2026‑07‑15 – 2026‑10‑14.',
  meta: 'Ekrano kopija 2026‑10‑17 · Šaltinis: Google Search Console',
}));
check('current Web3Forms copy unchanged', () => {
  assert.deepEqual(proof.forms.stats, [
    { value: '7', label: 'rugpjūtį' }, { value: '13', label: 'rugsėjį' }, { value: '2', label: 'spalį (iki 17 d.)' }, { value: '29', label: 'iš viso nuo 2026‑04‑19' },
  ]);
  assert.equal(proof.forms.alt, 'Web3Forms paskyra: forma ArbCut, iš viso 29 pateiktos formos, 0 šlamšto, rugsėjį 13');
  assert.equal(proof.forms.file, 'arbcut-web3forms-sep-2026-10-17.png');
  assert.deepEqual(proof.forms.more.map((m) => m.label), ['Paskyros apžvalga: iš viso 29, šlamšto 0', 'Rugpjūčio ekrano kopija', 'Spalio ekrano kopija']);
});
check('Lithuanian plural forms follow the number', () => {
  const f = ['paspaudimas', 'paspaudimai', 'paspaudimų'];
  assert.deepEqual([1, 21, 595, 613, 11, 10, 30, 112, 122].map((n) => ltPlural(n, f)), [f[0], f[0], f[1], f[2], f[2], f[2], f[2], f[2], f[1]]);
});
check('a refresh on 16 Oct renders the new month and total', () => {
  const f = formsProof({ captured: '2026-10-16', created: '2026-04-19', total: 30, spam: 0, months: [
    { month: '2026-08', submissions: 7, file: 'a.png' }, { month: '2026-09', submissions: 13, file: 'b.png' }, { month: '2026-10', submissions: 3, file: 'c.png' }] });
  assert.equal(f.stats[2].label, 'spalį (iki 16 d.)');
  assert.equal(f.stats[3].value, '30');
  const g = gscProof({ file: 'g.png', captured: '2026-10-16', from: '2026-07-14', to: '2026-10-12', clicks: '1204', impressions: '980', ctr: '4.8%', position: '7.9' });
  assert.deepEqual(g.stats.map((s) => s.value), ['1204', '980', '4,8 %', '7,9']);
});

// Import path: a folder like the one Codex Computer Use leaves (temp, left in place).
const dir = mkdtempSync(join(tmpdir(), 'proof-import-'));
copyFileSync('src/assets/proof/arbcut-gsc-3m-2026-10-14.png', join(dir, 'gsc.png'));
copyFileSync('src/assets/proof/arbcut-web3forms-oct-2026-10-14.png', join(dir, 'oct.png'));
const figures = (patch = {}) => {
  const f = { captured: '2026-10-14', how: 'test', gsc: { png: 'gsc.png', clicks: '595', impressions: '11.9K', ctr: '5%', position: '8.1', from: '2026-07-12', to: '2026-10-10' },
    forms: { createdText: 'Apr 19, 2026', thisMonth: 1, total: 28, spam: 0, months: [{ month: '2026-10', submissions: 1, png: 'oct.png' }] }, ...patch };
  writeFileSync(join(dir, 'figures.json'), JSON.stringify(f));
  return () => loadImport(dir);
};
check('import reads figures and screenshots', () => { const r = figures()(); assert.equal(r.gsc.clicks, '595'); assert.equal(r.w3f.created, '2026-04-19'); assert.equal(r.w3f.months[0].submissions, 1); });
check('import: chart month must equal the counter', () => assert.throws(figures({ forms: { createdText: 'Apr 19, 2026', thisMonth: 2, total: 28, spam: 0, months: [{ month: '2026-10', submissions: 1, png: 'oct.png' }] } }), /counter says 2/));
check('import: a missing screenshot refuses', () => assert.throws(figures({ gsc: { png: 'nope.png', clicks: '595', impressions: '11.9K', ctr: '5%', position: '8.1', from: '2026-07-12', to: '2026-10-10' } }), /not a PNG/));
check('import: months above the total refuse', () => assert.throws(figures({ forms: { createdText: 'Apr 19, 2026', thisMonth: 1, total: 0, spam: 0, months: [{ month: '2026-10', submissions: 1, png: 'oct.png' }] } }), /more than the total/));
check('import: "how" is required', () => assert.throws(figures({ how: '' }), /how/));

// Review r1 (2026-10-16) regressions: whole tokens, real dates, consistent counts, no partial refresh.
check('GSC: unsupported notation refuses instead of a prefix', () => {
  assert.throws(() => parseGsc(GSC.replace('11.9K', '1.2M')), /Total impressions/);
  assert.throws(() => parseGsc(GSC.replace('Average position\n8.1', 'Average position\n8,1')), /Average position/);
  assert.equal(parseGsc(GSC.replace('11.9K', '1,204')).impressions, '1204');
});
check('Web3Forms: grouped counts are read whole, decimals refuse', () => {
  assert.equal(parseW3f(W3F.replace('Total Submissions\n28', 'Total Submissions\n1,204')).total, 1204);
  assert.equal(parseTooltip(`${W3F}\nOctober 2026\nSubmissions\n1,204`).submissions, 1204);
  assert.throws(() => parseW3f(W3F.replace('Total Submissions\n28', 'Total Submissions\n28.9')), /Total Submissions/);
});
check('impossible calendar dates refuse', () => {
  assert.throws(() => parseGsc(GSC.replace('7/12/26', '13/12/26').replace('10/10/26', '16/10/26')), /not real days/);
  assert.throws(() => parseW3f(W3F.replace('Apr 19, 2026', 'Apr 31, 2026')), /not a real day/);
  assert.throws(() => checkForms({ thisMonth: 1, total: 28, months: [{ month: '2026-13', submissions: 1 }] }, '2026-10'), /not a real month/);
});
check('counts: current month without its chart point still checked', () => {
  assert.throws(() => checkForms({ thisMonth: 30, total: 28, months: [{ month: '2026-09', submissions: 13 }] }, '2026-10'), /more than the total/);
  assert.throws(() => checkForms({ thisMonth: 20, total: 28, months: [{ month: '2026-09', submissions: 13 }] }, '2026-10'), /add up to more/);
  assert.doesNotThrow(() => checkForms({ thisMonth: 2, total: 29, months: [{ month: '2026-08', submissions: 7 }, { month: '2026-09', submissions: 13 }, { month: '2026-10', submissions: 2 }] }, '2026-10'));
  assert.throws(() => checkForms({ thisMonth: 2, total: 29, months: [{ month: '2026-09', submissions: 1 }, { month: '2026-09', submissions: 1 }] }, '2026-10'), /twice/);
});
check('import: impossible captured date and decimal totals refuse', () => {
  assert.throws(figures({ captured: '2026-99-99' }), /real day/);
  assert.throws(figures({ forms: { createdText: 'Apr 19, 2026', thisMonth: 1, total: 28.9, spam: 0, months: [{ month: '2026-10', submissions: 1, png: 'oct.png' }] } }), /whole number/);
});
check('a late name collision writes nothing; an identical leftover is kept on rerun', () => {
  const dest = join(dir, 'assets'); mkdirSync(dest);
  const pairs = [[join(dir, 'gsc.png'), 'g.png'], [join(dir, 'oct.png'), 'o.png']];
  copyFileSync(join(dir, 'gsc.png'), join(dest, 'o.png')); // other content under the second name
  assert.throws(() => publishScreenshots(pairs, dest), /Nothing was written/);
  assert.deepEqual(readdirSync(dest), ['o.png']);
  const dest2 = join(dir, 'assets2'); mkdirSync(dest2);
  copyFileSync(join(dir, 'gsc.png'), join(dest2, 'g.png')); // interrupted earlier run left the first copy
  publishScreenshots(pairs, dest2);
  assert.deepEqual(readdirSync(dest2).sort(), ['g.png', 'o.png']);
  assert.ok(existsSync(join(dest2, 'o.png')));
});
console.log(`${passed} proof-refresh checks passed (fixtures left at ${dir})`);
