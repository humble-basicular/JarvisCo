#!/usr/bin/env node
/* Phone-width overflow guard for v3 previews: no page may scroll sideways and no text may run past the
   right edge at 320/360/390/414/768 px. Run against a local server:
   node scripts/preview-form-stub.mjs 4338 dist &  then  node scripts/overflow-check.mjs http://localhost:4338 <slug...>
   Exits 1 on any overflow. Leaves its Chrome profile in the temp dir (no deletes). */
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [base, ...slugs] = process.argv.slice(2);
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base ?? '') || !slugs.length) { console.error('usage: overflow-check.mjs http://localhost:<port> <slug...>'); process.exit(2); }
const profile = mkdtempSync(join(tmpdir(), 'ovf-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9335', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) { try { target = (await (await fetch('http://localhost:9335/json')).json()).find((t) => t.type === 'page'); } catch { await sleep(250); } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const waiting = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); waiting.get(m.id)?.(m); });
const cdp = (method, params = {}) => new Promise((res) => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expression) => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.result.value;
let bad = 0, total = 0;
for (const slug of slugs) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `${base}/perziura/${slug}` }); await sleep(1500);
  const towns = await ev(`[...new Set([...document.querySelectorAll('a[href^="/perziura/${slug}/"]')].map(a => a.getAttribute('href').split('#')[0]))]`);
  for (const path of [`/perziura/${slug}`, ...towns]) for (const width of [320, 360, 390, 414, 768]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: true });
    await cdp('Page.navigate', { url: base + path }); await sleep(900);
    const r = await ev(`(async () => { await document.fonts.ready; const W = document.documentElement.clientWidth;
      const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      const off = [...document.querySelectorAll('body *')].filter(el => { const b = el.getBoundingClientRect(); return b.width && b.right > W + 1 && getComputedStyle(el).position !== 'fixed'; })
        .filter(el => !el.closest('.v3-reviews__list') && !el.matches('.v3-hero__bg'))
        .slice(0, 4).map(el => (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName) + ':' + Math.round(el.getBoundingClientRect().right) + ':' + (el.textContent||'').trim().slice(0,24));
      return { W, sw, off }; })()`);
    total++;
    if (r.sw > r.W || r.off.length) { bad++; console.log(`OVERFLOW ${path} @${width}: scrollWidth ${r.sw} > ${r.W} | ${r.off.join(' | ')}`); }
  }
}
console.log(`checked ${total} page×width combos, ${bad} with overflow; profile ${profile}`);
ws.close(); chrome.kill();
process.exit(bad ? 1 : 0);
