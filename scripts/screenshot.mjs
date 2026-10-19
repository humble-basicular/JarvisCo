#!/usr/bin/env node
/* Full-page screenshots in headless Chrome at 390 and 1440 px wide.
   node scripts/screenshot.mjs <url> <out-prefix> [--retain-profile] → <prefix>-390.png, <prefix>-1440.png
   Local URLs only (http://localhost:<port>/...). */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, prefix] = process.argv.slice(2);
const retainProfile = process.argv.includes('--retain-profile');
if (!url || !prefix || !/^http:\/\/(localhost|127\.0\.0\.1):\d+\//.test(url)) { console.error('usage: screenshot.mjs http://localhost:<port>/path <out-prefix>'); process.exit(1); }
const profile = mkdtempSync(join(tmpdir(), 'shot-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) { try { target = (await (await fetch('http://localhost:9334/json')).json()).find((t) => t.type === 'page'); } catch { await sleep(250); } }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let n = 0; const waiting = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); waiting.get(m.id)?.(m); });
  const cdp = (method, params = {}) => new Promise((res) => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  for (const width of [390, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await cdp('Page.navigate', { url });
    await sleep(1200);
    // Load lazy images without a smooth-scroll race. Keep the real viewport height:
    // growing it to the document height changes layout and can crop the page top.
    const height = (await cdp('Runtime.evaluate', { expression: `(async () => {
      for (const image of document.images) image.loading = 'eager';
      await document.fonts.ready;
      await Promise.race([Promise.all([...document.images].map(i => i.decode().catch(() => {}))), new Promise(r => setTimeout(r, 4000))]);
      window.scrollTo({top: 0, left: 0, behavior: 'instant'});
      return document.documentElement.scrollHeight;
    })()`, awaitPromise: true, returnByValue: true })).result.result.value;
    const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: 1 } });
    writeFileSync(`${prefix}-${width}.png`, Buffer.from(shot.result.data, 'base64'));
    console.log(`${prefix}-${width}.png (${height}px tall)`);
  }
  ws.close();
} finally {
  chrome.kill(); await sleep(500);
  if (retainProfile) console.log(`Chrome profile retained at ${profile}`);
  else rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
