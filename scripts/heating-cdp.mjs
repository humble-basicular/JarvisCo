/* Headless Chrome over the DevTools protocol for the heating scripts
   (heating-shots.mjs, heating-contract-test.mjs), plus a tiny static file
   server for built client sites. Local URLs only. The temporary Chrome
   profile is left in the OS temp folder instead of being removed. */
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Starts Chrome, returns { cdp, evaluate, open, close, profile }. */
export async function chrome() {
  const port = 9300 + Math.floor(Math.random() * 400);
  const profile = mkdtempSync(join(tmpdir(), 'heating-cdp-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch { await sleep(250); }
  }
  if (!target) { proc.kill(); throw new Error('Chrome did not start'); }
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
  const evaluate = async (expression) => {
    const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  await cdp('Page.enable');
  /** Emulates the viewport, loads the URL and waits for load + fonts. */
  const open = async (url, { width, height, dpr = 1, mobile = false }) => {
    if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+\//.test(url)) throw new Error(`local URLs only: ${url}`);
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile });
    await cdp('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await cdp('Page.navigate', { url });
    await sleep(400);
    await evaluate('new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r)))');
    await evaluate('document.fonts.ready.then(() => true)');
  };
  const close = () => { ws.close(); proc.kill(); };
  return { cdp, evaluate, open, close, profile };
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
/** Serves a directory (GET only) on a free localhost port: { origin, close }. */
export async function serve(dir) {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (path.endsWith('/')) path += 'index.html';
    const file = join(root, path);
    try {
      if (!file.startsWith(root)) throw new Error('outside');
      const target = (await stat(file)).isDirectory() ? join(file, 'index.html') : file;
      res.writeHead(200, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' });
      res.end(await readFile(target));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

// In-page audit: each element with its own text, its colour against the first opaque
// background behind it (alpha blended); 4.5:1, or 3:1 for large text (≥ 24px, or ≥ 18.66px bold).
// Line icons on the colour field are checked as graphics (3:1).
export const CONTRAST_AUDIT = `(() => {
  const parse = (c) => { let m = c.match(/^rgba?\\(([^)]+)\\)/); if (m) { const p = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }
    m = c.match(/^color\\(srgb ([^)]+)\\)/); if (m) { const p = m[1].split(/[\\s\\/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1]; } return null; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const blend = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  const bgOf = (el) => { const layers = []; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let bg = [255, 255, 255]; for (const c of layers.reverse()) bg = blend(c, bg); return bg; };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && !el.closest('.hs-vh, .hs-hp, [hidden], option, .hs-dock.is-hidden'); };
  const fails = []; let checked = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (!/\\S/.test([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('')) || !visible(el)) continue;
    const s = getComputedStyle(el); const size = parseFloat(s.fontSize); const large = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700);
    const bg = bgOf(el); const fg = parse(s.color); const r = ratio(blend(fg, bg), bg); checked++;
    if (r < (large ? 3 : 4.5)) fails.push((el.className || el.tagName) + ' "' + el.textContent.trim().slice(0, 30) + '" ' + r.toFixed(2));
  }
  for (const el of document.querySelectorAll('.hs-routes__ico, .hs-hero .hs-ico, .hs-top__call .hs-ico')) {
    if (!visible(el)) continue; const s = getComputedStyle(el); const r = ratio(parse(s.stroke === 'none' ? s.color : s.stroke), bgOf(el)); checked++;
    if (r < 3) fails.push('icon ' + el.getAttribute('class') + ' ' + r.toFixed(2));
  }
  return { checked, fails, on: getComputedStyle(document.documentElement).getPropertyValue('--hs-on-accent').trim() };
})()`;
