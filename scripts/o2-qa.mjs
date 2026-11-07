#!/usr/bin/env node
/* Local visual + behaviour QA for the Jarvis Systems homepage (source-match, 2026-11-07).
   node scripts/o2-qa.mjs <outDir>   (serves ./dist itself on 127.0.0.1; run after a build)
   Own temporary Chrome profile; every request that is not to the local server is BLOCKED and every
   POST is recorded (expected: none). Produces full-page shots at 320/390/768/1024/1280/1440, per-section
   shots at 390/1440, scene frames (animations seeked via the Web Animations API), reduced-motion shots,
   and a JSON receipt with overflow, keyboard/menu/dialog focus and network results. */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const out = process.argv[2] ?? '/tmp/o2-qa';
mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.json': 'application/json' };
const served = []; const missing = [];
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (req.method !== 'GET') { served.push(`${req.method} ${p}`); res.writeHead(405); return res.end(); }
  let f = join('dist', p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { missing.push(p); res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(0, '127.0.0.1');
await new Promise((r) => server.on('listening', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const profile = mkdtempSync(join(tmpdir(), 'o2-qa-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9347', `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const receipt = { base, blocked: [], posts: [], overflow: {}, checks: {}, scenes: {} };
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) { try { target = (await (await fetch('http://127.0.0.1:9347/json')).json()).find((t) => t.type === 'page'); } catch { await sleep(250); } }
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
  const shot = async (file, clip) => { const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: clip !== false, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(join(out, file), Buffer.from(r.result.data, 'base64')); };
  const load = async (width, height = 900) => {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await cdp('Page.navigate', { url: base }); await sleep(1200);
    await ev(`(async()=>{document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));await document.fonts.ready;return 1})()`);
    await sleep(300);
  };
  const sections = ['header.hdr', '.hero', '#atsiliepimai', '#funkcijos', '#svetaine', '#atsiliepimai-sistema', '#skambuciai', '#kampanijos', '#seo', '#sritys', '#procesas', '#kodel', '#duk', '#pokalbis', 'footer.ftr'];
  for (const w of [320, 390, 768, 1024, 1280, 1440]) {
    await load(w);
    // pause all scene loops at a representative mid-cycle moment for full-page shots
    await ev(`document.getAnimations().forEach(a=>{a.pause();a.currentTime=9000});1`);
    const h = await ev('document.documentElement.scrollHeight');
    receipt.overflow[w] = await ev(`(()=>{const W=document.documentElement.clientWidth;const bad=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>W+1&&!e.closest('.car__track,.dev,.scr,.lap,dialog')}).slice(0,8).map(e=>e.className||e.tagName);return {scrollW:document.documentElement.scrollWidth,W,bad}})()`);
    await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await sleep(300);
    await shot(`full-${w}.png`);
    if (w === 390 || w === 1440) {
      for (const s of sections) {
        const r = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(s)});if(!e)return null;const b=e.getBoundingClientRect();return {x:0,y:b.top+scrollY,width:${w},height:Math.min(b.height,2400)}})()`);
        if (r) await shot(`sec-${w}-${s.replace(/[^a-z0-9]+/gi, '')}.png`, r);
      }
    }
  }
  // Scene frames: seek every animation of each scene to t and capture the scene box
  await load(1440);
  const times = { web: [0.3, 1.0, 2.0, 2.9, 3.4, 3.8, 4.3, 5.5, 6.6, 9.0, 13.0], reviews: [0.5, 1.5, 2.5, 3.4, 4.3, 5.6, 7.0, 8.5], missed: [0.5, 2.0, 3.3, 4.5, 5.6, 7.0, 12.0], campaign: [0.5, 1.6, 2.5, 3.4, 4.4, 5.9, 7.2, 9.0], seo: [0.5, 1.4, 2.4, 2.9, 3.6, 6.0] };
  for (const [kind, ts] of Object.entries(times)) {
    receipt.scenes[kind] = await ev(`(()=>{const s=document.querySelector('[data-scene=${kind}]');const as=s.getAnimations({subtree:true});return {animations:as.length,durations:[...new Set(as.map(a=>a.effect.getTiming().duration))],iterations:[...new Set(as.map(a=>String(a.effect.getTiming().iterations)))]}})()`);
    for (const t of ts) {
      const r = await ev(`(()=>{const s=document.querySelector('[data-scene=${kind}]');s.scrollIntoView({block:'center'});s.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=${t * 1000}});const b=s.getBoundingClientRect();return {x:b.left+scrollX,y:b.top+scrollY,width:b.width,height:b.height}})()`);
      await sleep(120);
      await shot(`scene-${kind}-${String(t).replace('.', '_')}.png`, r);
    }
  }
  // Behaviour at 390: menu, booking dialog, demo dialog, Escape/focus
  await load(390);
  const key = async (k) => { const code = { Escape: 'Escape', Enter: 'Enter', Tab: 'Tab' }[k]; await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: { Escape: 27, Enter: 13, Tab: 9 }[k] }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code }); await sleep(250); };
  receipt.checks.menuOpen = await ev(`(()=>{const b=document.querySelector('[data-menu-open]');b.focus();b.click();return document.querySelector('[data-menu]').open})()`);
  await key('Escape');
  receipt.checks.menuEscFocus = await ev(`document.querySelector('[data-menu]').open===false && document.activeElement===document.querySelector('[data-menu-open]')`);
  // outside-focus restore case: focus a link, open menu programmatically, close → opener focused
  receipt.checks.menuCloseAlwaysOpener = await ev(`(async()=>{document.querySelector('.hero__cta').focus();document.querySelector('[data-menu]').showModal();const closed=new Promise(r=>document.querySelector('[data-menu]').addEventListener('close',r,{once:true}));document.querySelector('[data-menu-close]').click();await closed;return document.activeElement===document.querySelector('[data-menu-open]')})()`);
  receipt.checks.bookOpen = await ev(`(()=>{const o=document.querySelector('#pokalbis [data-book-open]');o.focus();o.click();return document.querySelector('[data-book-dialog]').open && document.activeElement.name==='name'})()`);
  receipt.checks.bookInvalid = await ev(`(()=>{const f=document.querySelector('[data-book-form]');f.querySelector('[name=phone]').value='12';f.requestSubmit();return f.querySelector('[name=phone]').getAttribute('aria-invalid')})()`);
  receipt.checks.bookPreview = await ev(`(async()=>{const f=document.querySelector('[data-book-form]');f.querySelector('[name=phone]').value='+370 612 34567';f.requestSubmit();await new Promise(r=>setTimeout(r,200));const b=f.querySelector('button[type=submit]');return {mode:f.dataset.bookMode,status:f.querySelector('[data-status]').textContent,callShown:!f.querySelector('[data-book-call]').hidden,btnEnabled:!b.disabled,nextShown:!f.querySelector('[data-book-next]').hidden}})()`);
  await shot('dlg-book-390.png',false);
  await key('Escape');
  receipt.checks.bookEscFocus = await ev(`document.querySelector('[data-book-dialog]').open===false && document.activeElement===document.querySelector('#pokalbis [data-book-open]')`);
  receipt.checks.bookFromMenu = await ev(`(async()=>{document.querySelector('[data-menu-open]').click();await new Promise(r=>setTimeout(r,100));document.querySelector('[data-menu] [data-book-open]').click();await new Promise(r=>setTimeout(r,100));const open=document.querySelector('[data-book-dialog]').open&&!document.querySelector('[data-menu]').open;const closed=new Promise(r=>document.querySelector('[data-book-dialog]').addEventListener('close',r,{once:true}));document.querySelector('[data-book-close]').click();await closed;return open&&document.activeElement===document.querySelector('[data-menu-open]')})()`);
  receipt.checks.demo = await ev(`(async()=>{const r=[];for(const b of document.querySelectorAll('[data-demo-open]')){b.focus();b.click();await new Promise(r=>setTimeout(r,150));const d=document.querySelector('[data-demo-dialog]');r.push({id:b.dataset.demoOpen,open:d.open,scene:d.querySelector('[data-scene]')?.dataset.scene,title:d.querySelector('[data-demo-title]').textContent,w:d.querySelector('[data-dev]')?.clientWidth});d.close();await new Promise(r=>setTimeout(r,50));r[r.length-1].focusBack=document.activeElement===b}return r})()`);
  await ev(`document.querySelector('[data-demo-open=kampanijos]').click()`); await sleep(1200);
  await ev(`document.querySelector('[data-demo-dialog]').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=7400});1`);
  await shot('dlg-demo-390.png',false);
  await key('Escape');
  receipt.checks.demoEscFocus = await ev(`document.activeElement===document.querySelector('[data-demo-open=kampanijos]')`);
  // Carousel buttons at 1440
  await load(1440);
  receipt.checks.carousel = await ev(`(async()=>{const t=document.querySelector('[data-car-track]');const a=t.scrollLeft;document.querySelector('[data-car="1"]').click();await new Promise(r=>setTimeout(r,800));return {before:a,after:t.scrollLeft,max:t.scrollWidth-t.clientWidth,cards:t.children.length,imgsOk:[...t.querySelectorAll('img')].every(i=>i.naturalWidth>0)}})()`);
  receipt.checks.assets = await ev(`(async()=>{document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));return [...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)})()`);
  // Real clock playback: currentTime must advance in view, stop offscreen, and repeat its first frame.
  receipt.checks.playback = await ev(`(async()=>{const r=[];for(const s of document.querySelectorAll('[data-scene]')){s.scrollIntoView({block:'center',behavior:'instant'});await new Promise(r=>setTimeout(r,100));const a=s.getAnimations({subtree:true})[0];const start=a.currentTime;await new Promise(r=>setTimeout(r,400));const advances=a.currentTime>start+200;const T=a.effect.getTiming().duration;a.currentTime=300;const first=a.effect.getComputedTiming().progress;a.currentTime=T+300;const loops=Math.abs(a.effect.getComputedTiming().progress-first)<0.001;scrollTo({top:0,behavior:'instant'});await new Promise(r=>setTimeout(r,150));const off=a.currentTime;await new Promise(r=>setTimeout(r,150));r.push({kind:s.dataset.scene,advances,loops,offscreenPaused:a.currentTime===off})}return r})()`);
  // Reduced motion: static final scenes
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await load(1440);
  receipt.checks.reducedRunning = await ev(`document.querySelectorAll('.scn').length+':'+document.getAnimations().filter(a=>a.playState==='running').length`);
  for (const kind of Object.keys(times)) {
    const r = await ev(`(()=>{const s=document.querySelector('[data-scene=${kind}]');s.scrollIntoView({block:'center'});const b=s.getBoundingClientRect();return {x:b.left+scrollX,y:b.top+scrollY,width:b.width,height:b.height}})()`);
    await sleep(150); await shot(`reduced-${kind}.png`, r);
  }
  receipt.checks.callback = [];
  for (const w of [320, 390, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', {width:w,height:1000,deviceScaleFactor:1,mobile:w<600});
    await cdp('Page.navigate', {url:base+'pavyzdys/pokalbis'});await sleep(500);
    await ev('document.fonts.ready');
    receipt.checks.callback.push(await ev(`({w:innerWidth,noOverflow:document.documentElement.scrollWidth===innerWidth,noForm:document.forms.length===0,noScripts:document.scripts.length===0,noindex:document.querySelector('meta[name=robots]').content==='noindex,nofollow',unsent:document.body.innerText.includes('užklausa neišsiųsta'),proofColor:getComputedStyle(document.querySelector('.proof__big')).color})`));
    const height=await ev('document.documentElement.scrollHeight');
    await shot('callback-'+w+'.png',{x:0,y:0,width:w,height});
  }
  receipt.served = served; receipt.missing = [...new Set(missing)];
  ws.close();
} finally {
  chrome.kill('SIGKILL'); server.close();
  writeFileSync(join(out, 'receipt.json'), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ ...receipt, served: receipt.served?.length }, null, 1));
}

const checks = receipt.checks;
const failures = Object.entries(checks).filter(([k,v]) => ['menuOpen','menuEscFocus','menuCloseAlwaysOpener','bookOpen','bookEscFocus','bookFromMenu','demoEscFocus'].includes(k) && v !== true).map(([k])=>k);
if (checks.bookInvalid !== 'true') failures.push('bookInvalid');
if (!checks.bookPreview?.btnEnabled || !checks.bookPreview?.nextShown || !checks.bookPreview?.status.includes('neišsiųsta')) failures.push('bookPreview');
if (checks.demo?.length !== 5 || checks.demo.some(d=>!d.open || !d.focusBack)) failures.push('demo');
if (checks.playback?.length !== 5 || checks.playback.some(s=>!s.advances || !s.loops || !s.offscreenPaused)) failures.push('playback');
if (!checks.carousel?.imgsOk || checks.carousel.after <= checks.carousel.before || checks.carousel.cards !== 10) failures.push('carousel');
if (checks.assets?.length || receipt.missing.length || receipt.posts.length || receipt.blocked.length) failures.push('network/assets');
if (Object.values(receipt.overflow).some(v=>v.scrollW>v.W || v.bad.length)) failures.push('overflow');
if (checks.callback?.length !== 3 || checks.callback.some(c=>!c.noOverflow || !c.noForm || !c.noScripts || !c.noindex || !c.unsent || c.proofColor !== 'rgb(255, 255, 255)')) failures.push('callback');
if (checks.reducedRunning !== '5:0') failures.push('reducedRunning');
if (failures.length) { console.error('FAIL: '+failures.join(', ')); process.exitCode=1; }
else console.log('PASS: all focused browser acceptance checks');
