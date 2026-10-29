import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../src/templates/v3/form.js',import.meta.url),'utf8');
function element(value='') { return {appendChild(){},value,hidden:true,textContent:'Siųsti',disabled:false, files:[], events:{},classList:{add(){}},setCustomValidity(v){this.invalid=v;},setAttribute(){},addEventListener(k,fn){this.events[k]=fn;},focus(){this.focused=true;}}; }
function fixture({key='1x00000000000000000000AA',response={status:200,json:{ok:true,id:'fake-local'}},valid=true}={}) {
 const callbacks=[], resets=[], requests=[], navigations=[];
 const forms=[0,1].map(()=>{
  const els=Object.fromEntries(['input[type="file"]','[data-file-list]','[data-file-sum]','[data-form-error]','[data-form-error-text]','button[type="submit"]','[name=phone]','[name=message]'].map(k=>[k,element()]));
  els['[name=phone]'].value='+37060000000';els['[name=message]'].value='test';
  const f=element();f.action='http://localhost:4330/t/form';f.querySelector=k=>els[k];f.querySelectorAll=()=>[];f.getAttribute=()=>key;f.insertBefore=()=>{};f.reportValidity=()=>valid&&!els['[name=phone]'].invalid;f.els=els;return f;
 });
 const buttons=forms.map(f=>f.els['button[type="submit"]']);
 const document={body:{getAttribute:()=> 'vensland'},referrer:'https://chatgpt.com/?private=secret',querySelectorAll:k=>k==='[data-callback-form]'?forms:buttons,createElement:()=>element()};
 class FD {constructor(){this.items=new Map();}set(k,v){this.items.set(k,v);}delete(k){this.items.delete(k);}append(k,v,name){this.items.set(k,{v,name});}}
 const turnstile={render(holder,opts){callbacks.push(opts);return callbacks.length-1;},reset(id){resets.push(id);}};
 vm.runInNewContext(code,{document,location:{search:'',hostname:'vensland.lt',pathname:'/paslaugos/veja/',assign:p=>navigations.push(p)},URL,URLSearchParams,FormData:FD,Blob,sessionStorage:{getItem(){},setItem(){},removeItem(){}},window:{turnstile},fetch:async(url,opts)=>{requests.push(opts.body.items);if(response.throw)throw Error('isolated network failure');return {ok:response.status<300,status:response.status,json:async()=>response.json};}});
 const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
 return {forms,callbacks,resets,requests,navigations,flush,async activate(i=0){forms[i].events.focusin();await flush();},async submit(i=0){forms[i].events.submit({preventDefault(){}});await flush();}};
}
test('valid token and bounded fields; reset consumes token; interaction options; shared lock prevents second form',async()=>{
 const f=fixture();assert.equal(f.callbacks.length,0);await f.activate();assert.equal(f.callbacks[0].appearance,'interaction-only');assert.equal(f.callbacks[0].size,'flexible');assert.equal(f.callbacks[0].language,'lt');f.callbacks[0].callback('valid-local-token');
 const pending=f.submit();f.forms[1].events.submit({preventDefault(){}});await pending;
 assert.equal(f.requests.length,1);assert.equal(f.requests[0].get('cf-turnstile-response'),'valid-local-token');assert.equal(f.requests[0].get('source'),'ChatGPT');assert.equal(f.requests[0].get('page'),'/paslaugos/veja/');assert.equal(f.resets.length,1);assert.equal(f.navigations.length,1);
});
test('invalid/replayed response preserves fields/files and requires new token; expiry resets',async()=>{
 const f=fixture({response:{status:400,json:{error:'invalid'}}});await f.activate();const input=f.forms[0].els['input[type="file"]'];const file={name:'local.pdf',type:'application/pdf',size:12,lastModified:1};input.files=[file];
 input.events.change();
 f.forms[0].els['[data-file-list]'].appendChild=()=>{};
 // Submit with no file-change event exercises native fallback with no DataTransfer; values stay untouched.
 f.callbacks[0].callback('replay');await f.submit();assert.equal(f.requests.length,1);assert.equal(f.requests[0].get('files').name,'local.pdf');assert.equal(f.navigations.length,0);assert.equal(input.files[0],file);assert.equal(f.forms[0].els['[name=message]'].value,'test');await f.submit();assert.equal(f.requests.length,1);
 f.callbacks[0]['expired-callback']();assert.equal(f.resets.length,3);f.callbacks[0].callback('new');await f.submit();assert.equal(f.requests.length,2);
});
for(const response of [{status:503,json:{ok:false}},{throw:true}]) test('503/network is uncertain, never success, locks every form',async()=>{
 const f=fixture({response});await f.activate();f.callbacks[0].callback('valid');await f.submit();await f.submit(1);assert.equal(f.requests.length,1);assert.equal(f.navigations.length,0);assert.ok(f.forms.every(x=>x.els['button[type="submit"]'].disabled));assert.equal(f.forms[0].els['[name=message]'].value,'test');assert.equal(f.resets.length,1);
});
test('validation attempts reset and missing configuration fails closed',async()=>{
 const invalid=fixture({valid:false});await invalid.activate();invalid.callbacks[0].callback('token');await invalid.submit();assert.equal(invalid.resets.length,1);assert.equal(invalid.requests.length,0);
 const missing=fixture({key:null});await missing.submit();assert.equal(missing.requests.length,0);assert.match(missing.forms[0].els['[data-form-error-text]'].textContent,/nesukonfigūruota/);
});
test('upload validation and total budget failures consume token and retain picked files',async()=>{
 for(const [size,count] of [[11*1024*1024,1],[9*1024*1024,3]]){
  const f=fixture();await f.activate();const input=f.forms[0].els['input[type="file"]'];input.files=Array.from({length:count},(_,i)=>({name:`local-${i}.pdf`,type:'application/pdf',size,lastModified:i}));input.events.change();f.callbacks[0].callback('valid');await f.submit();assert.equal(f.requests.length,0);assert.equal(f.resets.length,1);assert.equal(input.files.length,count);assert.equal(f.forms[0].els['[data-form-error]'].hidden,false);
 }
});
