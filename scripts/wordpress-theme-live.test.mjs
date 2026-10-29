// Extends the frozen trial suite with the current approved live baseline.
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { build, LIVE_SLUG } from './wordpress-theme.mjs';
const base=process.env.VENSLAND_LIVE_BASELINE??join(homedir(),'Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/previews/vensland/wordpress-launch-20261026/baseline');
const manifest=JSON.parse(readFileSync(join(base,'manifest.json')));
const archive=join(base,`vensland-approved-static-${manifest.sourceCommit}.tar.gz`);
const sha=b=>createHash('sha256').update(b).digest('hex');
const migrations={paslaugos:{route:'home',fragment:'paslaugos'},kontaktai:{route:'home',fragment:'uzklausa'}};
const opts=()=>({baseline:archive,expectSha256:sha(readFileSync(archive)),manifestPath:join(base,'manifest.json'),mode:'live',migrations,outDir:mkdtempSync(join(tmpdir(),'vl-live-'))});
const built=build(opts()),root=mkdtempSync(join(tmpdir(),'vl-live-x-'));
execFileSync('unzip',['-q',built.zipPath,'-d',root]);
const theme=join(root,LIVE_SLUG);
test('live ZIP deterministic; page count equals all generated HTML files, nested service pages and 404 included',()=>{
 assert.equal(built.manifest.zip.sha256,build(opts()).manifest.zip.sha256);
 assert.equal(Object.keys(built.manifest.routes).length,manifest.pageCount);
 assert.equal(Object.values(built.manifest.routes).filter(r=>r.path.startsWith('paslaugos/')).length,10);
 assert.equal(built.manifest.routes['not-found'].status,404);
 execFileSync('unzip',['-tq',built.zipPath]);
});
test('live form/tracking scripts and assets are baseline bytes; Customizer variant inert; canonical/robots exact',()=>{
 for(const [slug,r] of Object.entries(built.manifest.routes)){
  const html=readFileSync(join(theme,'pages',r.file),'utf8'),preview=readFileSync(join(theme,'pages',r.previewFile),'utf8');
  const original=readFileSync(join(base,'site',r.path==='404.html'?'404.html':join(r.path,'index.html')),'utf8');
  const scripts=s=>[...s.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map(m=>m[0]);
  assert.deepEqual(scripts(html),scripts(original),slug);
  assert.ok(!/jarvisweb\.lt\/t\/|sendBeacon|fetch\(/.test(preview),slug+' preview inert');
  assert.ok(!html.includes('vl-seam-fix'),slug+' approved CSS retained');
  if(html.includes('<form')) for(const markup of ['action="https://www.jarvisweb.lt/t/form"','enctype="multipart/form-data"','name="site" value="vensland"','name="website"','type="file"']) assert.ok(html.includes(markup),slug+' '+markup);
  assert.ok(html.includes('content="%%VL_ROBOTS%%"'));
  if(r.canonical) assert.ok(html.includes(`href="${r.canonical}"`));
 }
 for(const f of manifest.files.filter(f=>/^site\/(foto|_astro)\//.test(f.path)))assert.equal(sha(readFileSync(join(theme,'assets',f.path.slice(5)))),f.sha256,f.path);
 assert.equal(readFileSync(join(theme,'data/sitemap.xml'),'utf8'),readFileSync(join(base,'site/sitemap.xml'),'utf8'));
 assert.equal(readFileSync(join(theme,'data/robots.txt'),'utf8'),readFileSync(join(base,'site/robots.txt'),'utf8'));
});
test('PHP routing: migrations, real 404 classification, query strings, core exclusions, preview render and CSP',()=>{
 const result=execFileSync('php',[fileURLToPath(new URL('../src/wordpress-theme/tests/stub-live.php',import.meta.url)),theme],{encoding:'utf8'});
 assert.ok(result.includes('PASS'),result);
});
