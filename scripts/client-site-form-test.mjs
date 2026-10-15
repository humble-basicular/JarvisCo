#!/usr/bin/env node
/* Drives a client-site build in headless Chrome against scripts/preview-form-stub.mjs.
   1) node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <d> --test http://localhost:4330
   2) node scripts/preview-form-stub.mjs 4330 client-sites/<slug> &
   3) node scripts/client-site-form-test.mjs [http://localhost:4330]
   Checks: JS submit → thanks + site_inquiry received; error → business tel: link;
   call/SMS click → beacon; no-JS 303 target /aciu and /aciu?klaida=1 (also with script execution disabled);
   double submit → one request; disallowed file refused client-side. Never touches the real Worker. */
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
  // 5. JavaScript disabled: static /aciu must not claim success (also with ?klaida=1), and must offer the tel: link
  await cdp('Emulation.setScriptExecutionDisabled', { value: true });
  for (const path of ['/aciu', '/aciu?klaida=1']) {
    await go(path);
    ok(await evaluate(`!document.querySelector('[data-aciu-neutral]').hidden && document.querySelector('[data-aciu-ok]').hidden && document.querySelector('[data-aciu-error]').hidden`), `no-JS ${path}: only the neutral text is visible`);
    ok(await evaluate(`/^tel:\\+370/.test(document.querySelector('[data-aciu-neutral] a').getAttribute('href')) && !/gauta/i.test(document.body.innerText)`), `no-JS ${path}: tel: link, no "gauta"`);
  }
  await cdp('Emulation.setScriptExecutionDisabled', { value: false });

  // 6. double submit → one request (the stub counts form posts)
  await logStatus(200); await go('/');
  await fill('hs-phone', '860000000');
  const before = Number((await (await fetch(`${BASE}/__stub/count`)).text()).trim());
  await evaluate(`(() => { const f = document.querySelector('[data-callback-form]'); f.requestSubmit(); f.requestSubmit(); })()`); await sleep(800);
  const after = Number((await (await fetch(`${BASE}/__stub/count`)).text()).trim());
  ok(after - before === 1, 'two rapid submits → one request');

  // 7. file validation happens before fetch
  await go('/');
  await fill('hs-phone', '860000000');
  const rejected = await evaluate(`(() => { const i = document.getElementById('hs-files'); const dt = new DataTransfer(); dt.items.add(new File(['x'], 'a.exe', { type: 'application/x-msdownload' })); i.files = dt.files; document.querySelector('[data-callback-form]').requestSubmit(); return new Promise(r => setTimeout(() => r(!document.querySelector('[data-form-error]').hidden && /priimti/.test(document.querySelector('[data-form-error-text]').textContent)), 300)); })()`);
  ok(rejected, 'disallowed file type is rejected before sending');
  ws.close();
} finally {
  chrome.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
console.log(failures ? `${failures} check(s) failed` : 'all form checks passed; compare with the stub log: site_inquiry fields and cta_call/cta_sms beacons');
process.exit(failures ? 1 : 0);
