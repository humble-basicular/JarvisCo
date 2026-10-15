#!/usr/bin/env node
/* Full-page screenshots in headless Chrome at 390 and 1440 px wide.
   node scripts/screenshot.mjs <url> <out-prefix>   → <prefix>-390.png, <prefix>-1440.png
   Local URLs only (http://localhost:<port>/...). */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, prefix] = process.argv.slice(2);
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
    // Lazy images: scroll through once, then measure.
    const height = (await cdp('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight); document.documentElement.scrollHeight', returnByValue: true })).result.result.value;
    await sleep(400);
    await cdp('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await sleep(300);
    const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(`${prefix}-${width}.png`, Buffer.from(shot.result.data, 'base64'));
    console.log(`${prefix}-${width}.png (${height}px tall)`);
  }
  ws.close();
} finally {
  chrome.kill(); await sleep(500);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
