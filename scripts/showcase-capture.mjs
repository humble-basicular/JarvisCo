#!/usr/bin/env node
/* Reproducible screenshots of the heating demo for the jarvisweb.lt hero and
   showcase (hero plan 2026-10-15 §4–§5). Headless Chrome over CDP, loopback only.
   node scripts/showcase-capture.mjs http://127.0.0.1:<port> <out-dir>
   Writes <out-dir>/{mobile,desktop,tall,hero-screen}.png + capture.json (viewport,
   DPR, sha256, git commit, Chrome version). The Chrome profile stays in
   <out-dir>/chrome-profile; nothing is deleted. Next: scripts/showcase-assets.mjs. */
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [baseArg, outArg] = process.argv.slice(2);
if (!baseArg || !outArg) { console.error('usage: showcase-capture.mjs http://127.0.0.1:<port> <out-dir>'); process.exit(1); }
const base = new URL(baseArg);
if (!['127.0.0.1', 'localhost'].includes(base.hostname)) throw new Error('Only a loopback preview is allowed');
const ROUTE = '/pavyzdys/sildymas';
const out = resolve(outArg);
const profile = join(out, 'chrome-profile');
mkdirSync(profile, { recursive: true });

/* name, CSS viewport, DPR, full page. hero-screen matches the phone display in
   hero-v2 (quad ≈ 128 × 237 px → 0.54), so the screenshot is not stretched. */
const SHOTS = [
  { name: 'mobile', width: 390, height: 844, dpr: 2, mobile: true },
  { name: 'desktop', width: 1440, height: 900, dpr: 2, mobile: false },
  { name: 'hero-screen', width: 390, height: 722, dpr: 2, mobile: true },
  // Whole page. DPR 1.3 (the page grew with the town pages) keeps it under 16 384 device px: past that Chrome repeats
  // compositor tiles, and WebP cannot encode it either.
  { name: 'tall', width: 390, height: 844, dpr: 1.3, mobile: true, fullPage: true },
];

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
let ws;
try {
  let stderr = '';
  const endpoint = await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('Chrome startup timed out')), 15000);
    chrome.on('error', rej);
    chrome.stderr.on('data', (c) => { stderr += c; const m = stderr.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(new URL(m[1]).origin.replace('ws:', 'http:')); } });
  });
  const version = (await (await fetch(`${endpoint}/json/version`)).json()).Browser;
  const target = (await (await fetch(`${endpoint}/json/list`)).json()).find((t) => t.type === 'page');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let seq = 0; const pending = new Map();
  ws.addEventListener('message', ({ data }) => { const m = JSON.parse(data); const p = pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } });
  const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

  await cdp('Page.enable');
  // Never let the demo reach the network beyond the loopback preview.
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', { urls: ['http://*/t/*', 'https://*'] });
  const shots = [];
  for (const s of SHOTS) {
    await cdp('Emulation.setDeviceMetricsOverride', { width: s.width, height: s.height, deviceScaleFactor: s.dpr, mobile: s.mobile });
    await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await cdp('Page.navigate', { url: new URL(ROUTE, base).href });
    await sleep(1200);
    await evaluate('document.fonts.ready.then(() => true)');
    // Load lazy images: walk the page once, then return to the top.
    const pageHeight = await evaluate(`(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); scrollTo(0, 0); return document.documentElement.scrollHeight; })()`);
    let height = s.height;
    // The hero phone shows the site without the example banner (the hero caption
    // says it is our demo): shoot taller by the banner's height; showcase-assets
    // crops exactly that many rows, so the screen keeps its 390 × 722 proportions.
    let bannerCss = 0;
    if (s.name === 'hero-screen') {
      bannerCss = await evaluate(`Math.ceil(document.querySelector('.hs-banner')?.getBoundingClientRect().height ?? 0)`);
      height = s.height + bannerCss;
      await cdp('Emulation.setDeviceMetricsOverride', { width: s.width, height, deviceScaleFactor: s.dpr, mobile: s.mobile });
    }
    if (s.fullPage) {
      height = pageHeight;
      if (height * s.dpr > 16000) throw new Error(`${s.name}: ${height} CSS px @${s.dpr}x exceeds the 16 000 device px limit`);
      await cdp('Emulation.setDeviceMetricsOverride', { width: s.width, height, deviceScaleFactor: s.dpr, mobile: s.mobile });
    }
    await sleep(500);
    const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = join(out, `${s.name}.png`);
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
    shots.push({ name: s.name, file, cssViewport: `${s.width}x${height}`, dpr: s.dpr, mobile: s.mobile, fullPage: Boolean(s.fullPage), pageHeight, bannerCss, sha256: sha(file) });
    console.log(`${s.name}: ${s.width}x${height} CSS px @${s.dpr}x`);
  }
  const receipt = {
    capturedAt: new Date().toISOString(),
    route: ROUTE,
    base: base.origin,
    browser: version,
    reducedMotion: 'reduce (no entrance animations in the captures)',
    blocked: ['http://*/t/*', 'https://*'],
    sourceCommit: git('rev-parse', 'HEAD'),
    demoSourcesClean: git('status', '--porcelain', '--', 'src/templates', 'src/pages/pavyzdys') === '',
    profile,
    shots,
  };
  writeFileSync(join(out, 'capture.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(`receipt: ${join(out, 'capture.json')}`);
} finally {
  ws?.close();
  chrome.kill();
}
