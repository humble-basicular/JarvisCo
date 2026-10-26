import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import {optimizeClientLogos} from './optimize-client-logos.mjs';

test('display logo retains approved original and provides an exact resized PNG candidate',async()=>{
  const root=mkdtempSync(join(tmpdir(),'seo-logo-test-'));mkdirSync(join(root,'foto'));
  const raw=Buffer.alloc(1280*720*3);let x=1337;
  for(let i=0;i<raw.length;i++){x^=x<<13;x^=x>>>17;x^=x<<5;raw[i]=x&255;}
  const original=await sharp(raw,{raw:{width:1280,height:720,channels:3}}).png().toBuffer();
  writeFileSync(join(root,'foto/logo.png'),original);
  writeFileSync(join(root,'index.html'),'<img class="brand" src="/foto/logo.png" width="1280" height="720"><script type="application/ld+json">{"logo":"/foto/logo.png"}</script>');
  const [change]=await optimizeClientLogos(root,['/foto/logo.png']);
  assert.deepEqual(readFileSync(join(root,'foto/logo.png')),original);
  assert.ok(change.optimizedBytes<change.originalBytes);
  const actual=await sharp(readFileSync(join(root,'.'+change.optimized))).raw().toBuffer();
  const expected=await sharp(original).resize({width:512,withoutEnlargement:true}).raw().toBuffer();
  assert.deepEqual(actual,expected);
  const html=readFileSync(join(root,'index.html'),'utf8');
  assert.ok(html.includes(`srcset="${change.optimized}"`));assert.ok(html.includes('src="/foto/logo.png"'));assert.ok(html.includes('"logo":"/foto/logo.png"'));
  assert.ok(html.includes('width="1280" height="720"'));
});

test('small logos stay unchanged and unsafe paths are rejected',async()=>{
  const root=mkdtempSync(join(tmpdir(),'seo-logo-small-'));mkdirSync(join(root,'foto'));
  writeFileSync(join(root,'foto/logo.png'),await sharp({create:{width:100,height:60,channels:4,background:'#2563eb'}}).png().toBuffer());
  writeFileSync(join(root,'index.html'),'<img src="/foto/logo.png">');
  assert.deepEqual(await optimizeClientLogos(root,['/foto/logo.png']),[]);
  assert.equal(readFileSync(join(root,'index.html'),'utf8'),'<img src="/foto/logo.png">');
  await assert.rejects(()=>optimizeClientLogos(root,['/foto/../../secret.png']));
});
