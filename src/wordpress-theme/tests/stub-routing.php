<?php
/* STUB harness (not real WordPress): routing + token rendering with minimal esc_* stand-ins.
   usage: php stub-routing.php <extracted theme dir> */
define('ABSPATH', '/stub/');
function esc_url($u) { return str_replace('&', '&#038;', $u); }
function esc_attr($s) { return htmlspecialchars($s, ENT_QUOTES); }
$dir = $argv[1] ?? '';
foreach (array('routing', 'render') as $f) { require $dir . '/inc/' . $f . '.php'; }
$fails = 0;
function check($ok, $label) { global $fails; if (!$ok) { $fails++; echo "FAIL $label\n"; } else { echo "ok $label\n"; } }
$m = vensland_load_routes($dir . '/routes.json');
check($m && count($m['routes']) === 13, '13 routes load');
$g = function ($u, $get = array(), $home = '/') use ($m) { return vensland_match_request($u, $get, $home, $m); };
check($g('/')['slug'] === 'home', 'home');
check($g('/vilnius/')['slug'] === 'vilnius' && $g('/vilnius')['slug'] === 'vilnius', 'vilnius with/without slash');
check($g('/privatumo-politika/?customize_changeset_uuid=x')['slug'] === 'privatumo-politika', 'preview args ignored for matching');
check($g('/sitemap.xml')['kind'] === 'sitemap', 'sitemap');
check($g('/paslaugos/')['fragment'] === 'paslaugos' && $g('/kontaktai/')['fragment'] === 'uzklausa', 'legacy links map to anchors');
foreach (array('/wp-admin/', '/wp-login.php', '/wp-json/', '/feed/', '/hello-world/', '/vilnius/../wp-login.php', '/%2e%2e/etc/passwd', '/vilnius//', '//vilnius/', "/vilnius/%00", '/vilnius%5C..', '/Vilnius/', '/vilnius/x/') as $u) {
  check($g($u) === null, "not ours: $u");
}
check($g('/', array('p' => '1')) === null && $g('/', array('s' => 'x')) === null, 'content-selecting query vars are not ours');
check($g('/', array('vl_route' => 'trakai'))['slug'] === 'trakai' && $g('/', array('vl_route' => '../x')) === null, 'plain-permalink route param is allowlisted');
check($g('/sub/vilnius/', array(), '/sub/')['slug'] === 'vilnius' && $g('/vilnius/', array(), '/sub/') === null, 'subdirectory home path');
$hr = 'vensland_host_redirect';
check($hr('www.vensland.lt', '/vilnius/?utm_source=x', 'https://vensland.lt/') === 'https://vensland.lt/vilnius/?utm_source=x', 'www host 301s to apex with path+query');
check($hr('WWW.VENSLAND.LT:443', '/', 'https://vensland.lt/') === 'https://vensland.lt/', 'www host match is case/port-insensitive');
check($hr('vensland.lt', '/', 'https://vensland.lt/') === null && $hr('evil.test', '/', 'https://vensland.lt/') === null, 'apex and foreign hosts are never redirected');
check($hr('www.vensland.lt', '//evil.test/', 'https://vensland.lt/') === null && $hr('www.vensland.lt', "/a\r\nX: y", 'https://vensland.lt/') === null && $hr('www.vensland.lt', '/', 'ftp://vensland.lt/') === null, 'malformed host-redirect input is refused');
check(vensland_preview_args(array('customize_theme' => 'a"b', 'customize_autosaved' => 'on')) === array('customize_autosaved' => 'on'), 'preview args validated');
// Regression (review1 P1-2): core Customizer GET transport fields must not turn a valid preview into the fallback.
$uuid = '12345678-1234-1234-1234-123456789abc';
$core = array('wp_customize' => 'on', 'customize_theme' => 't', 'nonce' => 'abc123XYZ9', 'customize_changeset_uuid' => $uuid);
check($g('/', $core)['slug'] === 'home' && $g('/vilnius/', $core)['slug'] === 'vilnius', 'core wp_customize/nonce GET params still match the route');
check($g('/', array('wp_customize' => 'off')) === null && $g('/', array('wp_customize' => array('on'))) === null, 'wp_customize must be exactly on');
check($g('/', array('nonce' => 'bad nonce!')) === null && $g('/', array('customize_preview_nonce' => str_repeat('a', 40))) === null, 'nonce shape is validated');
check($g('/', array('p' => '1', 'nonce' => 'abc123XYZ9')) === null, 'nonce does not unlock content-selecting vars');
$args = vensland_preview_args($core + array('customize_preview_nonce' => 'zzzzzz1234'));
check($args === array('customize_changeset_uuid' => $uuid, 'customize_theme' => 't'), 'link args carry uuid+theme only, never nonce or wp_customize');
check(vensland_preview_args(array('theme' => 'x', 'changeset_uuid' => $uuid)) === array('customize_theme' => 'x', 'customize_changeset_uuid' => $uuid), 'theme/changeset_uuid aliases map to customize_*');
$ctx = array('home' => 'https://x.test/', 'pretty' => true, 'assets' => 'https://x.test/wp-content/themes/t/assets', 'preview' => true,
  'args' => array('customize_changeset_uuid' => '12345678-1234-1234-1234-123456789abc', 'customize_theme' => 't'), 'parts' => array('HEAD' => '<!--h-->', 'BODY_OPEN' => '<!--b-->', 'FOOTER' => '<!--f-->'));
$total = 0;
foreach ($m['routes'] as $slug => $r) {
  $html = vensland_read_page($m, $slug); $ctx['slug'] = $slug;
  $out = vensland_render_html($html, $m, $ctx);
  check($out !== null && strpos($out, '%%VL_') === false, "render $slug no tokens left");
  check(strpos($out, 'content="noindex,nofollow"') !== false && strpos($out, '<!--h-->') !== false && strpos($out, '<!--f-->') !== false, "preview robots/hooks $slug");
  check(strpos($out, 'jarvisweb.lt/t/') === false && strpos($out, 'sendBeacon') === false, "no tracking/form endpoint $slug");
  check(strpos($out, 'href="https://x.test/?customize_changeset_uuid=') !== false && !preg_match('#href="https://x\.test/(?!wp-content)[^"?]*"#', $out), "internal links keep preview $slug");
}
$ctx['preview'] = false; $ctx['slug'] = 'aciu';
$out = vensland_render_html(vensland_read_page($m, 'aciu'), $m, $ctx);
check(strpos($out, 'content="noindex,follow"') !== false, 'non-preview keeps approved robots (aciu noindex,follow)');
$ctx['slug'] = 'home'; $out = vensland_render_html(vensland_read_page($m, 'home'), $m, $ctx);
check(strpos($out, 'content="index,follow"') !== false && strpos($out, 'rel="canonical" href="https://vensland.lt/"') !== false, 'non-preview home robots + canonical verbatim');
check(strpos($out, 'src="https://x.test/wp-content/themes/t/assets/foto/1.jpg"') !== false && strpos($out, 'url(https://x.test/wp-content/themes/t/assets/_astro/') !== false, 'asset paths rewritten');
check(vensland_render_html('x', $m, array_merge($ctx, array('assets' => 'javascript:alert(1)"'))) === null, 'unsafe asset base fails closed');
check(vensland_read_page(array('routes' => array('x' => array('file' => '../routes.json'))), 'x') === null, 'page read cannot leave pages/');
exit($fails ? 1 : 0);
