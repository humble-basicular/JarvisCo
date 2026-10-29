import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync,cpSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {ACCEPTANCE,BASE,CORE,sql,req,auth} from './wp-fixture.mjs';
import {visualLive} from './visual-live.mjs';
const dir=process.env.VENSLAND_LIVE_OUTPUT??join(homedir(),'Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/previews/vensland/wordpress-launch-20261026');
const out=join(dir,'acceptance');mkdirSync(out,{recursive:true});
const manifest=JSON.parse(readFileSync(join(dir,'candidate/vensland-launch-20261026.manifest.json')));
const theme=manifest.theme,themeDir=join(CORE,'wp-content/themes',theme);
let originals;const report={checks:[],restored:false};
before(async()=>{
 const php=`require ${JSON.stringify(CORE+'/wp-load.php')}; $u=get_user_by('login','trial-admin'); wp_set_current_user($u->ID); $expiry=time()+7200; $token=WP_Session_Tokens::get_instance($u->ID)->create($expiry); $logged=wp_generate_auth_cookie($u->ID,$expiry,'logged_in',$token); $_COOKIE[LOGGED_IN_COOKIE]=$logged; echo json_encode(array('cookies'=>array(LOGGED_IN_COOKIE=>$logged,AUTH_COOKIE=>wp_generate_auth_cookie($u->ID,$expiry,'auth',$token)),'previewNonce'=>wp_create_nonce('preview-customize_${theme}')));`;
 Object.assign(auth,JSON.parse(execFileSync('php',['-r',php],{encoding:'utf8'})));
 originals=sql("select option_name,option_value from vl_options where option_name in ('stylesheet','template','blog_public') order by 1");
 execFileSync('unzip',['-qo',join(dir,'candidate',manifest.zip.file),'-d',join(CORE,'wp-content/themes')]);
 // Deterministic ZIP mtimes are fixed; the persistent fixture server may cache previous PHP bytes.
 // Reset only this loopback fixture's opcode cache after replacing the theme.
 const reset=join(CORE,'vl-launch-fixture-opcache.php');
 try{writeFileSync(reset,"<?php echo function_exists('opcache_reset') && opcache_reset() ? 'reset' : 'not enabled';");await req('/vl-launch-fixture-opcache.php');}finally{unlinkSync(reset);}
 sql(`update vl_options set option_value='${theme}' where option_name in ('stylesheet','template')`);
 sql("update vl_options set option_value='1' where option_name='blog_public'");
});
after(()=>{
 for(const line of originals.trim().split('\n')){const [key,value]=line.split('\t');if(!/^[a-z0-9_-]+$/.test(value))throw Error('unexpected original');sql(`update vl_options set option_value='${value}' where option_name='${key}'`);}
 report.restored=sql("select option_name,option_value from vl_options where option_name in ('stylesheet','template','blog_public') order by 1")===originals;
 writeFileSync(join(out,'wp-live-report.json'),JSON.stringify(report,null,2)+'\n');
 assert.ok(report.restored,'local theme options restored');
});
test('active live theme: all generated routes, status, robots, canonical and form markup',async()=>{
 for(const [slug,r] of Object.entries(manifest.routes)){
  const path=r.path===''?'/':r.path==='404.html'?'/404.html':'/'+r.path+'/';
  const response=await req(path);assert.equal(response.status,r.status,slug);
  assert.ok(response.text.includes(`<meta name="robots" content="${r.robots}">`),slug);
  if(r.canonical)assert.ok(response.text.includes(`href="${r.canonical}"`),slug);
  if(response.text.includes('<form'))assert.ok(response.text.includes('action="https://www.jarvisweb.lt/t/form"')&&response.text.includes('name="files"')&&response.text.includes('name="site" value="vensland"'),slug);
  assert.ok(!response.text.includes('%%VL_'),slug);assert.ok(!/Warning:|Fatal error:/.test(response.text),slug+' PHP clean');
  report.checks.push({slug,path,status:response.status});
 }
});
test('active live Customizer is noindex and inert; authorized core preview transport still works',async()=>{
 const query=new URLSearchParams({wp_customize:'on',customize_theme:theme,nonce:auth.previewNonce}).toString();
 const r=await req('/?'+query,{auth:true});assert.equal(r.status,200);assert.ok(r.text.includes('noindex,nofollow'));assert.ok(!r.text.includes('jarvisweb.lt/t/'));assert.ok(r.text.includes('customize-preview'));
 const post=await req('/',{auth:true,method:'POST',nonceField:'nonce',form:{wp_customize:'on',customize_theme:theme,customized:'{}'}});assert.equal(post.status,200);assert.ok(post.text.includes('noindex,nofollow'));
});
test('live redirects cover every discovered old URL except retained home; unknown frontend is actual 404',async()=>{
 for(const [path,to]of Object.entries(manifest.migrations)){
  const r=await req('/'+path+'/');assert.equal(r.status,301,path);assert.equal(r.location,BASE+'/#'+to.fragment);
 }
 for(const path of ['/not-found-launch-check/','/hello-world/','/missing/?tracking=anything']){const r=await req(path);assert.equal(r.status,404,path);assert.ok(r.text.includes('Puslapis nerastas'));}
 for(const path of ['/sitemap.xml','/robots.txt']){const r=await req(path);assert.equal(r.status,200);assert.equal(r.text,readFileSync(join(dir,'baseline/site',path.slice(1)),'utf8'));}
 const post=await req('/',{method:'POST',form:{phone:'+37060000000'}});assert.equal(post.status,405);
});
test('active theme leaves admin/login/REST/feeds/uploads/core sitemaps available',async()=>{
 for(const path of ['/wp-login.php','/wp-admin/','/wp-json/','/?rest_route=/wp/v2/pages','/feed/','/wp-sitemap.xml','/wp-sitemap-posts-page-1.xml']){
  const r=await req(path,{auth:path==='/wp-admin/'});assert.equal(r.status,200,path);assert.ok(!r.text.includes('v3--outdoor'),path);
 }
 const upload=await req('/wp-content/uploads/nonexistent-local-sentinel.txt');assert.equal(upload.status,404);assert.ok(!upload.text.includes('v3--outdoor'));
});
test('360/1440 home + 2 services match standalone; Worker beacon/form endpoints stubbed',async()=>{const result=await visualLive({base:BASE,site:join(dir,'baseline/site'),out});report.visualCases=result.cases.length;});
