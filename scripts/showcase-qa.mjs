#!/usr/bin/env node
/* Local browser QA for the hero + showcase (hero plan §8). Headless Chrome, loopback
   only; every /t/* request (form + beacons) and all https is blocked, so nothing
   leaves the machine. node scripts/showcase-qa.mjs http://127.0.0.1:<port> <out-dir>
   Per route × width (390, 1440), plus hero-only shots at 768/1024/1280/1920: horizontal overflow, every image decoded, layout
   shift after load, hero image attributes, console errors, full-page screenshot.
   Then the motion rules on / : reduced motion = static phone, no tall download,
   no pause control; otherwise the scroll runs and the checkbox pauses it.
   Writes <out-dir>/qa.json and PNGs; the Chrome profiles stay in <out-dir>. */
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [baseArg, outArg] = process.argv.slice(2);
if (!baseArg || !outArg) { console.error('usage: showcase-qa.mjs http://127.0.0.1:<port> <out-dir>'); process.exit(1); }
const base = new URL(baseArg);
if (!['127.0.0.1', 'localhost'].includes(base.hostname)) throw new Error('Only a loopback preview is allowed');
const out = resolve(outArg);
const ROUTES = ['/', '/sildymui', '/pavyzdys/sildymas'];
const WIDTHS = [390, 1440];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const expect = (ok, message) => { if (!ok) failures.push(message); return ok; };

// Two browsers: the reduced-motion one gets the browser-level flag, because CDP media
// emulation is not seen by the HTML preload scanner (it fetched the tall capture).
const browsers = [];
async function launch(name, flags = []) {
  const profile = join(out, `chrome-profile${name ? `-${name}` : ''}`);
  mkdirSync(profile, { recursive: true });
  const chrome = spawn(process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', ...flags, `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const b = { chrome, consoleErrors: [], requests: [] };
  browsers.push(b);
  let stderr = '';
  const endpoint = await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('Chrome startup timed out')), 15000);
    chrome.on('error', rej);
    chrome.stderr.on('data', (c) => { stderr += c; const m = stderr.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(new URL(m[1]).origin.replace('ws:', 'http:')); } });
  });
  const target = (await (await fetch(`${endpoint}/json/list`)).json()).find((t) => t.type === 'page');
  const ws = b.ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let seq = 0; const pending = new Map();
  ws.addEventListener('message', ({ data }) => {
    const m = JSON.parse(data);
    if (m.method === 'Runtime.exceptionThrown') b.consoleErrors.push(m.params.exceptionDetails.text);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/ERR_BLOCKED_BY_CLIENT|net::ERR_BLOCKED/.test(m.params.entry.text)) b.consoleErrors.push(m.params.entry.text);
    if (m.method === 'Network.requestWillBeSent') b.requests.push({ url: m.params.request.url, initiator: m.params.initiator.type });
    const p = pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  });
  b.cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  b.evaluate = async (expression) => { const r = await b.cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };
  await b.cdp('Page.enable'); await b.cdp('Runtime.enable'); await b.cdp('Log.enable'); await b.cdp('Network.enable');
  await b.cdp('Network.setBlockedURLs', { urls: ['http://*/t/*', 'https://*'] });
  await b.cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });' });
  b.open = async (route, width) => {
    await b.cdp('Emulation.setDeviceMetricsOverride', { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: width < 600 });
    b.requests.length = 0; b.consoleErrors.length = 0;
    await b.cdp('Page.navigate', { url: new URL(route, base).href });
    await sleep(1500);
    await b.evaluate('document.fonts.ready.then(() => true)');
  };
  return b;
}
try {
  const main = await launch('');
  await main.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  const still = await launch('reduce', ['--force-prefers-reduced-motion']);
  const { cdp, evaluate, consoleErrors } = main;
  const report = { base: base.origin, at: new Date().toISOString(), pages: [], motion: {} };

  for (const route of ROUTES) for (const width of WIDTHS) {
    await main.open(route, width);
    const clsAfterLoad = await evaluate('window.__cls');
    const hero = await evaluate(`(() => { const i = document.querySelector('.hero__object img'); return i && { loading: i.loading, fetchpriority: i.getAttribute('fetchpriority'), w: i.getAttribute('width'), h: i.getAttribute('height'), src: i.currentSrc.split('/').pop(), box: i.getBoundingClientRect().toJSON() }; })()`);
    const page = await evaluate(`(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 500) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 40)); }
      const settle = (i) => Promise.race([i.decode().catch(() => {}), new Promise((r) => setTimeout(r, 3000))]);
      await Promise.all([...document.images].map(settle));
      scrollTo({ top: 0, behavior: 'instant' });
      const visible = (el) => getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
      const broken = [...document.images].filter((i) => visible(i) && !(i.complete && i.naturalWidth > 0)).map((i) => i.currentSrc || i.src);
      const wide = [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1) && !el.closest('.hero__object'); }).slice(0, 5).map((el) => el.className || el.tagName);
      return { height: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth - innerWidth, broken, wide, images: document.images.length };
    })()`);
    const cls = await evaluate('window.__cls');
    const name = `${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}-${width}`;
    // Full page in 4000 px slices (one huge surface repeats compositor tiles), stitched.
    const slices = [];
    for (let y = 0; y < page.height; y += 4000) {
      const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width, height: Math.min(4000, page.height - y), scale: 1 } });
      const file = join(out, `${name}-part${slices.length}.png`);
      writeFileSync(file, Buffer.from(shot.data, 'base64'));
      slices.push(file);
    }
    const full = join(out, `${name}-full.png`);
    execFileSync('/opt/homebrew/bin/magick', [...slices, '-append', full]);
    const entry = { route, width, ...page, clsAfterLoad, cls, hero, consoleErrors: [...consoleErrors], screenshot: full };
    report.pages.push(entry);
    expect(page.overflowX <= 0, `${name}: horizontal overflow ${page.overflowX}px`);
    expect(page.broken.length === 0, `${name}: images not decoded ${page.broken}`);
    expect(cls < 0.01, `${name}: layout shift ${cls}`);
    expect(consoleErrors.length === 0, `${name}: console errors ${consoleErrors}`);
    if (route !== '/pavyzdys/sildymas') expect(hero && hero.loading === 'eager' && hero.fetchpriority === 'high' && hero.w === '1536' && hero.h === '1024' && /^a1-knolling-finished\.[\w-]+\.avif$/.test(hero.src), `${name}: hero image attributes ${JSON.stringify(hero)}`);
    console.log(`${name}: ${page.height}px, overflow ${page.overflowX}, broken ${page.broken.length}, CLS ${cls.toFixed(4)}`);
  }

  for (const width of WIDTHS) {
    await still.open('/', width);
    expect(await still.evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'), 'reduce browser does not report reduced motion');
    await still.evaluate(`(async () => { const s = document.querySelector('.sc'); scrollTo({ top: s.getBoundingClientRect().top + scrollY - 80, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 1200)); })()`);
    const reduce = await still.evaluate(`(() => { const t = document.querySelector('.sc__tall'), s = document.querySelector('.sc__static'); return { tallSrc: t.querySelector('img').currentSrc.slice(0, 22), tallDisplay: getComputedStyle(t).display, staticVisible: s.complete && s.naturalWidth > 0 && getComputedStyle(s).display !== 'none', pause: getComputedStyle(document.querySelector('.sc__pause')).display, toggle: getComputedStyle(document.querySelector('.sc__toggle')).display, revealHidden: [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity !== '1').length }; })()`);
    reduce.tallRequested = still.requests.filter((r) => r.url.includes('heating-mobile-tall'));
    writeFileSync(join(out, `motion-reduce-${width}.png`), Buffer.from((await still.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
    expect(reduce.tallDisplay === 'none' && reduce.staticVisible && reduce.tallRequested.length === 0 && reduce.pause === 'none' && reduce.toggle === 'none', `reduce ${width}: ${JSON.stringify(reduce)}`);

    await main.open('/', width);
    await evaluate(`(async () => { const s = document.querySelector('.sc'); scrollTo({ top: s.getBoundingClientRect().top + scrollY - 80, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 1500)); await document.querySelector('.sc__tall img').decode(); })()`);
    const motion = await evaluate(`(async () => {
      const t = document.querySelector('.sc__tall');
      const y = () => new DOMMatrix(getComputedStyle(t).transform).m42;
      const anim = getComputedStyle(t).animationName;
      await new Promise((r) => setTimeout(r, 5000)); const y0 = y(); await new Promise((r) => setTimeout(r, 3000)); const y1 = y();
      document.querySelector('.sc__pause').click();
      await new Promise((r) => setTimeout(r, 300));
      const state = getComputedStyle(t).animationPlayState;
      const p0 = y(); await new Promise((r) => setTimeout(r, 1500)); const p1 = y();
      document.querySelector('.sc__pause').click();
      return { anim, moved: y1 - y0, pausedState: state, movedWhilePaused: p1 - p0, checkedAfterTwoClicks: document.getElementById('sc-pause').checked };
    })()`);
    writeFileSync(join(out, `motion-scroll-${width}.png`), Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
    expect(motion.anim === 'sc-scroll' && motion.moved < -1 && motion.pausedState === 'paused' && motion.movedWhilePaused === 0 && motion.checkedAfterTwoClicks === false, `motion ${width}: ${JSON.stringify(motion)}`);
    report.motion[width] = { reduce, motion };
    console.log(`motion ${width}: reduce ${JSON.stringify(reduce)} · scroll ${JSON.stringify(motion)}`);
  }
  // Hero at the in-between widths (the copy overlaps the photo's empty corner from 80rem).
  report.heroWidths = [];
  for (const route of ['/', '/sildymui']) for (const width of [768, 1024, 1280, 1920]) {
    await main.open(route, width);
    await sleep(1200);
    const name = `hero-${route === '/' ? 'home' : 'sildymui'}-${width}`;
    const h = await evaluate(`(() => { const r = document.querySelector('.hero').getBoundingClientRect(); return { height: r.height, overflowX: document.documentElement.scrollWidth - innerWidth }; })()`);
    const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.ceil(h.height) + 64, scale: 1 } });
    writeFileSync(join(out, `${name}.png`), Buffer.from(shot.data, 'base64'));
    expect(h.overflowX <= 0, `${name}: horizontal overflow ${h.overflowX}px`);
    report.heroWidths.push({ route, width, ...h, screenshot: join(out, `${name}.png`) });
  }
  report.blockedTrafficPatterns = ['http://*/t/*', 'https://*'];
  report.failures = failures;
  writeFileSync(join(out, 'qa.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(failures.length ? `FAILED\n${failures.join('\n')}` : 'showcase-qa: all checks pass');
  process.exitCode = failures.length ? 1 : 0;
} finally {
  for (const b of browsers) { b.ws?.close(); b.chrome.kill(); }
}
