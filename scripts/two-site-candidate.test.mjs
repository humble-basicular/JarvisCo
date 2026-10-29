import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir,homedir} from 'node:os';
import {gzipSync} from 'node:zlib';
import {spawnSync,execFileSync} from 'node:child_process';
import {checkSeoArtifacts} from './service-artifacts.mjs';
import {build,transformPage} from './wordpress-theme.mjs';
const privateBase=join(homedir(),'Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/previews');
for(const [slug,code,n] of [['cg6j485ktf','meselektra',7],['aewz4kawy3','vensland',10]])test(`${code} candidate routes, copy, canonicals, noindex, 404, JS budget and deployment refusal`,()=>{
 const dir=join('client-sites',slug);assert.ok(existsSync(dir),'build local test candidate first');const data=JSON.parse(readFileSync(`previews/${slug}.json`));assert.equal(data.v3.servicePages.length,n);assert.deepEqual(checkSeoArtifacts(dir,{domain:code+'.lt',test:true,services:data.v3.servicePages}),[]);
 const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(join(d,x.name)):[join(d,x.name)]);
 for(const p of walk(dir).filter(x=>x.endsWith('.html'))){const h=readFileSync(p,'utf8');let bytes=0;for(const m of h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(m[1].includes('application/ld+json'))continue;assert.ok(!/\bsrc=/.test(m[1]),'no remote/unmeasured initial script');bytes+=gzipSync(m[2]).length;}assert.ok(bytes<15360,`${p}: ${bytes}B gzip exceeds15KiB`);assert.match(h,/noindex,nofollow/);}
 const h=readFileSync(join(dir,'index.html'),'utf8');for(const field of ['quoteHelper','priceFootnote']){assert.equal(typeof data.v3[field],'string');assert.ok(h.includes(data.v3[field]));}assert.match(h,/data-widget-key="1x00000000000000000000AA"/);assert.equal((h.match(/data-rate-form/g)||[]).length>0,true);
 const result=spawnSync(process.execPath,['scripts/client-site-deploy-check.mjs',dir],{encoding:'utf8'});assert.equal(result.status,1);assert.match(result.stderr,/TEST-BUILD-DO-NOT-DEPLOY/);
});
test('new Vens archive produces deterministic inert test theme; hash guards reject drift',()=>{
 const root=join(privateBase,'vensland/two-site-ui-20261029/candidate');assert.ok(existsSync(root));const args={baseline:join(root,'vensland-test.tar.gz'),expectSha256:readFileSync(join(root,'archive.sha256'),'utf8').trim(),manifestPath:join(root,'manifest.json'),mode:'trial',testInput:true};const tmp=mkdtempSync(join(tmpdir(),'two-site-theme-'));const a=build({...args,outDir:join(tmp,'a')}),b=build({...args,outDir:join(tmp,'b')});assert.equal(a.manifest.zip.sha256,b.manifest.zip.sha256);assert.equal(Object.keys(a.manifest.routes).length,24);assert.equal(a.manifest.mode,'trial');assert.throws(()=>build({...args,expectSha256:'0'.repeat(64),outDir:join(tmp,'bad')}),/sha256/);assert.throws(()=>build({...args,mode:'live',outDir:join(tmp,'live')}),/trial-only/);
 execFileSync('/usr/bin/unzip',['-q',a.zipPath,'-d',join(tmp,'unzip')]);const page=readFileSync(join(tmp,'unzip',a.manifest.theme,'pages/home.html'),'utf8');assert.ok(!page.includes('fetch('));assert.ok(!page.includes('data-widget-key='));assert.ok(!page.includes('sendBeacon'));assert.ok(page.includes('data-rate-form'));assert.ok(page.includes('Bandomoji versija'));
 const html=readFileSync('client-sites/aewz4kawy3/index.html','utf8');const slugs=new Map(Object.entries(a.manifest.routes).map(([k,v])=>[v.path?`/${v.path}/`:'/',k]));assert.throws(()=>transformPage(html.replace('var started = Date.now();','var started = 1;'),{slug:'home',robots:'noindex,nofollow'},slugs,'trial',true),/source drifted/);
});
