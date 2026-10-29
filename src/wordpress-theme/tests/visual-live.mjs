// Uses the established local-only browser fixture workflow. Every external request is intercepted before transport.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { startChrome, staticServer } from './browser.mjs';
export async function visualLive({ base, site, out }) {
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('loopback required');
 mkdirSync(join(out,'screens'),{recursive:true});
 const staticSite=await staticServer(site),b=await startChrome(),report={cases:[],stubbed:[],blocked:[]};
 // Fetch interception is stronger than DNS blocking: no Worker POST/beacon ever reaches a real endpoint.
 await b.cdp('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const handle=setInterval(()=>{for(const e of b.events.splice(0))if(e.method==='Fetch.requestPaused'){
  const {requestId,request}=e.params,u=new URL(request.url);
  if(u.hostname==='127.0.0.1'||['data:','blob:','about:'].includes(u.protocol))void b.cdp('Fetch.continueRequest',{requestId});
  else if(['jarvisweb.lt','www.jarvisweb.lt'].includes(u.hostname)&&['/t/form','/t/e'].includes(u.pathname)){
   report.stubbed.push({url:request.url,method:request.method,body:request.postData??''});
   void b.cdp('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(JSON.stringify({ok:true,id:'local-stub'})).toString('base64')});
  }else{report.blocked.push(request.url);void b.cdp('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});}
 }},10);
 async function load(url,width){
  await b.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===360});
  await b.cdp('Page.navigate',{url});await b.sleep(700);
  await b.ev(`(async()=>{const style=document.createElement('style');style.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';document.head.append(style);document.querySelectorAll('img').forEach(i=>i.loading='eager');await document.fonts.ready;for(let y=0;y<document.documentElement.scrollHeight;y+=650){scrollTo(0,y);await new Promise(r=>setTimeout(r,20))}scrollTo(0,0);await Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>i.onload=i.onerror=r)));await new Promise(r=>setTimeout(r,150));})()`);
  const metrics=await b.ev(`({text:document.body.innerText.replace(/\\s+/g,' ').trim(),width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,badImages:[...document.images].filter(i=>!i.naturalWidth).length})`);
  const shot=await b.cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.min(metrics.height,20000),scale:1}});
  return {metrics,png:shot.result.data};
 }
 try{
  for(const width of [360,1440])for(const route of ['','paslaugos/vejos-irengimas','paslaugos/laistymo-sistemos']){
   const path=route?'/'+route+'/':'/',a=await load(staticSite.url+path,width),w=await load(base+path,width),name=route.replaceAll('/','-')||'home';
   writeFileSync(join(out,'screens',`${name}-${width}-standalone.png`),Buffer.from(a.png,'base64'));
   writeFileSync(join(out,'screens',`${name}-${width}-wordpress.png`),Buffer.from(w.png,'base64'));
   assert.deepEqual(w.metrics,a.metrics,`${path} ${width} layout/text/images`);
   // Canvas compares screenshots without third-party dependencies.
   await b.cdp('Page.navigate',{url:'about:blank'});await b.sleep(70);
   const diff=await b.ev(`(async()=>{const L=s=>new Promise(r=>{const i=new Image;i.onload=()=>r(i);i.src='data:image/png;base64,'+s});const [a,b]=await Promise.all([L(${JSON.stringify(a.png)}),L(${JSON.stringify(w.png)})]);const c=document.createElement('canvas');c.width=a.width;c.height=a.height;const x=c.getContext('2d');x.drawImage(a,0,0);const A=x.getImageData(0,0,c.width,c.height).data;x.clearRect(0,0,c.width,c.height);x.drawImage(b,0,0);const B=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<A.length;i+=4)if(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2])>30)n++;return {pixels:n,ratio:n/(c.width*c.height)}})()`);
   report.cases.push({path,width,...w.metrics,diff});assert.ok(diff.ratio<0.001,`${path} visual drift ${diff.ratio}`);
  }
  // Exercise actual production JS with multipart data and an intercepted successful response.
  await load(base+'/',360);
  await b.ev(`(()=>{const f=document.querySelector('form[data-callback-form]');f.querySelector('[name=phone]').value='+37060000000';f.querySelector('[name=message]').value='LOCAL STUB ONLY';const dt=new DataTransfer;dt.items.add(new File(['local fixture'],'local.txt',{type:'application/pdf'}));f.querySelector('[name=files]').files=dt.files;f.querySelector('[name=files]').dispatchEvent(new Event('change',{bubbles:true}));f.requestSubmit()})()`);
  await b.sleep(800);
  assert.ok(report.stubbed.some(r=>r.url.endsWith('/t/form')&&r.method==='POST'),'Worker form intercepted');
  report.formAfter=await b.ev('location.pathname+location.search');
  assert.ok(report.formAfter.startsWith('/aciu/'),'success receipt navigation');
  assert.equal(report.blocked.length,0,'unexpected external URLs');
  writeFileSync(join(out,'visual-live-report.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{writeFileSync(join(out,'visual-live-report.json'),JSON.stringify(report,null,2)+'\n');clearInterval(handle);b.close();staticSite.close();}
}
