/* Headless Chrome (isolated temp profile, DNS-blocked for everything except 127.0.0.1) comparison of the approved static
   site vs the WordPress preview render, plus a real-browser form check.
   node src/wordpress-theme/tests/visual-acceptance.mjs <outDir> */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';
import { ACCEPTANCE, BASE, THEME, UUID, auth, previewQuery as pq } from './wp-fixture.mjs';
// Same as the real Customizer iframe: a messenger channel makes core hide the admin bar (no avatar/gravatar request).
const previewQuery = () => pq({ customize_messenger_channel: 'preview-0' });

const OUT = process.argv[2]; mkdirSync(join(OUT, 'screens'), { recursive: true });
const SITE = join(ACCEPTANCE, '..', 'candidate', 'input', 'site');
const ROUTES = ['', 'aciu', 'avizieniai', 'juodsiliai', 'lentvaris', 'maisiagala', 'nemencine', 'pagiriai', 'privatumo-politika', 'riese', 'rudamina', 'trakai', 'vilnius'];
const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const baseline = createServer((q, r) => { // static copy of the approved site, path-guarded
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = normalize(join(SITE, p)); if (!f.startsWith(SITE + '/') || !existsSync(f) || !statSync(f).isFile()) { r.statusCode = 404; return r.end(); }
  r.setHeader('content-type', MIME[f.slice(f.lastIndexOf('.'))] ?? 'application/octet-stream'); r.end(readFileSync(f));
}).listen(0, '127.0.0.1');
await new Promise((r) => baseline.once('listening', r));
const SB = `http://127.0.0.1:${baseline.address().port}`;
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'vl-chrome-'))}`, '--no-first-run', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch { await sleep(250); } }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const waiting = new Map(); const events = [];
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id) waiting.get(m.id)?.(m); else events.push(m); });
const cdp = (method, params = {}) => new Promise((res) => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expression) => { const r = (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result; if (r.exceptionDetails) throw new Error('page eval failed: ' + JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 300)); return r.result.value; };
await cdp('Network.enable'); await cdp('Page.enable');
await cdp('Network.setCookies', { cookies: Object.entries(auth.cookies).map(([name, value]) => ({ name, value, url: BASE })) });
const requested = new Set(); // every URL the page tried to fetch
const nonGet = [];
const report = { viewports: {}, form: null, external: [], assets: {} };

let framed = false; // WordPress preview is shown inside a same-origin iframe, exactly like the Customizer (core hides the admin bar then)
async function load(url, width, frame = false) {
  events.length = 0; framed = frame;
  await cdp('Emulation.setDeviceMetricsOverride', { width, height: width < 600 ? 800 : 900, deviceScaleFactor: 1, mobile: width < 600 });
  if (frame) {
    await cdp('Page.navigate', { url: BASE + '/robots.txt' }); await sleep(500);
    await ev(`(async()=>{document.documentElement.innerHTML='<head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe id="vlf" style="border:0;display:block;width:100%;height:900px"></iframe></body>';const f=document.getElementById('vlf');await new Promise(r=>{f.onload=r;f.src=${JSON.stringify(url)}});})()`);
    await sleep(1500);
  } else { await cdp('Page.navigate', { url }); await sleep(1500); }
  await ev(FR(`(async()=>{await document.fonts.ready; for(let y=0;y<document.documentElement.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} scrollTo(0,0); await Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))); await new Promise(r=>setTimeout(r,300));})()`));
  if (frame) await ev(`(()=>{const f=document.getElementById('vlf');f.style.height=f.contentDocument.documentElement.scrollHeight+'px'})()`);
  for (const m of events) if (m.method === 'Network.requestWillBeSent') { const u = m.params.request.url; requested.add(u); if (m.params.request.method !== 'GET') nonGet.push(u); }
}
// Run an expression against the framed document when the WordPress preview is framed.
const FR = (x) => (framed ? `(()=>{const D__=document.getElementById('vlf').contentDocument,W__=document.getElementById('vlf').contentWindow;return ${x.replace(/\bdocument\./g, 'D__.').replace(/\bgetComputedStyle\(/g, 'W__.getComputedStyle(').replace(/\bscrollTo\(/g, 'W__.scrollTo(').replace(/\blocation\b/g, 'W__.location').replace(/\bsetTimeout\b/g, 'W__.setTimeout')}})()` : x);
const metrics = () => ev(FR(`(()=>{const W=document.documentElement.clientWidth;
 const off=[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.right>W+1&&getComputedStyle(e).position!=='fixed'&&!e.closest('.v3-reviews__list')&&!e.matches('.v3-hero__bg')}).length;
 return {W,sw:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),h:document.documentElement.scrollHeight,off,
 text:document.body.innerText.replace(/\\s+/g,' ').trim(),
 imgs:[...document.images].map(i=>[i.currentSrc.split('/').pop(),i.naturalWidth]),
 badImgs:[...document.images].filter(i=>!i.naturalWidth).length,
 fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+' '+f.weight).sort(),
 fontsNotLoaded:[...document.fonts].filter(f=>f.status==='error').length,
 opacity:getComputedStyle(document.documentElement).opacity,adminBar:!!document.getElementById('wpadminbar'),url:location.href.replace(/customize_[a-z_]+=[^&]*/g,'…')}})()`));
const shot = async (file, h) => { const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: (await metrics()).W, height: h, scale: 1 } }); writeFileSync(join(OUT, 'screens', file), Buffer.from(r.result.data, 'base64')); return r.result.data; };

for (const width of [360, 1440]) {
  report.viewports[width] = {};
  for (const route of ROUTES) {
    const path = route ? `/${route}/` : '/';
    await load(SB + path, width); const a = await metrics();
    const ha = Math.min(a.h, 20000); const pa = await shot(`${route || 'home'}-${width}-original.png`, ha);
    await load(BASE + path + '?' + previewQuery(), width, true); const b = await metrics();
    const pb = await shot(`${route || 'home'}-${width}-wordpress.png`, Math.min(b.h, 20000));
    await cdp('Emulation.setDeviceMetricsOverride', { width: 100, height: 100, deviceScaleFactor: 1, mobile: false });
    const diff = await (async () => { // pixel diff in-page, data: URLs do not taint the canvas
      await cdp('Page.navigate', { url: 'about:blank' }); await sleep(100);
      return ev(`(async()=>{const L=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+s});
       const [x,y]=await Promise.all([L(${JSON.stringify(pa)}),L(${JSON.stringify(pb)})]);const w=Math.max(x.width,y.width),h=Math.max(x.height,y.height);
       const d=i=>{const c=document.createElement('canvas');c.width=w;c.height=h;const t=c.getContext('2d');t.drawImage(i,0,0);return t.getImageData(0,0,w,h).data};
       const A=d(x),B=d(y);let bad=0;for(let k=0;k<A.length;k+=4){if(Math.abs(A[k]-B[k])+Math.abs(A[k+1]-B[k+1])+Math.abs(A[k+2]-B[k+2])>30)bad++}
       return {sizeOriginal:[x.width,x.height],sizeWordPress:[y.width,y.height],diffPixels:bad,diffRatio:+(bad/(w*h)).toFixed(5)}})()`);
    })();
    report.viewports[width][route || 'home'] = {
      overflowOriginal: a.sw > a.W || a.off > 0, overflowWordPress: b.sw > b.W || b.off > 0,
      textEqual: a.text === b.text, adminBar: b.adminBar, loadedUrl: b.url, firstTextDiff: a.text === b.text ? null : (() => { let i = 0; while (a.text[i] === b.text[i]) i++; return [a.text.slice(i, i + 60), b.text.slice(i, i + 60)]; })(), badImgs: b.badImgs, imagesEqual: JSON.stringify(a.imgs) === JSON.stringify(b.imgs), badImagesWordPress: b.badImgs,
      fontsLoadedEqual: JSON.stringify(a.fonts.filter((f) => !/Fallback/.test(f))) === JSON.stringify(b.fonts.filter((f) => !/Fallback/.test(f))), // local() metric-fallback faces load on demand and are not asset checks
      fontsLoaded: b.fonts, fontsLoadedOriginal: a.fonts, fontErrors: b.fontsNotLoaded, htmlOpacity: b.opacity, ...diff,
    };
  }
}

// Real-browser form interaction in the WordPress preview: no request of any kind may leave for a form.
await load(BASE + '/?' + previewQuery(), 360, true);
nonGet.length = 0; const before = requested.size;
await ev(FR(`(()=>{const f=document.querySelector('form[data-callback-form]');f.querySelector('[name=phone]').value='+37060000000';f.querySelector('[name=message]').value='test';f.requestSubmit();})()`));
await sleep(800);
report.form = await ev(FR(`(()=>{const f=document.querySelector('form[data-callback-form]');const e=f.querySelector('[data-form-error]');return {noticeVisible:!e.hidden,notice:e.querySelector('[data-form-error-text]').textContent,action:f.getAttribute('action').replace(/customize_[a-z_]+=[^&]*/g,'…'),buttonText:f.querySelector('button[type=submit]').textContent.trim(),buttonDisabled:f.querySelector('button[type=submit]').disabled,url:location.pathname}})()`));
report.form.newRequestsAfterSubmit = [...requested].slice(before); report.form.nonGetRequests = nonGet.length;
report.external = [...requested].filter((u) => !/^(http:\/\/127\.0\.0\.1|data:|blob:|about:)/.test(u));
writeFileSync(join(OUT, 'visual-acceptance-report.json'), JSON.stringify(report, null, 2));
const bad = [];
for (const [w, rs] of Object.entries(report.viewports)) for (const [r, m] of Object.entries(rs)) { if (m.overflowWordPress || !m.textEqual || !m.imagesEqual || m.badImagesWordPress || !m.fontsLoadedEqual || m.fontErrors || m.htmlOpacity !== '1') bad.push(`${w}/${r}`); }
console.log(JSON.stringify({ routes: ROUTES.length * 2, problems: bad, maxDiffRatio: Math.max(...Object.values(report.viewports).flatMap((rs) => Object.values(rs).map((m) => m.diffRatio))), form: report.form, externalRequests: report.external.length }, null, 1));
chrome.kill(); baseline.close(); process.exit(bad.length || report.external.length || report.form.newRequestsAfterSubmit.length ? 1 : 0);
