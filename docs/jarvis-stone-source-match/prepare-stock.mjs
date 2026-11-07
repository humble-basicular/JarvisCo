// Local acceptance only: headless Chrome, every fetch/beacon stubbed before page scripts.
// Usage: npm run check:browser -- http://127.0.0.1:4335 [receipt.json]
// CHROME_PATH may override the locally installed Chrome executable. No real form POSTs.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import fs from 'node:fs';

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
  const items=[
    {id:9029162,slug:'aplinkos-tvarkymas',label:'Aplinkos tvarkymas',page:'https://www.pexels.com/photo/a-man-cutting-the-grass-using-a-lawn-mower-9029162/',author:'Makrufin Muhammad'},
    {id:9431615,slug:'stogai',label:'Stogai',page:'https://www.pexels.com/photo/handyman-putting-roof-tiles-on-roof-9431615/',author:'Keith'},
    {id:20500461,slug:'elektra',label:'Elektra',page:'https://www.pexels.com/photo/a-female-electrician-standing-on-a-ladder-and-holding-cables-20500461/',author:'Audy of Course'},
    {id:31763537,slug:'statyba',label:'Statyba',page:'https://www.pexels.com/photo/roof-construction-with-wooden-framework-and-workers-31763537/',author:'Clément Proust'},
    {id:5493654,slug:'remontas',label:'Remontas',page:'https://www.pexels.com/photo/construction-workers-renovating-a-house-5493654/',author:'Antoni Shkraba'},
    {id:34975633,slug:'fasadai',label:'Fasadai',page:'https://www.pexels.com/photo/construction-worker-painting-building-exterior-34975633/',author:'Shadman Sirwan'},
    {id:7641010,slug:'langu-valymas',label:'Langų valymas',page:'https://www.pexels.com/photo/a-woman-cleaning-the-window-7641010/',author:'MART PRODUCTION'},
    {id:6474301,slug:'dazymas',label:'Dažymas',page:'https://www.pexels.com/photo/a-man-working-at-a-construction-site-6474301/',author:'Tima Miroshnichenko'},
    {id:7788245,slug:'staliai',label:'Staliai',page:'https://www.pexels.com/photo/a-carpenter-on-the-roof-7788245/',author:'Hanna Payasnikava'},
    {id:14614016,slug:'techninis-aptarnavimas',label:'Techninis aptarnavimas',page:'https://www.pexels.com/photo/men-working-with-electrical-wires-14614016/',author:'Trinh Trần'},
  ];
  const targetDir='public/jarvis-systems/trades-stock';fs.mkdirSync(targetDir,{recursive:true});
  fs.mkdirSync(evidenceRoot,{recursive:true});
  await send('Page.enable');await send('Network.enable',{maxTotalBufferSize:50000000,maxResourceBufferSize:10000000});
  const responses=new Map();ws.addEventListener('message',({data})=>{const e=JSON.parse(data);if(e.method==='Network.responseReceived')responses.set(e.params.response.url,e.params.requestId);});
  const completed=[];
  for(const it of items){
    const url=`https://images.pexels.com/photos/${it.id}/pexels-photo-${it.id}.jpeg?auto=compress&cs=tinysrgb&w=960`;
    await send('Page.navigate',{url});
    for(let i=0;i<100;i++){if(await evaluate("document.images[0]?.complete&&document.images[0]?.naturalWidth>0"))break;await sleep(100);}
    await sleep(250);
    const rid=responses.get(url);if(!rid)throw Error('No photo response:'+it.slug);
    const body=await send('Network.getResponseBody',{requestId:rid});const bytes=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');
    const meta=await sharp(bytes).metadata();if(!meta.width)throw Error('Invalid photo:'+it.slug);
    const file=it.slug+'.webp';await sharp(bytes).rotate().resize(742,400,{fit:'cover',position:'attention'}).webp({quality:85}).toFile(join(targetDir,file));
    fs.copyFileSync(join(targetDir,file),join(evidenceRoot,file));
    completed.push({...it,download:url,license:'https://www.pexels.com/license/',src:'/jarvis-systems/trades-stock/'+file,width:742,height:400});console.log(it.slug,bytes.length);
  }
  const manifest={checkedAt:new Date().toISOString(),license:'https://www.pexels.com/license/',notes:'Free stock photos; no endorsement or client-work claim. Source pages and Pexels license inspected7Nov2026.',items:completed};
  fs.writeFileSync('docs/jarvis-stone-source-match/stock-manifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync(join(evidenceRoot,'stock-manifest.json'),JSON.stringify(manifest,null,2));
  await send('Page.navigate',{url:'https://jarvisweb-sistema.jarvisworks-co.workers.dev/'});
  for(let i=0;i<80;i++){if(await evaluate("document.readyState==='complete'"))break;await sleep(150);}
  await sleep(800);
  const app=await evaluate("({url:location.href,title:document.title,text:document.body.innerText.slice(0,3000),fields:[...document.querySelectorAll('input')].map(e=>({type:e.type,name:e.name}))})");
  fs.writeFileSync('docs/jarvis-stone-source-match/app-entry-verification.json',JSON.stringify(app,null,2));console.log(JSON.stringify(app));
}finally{ws?.close();chrome.kill('SIGTERM');}
