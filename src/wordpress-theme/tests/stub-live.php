<?php
define('ABSPATH','/stub/');
function esc_url($u){return str_replace('&','&#038;',$u);}
function esc_attr($s){return htmlspecialchars($s,ENT_QUOTES);}
$d=$argv[1]; require "$d/inc/routing.php";require "$d/inc/render.php";
function ck($v,$s){if(!$v){fwrite(STDERR,"FAIL $s\n");exit(1);}}
$m=vensland_load_routes("$d/routes.json");ck($m!==null,'manifest');
foreach($m['routes'] as $slug=>$r){$p='/'.$r['path'].($r['path']!==''&&$r['path']!=='404.html'?'/':'');ck(vensland_match_request($p,array(),'/',$m)['slug']===$slug,$p);}
foreach(array('/wp-admin/','/wp-login.php','/wp-json/','/wp-json/wp/v2/pages','/feed/','/comments/feed/','/any/feed/','/wp-content/uploads/test.jpg','/wp-sitemap.xml','/wp-sitemap-posts-page-1.xml','/wp-sitemap.xsl','/robots.txt') as $p) ck(vensland_match_request($p,array(),'/',$m)===null,$p);
ck(vensland_match_request('/',array('rest_route'=>'/wp/v2/pages'),'/',$m)===null,'REST query');
ck(vensland_match_request('/missing/',array(),'/',$m)['slug']==='not-found','404');
ck(vensland_match_request('/missing/',array('tracking'=>'x'),'/',$m)['slug']==='not-found','404 query');
ck(vensland_match_request('/paslaugos/',array(),'/',$m)['kind']==='migration','301');
ck(vensland_match_request('/kontaktai',array(),'/',$m)['fragment']==='uzklausa','contact anchor');
$c=array('assets'=>'https://vensland.lt/wp-content/themes/x/assets','home'=>'https://vensland.lt/','pretty'=>true,'preview'=>false,'args'=>array(),'slug'=>'home','parts'=>array());
$h=vensland_render_html(vensland_read_page($m,'home'),$m,$c);ck(strpos($h,'content="index,follow"')!==false,'index');ck(strpos($h,'%%VL_')===false,'tokens');
$c['preview']=true;$h=vensland_render_html(vensland_read_page($m,'home',true),$m,$c);ck(strpos($h,'noindex,nofollow')!==false,'preview robots');ck(strpos($h,'jarvisweb.lt/t/')===false,'preview inert');
ck(strpos(vensland_security_headers(false,true)['Content-Security-Policy'],"connect-src 'self' https://jarvisweb.lt https://www.jarvisweb.lt")!==false,'live CSP');
ck(strpos(vensland_security_headers(true,true)['Content-Security-Policy'],"connect-src 'self';")!==false,'preview CSP');echo "PASS\n";
