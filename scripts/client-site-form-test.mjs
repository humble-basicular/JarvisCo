#!/usr/bin/env node
/* Drives a client-site build in headless Chrome against scripts/preview-form-stub.mjs.
   1) node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <d> --test http://localhost:4330
   2) node scripts/preview-form-stub.mjs 4330 client-sites/<slug> &
   3) node scripts/client-site-form-test.mjs [http://localhost:4330]
   Checks: wire fields (kind, site, service, location, name, phone, message with
   boiler brand/code composed in, contact_time, files, empty honeypot); service
   preselect from "Užklausti"; upload list (adds to earlier picks, remove, per-file
   type/size errors, count and total limits) before sending; JS success → /aciu;
   error → input kept + business tel: link; call/SMS click → beacons; no-JS
   /aciu and /aciu?klaida=1 (also with script execution disabled); double submit
   → one request; mobile action bar hides while typing and over the form.
   Never touches the real Worker. */
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
const stub = async (path) => (await fetch(`${BASE}/__stub/${path}`)).json();
const count = async () => Number((await (await fetch(`${BASE}/__stub/count`)).text()).trim());

/* In-page helpers: files are made in the page and handed to the input the way a picker would (change event). */
const HELPERS = `
  window.__file = (name, type, size) => new File([new Uint8Array(size)], name, { type });
  window.__pick = (files) => { const i = document.getElementById('hs-files'); const dt = new DataTransfer(); files.forEach((f) => dt.items.add(f)); i.files = dt.files; i.dispatchEvent(new Event('change', { bubbles: true })); };
  window.__rows = () => [...document.querySelectorAll('[data-file-list] .hs-file')].map((li) => ({ name: li.querySelector('.hs-file__name').textContent, bad: li.classList.contains('is-bad'), err: li.querySelector('.hs-file__err')?.textContent ?? '' }));
  window.__submit = () => document.querySelector('[data-callback-form]').requestSubmit();
  window.__errorShown = () => !document.querySelector('[data-form-error]').hidden;
  1`;

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
  const go = async (path) => { await cdp('Page.navigate', { url: BASE + path }); await sleep(800); await evaluate(HELPERS); };
  const fill = (id, v) => evaluate(`(() => { const e = document.getElementById(${JSON.stringify(id)}); e.value = ${JSON.stringify(v)}; })()`);
  await cdp('Page.enable');
  const setStatus = (code) => fetch(`${BASE}/__stub/status/${code}`);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

  // 0. wire shape without JS: named fields only from the spec, honeypot present, files multiple and not camera-only
  await go('/');
  const names = await evaluate(`[...document.querySelector('[data-callback-form]').elements].map((e) => e.name).filter(Boolean)`);
  const wire = ['kind', 'site', 'website', 'service', 'location', 'name', 'phone', 'message', 'contact_time', 'files'];
  ok(names.every((x) => wire.includes(x)) && wire.every((x) => names.includes(x)), `only spec wire fields are named (${[...new Set(names)].join(',')})`);
  ok(await evaluate(`(() => { const i = document.getElementById('hs-files'); return i.multiple && !i.hasAttribute('capture') && /image\\/heic/.test(i.accept); })()`), 'files: multiple, HEIC accepted, camera + library (no capture)');
  ok(await evaluate(`[...document.querySelectorAll('#hs-service option')].length >= 3`), 'service select lists the site services');

  // 1. "Užklausti" preselects the service
  const preselected = await evaluate(`(() => { const a = document.querySelector('.hs-svc__ask[data-service]'); a.click(); return document.getElementById('hs-service').value === a.getAttribute('data-service'); })()`);
  ok(preselected, 'service link preselects the form select');

  // 2. upload list: second pick adds to the first, remove works, per-file errors before sending
  await evaluate(`__pick([__file('katilas.jpg', 'image/jpeg', 2000), __file('lentele.heic', '', 3000)])`);
  await evaluate(`__pick([__file('ekranas.png', 'image/png', 1500)])`);
  let rows = await evaluate(`__rows()`);
  ok(rows.length === 3 && rows.every((r) => !r.bad), `second pick keeps the first (3 files, HEIC without MIME type accepted): ${rows.map((r) => r.name)}`);
  await evaluate(`document.querySelectorAll('[data-file-list] .hs-file__rm')[1].click()`);
  rows = await evaluate(`__rows()`);
  ok(rows.length === 2 && !rows.some((r) => r.name === 'lentele.heic'), 'remove button drops one file');
  ok(await evaluate(`document.getElementById('hs-files').files.length === 2`), 'native input mirrors the list');
  await evaluate(`__pick([__file('didelis.jpg', 'image/jpeg', 11 * 1024 * 1024), __file('programa.exe', 'application/x-msdownload', 10)])`);
  rows = await evaluate(`__rows()`);
  ok(rows.find((r) => r.name === 'didelis.jpg')?.err.includes('10 MB') && rows.find((r) => r.name === 'programa.exe')?.err.includes('priimti'), 'oversize and wrong-type files flagged in the list');
  await fill('hs-phone', '860000000');
  let before = await count();
  await evaluate(`__submit()`); await sleep(300);
  ok(await evaluate(`__errorShown()`) && (await count()) === before, 'flagged files block sending (nothing posted)');
  await evaluate(`(() => { let b; while ((b = document.querySelector('[data-file-list] .is-bad .hs-file__rm'))) b.click(); })()`);
  await evaluate(`__pick(Array.from({ length: 7 }, (_, i) => __file('n' + i + '.jpg', 'image/jpeg', 100)))`);
  ok((await evaluate(`__rows()`)).filter((r) => r.bad).length === 1, '9th file flagged (limit 8)');
  await go('/');
  await evaluate(`__pick([0, 1, 2].map((i) => __file('d' + i + '.pdf', 'application/pdf', 9 * 1024 * 1024)))`);
  ok(await evaluate(`document.querySelector('[data-file-sum]').classList.contains('is-bad')`), 'total over 25 MB flagged');

  // 3. success: all fields reach the stub; brand + code are composed into message; → /aciu
  await setStatus(200); await go('/');
  await evaluate(`document.getElementById('hs-service').selectedIndex = 1`);
  const service = await evaluate(`document.getElementById('hs-service').value`);
  await fill('hs-location', 'Garliava'); await fill('hs-name', 'Testas'); await fill('hs-phone', '860000000');
  await fill('hs-message', 'Neveikia katilas'); await fill('hs-brand', 'Vaillant ecoTEC'); await fill('hs-code', 'F28');
  await evaluate(`document.getElementById('hs-time-evening').checked = true`);
  await evaluate(`__pick([__file('katilas.jpg', 'image/jpeg', 2000), __file('lentele.heic', 'image/heic', 3000)])`);
  before = await count();
  await evaluate(`document.querySelector('[data-callback-form] button[type=submit]').click()`); await sleep(1200);
  ok((await count()) === before + 1, 'one form post');
  const last = Object.groupBy(await stub('last'), ([k]) => k);
  const val = (k) => last[k]?.map(([, v]) => v);
  ok(val('kind')?.[0] === 'site_inquiry' && val('site')?.[0] === 'demo-silumos', 'kind=site_inquiry, site=<code>');
  ok(val('service')?.[0] === service && val('location')?.[0] === 'Garliava' && val('name')?.[0] === 'Testas' && val('phone')?.[0] === '860000000', 'service, location, name, phone sent');
  ok(val('message')?.[0]?.replace(/\r\n/g, '\n') === 'Katilo markė ir modelis: Vaillant ecoTEC\nKlaidos kodas: F28\n\nNeveikia katilas', `brand + code composed into message: ${JSON.stringify(val('message')?.[0])}`);
  ok(val('contact_time')?.[0] === 'evening', 'contact_time sent');
  ok(val('files')?.map((f) => f.name).join() === 'katilas.jpg,lentele.heic', 'both files sent as repeated "files" parts');
  ok(val('website')?.[0] === '', 'honeypot empty');
  ok(!last.brand && !last.code && !last.consent, 'no non-spec fields');
  ok(await evaluate(`location.pathname.replace(/\\/$/, '') === '/aciu' && !document.querySelector('[data-aciu-ok]').hidden`), 'JS success lands on /aciu with the thanks text');

  // 4. explicit rejection → input kept, tel link, retry possible
  await setStatus(400); await go('/');
  await fill('hs-phone', '860000000'); await fill('hs-message', 'Laša vanduo');
  await evaluate(`__pick([__file('nuotrauka.jpg', 'image/jpeg', 500)])`);
  await evaluate(`document.querySelector('[data-callback-form] button[type=submit]').click()`); await sleep(800);
  ok(await evaluate(`__errorShown()`), 'error box shown on 400');
  ok(await evaluate(`/^tel:\\+370/.test(document.querySelector('[data-form-error] a').getAttribute('href'))`), 'error box has tel: link');
  ok(await evaluate(`document.querySelector('[data-form-error]').textContent.includes('Paskambinkite tiesiai')`), 'error text "Paskambinkite tiesiai"');
  ok(await evaluate(`document.getElementById('hs-phone').value === '860000000' && document.getElementById('hs-message').value === 'Laša vanduo' && __rows().length === 1 && !document.querySelector('[data-callback-form] button[type=submit]').disabled`), 'text and files kept, button enabled for a retry');
  await setStatus(200);

  await setStatus(500);
  await evaluate(`__submit()`); await sleep(800);
  ok(await evaluate(`__errorShown() && document.querySelector('[data-callback-form] button[type=submit]').disabled && document.querySelector('[data-form-error-text]').textContent.includes('ar užklausa gauta')`), '500 is uncertain, repeat POST blocked');
  await setStatus(200);

  // 5. beacons
  await go('/');
  const seen = (await stub('beacons')).length;
  await evaluate(`document.addEventListener('click', e => { if (e.target.closest('a[href^="tel:"], a[href^="sms:"]')) e.preventDefault(); }, true); document.querySelector('a[data-cta=cta_call]').click(); document.querySelector('a[data-cta=cta_sms]')?.click(); 1`);
  await sleep(500);
  const sent = (await stub('beacons')).slice(seen).map((b) => JSON.parse(b));
  const hasSms = await evaluate(`!!document.querySelector('a[data-cta=cta_sms]')`);
  ok(sent.some((b) => b.type === 'cta_call' && b.site === 'demo-silumos') && (!hasSms || sent.some((b) => b.type === 'cta_sms')), `beacons ${sent.map((b) => b.type)}`);

  // 6. mobile action bar: hidden while typing and while the form is on screen, never over submit
  await go('/');
  ok(await evaluate(`!document.querySelector('[data-dock]').classList.contains('is-hidden')`), 'action bar visible at the top');
  await evaluate(`document.getElementById('hs-phone').focus()`); await sleep(300);
  ok(await evaluate(`document.querySelector('[data-dock]').classList.contains('is-hidden')`), 'action bar hides while a field has focus');
  await evaluate(`document.getElementById('hs-phone').blur(); document.querySelector('[data-callback-form] button[type=submit]').scrollIntoView({ block: 'end' })`); await sleep(500);
  ok(await evaluate(`(() => { const d = document.querySelector('[data-dock]'); const b = document.querySelector('[data-callback-form] button[type=submit]').getBoundingClientRect(); return d.classList.contains('is-hidden') || d.getBoundingClientRect().top >= b.bottom; })()`), 'action bar does not cover the submit button');
  ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'no horizontal overflow at 390 px');

  // 7. no-JS targets
  await evaluate(`sessionStorage.clear()`);
  await go('/aciu'); ok(await evaluate(`!document.querySelector('[data-aciu-neutral]').hidden`), 'direct /aciu without receipt stays neutral');
  await go('/aciu?klaida=1'); ok(await evaluate(`!document.querySelector('[data-aciu-error]').hidden && /tel:/.test(document.querySelector('[data-aciu-error] a').href)`), '/aciu?klaida=1 shows error with tel:');
  // JavaScript disabled: static /aciu must not claim success (also with ?klaida=1), and must offer the tel: link
  await cdp('Emulation.setScriptExecutionDisabled', { value: true });
  for (const path of ['/aciu', '/aciu?klaida=1']) {
    await go(path);
    ok(await evaluate(`!document.querySelector('[data-aciu-neutral]').hidden && document.querySelector('[data-aciu-ok]').hidden && document.querySelector('[data-aciu-error]').hidden`), `no-JS ${path}: only the neutral text is visible`);
    ok(await evaluate(`/^tel:\\+370/.test(document.querySelector('[data-aciu-neutral] a').getAttribute('href')) && !/gauta/i.test(document.body.innerText)`), `no-JS ${path}: tel: link, no "gauta"`);
  }
  await go('/');
  ok(await evaluate(`(() => { const i = document.getElementById('hs-files'); return i.getBoundingClientRect().width > 50; })()`), 'no-JS: native file input visible');
  await cdp('Emulation.setScriptExecutionDisabled', { value: false });

  // 8. double submit → one request (the stub counts form posts)
  await setStatus(200); await go('/');
  await fill('hs-phone', '860000000');
  before = await count();
  await evaluate(`(() => { const f = document.querySelector('[data-callback-form]'); f.requestSubmit(); f.requestSubmit(); })()`); await sleep(800);
  ok((await count()) - before === 1, 'two rapid submits → one request');

  // 9. file set without a change event is still checked before fetch
  await go('/');
  await fill('hs-phone', '860000000');
  const rejected = await evaluate(`(() => { const i = document.getElementById('hs-files'); const dt = new DataTransfer(); dt.items.add(new File(['x'], 'a.exe', { type: 'application/x-msdownload' })); i.files = dt.files; __submit(); return new Promise(r => setTimeout(() => r(__errorShown() && /priimti/.test(document.querySelector('[data-form-error-text]').textContent)), 300)); })()`);
  ok(rejected, 'disallowed file type is rejected before sending');
  ws.close();
} finally {
  chrome.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
console.log(failures ? `${failures} check(s) failed` : 'all form checks passed');
process.exit(failures ? 1 : 0);
