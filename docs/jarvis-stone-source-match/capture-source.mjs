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
  await send('Page.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate', {url:'https://stonesystems.io/'});
  for(let i=0;i<100;i++){if(await evaluate("document.readyState === 'complete' && document.querySelectorAll('h1,h2,h3').length>8"))break;await sleep(150);}
  await evaluate("document.documentElement.style.scrollBehavior='auto'");
  const metadata=await evaluate(`({url:location.href,title:document.title,text:document.body.innerText,header:[...document.querySelectorAll('header')].map(e=>({position:getComputedStyle(e).position,top:getComputedStyle(e).top,height:e.offsetHeight})),blocks:[...document.querySelectorAll('h1')].filter(e=>['Functional Website','5-Star Magic Review Funnel','Missed Call Text Back','One-Click Marketing Campaigns','Local SEO'].includes(e.innerText.trim())).map(e=>{let p=e.parentElement;while(p.parentElement&&!p.querySelector('img[src*=".gif"]'))p=p.parentElement;return {title:e.innerText,y:e.getBoundingClientRect().top+scrollY,text:p.innerText,html:p.outerHTML.slice(0,18000)}})})`);
  writeFileSync(join(evidenceRoot,'live-details.json'),JSON.stringify(metadata,null,2));
  console.log(JSON.stringify({header:metadata.header,blocks:metadata.blocks.map(b=>({title:b.title,y:b.y})),appMentions:metadata.text.split('\n').filter(t=>/app|mobile|integration|steps|download/i.test(t))}));
  const b=metadata.blocks.find(b=>b.title==='Functional Website');
  await evaluate(`scrollTo(0,${Math.max(0,b.y-160)})`);await sleep(1000);
  // Actual browser frames, 4fps; no interactions/form submissions. User asked for a recording.
  for(let i=0;i<56;i++){const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:70,captureBeyondViewport:false});writeFileSync(join(evidenceRoot,`functional-frame-${String(i).padStart(3,'0')}.jpg`),Buffer.from(shot.data,'base64'));await sleep(250);}
} finally {
  ws?.close();
  chrome.kill('SIGTERM');
}
