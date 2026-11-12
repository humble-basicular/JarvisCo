#!/usr/bin/env node
/* Local QA for the Jarvis Systems separate pages (USER13, 2026-11-08). Run after `O2_BOOKING=preview npm run build`.
   node scripts/o2-pages-qa.mjs <outDir>
   Serves ./dist on 127.0.0.1; every non-local request is BLOCKED and every POST recorded (expected none).
   Per route: HTTP 200, <title>, canonical, active nav, no in-page # links (skip link excepted), all link targets
   200, overflow at 320/390/768/1024/1280/1440, full-page shots at 390 + 1440 → contact sheets.
   Behaviour on subpages: menu Escape/focus, booking quiz from header/menu/body CTA, quiz walk (auto-advance, back,
   required phone/email/name/company validation), live-mode FormData contract with fetch intercepted INSIDE the page,
   preview no-send message, Escape focus. */
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
    const meta = await ev(`(()=>({title:document.title,canonical:document.querySelector('link[rel=canonical]')?.href,current:[...document.querySelectorAll('.hdr__nav > a[aria-current=page], .hdr__dd > a[aria-current=page]')].map(a=>a.getAttribute('href')),hash:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h!=='#turinys'),links:[...new Set([...document.querySelectorAll('a[href^="/"]')].map(a=>a.getAttribute('href')))],h1:document.querySelectorAll('h1').length,brokenImgs:[...document.images].filter(i=>i.getAttribute('src')&&!i.naturalWidth).map(i=>i.src),bookDialog:!!document.querySelector('dialog[data-book-dialog] [data-book-form]'),robots:document.querySelector('meta[name=robots]')?.content??''}))()`);
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
    const onQ1 = `document.activeElement.matches('[data-q-pick]') && !document.querySelector('[data-q-step="0"]').hidden`;
    c.bookFromMenu = await ev(`(async()=>{document.querySelector('[data-menu-open]').click();await new Promise(r=>setTimeout(r,100));document.querySelector('[data-menu] [data-book-open]').click();await new Promise(r=>setTimeout(r,100));const ok=document.querySelector('[data-book-dialog]').open&&!document.querySelector('[data-menu]').open&&${onQ1};const closed=new Promise(r=>document.querySelector('[data-book-dialog]').addEventListener('close',r,{once:true}));document.querySelector('[data-book-close]').click();await closed;return ok&&document.activeElement===document.querySelector('[data-menu-open]')})()`);
    c.bookFromBody = await ev(`(()=>{const o=[...document.querySelectorAll('main [data-book-open]')].pop();o.scrollIntoView();o.focus();o.click();return document.querySelector('[data-book-dialog]').open && ${onQ1}})()`);
    if (route === '/kainos') await sharp(Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).result.data, 'base64')).toFile(join(out, 'dlg-quiz-q1-kainos-390.png'));
    // Quiz walk: 4 choice slides (auto-advance, back keeps the answer), then phone → email → name → company, each required.
    c.quiz = await ev(`(async()=>{const W=ms=>new Promise(r=>setTimeout(r,ms));const f=document.querySelector('[data-book-form]');const d=document.querySelector('[data-book-dialog]');f.dataset.noRedirect='1';
      const vis=()=>[...f.querySelectorAll('[data-q-step]')].findIndex(s=>!s.hidden);const bar=()=>Number(d.querySelector('[data-q-bar]').getAttribute('aria-valuenow'));
      const r={start:vis(),bar0:bar(),title:d.querySelector('#bd-h').textContent.trim().replace(/\\u00a0/g,' '),backHidden:d.querySelector('[data-q-back]').hidden};
      const pick=async(i)=>{f.querySelector('[data-q-step]:not([hidden])').querySelectorAll('[data-q-pick]')[i].click();await W(300)};
      await pick(0);r.afterQ1=vis();d.querySelector('[data-q-back]').click();await W(50);r.backTo=vis();r.kept=f.querySelector('[name=q_audience]').value;
      await pick(1);await pick(1);await pick(0);await pick(3);r.atPhone=vis()===4&&document.activeElement.name==='phone';r.bar4=bar();
      const go=async(n,v)=>{f.querySelector('[name='+n+']').value=v;f.requestSubmit();await W(60);return f.querySelector('[name='+n+']').getAttribute('aria-invalid')==='true'};
      r.phoneShort=await go('phone','12345')&&vis()===4;r.phoneForeign=await go('phone','+44 7700 900123')&&vis()===4;r.phoneOk=!(await go('phone','+370 612 34567'))&&vis()===5;
      r.emailEmpty=await go('email','')&&vis()===5;r.emailBad=await go('email','jonas@example')&&vis()===5;r.emailOk=!(await go('email','jonas@example.com'))&&vis()===6;
      r.nameEmpty=await go('name','')&&vis()===6;r.nameOk=!(await go('name','Jonas'))&&vis()===7;r.companyEmpty=await go('company','')&&vis()===7;
      r.submitLabel=f.querySelector('[data-q-step]:not([hidden]) button[type=submit]').textContent.trim();r.contactTime=!!f.querySelector('[name=contact_time]');r.honeypot=!!f.querySelector('[name=website]');
      const real=window.fetch;const sent=[];window.fetch=async(u,o)=>{sent.push([String(u),[...o.body.entries()]]);return new Response('{}',{status:200})};
      const mode=f.dataset.bookMode;f.dataset.bookMode='live';f.querySelector('[name=company]').value='Stogai, Kaunas';f.requestSubmit();await W(200);
      window.fetch=real;f.dataset.bookMode=mode;f.querySelector('[data-book-fields]').hidden=false;f.querySelector('[data-status]').textContent='';
      const g=k=>(sent[0]?.[1]??[]).filter(e=>e[0]===k).map(e=>e[1]);
      r.live={calls:sent.length,url:sent[0]?.[0],kind:g('kind')[0],name:g('name')[0],phone:g('phone')[0],email:g('email')[0],company:g('company')[0],time:g('contact_time').length,website:g('website').length,standout:g('standout')[0]};
      const sent2=[];window.fetch=async(...a)=>{sent2.push(a);return new Response('{}')};f.requestSubmit();await W(150);window.fetch=real;
      r.preview={mode:f.dataset.bookMode,calls:sent2.length,status:f.querySelector('[data-status]').textContent};return r})()`);
    if (route === '/kainos') { await sharp(Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).result.data, 'base64')).toFile(join(out, 'dlg-book-kainos-390.png')); }
    await key('Escape');
    c.bookEscFocus = await ev(`!document.querySelector('[data-book-dialog]').open && document.activeElement===[...document.querySelectorAll('main [data-book-open]')].pop()`);
    const q = c.quiz ?? {}; const L = q.live ?? {};
    const quizOk = q.start === 0 && q.bar0 === 50 && q.backHidden && q.title === 'Daugiau užklausų Jūsų verslui už 97 €/mėn.' && q.afterQ1 === 1 && q.backTo === 0 && q.kept === 'Gyventojams'
      && q.atPhone && q.bar4 > 50 && q.phoneShort && q.phoneForeign && q.phoneOk && q.emailEmpty && q.emailBad && q.emailOk && q.nameEmpty && q.nameOk && q.companyEmpty
      && q.submitLabel === 'Taip, noriu daugiau užklausų' && !q.contactTime && q.honeypot
      && L.calls === 1 && L.url?.endsWith('/t/form') && L.kind === 'callback_request' && L.name === 'Jonas' && L.phone === '+370 612 34567' && L.email === 'jonas@example.com' && L.company === 'Stogai, Kaunas' && L.time === 0 && L.website === 1
      && L.standout?.includes(route) && L.standout.includes('Kam dirbate? Įmonėms') && L.standout.includes('Kaip dabar sekasi? Darbų yra, bet nepastoviai') && L.standout.includes('Kada norėtumėte tai spręsti? Iš karto') && L.standout.includes('Mėnesio apyvarta? daugiau nei 30 tūkst. €') && L.standout.includes('Įmonė/veikla: Stogai, Kaunas')
      && q.preview?.mode === 'preview' && q.preview.calls === 0 && q.preview.status.includes('neišsiųsta');
    const ok = c.menuOpen && c.menuEscFocus && c.bookFromMenu && c.bookFromBody && c.bookEscFocus && quizOk;
    if (!ok) fails.push(`${route}: behaviour ${JSON.stringify(c)}`);
  }
  // Desktop dropdown: keyboard focus reveals the five feature links
  await load('/apie', 1440);
  C.dropdown = await ev(`(async()=>{const a=document.querySelector('.hdr__dd > a');a.focus();await new Promise(r=>setTimeout(r,400));const l=document.querySelector('.hdr__ddl');return getComputedStyle(l).visibility==='visible'&&l.querySelectorAll('a').length===5})()`);
  if (!C.dropdown) fails.push('dropdown');
  // /musu-darbai proof lightbox (zoom.ts): GSC + forms screenshot open in-page; Esc, X and backdrop close; focus returns.
  await load('/musu-darbai', 390);
  C.zoom = {};
  for (const sel of ['.case__gsc a', '.case__forms a']) {
    const r = C.zoom[sel] = {};
    r.open = await ev(`(async()=>{const a=document.querySelector('${sel}');a.scrollIntoView();a.focus();a.click();await new Promise(r=>setTimeout(r,500));const d=document.querySelector('[data-zoom-dialog]');const i=d.querySelector('img');const b=i.getBoundingClientRect();return d.open&&i.complete&&i.naturalWidth>0&&!a.target&&b.left>=0&&b.right<=innerWidth+1&&location.pathname==='/musu-darbai'})()`);
    if (sel === '.case__gsc a') await sharp(Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).result.data, 'base64')).toFile(join(out, 'dlg-zoom-darbai-390.png'));
    await key('Escape');
    r.esc = await ev(`!document.querySelector('[data-zoom-dialog]').open&&document.activeElement===document.querySelector('${sel}')`);
    r.x = await ev(`(async()=>{document.querySelector('${sel}').click();await new Promise(r=>setTimeout(r,200));document.querySelector('[data-zoom-dialog] button[type=submit]').click();await new Promise(r=>setTimeout(r,100));return !document.querySelector('[data-zoom-dialog]').open&&document.activeElement===document.querySelector('${sel}')})()`);
    r.backdrop = await ev(`(async()=>{document.querySelector('${sel}').click();await new Promise(r=>setTimeout(r,200));document.querySelector('[data-zoom-dialog] .zoom__stage').click();await new Promise(r=>setTimeout(r,100));return !document.querySelector('[data-zoom-dialog]').open})()`);
    if (!(r.open && r.esc && r.x && r.backdrop)) fails.push(`zoom ${sel}: ${JSON.stringify(r)}`);
  }
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
