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
  const gifs=new Map();
  ws.addEventListener('message',({data})=>{const e=JSON.parse(data);if(e.method==='Network.responseReceived'&&e.params.response.url.includes('.gif'))gifs.set(e.params.response.url,e.params.requestId);});
  await send('Page.enable');
  await send('Network.enable',{maxTotalBufferSize:150000000,maxResourceBufferSize:50000000});
  await send('Page.navigate',{url:'https://stonesystems.io/'});
  for(let i=0;i<120;i++){if(await evaluate("document.readyState==='complete'"))break;await sleep(200);}
  await evaluate("document.documentElement.style.scrollBehavior='auto'");
  for(const y of [2000,2800,3600,4400,5200]){await evaluate(`scrollTo(0,${y})`);await sleep(900);}
  await evaluate("Promise.all([...document.images].filter(e=>e.src.includes('.gif')).map(e=>{e.loading='eager';return e.decode().catch(()=>null)}))");
  await sleep(1000);
  for(const [url,requestId] of gifs){try{const body=await send('Network.getResponseBody',{requestId});const bytes=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');const name=new URL(url).pathname.split('/').at(-1);writeFileSync(join(evidenceRoot,name),bytes);console.log(JSON.stringify({url,name,bytes:bytes.length}));}catch(e){console.log(JSON.stringify({url,error:e.message}));}}
  const extra=await evaluate(`({header:[...document.querySelectorAll('header')].map(e=>({position:getComputedStyle(e).position,height:e.offsetHeight})),appElements:[...document.querySelectorAll('a')].filter(e=>/app|mobile|integration|login|log in/i.test(e.textContent)).map(e=>({text:e.textContent,href:e.href})),why:[...document.querySelectorAll('h3')].find(e=>e.innerText==='Simple To Use')?.parentElement.outerHTML})`);
  writeFileSync(join(evidenceRoot,'extra-details.json'),JSON.stringify(extra,null,2));
} finally {ws?.close();chrome.kill('SIGTERM');}
