// Local acceptance only: headless Chrome, every fetch/beacon stubbed before page scripts.
// Usage: npm run check:browser -- http://127.0.0.1:4335 [receipt.json]
// CHROME_PATH may override the locally installed Chrome executable. No real form POSTs.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const evidenceRoot = process.argv[2];
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
  await send('Page.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'https://stonesystems.io/'});
  for(let i=0;i<100;i++){if(await evaluate("document.readyState==='complete'"))break;await sleep(150);}
  const metrics=await evaluate(`(()=>{const style=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {x:r.left,y:r.top+scrollY,w:r.width,h:r.height,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,lineHeight:s.lineHeight,color:s.color,bg:s.backgroundColor,padding:s.padding,textAlign:s.textAlign,gap:s.gap,borderRadius:s.borderRadius,grid:s.gridTemplateColumns}};const h=[...document.querySelectorAll('h3')].find(e=>e.innerText==='Simple To Use');const why=h.parentElement;const feature=[...document.querySelectorAll('h1')].find(e=>e.innerText==='Functional Website');let row=feature.parentElement;while(row.parentElement&&!row.querySelector('img[src*=".gif"]'))row=row.parentElement;return {whyCard:style(why),whyGrid:style(why.parentElement),whyTitle:style(h),whyText:style(why.querySelector('p')),whyIcon:style(why.querySelector('img')),featureRow:style(row),featureTitle:style(feature),featureText:style(row.querySelector('p')),buttons:[...document.querySelectorAll('button,a')].filter(e=>e.textContent==='See Short Demo').slice(0,1).map(style)}})()`);
  writeFileSync(join(evidenceRoot,'computed-metrics.json'),JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics));
}finally{ws?.close();chrome.kill('SIGTERM');}
