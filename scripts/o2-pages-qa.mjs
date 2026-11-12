#!/usr/bin/env node
/* Local QA for the Jarvis Systems separate pages (USER13, 2026-11-08). Run after `O2_BOOKING=preview npm run build`.
   node scripts/o2-pages-qa.mjs <outDir>
   Serves ./dist on 127.0.0.1; every non-local request is BLOCKED and every POST recorded (expected none).
   Per route: HTTP 200, <title>, canonical, active nav, no in-page # links (skip link excepted), all link targets
   200, overflow at 320/390/768/1024/1280/1440, full-page shots at 390 + 1440 → contact sheets.
   Behaviour on subpages: menu Escape/focus, booking from header/menu/body CTA, email invalid/valid/omitted with
   fetch intercepted INSIDE the page (live-mode FormData contract), preview no-send message, Escape focus. */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const out = process.argv[2] ?? '/tmp/o2-pages-qa';
mkdirSync(out, { recursive: true });
const ROUTES = ['/', '/funkcijos', '/funkcijos/funkcionali-svetaine', '/funkcijos/atsiliepimu-rinkimas', '/funkcijos/praleistas-skambutis', '/funkcijos/kampanijos', '/funkcijos/vietinis-seo', '/kainos', '/atsiliepimai', '/musu-darbai', '/apie', '/kaip-dirbame', '/sritys', '/kontaktai'];
const NAV = { '/funkcijos': '/funkcijos', '/kainos': '/kainos', '/atsiliepimai': '/atsiliepimai', '/musu-darbai': '/musu-darbai', '/apie': '/apie' };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.json': 'application/json', '.pdf': 'application/pdf' };
const missing = [];
const resolve = (p) => { let f = join('dist', p); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html'); else if (!existsSync(f) && existsSync(`${f}.html`)) f = `${f}.html`; return existsSync(f) ? f : null; };
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
  const f = resolve(p);
  if (!f) { missing.push(p); res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(0, '127.0.0.1');
await new Promise((r) => server.on('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
const profile = mkdtempSync(join(tmpdir(), 'o2-pages-qa-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9348', `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const receipt = { base, blocked: [], posts: [], routes: {}, overflow: {}, links: {}, checks: {} };
const fails = [];
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) { try { target = (await (await fetch('http://127.0.0.1:9348/json')).json()).find((t) => t.type === 'page'); } catch { await sleep(250); } }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let n = 0; const waiting = new Map();
  const cdp = (method, params = {}) => new Promise((res) => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data); if (m.id) return waiting.get(m.id)?.(m);
    if (m.method === 'Fetch.requestPaused') {
      const { requestId, request } = m.params;
      if (request.method === 'POST') receipt.posts.push(request.url);
      if (request.url.startsWith(base)) cdp('Fetch.continueRequest', { requestId });
      else { receipt.blocked.push(request.url); cdp('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }); }
    }
  });
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await cdp('Page.enable'); await cdp('Runtime.enable');
  const ev = async (expression) => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const load = async (route, width, height = 900) => {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await cdp('Page.navigate', { url: base + route }); await sleep(700);
    await ev(`(async()=>{document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));await document.fonts.ready;return 1})()`);
    await sleep(200);
  };
  const shots = { 390: [], 1440: [] };
  for (const route of ROUTES) {
    const status = (await fetch(base + route)).status;
    await load(route, 1440);
    const meta = await ev(`(()=>({title:document.title,canonical:document.querySelector('link[rel=canonical]')?.href,current:[...document.querySelectorAll('.hdr__nav > a[aria-current=page], .hdr__dd > a[aria-current=page]')].map(a=>a.getAttribute('href')),hash:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h!=='#turinys'),links:[...new Set([...document.querySelectorAll('a[href^="/"]')].map(a=>a.getAttribute('href')))],h1:document.querySelectorAll('h1').length,brokenImgs:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),bookDialog:!!document.querySelector('dialog[data-book-dialog] [data-book-form]'),robots:document.querySelector('meta[name=robots]')?.content??''}))()`);
    receipt.routes[route] = { status, ...meta };
    const want = new URL(route, 'https://jarvisweb.lt').href;
    const nav = Object.keys(NAV).find((k) => route === k || route.startsWith(`${k}/`));
    if (status !== 200) fails.push(`${route}: HTTP ${status}`);
    if (meta.canonical !== want) fails.push(`${route}: canonical ${meta.canonical}`);
    if (meta.hash.length) fails.push(`${route}: in-page # links ${meta.hash}`);
    if (meta.h1 !== 1) fails.push(`${route}: ${meta.h1} h1`);
    if (meta.brokenImgs.length) fails.push(`${route}: broken images ${meta.brokenImgs}`);
    if (!meta.bookDialog) fails.push(`${route}: no booking dialog`);
    if (JSON.stringify(meta.current) !== JSON.stringify(nav ? [nav] : [])) fails.push(`${route}: active nav ${meta.current}`);
    for (const l of meta.links) { const p = l.split('#')[0].split('?')[0]; if (!(p in receipt.links)) receipt.links[p] = (await fetch(base + p)).status; }
    for (const w of [320, 390, 768, 1024, 1280, 1440]) {
      await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 }); await sleep(700);
      const o = await ev(`(()=>{const W=document.documentElement.clientWidth;const bad=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>W+1&&!e.closest('.car__track,.dev,.scr,.lap,dialog,.hdr__ddl')}).slice(0,6).map(e=>e.className||e.tagName);return {scrollW:document.documentElement.scrollWidth,W,bad}})()`);
      receipt.overflow[`${route}@${w}`] = o;
      if (o.scrollW > o.W || o.bad.length) fails.push(`${route}@${w}: overflow ${o.scrollW}/${o.W} ${o.bad}`);
      if (w === 390 || w === 1440) {
        await ev(`document.getAnimations().forEach(a=>{a.pause();a.currentTime=9000});1`);
        const h = Math.min(await ev('document.documentElement.scrollHeight'), 16000);
        await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 }); await sleep(250);
        const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
        const file = join(out, `page-${w}-${route === '/' ? 'home' : route.slice(1).replace(/\//g, '_')}.png`);
        writeFileSync(file, Buffer.from(r.result.data, 'base64')); shots[w].push([route, file]);
        await ev(`document.getAnimations().forEach(a=>a.play());1`);
      }
    }
  }
  for (const [p, s] of Object.entries(receipt.links)) if (s !== 200) fails.push(`link ${p}: HTTP ${s}`);
  // Contact sheets: every page side by side, scaled to a fixed column width
  for (const [w, list] of Object.entries(shots)) {
    const col = w === '390' ? 260 : 360; const H = 2400;
    const tiles = await Promise.all(list.map(async ([, f]) => sharp(f).resize({ width: col }).toBuffer().then(async (b) => { const m = await sharp(b).metadata(); return m.height > H ? sharp(b).extract({ left: 0, top: 0, width: col, height: H }).toBuffer() : b; })));
    const metas = await Promise.all(tiles.map((b) => sharp(b).metadata()));
    const perRow = 7; const rows = Math.ceil(tiles.length / perRow);
    const rowH = [...Array(rows)].map((_, r) => Math.max(...metas.slice(r * perRow, r * perRow + perRow).map((m) => m.height)));
    const comp = tiles.map((b, i) => ({ input: b, left: (i % perRow) * (col + 10), top: rowH.slice(0, Math.floor(i / perRow)).reduce((a, x) => a + x + 10, 0) }));
    await sharp({ create: { width: perRow * (col + 10), height: rowH.reduce((a, x) => a + x + 10, 0), channels: 3, background: '#ff00ff' } }).composite(comp).png().toFile(join(out, `sheet-${w}.png`));
  }
  // Behaviour on subpages
  const key = async (k) => { await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: { Escape: 27 }[k] }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k }); await sleep(250); };
  const C = receipt.checks;
  for (const route of ['/kainos', '/funkcijos/kampanijos', '/kontaktai']) {
    await load(route, 390);
    const c = C[route] = {};
    c.menuOpen = await ev(`(()=>{const b=document.querySelector('[data-menu-open]');b.focus();b.click();return document.querySelector('[data-menu]').open && document.querySelectorAll('[data-menu] .menu__sub a').length===5})()`);
    await key('Escape');
    c.menuEscFocus = await ev(`!document.querySelector('[data-menu]').open && document.activeElement===document.querySelector('[data-menu-open]')`);
    c.bookFromMenu = await ev(`(async()=>{document.querySelector('[data-menu-open]').click();await new Promise(r=>setTimeout(r,100));document.querySelector('[data-menu] [data-book-open]').click();await new Promise(r=>setTimeout(r,100));const ok=document.querySelector('[data-book-dialog]').open&&!document.querySelector('[data-menu]').open&&document.activeElement.name==='name';const closed=new Promise(r=>document.querySelector('[data-book-dialog]').addEventListener('close',r,{once:true}));document.querySelector('[data-book-close]').click();await closed;return ok&&document.activeElement===document.querySelector('[data-menu-open]')})()`);
    c.bookFromBody = await ev(`(()=>{const o=[...document.querySelectorAll('main [data-book-open]')].pop();o.scrollIntoView();o.focus();o.click();return document.querySelector('[data-book-dialog]').open && document.activeElement.name==='name'})()`);
    c.emailInvalid = await ev(`(()=>{const f=document.querySelector('[data-book-form]');f.querySelector('[name=phone]').value='+370 612 34567';f.querySelector('[name=email]').value='jonas@example';f.requestSubmit();return f.querySelector('[name=email]').getAttribute('aria-invalid')==='true'&&document.activeElement.name==='email'&&!f.querySelector('[data-status]').textContent})()`);
    c.emailLive = await ev(`(async()=>{const f=document.querySelector('[data-book-form]');f.dataset.noRedirect='1';const real=window.fetch;const sent=[];window.fetch=async(u,o)=>{sent.push([String(u),[...o.body.entries()]]);return new Response('{}',{status:200})};const mode=f.dataset.bookMode;f.dataset.bookMode='live';const run=async(em)=>{f.querySelector('[data-book-fields]').hidden=false;f.querySelector('[name=email]').value=em;f.querySelector('[name=phone]').value='+370 612 34567';f.requestSubmit();await new Promise(r=>setTimeout(r,150))};await run('jonas@example.com');await run('');window.fetch=real;f.dataset.bookMode=mode;f.querySelector('[data-book-fields]').hidden=false;f.querySelector('[data-status]').textContent='';const get=(i,k)=>sent[i]?.[1].find(e=>e[0]===k)?.[1];return {calls:sent.length,url:sent[0]?.[0],email:get(0,'email'),omitted:get(1,'email')===undefined,context:get(0,'standout')}})()`);
    c.preview = await ev(`(async()=>{const f=document.querySelector('[data-book-form]');f.querySelector('[name=email]').value='';f.querySelector('[name=phone]').value='+370 612 34567';f.requestSubmit();await new Promise(r=>setTimeout(r,150));return {mode:f.dataset.bookMode,status:f.querySelector('[data-status]').textContent}})()`);
    if (route === '/kainos') { await sharp(Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).result.data, 'base64')).toFile(join(out, 'dlg-book-kainos-390.png')); }
    await key('Escape');
    c.bookEscFocus = await ev(`!document.querySelector('[data-book-dialog]').open && document.activeElement===[...document.querySelectorAll('main [data-book-open]')].pop()`);
    const ok = c.menuOpen && c.menuEscFocus && c.bookFromMenu && c.bookFromBody && c.emailInvalid && c.bookEscFocus && c.emailLive?.calls === 2 && c.emailLive.email === 'jonas@example.com' && c.emailLive.omitted && c.emailLive.context?.includes(route) && c.preview.mode === 'preview' && c.preview.status.includes('neišsiųsta');
    if (!ok) fails.push(`${route}: behaviour ${JSON.stringify(c)}`);
  }
  // Desktop dropdown: keyboard focus reveals the five feature links
  await load('/apie', 1440);
  C.dropdown = await ev(`(async()=>{const a=document.querySelector('.hdr__dd > a');a.focus();await new Promise(r=>setTimeout(r,400));const l=document.querySelector('.hdr__ddl');return getComputedStyle(l).visibility==='visible'&&l.querySelectorAll('a').length===5})()`);
  if (!C.dropdown) fails.push('dropdown');
  ws.close();
} finally {
  chrome.kill('SIGKILL'); server.close();
  receipt.missing = [...new Set(missing)];
  if (receipt.posts.length || receipt.blocked.length) fails.push(`network posts=${receipt.posts.length} blocked=${receipt.blocked.length}`);
  receipt.fails = fails;
  writeFileSync(join(out, 'receipt.json'), JSON.stringify(receipt, null, 2));
}
if (fails.length) { console.error('FAIL:\n' + fails.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${ROUTES.length} routes, ${Object.keys(receipt.links).length} link targets, 6 widths, subpage behaviour, 0 POST/blocked`);
