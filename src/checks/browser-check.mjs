// Local acceptance only: headless Chrome, every fetch/beacon stubbed before page scripts.
// Usage: npm run check:browser -- http://127.0.0.1:4335 [receipt.json]
// CHROME_PATH may override the locally installed Chrome executable. No real form POSTs.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:4335');
assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Only a loopback preview is allowed');
const profile = mkdtempSync(join(tmpdir(), 'jarvis-v4-browser-'));
const chrome = spawn(process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let ws;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let stderr = '';
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 15000);
    chrome.on('error', reject);
    chrome.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timeout); resolve(new URL(match[1]).origin.replace('ws:', 'http:')); }
    });
  });
  const targets = await (await fetch(`${endpoint}/json/list`)).json();
  const target = targets.find((t) => t.type === 'page');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  let seq = 0;
  const pending = new Map();
  ws.addEventListener('message', ({ data }) => {
    const reply = JSON.parse(data);
    const p = pending.get(reply.id);
    if (p) { clearTimeout(p.timeout); pending.delete(reply.id); reply.error ? p.reject(new Error(JSON.stringify(reply.error))) : p.resolve(reply.result); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
    pending.set(id, { resolve, reject, timeout });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send('Page.enable');
  await send('Network.enable');
  // A second barrier: external network URLs are blocked, even if a page bypasses fetch.
  await send('Network.setBlockedURLs', { urls: ['https://*', 'http://jarvisweb.lt/*', 'http://www.jarvisweb.lt/*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__posts = [];
    window.fetch = async (url, options = {}) => {
      if (options.method === 'POST') {
        window.__posts.push({ url: String(url), entries: [...options.body.entries()] });
      }
      return new Response(JSON.stringify({ok:true}), {status:200,headers:{'Content-Type':'application/json'}});
    };
    navigator.sendBeacon = () => true;
  ` });
  const receipts = [];
  for (const route of ['/', '/sildymui', '/noriu']) {
    for (const mode of ['sms', 'email', 'invalid-email', 'callback']) {
      await send('Page.navigate', { url: new URL(route, base).href });
      for (let tries = 0; tries < 100; tries++) {
        if (await evaluate(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete' && !!document.querySelector('form.is-stepped') && window.__posts?.length === 0`)) break;
        assert(tries < 99, `form did not load: ${route}`);
        await sleep(50);
      }
      const result = await evaluate(`(async () => {
        const mode = ${JSON.stringify(mode)};
        const f = document.querySelector('[data-preview-form]');
        const q = (s) => f.querySelector(s);
        const put = (s, v) => { const el = q(s); el.value = v; el.dispatchEvent(new Event('input', {bubbles:true})); };
        const checked = (s) => { const el = q(s); el.checked = true; el.dispatchEvent(new Event('change', {bubbles:true})); };
        const visible = (el) => Boolean(el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';
        const callback = q('[value="callback_request"]');
        const callbackVisibility = [];
        checked('[data-trade-input][value="Šildymas"]');
        callbackVisibility.push(visible(callback)); q('[data-next]').click();
        checked('[name="services"][value="Katilų montavimas"]');
        put('[name="services_other"]', 'Priežiūra');
        callbackVisibility.push(visible(callback)); q('[data-next]').click();
        checked('[name="area"][value="Kaunas"]'); put('[name="area_other"]', 'Kauno rajonas');
        callbackVisibility.push(visible(callback)); q('[data-next]').click();
        checked('[data-years-input][value="3–10"]'); put('[name="standout"]', 'Garantija darbams');
        callbackVisibility.push(visible(callback)); q('[data-next]').click();
        checked('#pf-photos-yes'); put('[data-profile]', 'https://example.com/profilis');
        callbackVisibility.push(visible(callback)); q('[data-next]').click();
        callbackVisibility.push(visible(callback));
        put('[name="name"]', 'Tomas');
        checked('[name="contact_time"][value="day"]');
        if (mode !== 'sms') {
          checked('#pf-via-email');
          put('[name="email"]', mode === 'invalid-email' ? 'neteisingas@adresas' : 'preview@example.com');
        }
        if (mode === 'sms' || mode === 'callback') put('[name="phone"]', '+37060000000');
        const button = mode === 'callback' ? callback : q('[value="preview_request"]');
        button.click(); button.click(); button.click();
        for (let i = 0; i < 20 && !window.__posts.length; i++) await new Promise(r => setTimeout(r, 10));
        return { callbackVisibility, posts: window.__posts, invalidEmail: q('[name="email"]').getAttribute('aria-invalid'),
          focus: document.activeElement.id, status: q('[data-status]').textContent,
          thanks: document.querySelector('[data-thanks-text]').textContent,
          thanksVisible: !document.querySelector('[data-thanks]').hidden };
      })()`);
      assert.deepEqual(result.callbackVisibility, [false, false, false, false, false, true], `${route}/${mode}: callback only at last step`);
      if (mode === 'invalid-email') {
        assert.equal(result.posts.length, 0, `${route}: invalid email must not post`);
        assert.equal(result.invalidEmail, 'true');
        assert.equal(result.focus, 'pf-email');
        assert(result.status.includes('el. pašto adresą'));
        assert.equal(result.thanksVisible, false);
      } else {
        assert.equal(result.posts.length, 1, `${route}/${mode}: one mocked POST`);
        assert.equal(result.posts[0].url, new URL('/t/form', base).href);
        const expected = {
          code: '', name: 'Tomas', phone: mode === 'email' ? '' : '+37060000000',
          services: 'Katilų montavimas', services_other: 'Priežiūra', area: 'Kaunas', area_other: 'Kauno rajonas',
          photos_ok: 'yes', preview_via: mode === 'sms' ? 'sms' : 'email', contact_time: 'day', website: '',
          standout: 'Sritis: Šildymas; Patirtis: 3–10 m.\nProfilis: https://example.com/profilis\nGarantija darbams',
          kind: mode === 'callback' ? 'callback_request' : 'preview_request',
          ...(mode === 'sms' ? {} : {email:'preview@example.com'}),
        };
        assert.equal(result.posts[0].entries.length, Object.keys(expected).length, 'No extra or duplicate wire fields');
        assert.deepEqual(Object.fromEntries(result.posts[0].entries), expected, `${route}/${mode}: exact posted fields`);
        assert(result.thanksVisible);
        assert(result.thanks.includes(mode === 'callback' ? 'Paskambinsiu dieną.' : mode === 'email' ? 'el. paštu' : 'SMS'));
      }
      receipts.push({route, mode, passed:true, ...result});
      console.log(`browser-check: ${route} ${mode}: PASS`);
    }
  }
  // Code-bearing SMS entry keeps the phone hidden and identifies the lead only by code.
  await send('Page.navigate', { url: new URL('/noriu?r=p2345', base).href });
  for (let i = 0; i < 100; i++) {
    if (await evaluate(`document.querySelector('[name="code"]')?.value === 'p2345'`)) break;
    assert(i < 99, 'Code-bearing form did not load');
    await sleep(50);
  }
  assert.deepEqual(await evaluate(`({code:document.querySelector('[name="code"]').value,phoneHidden:document.querySelector('[data-phone-field]').hidden,phoneRequired:document.querySelector('[name="phone"]').required})`), {code:'p2345',phoneHidden:true,phoneRequired:false});
  receipts.push({route:'/noriu?r=p2345', mode:'sms-code', passed:true});
  await send('Emulation.setScriptExecutionDisabled', { value:true });
  await send('Page.navigate', { url: new URL('/noriu', base).href });
  for (let i = 0; i < 100; i++) {
    if (await evaluate(`document.readyState === 'complete' && !!document.querySelector('noscript a')`)) break;
    assert(i < 99, 'No-JS fallback did not load');
    await sleep(50);
  }
  assert.deepEqual(await evaluate(`({formHidden:!document.querySelector('[data-preview-form]').getClientRects().length,email:document.querySelector('noscript a[href^="mailto:"]').textContent,href:document.querySelector('noscript a[href^="mailto:"]').href})`), {formHidden:true,email:'matas@jarvisweb.lt',href:'mailto:matas@jarvisweb.lt'});
  receipts.push({route:'/noriu',mode:'javascript-disabled',passed:true});
  const receipt = { at: new Date().toISOString(), browser:'headless Chrome / CDP, 390×844, DPR 1', network:'fetch and beacons stubbed before scripts; external URLs blocked', results:receipts };
  if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(receipt, null, 2) + '\n');
  console.log(`browser-check: ${receipts.length} cases PASS; no real form requests`);
} finally {
  ws?.close();
  chrome.kill();
}
