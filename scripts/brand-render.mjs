#!/usr/bin/env node
/* Browser-tab icon, home-screen icon and link-preview cards in the v4 look
   (paper #faf9f6, ink #141412, safety orange #ff6a13, Instrument Sans).
   The logo itself is unchanged: the editorial wordmark/J, recoloured.
   node scripts/brand-render.mjs   (headless Chrome over CDP, offline; nothing is deleted)
   Writes public/brand/v4/favicon.svg, public/apple-touch-icon.png,
   public/assets/og-v4.png, public/assets/og-rezultatai-v4.png. */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const C = { paper: '#faf9f6', ink: '#141412', mute: '#5b5952', rule: '#dcd9d0', accent: '#ff6a13' };
const read = (p) => readFileSync(p, 'utf8');
const font = (file) => `data:font/woff2;base64,${readFileSync(`node_modules/${file}`).toString('base64')}`;

// 1. Favicon: same J and accent geometry as the editorial favicon, v4 colours.
const favicon = read('public/brand/editorial/jarvisco-favicon.svg')
  .replace('fill="#06110C"', `fill="${C.ink}"`)
  .replace('fill="#F4F1E8"', `fill="${C.paper}"`)
  .replace('fill="#C8F560"', `fill="${C.accent}"`);
if (favicon.includes('#06110C') || favicon.includes('#C8F560')) throw new Error('favicon recolour missed a fill');
mkdirSync('public/brand/v4', { recursive: true });
writeFileSync('public/brand/v4/favicon.svg', favicon);

// The header's wordmark: every fill in ink (Header.astro does the same with currentColor).
const wordmark = read('public/brand/editorial/jarvisco-wordmark-light.svg')
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${C.ink}"`);

const css = `
@font-face { font-family: 'Instrument Sans'; src: url(${font('@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2')}) format('woff2'); font-weight: 400 700; unicode-range: U+0000-00FF, U+2000-206F, U+20AC; }
@font-face { font-family: 'Instrument Sans'; src: url(${font('@fontsource-variable/instrument-sans/files/instrument-sans-latin-ext-wght-normal.woff2')}) format('woff2'); font-weight: 400 700; unicode-range: U+0100-02BA, U+1E00-1EFF; }
@font-face { font-family: 'Barlow Condensed'; src: url(${font('@fontsource/barlow-condensed/files/barlow-condensed-latin-ext-800-normal.woff2')}) format('woff2'); font-weight: 800; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; background: ${C.paper}; color: ${C.ink}; font-family: 'Instrument Sans', sans-serif; }
.card { position: relative; width: 1200px; height: 630px; padding: 64px 72px 56px; display: grid; grid-template-rows: auto 1fr auto; overflow: hidden; }
.logo svg { display: block; width: 236px; height: auto; }
.head { align-self: center; font-weight: 600; letter-spacing: -0.05em; line-height: 0.95; }
.foot { display: flex; align-items: center; justify-content: space-between; padding-top: 28px; border-top: 1.5px solid ${C.ink}; }
.pill { padding: 14px 26px; border-radius: 999px; background: ${C.accent}; color: ${C.ink}; font-size: 30px; font-weight: 600; letter-spacing: -0.02em; }
.stamp { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 26px; letter-spacing: 0.08em; text-transform: uppercase; }
.url { color: ${C.mute}; font-size: 28px; font-weight: 500; }`;

const page = (body) => `<!doctype html><html lang="lt"><meta charset="utf-8"><style>${css}</style><body>${body}</body></html>`;
const CARDS = [
  {
    file: 'public/assets/og-v4.png',
    html: page(`<div class="card"><div class="logo">${wordmark}</div>
      <p class="head" style="font-size:92px">Svetainė, kuri<br>nieko nekainuoja,<br>kol neatneša užklausos.</p>
      <div class="foot"><span class="pill">Nemokama peržiūra per 48 val.</span><span class="url">jarvisweb.lt</span></div></div>`),
  },
  {
    file: 'public/assets/og-rezultatai-v4.png',
    html: page(`<div class="card"><div class="logo">${wordmark}</div>
      <div class="head"><p class="stamp" style="margin-bottom:22px">Rezultatai · arbcut.lt</p><p style="font-size:120px">20 užklausų</p><p style="font-size:84px">per 2 mėnesius</p></div>
      <div class="foot"><span class="url" style="color:${C.ink}">Tikros ekrano kopijos, skaičiai nepakeisti</span><span class="url">jarvisweb.lt/rezultatai</span></div></div>`),
  },
  // iOS ignores SVG icons: a 180 px PNG of the favicon, full-bleed (iOS rounds the corners itself).
  { file: 'public/apple-touch-icon.png', size: 180, html: `<!doctype html><style>*{margin:0}html,body{width:180px;height:180px;background:${C.ink}}svg{display:block;width:180px;height:180px}</style><body>${favicon.replace('rx="14"', 'rx="0"')}</body>` },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'brand-render-'));
const chrome = spawn(process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=0', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${join(dir, 'profile')}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
try {
  let stderr = '';
  const endpoint = await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('Chrome startup timed out')), 15000);
    chrome.stderr.on('data', (c) => { stderr += c; const m = stderr.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(new URL(m[1]).origin.replace('ws:', 'http:')); } });
  });
  const target = (await (await fetch(`${endpoint}/json/list`)).json()).find((t) => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let seq = 0; const pending = new Map();
  ws.addEventListener('message', ({ data }) => { const m = JSON.parse(data); const p = pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } });
  const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  await cdp('Page.enable');
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', { urls: ['http://*', 'https://*'] }); // fonts are inlined; nothing leaves the machine
  for (const card of CARDS) {
    const w = card.size ?? 1200; const h = card.size ?? 630;
    const html = join(dir, `${card.file.replaceAll('/', '_')}.html`);
    writeFileSync(html, card.html);
    await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await cdp('Page.navigate', { url: `file://${html}` });
    await sleep(600);
    const ready = (await cdp('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => [...document.fonts].filter((f) => f.status === "loaded").length)', awaitPromise: true, returnByValue: true })).result.value;
    const overflow = (await cdp('Runtime.evaluate', { expression: 'Math.max(document.documentElement.scrollWidth - innerWidth, document.documentElement.scrollHeight - innerHeight)', returnByValue: true })).result.value;
    if (overflow > 0) throw new Error(`${card.file}: content overflows by ${overflow}px`);
    const shot = await cdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    writeFileSync(card.file, Buffer.from(shot.data, 'base64'));
    console.log(`${card.file}: ${w}×${h}, fonts loaded ${ready}`);
  }
  ws.close();
} finally {
  chrome.kill();
}
console.log(`public/brand/v4/favicon.svg written; scratch files left in ${dir}`);
