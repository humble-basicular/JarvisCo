<?php
/**
 * WordPress glue. Registers filters only: no options, no rewrite rules, no database writes, no outbound requests.
 * These hooks exist only while this theme is previewed or active, so an uploaded-but-inactive theme changes nothing.
 */
if (!defined('ABSPATH')) {
    exit;
}

/** Match the current request once. Null means WordPress handles it exactly as it would without this theme. */
function vensland_current_match()
{
    static $done = false;
    static $match = null;
    if (!$done) {
        $done = true;
        $uri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
        $get = array_map('wp_unslash', is_array($_GET) ? $_GET : array());
        $match = vensland_match_request($uri, $get, (string) wp_parse_url(home_url('/'), PHP_URL_PATH), vensland_routes());
    }
    return $match;
}

function vensland_request_method()
{
    return isset($_SERVER['REQUEST_METHOD']) && is_string($_SERVER['REQUEST_METHOD']) ? strtoupper($_SERVER['REQUEST_METHOD']) : 'GET';
}

function vensland_is_preview()
{
    return function_exists('is_customize_preview') && is_customize_preview();
}

function vensland_context($slug)
{
    $preview = vensland_is_preview();
    return array(
        'home' => home_url('/'),
        'pretty' => (bool) get_option('permalink_structure'),
        'assets' => get_theme_file_uri('assets'),
        'preview' => $preview,
        'args' => $preview ? vensland_preview_args(array_merge(vensland_post_state(), array_map('wp_unslash', $_GET))) : array(),
        'slug' => $slug,
        'parts' => array(),
    );
}

/** Preview state carried in a core preview POST body (never the nonce); empty unless the POST is authorised. */
function vensland_post_state()
{
    return vensland_authorized_preview_post() ? array_map('wp_unslash', array_intersect_key($_POST, array_flip(array('customize_changeset_uuid', 'customize_theme', 'theme', 'customize_messenger_channel', 'customize_autosaved')))) : array();
}

/**
 * The one POST the theme accepts: WordPress core's own Customizer preview transport. All of these must hold:
 * core is previewing this theme, the user may customize, wp_customize=on, a valid session-bound preview nonce, and
 * the body contains only core's transport fields. An enquiry-shaped POST (name/phone/message/files...) therefore
 * never qualifies, and nothing in the body is read, stored or forwarded.
 */
function vensland_authorized_preview_post()
{
    static $transport = array('wp_customize', 'customize_theme', 'theme', 'nonce', 'customize_preview_nonce', 'customize_changeset_uuid', 'changeset_uuid', 'customize_autosaved', 'customized', 'customize_messenger_channel');
    if (!vensland_is_preview() || !current_user_can('customize') || !isset($_POST['wp_customize']) || wp_unslash($_POST['wp_customize']) !== 'on') {
        return false;
    }
    foreach (array_keys($_POST) as $key) {
        if (!in_array($key, $transport, true)) {
            return false;
        }
    }
    $action = 'preview-customize_' . get_stylesheet();
    foreach (array('nonce', 'customize_preview_nonce') as $field) {
        if (isset($_POST[$field]) && is_string($_POST[$field]) && wp_verify_nonce(wp_unslash($_POST[$field]), $action)) {
            return true;
        }
    }
    return false;
}

function vensland_send_headers(array $headers)
{
    if (headers_sent()) {
        return;
    }
    foreach ($headers as $name => $value) {
        header($name . ': ' . $value, true);
    }
}

function vensland_capture($tag)
{
    ob_start();
    do_action($tag);
    return (string) ob_get_clean();
}

function vensland_send_page($slug)
{
    $manifest = vensland_routes();
    $html = vensland_read_page($manifest, $slug, vensland_is_preview());
    if ($html === null) {
        status_header(500);
        echo vensland_fallback_html(home_url('/'));
        return;
    }
    $ctx = vensland_context($slug);
    vensland_isolate_output();
    $ctx['parts'] = array(
        'HEAD' => vensland_capture('wp_head'),
        'BODY_OPEN' => vensland_capture('wp_body_open'),
        'FOOTER' => vensland_capture('wp_footer'),
    );
    $out = vensland_render_html($html, $manifest, $ctx);
    if ($out === null) {
        status_header(500);
        echo vensland_fallback_html(home_url('/'));
        return;
    }
    global $wp_query;
    if ($wp_query instanceof WP_Query) {
        $wp_query->is_404 = ($manifest['routes'][$slug]['status'] ?? 200) === 404;
    }
    status_header($manifest['routes'][$slug]['status'] ?? 200);
    if (($manifest['routes'][$slug]['status'] ?? 200) === 404) nocache_headers();
    vensland_send_headers(vensland_security_headers($ctx['preview'], ($manifest['mode'] ?? 'trial') === 'live'));
    echo $out;
}

/** index.php entry point. */
function vensland_dispatch()
{
    $match = vensland_current_match();
    if ($match && $match['kind'] === 'page') {
        vensland_send_page($match['slug']);
        return;
    }
    echo vensland_fallback_html(home_url('/'));
}

/** Pre-empt core before it 404s, canonicalises or guesses a redirect for an approved route. */
function vensland_filter_pre_handle_404($preempt, $query = null)
{
    $match = vensland_current_match();
    if (!$match) return $preempt;
    // Nested static paths can look like missing attachments to WP. Clear stale query flags before
    // core's shortlink/header callbacks try to read a nonexistent post. No post or DB row is invented.
    $query = $GLOBALS['wp_query'] ?? null;
    if ($match['kind'] === 'page' && $query instanceof WP_Query) {
        $query->init_query_flags();
        $routes = vensland_routes();
        $query->is_404 = ($routes['routes'][$match['slug']]['status'] ?? 200) === 404;
    }
    return true;
}

function vensland_filter_redirect_canonical($redirect_url)
{
    return vensland_current_match() ? false : $redirect_url;
}

/** Runs before core's template_redirect work (canonical redirects, core sitemap): legacy links, sitemap, method guard. */
function vensland_action_template_redirect()
{
    $match = vensland_current_match();
    if (!$match) {
        return;
    }
    // A late redirect_canonical filter runs after core has already dereferenced missing attachments.
    // Skip the callback entirely only for this theme's exact routes/404s.
    remove_action('template_redirect', 'redirect_canonical');
    if (!in_array(vensland_request_method(), array('GET', 'HEAD'), true) && !($match['kind'] === 'page' && vensland_authorized_preview_post())) {
        status_header(405);
        nocache_headers();
        header('Allow: GET, HEAD');
        header('Content-Type: text/plain; charset=UTF-8');
        echo "Method not allowed. This WordPress URL does not receive enquiries; use the page form. Nothing was received or stored.\n";
        exit;
    }
    $manifest = vensland_routes();
    if (($manifest['mode'] ?? 'trial') === 'live' && !vensland_is_preview()) {
        $target = vensland_host_redirect(isset($_SERVER['HTTP_HOST']) ? wp_unslash($_SERVER['HTTP_HOST']) : '', isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '', home_url('/'));
        if ($target !== null) {
            wp_redirect($target, 301, 'VensLand theme');
            exit;
        }
    }
    if ($match['kind'] === 'legacy' || $match['kind'] === 'migration') {
        $ctx = vensland_context($match['slug']);
        $url = vensland_route_url($manifest, $match['slug'], $ctx, $ctx['args'], $match['fragment']);
        if ($url !== null) {
            wp_safe_redirect($url, $match['kind'] === 'migration' && !vensland_is_preview() ? 301 : 302, 'VensLand theme');
            exit;
        }
    } elseif ($match['kind'] === 'sitemap') {
        $xml = is_readable(__DIR__ . '/../data/sitemap.xml') ? file_get_contents(__DIR__ . '/../data/sitemap.xml') : false;
        if (is_string($xml)) {
            status_header(200);
            vensland_send_headers(array('Content-Type' => 'application/xml; charset=UTF-8', 'X-Content-Type-Options' => 'nosniff'));
            echo $xml;
            exit;
        }
    }
}

/** Approved robots.txt, unless the site owner chose "discourage search engines" (then core's own output stays). */
function vensland_filter_robots_txt($output, $is_public)
{
    $file = __DIR__ . '/../data/robots.txt';
    if ($is_public && is_readable($file)) {
        $text = file_get_contents($file);
        if (is_string($text)) {
            return $text;
        }
    }
    return $output;
}

add_filter('pre_handle_404', 'vensland_filter_pre_handle_404', 1, 2);
add_filter('redirect_canonical', 'vensland_filter_redirect_canonical', 1);
add_action('template_redirect', 'vensland_action_template_redirect', 0);
add_filter('robots_txt', 'vensland_filter_robots_txt', 99, 2);
