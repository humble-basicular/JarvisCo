/* Minimal headless-Chrome/CDP helper for the local checks: isolated temp profile, DNS-blocked except 127.0.0.1,
   plus a path-guarded static server for the approved site copy. Never touches the user's Chrome profile. */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';

const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

export async function staticServer(root) {
  const server = createServer((q, r) => {
    let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = normalize(join(root, p));
    if (!f.startsWith(root + '/') || !existsSync(f) || !statSync(f).isFile()) { r.statusCode = 404; return r.end(); }
    r.setHeader('content-type', MIME[f.slice(f.lastIndexOf('.'))] ?? 'application/octet-stream'); r.end(readFileSync(f));
  }).listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

export async function startChrome() {
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
  return { cdp, ev, events, sleep, close: () => chrome.kill() };
}

/** Pixel rows of a PNG (base64) as {w,h,data(Uint8 RGBA as base64)} decoded in an about:blank page. */
export async function decodePng(b, base64) {
  await b.cdp('Page.navigate', { url: 'about:blank' }); await b.sleep(80);
  return b.ev(`(async()=>{const i=new Image();await new Promise(r=>{i.onload=r;i.src='data:image/png;base64,'+${JSON.stringify(base64)}});const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const t=c.getContext('2d');t.drawImage(i,0,0);window.__px=t.getImageData(0,0,i.width,i.height).data;window.__w=i.width;return {w:i.width,h:i.height}})()`);
}
