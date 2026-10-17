#!/usr/bin/env node
/* Refresh the arbcut.lt proof (Search Console + Web3Forms) from new screenshots.
   The figures on the page are read from the same pages the screenshots are
   taken of, at the same moment, so every number stays backed by a dated,
   unedited screenshot (crop only, src/assets/proof/PROVENANCE.md).

   npm run proof:refresh -- login     one-time: opens a separate Chrome window;
                                      sign in to Search Console and Web3Forms, then close it
   npm run proof:refresh              capture both, update src/data/arbcut-proof.json,
                                      add the new PNGs to src/assets/proof/, log provenance
   npm run proof:refresh -- --show    the same, with the Chrome window visible
   npm run proof:refresh -- --dry     capture and print only: nothing in src/ changes
   npm run proof:refresh -- import <dir> --dry | --checked
                                      MAIN PATH (Jarvis 2026-10-16): the screenshots are taken in
                                      Jarvis's own logged-in Chrome (Codex Computer Use) and saved
                                      with figures.json; --checked once the lead has compared every
                                      figure with the screenshots by eye.

   <dir>/figures.json (screenshots crop only, e.g. magick -crop WxH+X+Y, no resize/edits):
   { "captured": "YYYY-MM-DD", "how": "who, which browser, exact crop commands",
     "gsc": { "png": "gsc.png", "property": "sc-domain:arbcut.lt", "clicks": "612",
              "impressions": "12.1K", "ctr": "5%", "position": "8.0",
              "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },            ← as shown on screen
     "forms": { "createdText": "Apr 19, 2026", "thisMonth": 3, "total": 30, "spam": 0,
                "months": [ { "month": "YYYY-MM", "submissions": 7, "png": "web3forms-YYYY-MM.png" } ] } }

   The login lives in its own Chrome profile outside the repo (PROFILE below),
   never in git. Read-only on both sites: it only loads pages and moves the
   mouse over the Web3Forms chart. Nothing is deleted; the raw page text and
   uncropped screenshots of every run stay in the run folder for review.
   It refuses to write anything when a figure cannot be read, when the period
   is not "3 months", or when a crop would show an email address. */
import { spawn } from 'node:child_process';
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILE = join(homedir(), 'Library', 'Application Support', 'JarvisCo', 'proof-chrome');
const GSC_PROPERTIES = ['sc-domain:arbcut.lt', 'https://arbcut.lt/', 'https://www.arbcut.lt/'];
const gscUrl = (resource) => `https://search.google.com/search-console/performance/search-analytics?resource_id=${encodeURIComponent(resource)}&num_of_months=3`;
const W3F_URL = 'https://app.web3forms.com/';
const ROOT = resolve(import.meta.dirname, '..');
const DATA = join(ROOT, 'src', 'data', 'arbcut-proof.json');
const ASSETS = join(ROOT, 'src', 'assets', 'proof');
const PROVENANCE = join(ASSETS, 'PROVENANCE.md');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Today in Europe/Vilnius as YYYY-MM-DD. */
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vilnius' }).format(new Date());

/* ---------- parsing (pure, covered by scripts/proof-refresh-test.mjs) ---------- */

/** A real calendar day YYYY-MM-DD (2026-13-12 and 2026-02-30 are not). */
const isDay = (iso) => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso ?? '') ? new Date(`${iso}T00:00:00Z`) : null;
  return Boolean(d) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
};
/** A real month YYYY-MM. */
const isMonth = (ym) => /^\d{4}-(0[1-9]|1[0-2])$/.test(ym ?? '');
/** A whole count as shown: 28 or 1,204 (English grouping). The whole token must match: 28.9 and 1.2K refuse. */
const COUNT = '\\d{1,3}(?:,\\d{3})+|\\d+';
const END = '(?=\\s|$)';

/** Search Console performance page text → figures. Throws if any is missing. */
export function parseGsc(text) {
  const grab = (label, pattern) => {
    const m = new RegExp(`${label}\\s*\\n?\\s*(${pattern})${END}`, 'i').exec(text);
    if (!m) throw new Error(`Search Console: "${label}" not found on the page, or not in a supported notation`);
    return m[1];
  };
  const fig = {
    // Whole tokens only (595, 1,204, 11.9K): 1.2M or 8,1 refuse instead of being cut to a prefix.
    clicks: grab('Total clicks', `(?:${COUNT})(?:\\.\\d+K)?|\\d+K`),
    impressions: grab('Total impressions', `(?:${COUNT})(?:\\.\\d+K)?|\\d+K`),
    ctr: grab('Average CTR', '\\d+(?:\\.\\d+)?%'),
    position: grab('Average position', '\\d+(?:\\.\\d+)?'),
  };
  // English UI uses "," as thousands separator: 1,234 → 1234.
  for (const k of ['clicks', 'impressions']) fig[k] = fig[k].replace(/,/g, '');
  // Chart axis dates, M/D/YY: first and last are the period. The range buttons are
  // always on the page, so the period itself proves "3 months" was selected.
  const dates = [...text.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{2})\b/g)].map(([, m, d, y]) => `20${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  if (dates.length < 2) throw new Error('Search Console: chart dates not found');
  const from = dates[0], to = dates[dates.length - 1];
  if (!isDay(from) || !isDay(to)) throw new Error(`Search Console: chart dates ${from} – ${to} are not real days`);
  const days = (Date.parse(to) - Date.parse(from)) / 86400000;
  if (days < 80 || days > 95) throw new Error(`Search Console: period ${from} – ${to} is not 3 months`);
  return { ...fig, from, to };
}

/** Web3Forms dashboard text → totals. */
export function parseW3f(text) {
  const num = (label) => {
    const m = new RegExp(`${label}\\s*\\n?\\s*(${COUNT})${END}`, 'i').exec(text);
    if (!m) throw new Error(`Web3Forms: "${label}" not found on the page, or not a whole count`);
    return Number(m[1].replace(/,/g, ''));
  };
  const created = /Created\s+([A-Z][a-z]{2,8})\s+(\d{1,2}),\s+(\d{4})/.exec(text);
  if (!created) throw new Error('Web3Forms: form creation date not found');
  const month = MONTHS.findIndex((m) => m.startsWith(created[1].slice(0, 3)));
  if (!/ArbCut/i.test(text)) throw new Error('Web3Forms: the ArbCut form is not on the dashboard');
  const day = `${created[3]}-${String(month + 1).padStart(2, '0')}-${created[2].padStart(2, '0')}`;
  if (month < 0 || !isDay(day)) throw new Error(`Web3Forms: creation date "${created[0]}" is not a real day`);
  return { thisMonth: num('Submissions this month'), total: num('Total Submissions'), spam: num('Total Spam Blocked'), created: day };
}

/** Chart tooltip text "October 2026 … Submissions 1" → {month: '2026-10', submissions: 1}. */
export function parseTooltip(text) {
  const m = new RegExp(`(${MONTHS.join('|')})\\s+(\\d{4})[\\s\\S]{0,40}?Submissions\\s*(${COUNT})${END}`).exec(text);
  return m ? { month: `${m[2]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, '0')}`, submissions: Number(m[3].replace(/,/g, '')) } : null;
}

/** Cross-checks of the form counts. current = the capture month (YYYY-MM), whose chart point may be missing. */
export function checkForms(w3f, current) {
  if (w3f.thisMonth > w3f.total) throw new Error(`Web3Forms: ${w3f.thisMonth} this month is more than the total ${w3f.total}`);
  const seen = new Set();
  for (const m of w3f.months) {
    if (!isMonth(m.month)) throw new Error(`Web3Forms: chart month ${m.month} is not a real month`);
    if (seen.has(m.month)) throw new Error(`Web3Forms: chart month ${m.month} is listed twice`);
    seen.add(m.month);
    if (m.month > current) throw new Error(`Web3Forms: chart month ${m.month} is after the capture month ${current}`);
  }
  const now = w3f.months.find((m) => m.month === current);
  if (now && now.submissions !== w3f.thisMonth) throw new Error(`Web3Forms: chart says ${now.submissions} this month, the counter says ${w3f.thisMonth}`);
  // The counter stands in for the current month even when its chart point is missing; never count it twice.
  const known = w3f.months.filter((m) => m.month !== current).reduce((a, m) => a + m.submissions, 0) + w3f.thisMonth;
  if (known > w3f.total) throw new Error('Web3Forms: the months add up to more than the total');
}

/* ---------- browser ---------- */

async function launch({ show }) {
  const port = 9700 + Math.floor(Math.random() * 200);
  mkdirSync(PROFILE, { recursive: true });
  const args = [`--remote-debugging-port=${port}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--window-size=1920,1200'];
  if (!show) args.push('--headless=new');
  const proc = spawn(CHROME, [...args, 'about:blank'], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 80 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch { await sleep(250); }
  }
  if (!target) { proc.kill(); throw new Error('Chrome did not start (is the proof profile already open in another window?)'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let n = 0;
  const waiting = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); waiting.get(m.id)?.(m); waiting.delete(m.id); });
  const cdp = (method, params = {}) => new Promise((res, rej) => {
    const id = ++n;
    waiting.set(id, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1880, height: 1100, deviceScaleFactor: 2, mobile: false });
  // Headless Chrome announces itself in the user agent; look like the same Chrome with a window.
  const { userAgent } = await cdp('Browser.getVersion');
  await cdp('Emulation.setUserAgentOverride', { userAgent: userAgent.replace('HeadlessChrome', 'Chrome') });
  const open = async (url) => {
    await cdp('Page.navigate', { url });
    await sleep(800);
    await evaluate('new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r)))');
    await evaluate('scrollTo(0, 0)');
  };
  /** Waits until the page text matches, or throws with what it saw. */
  const waitFor = async (pattern, what, ms = 30000) => {
    for (let t = 0; t < ms; t += 500) {
      const text = await evaluate('document.body ? document.body.innerText : ""');
      if (pattern.test(text)) return text;
      await sleep(500);
    }
    const url = await evaluate('location.href');
    throw new Error(`${what} did not appear (at ${url}). Not signed in? Run: npm run proof:refresh -- login`);
  };
  const shot = async (file, clip) => {
    const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: Boolean(clip), ...(clip ? { clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height, scale: 1 } } : {}) });
    writeFileSync(file, Buffer.from(r.data, 'base64'));
  };
  /** Smallest element containing every one of the texts: its page rect + its own text. */
  const boxOf = (texts) => evaluate(`(() => {
    const texts = ${JSON.stringify(texts)};
    const has = (el) => texts.every((t) => el.innerText && el.innerText.includes(t));
    let el = [...document.querySelectorAll('body *')].filter(has).sort((a, b) => a.innerText.length - b.innerText.length)[0];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.left + scrollX - 12), y: Math.max(0, r.top + scrollY - 12), width: Math.min(innerWidth, r.width + 24), height: r.height + 24, text: el.innerText };
  })()`);
  return { cdp, evaluate, open, waitFor, shot, boxOf, close: () => { ws.close(); proc.kill(); } };
}

const noEmail = (box, what) => { if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(box.text)) throw new Error(`${what}: the crop would show an email address; not saving it`); };

async function captureGsc(b, run) {
  let text, used;
  for (const resource of GSC_PROPERTIES) {
    await b.open(gscUrl(resource));
    try { text = await b.waitFor(/Total clicks[\s\S]*Average position/i, 'Search Console figures', 20000); used = resource; break; } catch (e) { if (resource === GSC_PROPERTIES.at(-1)) throw e; }
  }
  await sleep(2500); // chart animation
  text = await b.evaluate('document.body.innerText');
  writeFileSync(join(run, 'gsc-page.txt'), text);
  await b.shot(join(run, 'gsc-viewport.png'));
  const fig = parseGsc(text);
  // Crop: the performance block from the date-range buttons to the chart axis.
  const axis = (iso) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}/${iso.slice(2, 4)}`;
  const box = await b.boxOf(['3 months', 'Total clicks', 'Average position', axis(fig.to)]);
  if (!box) throw new Error('Search Console: could not find the performance block to crop');
  noEmail(box, 'Search Console');
  const out = join(run, 'gsc.png');
  await b.shot(out, box);
  return { ...fig, property: used, png: out, crop: box };
}

async function captureW3f(b, run) {
  await b.open(W3F_URL);
  const text = await b.waitFor(/Total Submissions[\s\S]*Email Submission History/i, 'Web3Forms dashboard');
  await sleep(1500);
  writeFileSync(join(run, 'web3forms-page.txt'), text);
  await b.shot(join(run, 'web3forms-viewport.png'));
  const totals = parseW3f(text);
  const box = await b.boxOf(['Submissions this month', 'Total Submissions', 'Email Submission History']);
  if (!box) throw new Error('Web3Forms: could not find the dashboard block to crop');
  noEmail(box, 'Web3Forms');
  // Sweep the mouse along the chart and note where each month's tooltip shows.
  const chart = await b.evaluate(`(() => {
    const card = [...document.querySelectorAll('body *')].filter((e) => e.innerText && e.innerText.includes('Email Submission History')).sort((a, z) => a.innerText.length - z.innerText.length)[0];
    const svg = card && [...card.querySelectorAll('svg')].sort((a, z) => z.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    if (!svg) return null; const r = svg.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height };
  })()`);
  if (!chart) throw new Error('Web3Forms: submission chart not found');
  const seen = new Map();
  for (let i = 0; i <= 60; i++) {
    const x = chart.x + 2 + (chart.w - 4) * (i / 60), y = chart.y + chart.h * 0.6;
    await b.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await sleep(120);
    const tip = parseTooltip(await b.evaluate('document.body.innerText'));
    if (tip) seen.set(tip.month, { ...tip, x, y });
  }
  if (!seen.size) throw new Error('Web3Forms: no chart tooltip could be read');
  const months = [];
  for (const m of [...seen.values()].sort((a, z) => a.month.localeCompare(z.month))) {
    await b.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: m.x, y: m.y });
    await sleep(400);
    const tip = parseTooltip(await b.evaluate('document.body.innerText'));
    if (!tip || tip.month !== m.month || tip.submissions !== m.submissions) throw new Error(`Web3Forms: tooltip for ${m.month} changed while capturing`);
    const png = join(run, `web3forms-${m.month}.png`);
    await b.shot(png, box);
    months.push({ month: m.month, submissions: m.submissions, png });
  }
  checkForms({ ...totals, months }, today().slice(0, 7));
  return { ...totals, months, crop: box };
}

/* ---------- import (screenshots taken in Jarvis's own browser) ---------- */

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
/** Reads <dir>/figures.json + its PNGs (format: top of this file), applying the same checks as a capture. */
export function loadImport(dir) {
  const f = JSON.parse(readFileSync(join(dir, 'figures.json'), 'utf8'));
  const png = (name, what) => {
    const file = join(dir, String(name ?? ''));
    if (!name || !existsSync(file) || !readFileSync(file).subarray(0, 4).equals(PNG)) throw new Error(`${what}: ${name} is not a PNG in ${dir}`);
    return file;
  };
  if (!isDay(f.captured)) throw new Error('figures.json: captured must be a real day YYYY-MM-DD');
  if (!f.how) throw new Error('figures.json: "how" must say who took the screenshots, in which browser, and the exact crop commands');
  const g = f.gsc ?? {};
  // Same parser as a capture: rebuild the page text from the figures, so the same rules apply.
  const axis = (iso) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}/${iso.slice(2, 4)}`;
  if (!isDay(g.from) || !isDay(g.to)) throw new Error('figures.json: gsc.from/gsc.to must be real days YYYY-MM-DD');
  for (const k of ['clicks', 'impressions', 'ctr', 'position']) if (typeof g[k] !== 'string') throw new Error(`figures.json: gsc.${k} must be the text shown on screen, e.g. "11.9K"`);
  const gsc = { ...parseGsc(`Total clicks ${g.clicks}\nTotal impressions ${g.impressions}\nAverage CTR ${g.ctr}\nAverage position ${g.position}\n${axis(g.from)} ${axis(g.to)}`), property: g.property ?? 'not recorded', png: png(g.png, 'gsc') };
  const w = f.forms ?? {};
  for (const k of ['thisMonth', 'total', 'spam']) if (!Number.isInteger(w[k]) || w[k] < 0) throw new Error(`figures.json: forms.${k} must be a whole number`);
  const w3f = { ...parseW3f(`ArbCut\nCreated ${w.createdText}\nSubmissions this month ${w.thisMonth}\nTotal Submissions ${w.total}\nTotal Spam Blocked ${w.spam}`) };
  if (!Array.isArray(w.months) || !w.months.length) throw new Error('figures.json: forms.months must list the chart months');
  w3f.months = w.months.map((m, i) => {
    if (!isMonth(m.month) || !Number.isInteger(m.submissions) || m.submissions < 0) throw new Error(`figures.json: forms.months[${i}] needs a real month YYYY-MM and whole submissions`);
    return { month: m.month, submissions: m.submissions, png: png(m.png, `forms.months[${i}]`) };
  }).sort((a, z) => a.month.localeCompare(z.month));
  // The overview crop is what shows created / total / spam / this month (the month crops show only the chart).
  if (w.overviewPng) w3f.overviewPng = png(w.overviewPng, 'forms.overviewPng');
  checkForms(w3f, f.captured.slice(0, 7));
  return { gsc, w3f, date: f.captured, how: f.how };
}

/** Copies [source, name] pairs into dir. Every destination is checked before the first write:
    a file that already holds the very same screenshot (a rerun after an interrupted copy) is kept,
    any other existing file refuses and nothing is written. */
export function publishScreenshots(pairs, dir = ASSETS) {
  const copies = pairs.map(([from, to]) => ({ from, to, dest: join(dir, to), bytes: readFileSync(from) }));
  if (new Set(copies.map((c) => c.to)).size !== copies.length) throw new Error('two screenshots would get the same file name. Nothing was written.');
  for (const c of copies) {
    if (existsSync(c.dest) && !readFileSync(c.dest).equals(c.bytes)) throw new Error(`${c.to} already exists with other content; refresh once per day, or rename by hand. Nothing was written.`);
  }
  for (const c of copies) if (!existsSync(c.dest)) copyFileSync(c.from, c.dest, constants.COPYFILE_EXCL);
}

/* ---------- main ---------- */

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === 'login') {
    mkdirSync(PROFILE, { recursive: true });
    spawn(CHROME, [`--user-data-dir=${PROFILE}`, '--no-first-run', 'https://search.google.com/search-console', W3F_URL], { stdio: 'ignore', detached: true }).unref();
    console.log(`Chrome opened with the proof profile (${PROFILE}).\nSign in to Search Console (the Google account that owns arbcut.lt) and to Web3Forms, then close that Chrome window.\nAfter that: npm run proof:refresh`);
    return;
  }
  const dry = args.includes('--dry');
  let gsc, w3f, date, run, how;
  if (args[0] === 'import') {
    if (!args[1]) throw new Error('usage: npm run proof:refresh -- import <capture-folder> [--dry | --checked]');
    if (!dry && !args.includes('--checked')) throw new Error('import writes only with --checked: first compare every figure in figures.json with the screenshots by eye (run with --dry to see them)');
    run = resolve(args[1]);
    ({ gsc, w3f, date, how } = loadImport(run));
  } else {
    date = today();
    run = join(ROOT, '.proof-runs', `${date}-${Date.now()}`);
    mkdirSync(run, { recursive: true });
    how = 'Headless Chrome screenshots taken by the script from Jarvis\'s own logins (Chrome profile outside the repo), DPR 2, crop only (CDP clip of the block that holds the figures; no resize, no pixel edits). The figures were read from the same page text at the same moment. Raw page text and uncropped viewports: `.proof-runs/` (local, not committed).';
    const b = await launch({ show: args.includes('--show') });
    try {
      gsc = await captureGsc(b, run);
      w3f = await captureW3f(b, run);
    } finally { b.close(); }
  }

  const old = JSON.parse(readFileSync(DATA, 'utf8'));
  const name = (kind) => `arbcut-${kind}-${date}.png`;
  const next = {
    note: old.note,
    gsc: { file: name('gsc-3m'), captured: date, from: gsc.from, to: gsc.to, clicks: gsc.clicks, impressions: gsc.impressions, ctr: gsc.ctr, position: gsc.position },
    forms: {
      captured: date, created: w3f.created, total: w3f.total, spam: w3f.spam,
      months: w3f.months.map((m) => ({ month: m.month, submissions: m.submissions, file: name(`web3forms-${KEYS[Number(m.month.slice(5)) - 1]}`) })),
      ...(w3f.overviewPng ? { overview: name('web3forms-overview') } : {}),
    },
  };
  writeFileSync(join(run, 'arbcut-proof.json'), `${JSON.stringify(next, null, 2)}\n`);
  const line = (label, a, z) => console.log(`${label.padEnd(26)} ${String(a).padStart(8)} → ${z}`);
  line('Google clicks', old.gsc.clicks, gsc.clicks);
  line('Google impressions', old.gsc.impressions, gsc.impressions);
  line('Average CTR', old.gsc.ctr, gsc.ctr);
  line('Average position', old.gsc.position, gsc.position);
  line('Period', `${old.gsc.from}…`, `${gsc.from} – ${gsc.to}`);
  line('Form submissions (total)', old.forms.total, w3f.total);
  for (const m of w3f.months) line(`  ${m.month}`, old.forms.months.find((o) => o.month === m.month)?.submissions ?? '–', m.submissions);
  console.log(`Run folder (page text, uncropped + cropped screenshots): ${run}`);
  if (dry) { console.log('--dry: src/ not changed.'); return; }

  publishScreenshots([[gsc.png, next.gsc.file], ...w3f.months.map((m, i) => [m.png, next.forms.months[i].file]), ...(w3f.overviewPng ? [[w3f.overviewPng, next.forms.overview]] : [])]);
  writeFileSync(DATA, `${JSON.stringify(next, null, 2)}\n`);
  appendFileSync(PROVENANCE, [
    '', `## Proof refresh ${date} (scripts/proof-refresh.mjs)`,
    how,
    '', '| File here | Shows |', '|---|---|',
    `| ${next.gsc.file} | Search Console (${gsc.property}), 3 months, ${gsc.from} – ${gsc.to}: clicks ${gsc.clicks}, impressions ${gsc.impressions}, CTR ${gsc.ctr}, position ${gsc.position} |`,
    ...next.forms.months.map((m) => `| ${m.file} | Web3Forms submission chart, tooltip ${m.month}: ${m.submissions} (chart only) |`),
    ...(next.forms.overview ? [`| ${next.forms.overview} | Web3Forms overview: form ArbCut created ${w3f.created}, this month ${w3f.thisMonth ?? '–'}, total ${w3f.total}, spam ${w3f.spam} |`] : []),
    '',
  ].join('\n'));
  console.log(`Updated src/data/arbcut-proof.json, added ${1 + w3f.months.length + (w3f.overviewPng ? 1 : 0)} screenshots and a PROVENANCE.md entry.\nNext: look at the new PNGs, npm run check, commit, Vercel preview; production only after Jarvis approves.`);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  main().catch((e) => { console.error(`proof-refresh: ${e.message}`); process.exit(1); });
}
