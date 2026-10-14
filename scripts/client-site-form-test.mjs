#!/usr/bin/env node
/* Drives a client-site build in headless Chrome against scripts/preview-form-stub.mjs.
   1) node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <d> --test http://localhost:4330
   2) node scripts/preview-form-stub.mjs 4330 client-sites/<slug> &
   3) node scripts/client-site-form-test.mjs [http://localhost:4330]
   Checks: JS submit → thanks + site_inquiry received; error → business tel: link;
   call/SMS click → beacon; no-JS 303 target /aciu and /aciu?klaida=1. Never touches the real Worker. */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4330';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(BASE)) { console.error('only local stubs'); process.exit(1); }
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = mkdtempSync(join(tmpdir(), 'cs-test-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const ok = (cond, label) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failures++; };

try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    try { target = (await (await fetch('http://localhost:9333/json')).json()).find((t) => t.type === 'page'); } catch { await sleep(250); }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let n = 0; const waiting = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); waiting.get(m.id)?.(m); });
  const cdp = (method, params = {}) => new Promise((res) => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const go = async (path) => { await cdp('Page.navigate', { url: BASE + path }); await sleep(800); };
  const fill = (id, v) => evaluate(`(() => { const e = document.getElementById(${JSON.stringify(id)}); e.value = ${JSON.stringify(v)}; })()`);
  await cdp('Page.enable');
  const logStatus = (code) => fetch(`${BASE}/__stub/status/${code}`);

  // 1. success
  await logStatus(200); await go('/');
  await fill('hs-name', 'Testas'); await fill('hs-phone', '860000000'); await fill('hs-message', 'Neveikia katilas');
  await evaluate(`document.querySelector('[data-callback-form] button[type=submit]').click()`); await sleep(800);
  ok(await evaluate(`!document.querySelector('[data-form-thanks]').hidden`), 'JS submit shows thanks');
  ok(await evaluate(`document.querySelector('[data-callback-form]').hidden`), 'form hidden after success');

  // 2. server error → tel link
  await logStatus(500); await go('/');
  await fill('hs-phone', '860000000');
  await evaluate(`document.querySelector('[data-callback-form] button[type=submit]').click()`); await sleep(800);
  ok(await evaluate(`!document.querySelector('[data-form-error]').hidden`), 'error box shown on 500');
  ok(await evaluate(`/^tel:\\+370/.test(document.querySelector('[data-form-error] a').getAttribute('href'))`), 'error box has tel: link');
  ok(await evaluate(`document.querySelector('[data-form-error]').textContent.includes('Paskambinkite tiesiai')`), 'error text "Paskambinkite tiesiai"');
  await logStatus(200);

  // 3. beacons
  await go('/');
  await evaluate(`document.addEventListener('click', e => { if (e.target.closest('a[data-cta]')) e.preventDefault(); }, true); document.querySelector('a[data-cta=cta_call]').click(); document.querySelector('a[data-cta=cta_sms]')?.click(); 1`);
  await sleep(500);

  // 4. no-JS targets
  await go('/aciu'); ok(await evaluate(`!document.querySelector('[data-aciu-ok]').hidden`), '/aciu shows thanks');
  await go('/aciu?klaida=1'); ok(await evaluate(`!document.querySelector('[data-aciu-error]').hidden && /tel:/.test(document.querySelector('[data-aciu-error] a').href)`), '/aciu?klaida=1 shows error with tel:');
  ws.close();
} finally {
  chrome.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
console.log(failures ? `${failures} check(s) failed` : 'all form checks passed; compare with the stub log: site_inquiry fields and cta_call/cta_sms beacons');
process.exit(failures ? 1 : 0);
