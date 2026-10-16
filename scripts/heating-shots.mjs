#!/usr/bin/env node
/* Screenshots of local heating pages through CDP device emulation (not Chrome's
   --window-size, which lays out wider than 390 px).
   node scripts/heating-shots.mjs <out-dir> <name>=<http://localhost:port/path> [...]
   For each page: <name>-390-first.png (390×844, DPR 2, mobile), <name>-390-full.png,
   <name>-1440-first.png (1440×900, DPR 1) and <name>-1440-full.png.
   Local URLs only. The temporary Chrome profile is left in the OS temp folder
   (printed at the end) instead of being removed. */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const [outArg, ...pairs] = process.argv.slice(2);
const pages = pairs.map((p) => { const i = p.indexOf('='); return { name: p.slice(0, i), url: p.slice(i + 1) }; });
if (!outArg || !pages.length || pages.some((p) => !p.name || !/^http:\/\/(localhost|127\.0\.0\.1):\d+\//.test(p.url))) {
  console.error('usage: heating-shots.mjs <out-dir> <name>=http://localhost:<port>/path ...');
  process.exit(1);
}
const out = resolve(outArg);
mkdirSync(out, { recursive: true });
const VIEWPORTS = [
  { label: '390', width: 390, height: 844, dpr: 2, mobile: true },
  { label: '1440', width: 1440, height: 900, dpr: 1, mobile: false },
];
const port = 9300 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'heating-shots-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch { await sleep(250); }
  }
  if (!target) throw new Error('Chrome did not start');
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
  const evaluate = async (expression) => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
  await cdp('Page.enable');
  const shot = async (file) => {
    const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(out, file), Buffer.from(data, 'base64'));
    console.log(join(out, file));
  };
  for (const page of pages) {
    for (const vp of VIEWPORTS) {
      const metrics = { width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr, mobile: vp.mobile };
      await cdp('Emulation.setDeviceMetricsOverride', metrics);
      await cdp('Emulation.setTouchEmulationEnabled', vp.mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
      await cdp('Page.navigate', { url: page.url });
      await sleep(400);
      await evaluate('new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r)))');
      await evaluate('document.fonts.ready.then(() => true)');
      const overflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
      if (overflow > 0) console.warn(`WARN ${page.name} ${vp.label}: horizontal overflow ${overflow}px`);
      await sleep(300);
      await shot(`${page.name}-${vp.label}-first.png`);
      // Lazy images: scroll through, then grow the viewport to the page height.
      await evaluate('(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); await Promise.race([new Promise((r) => setTimeout(r, 4000)), Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))]); return true; })()');
      const height = await evaluate('document.documentElement.scrollHeight');
      await cdp('Emulation.setDeviceMetricsOverride', { ...metrics, height });
      await sleep(400);
      await shot(`${page.name}-${vp.label}-full.png`);
    }
  }
  ws.close();
} finally {
  chrome.kill();
  console.log(`Chrome profile left at ${profile} (cleanup candidate)`);
}
