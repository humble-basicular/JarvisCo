<?php
/**
 * Route table and request matching. Pure functions: no WordPress calls, so they can be tested without core.
 *
 * Security model: a request is never mapped to a file name. The path is normalised, then looked up as an exact
 * key in the route table produced at build time (routes.json). Only the table's own file names are read.
 */
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Query keys that never change which route is served. Anything else means "not our request".
 * Includes the core Customizer transport fields (wp_customize, nonce, ...): they are inert for routing, validated
 * here by shape only, and authorised by core itself. Nonces are never copied into links (see vensland_preview_args).
 */
function vensland_query_rules()
{
    $token = '/^[A-Za-z0-9._-]{1,100}$/';
    $uuid = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
    return array(
        // Preview state that follows internal links.
        'customize_changeset_uuid' => $uuid,
        'customize_theme' => $token,
        'customize_messenger_channel' => $token,
        'customize_autosaved' => '/^on$/',
        'wp_theme_preview' => $token,
        // Core Customizer transport: accepted for routing, never propagated.
        'wp_customize' => '/^on$/',
        'theme' => $token,
        'changeset_uuid' => $uuid,
        'nonce' => '/^[A-Za-z0-9]{6,32}$/',
        'customize_preview_nonce' => '/^[A-Za-z0-9]{6,32}$/',
        // Route and page parameters.
        'vl_route' => '/^[a-z0-9-]{1,120}$/',
        'receipt' => '/^[A-Za-z0-9._-]{1,100}$/',
        'klaida' => '/^1$/',
    );
}

function vensland_allowed_query($key, $value)
{
    $rules = vensland_query_rules();
    if (!is_string($key)) {
        return false;
    }
    if (isset($rules[$key])) {
        return is_string($value) && preg_match($rules[$key], $value) === 1;
    }
    // Campaign parameters are ignored, not interpreted.
    return (preg_match('/^utm_[a-z0-9_]{1,30}$/', $key) === 1 || $key === 'fbclid' || $key === 'gclid') && is_string($value) && strlen($value) <= 300;
}

/** Customizer preview state that must follow every internal link. Values are validated; nonces are never included. */
function vensland_preview_args(array $get)
{
    $rules = vensland_query_rules();
    $out = array();
    foreach (array('customize_changeset_uuid', 'customize_theme', 'customize_messenger_channel', 'customize_autosaved', 'wp_theme_preview') as $key) {
        if (isset($get[$key]) && is_string($get[$key]) && preg_match($rules[$key], $get[$key]) === 1) {
            $out[$key] = $get[$key];
        }
    }
    if (!isset($out['customize_theme']) && isset($get['theme']) && is_string($get['theme']) && preg_match($rules['theme'], $get['theme']) === 1) {
        $out['customize_theme'] = $get['theme'];
    }
    if (!isset($out['customize_changeset_uuid']) && isset($get['changeset_uuid']) && is_string($get['changeset_uuid']) && preg_match($rules['changeset_uuid'], $get['changeset_uuid']) === 1) {
        $out['customize_changeset_uuid'] = $get['changeset_uuid'];
    }
    return $out;
}

/** Load and validate routes.json once. Returns null (fail closed) on any problem. */
function vensland_load_routes($file)
{
    $raw = is_readable($file) ? file_get_contents($file) : false;
    $data = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($data) || !isset($data['version']) || $data['version'] !== 1 || !isset($data['routes']) || !is_array($data['routes']) || !$data['routes']) {
        return null;
    }
    foreach ($data['routes'] as $slug => $route) {
        if (!is_string($slug) || preg_match('/^[a-z0-9-]{1,120}$/', $slug) !== 1 || !is_array($route)
            || !isset($route['path'], $route['file'], $route['robots'], $route['canonical'])
            || !is_string($route['path']) || preg_match('#^(|404\.html|[a-z0-9-]+(?:/[a-z0-9-]+)*)$#', $route['path']) !== 1
            || !is_string($route['file']) || preg_match('/^[a-z0-9-]{1,120}\.html$/', $route['file']) !== 1
            || !is_string($route['robots']) || preg_match('/^[a-z, ]{1,60}$/', $route['robots']) !== 1) {
            return null;
        }
    }
    if (!isset($data['routes']['home']) || $data['routes']['home']['path'] !== '') {
        return null;
    }
    $data['legacy'] = isset($data['legacy']) && is_array($data['legacy']) ? $data['legacy'] : array();
    foreach ($data['legacy'] as $from => $to) {
        if (!is_string($from) || preg_match('/^[a-z0-9-]{1,120}$/', $from) !== 1 || !is_array($to)
            || !isset($to['route'], $to['fragment']) || !isset($data['routes'][$to['route']])
            || !is_string($to['fragment']) || preg_match('/^[a-z0-9-]{1,120}$/', $to['fragment']) !== 1) {
            return null;
        }
    }
    if (isset($data['mode']) && !in_array($data['mode'], array('trial', 'live'), true)) return null;
    foreach ($data['routes'] as $route) {
        if (isset($route['previewFile']) && (!is_string($route['previewFile']) || preg_match('/^[a-z0-9-]{1,140}\.html$/', $route['previewFile']) !== 1)) return null;
    }
    $data['migrations'] = isset($data['migrations']) && is_array($data['migrations']) ? $data['migrations'] : array();
    foreach ($data['migrations'] as $from => $to) {
        if (!is_string($from) || preg_match('#^[a-z0-9-]+(?:/[a-z0-9-]+)*$#', $from) !== 1 || !is_array($to) || !isset($to['route']) || !isset($data['routes'][$to['route']]) || !is_string($to['fragment'] ?? '') || preg_match('/^[a-z0-9-]*$/', $to['fragment'] ?? '') !== 1) return null;
    }
    return $data;
}

function vensland_routes()
{
    static $cache = false;
    if ($cache === false) {
        $cache = vensland_load_routes(dirname(__DIR__) . '/routes.json');
    }
    return $cache;
}

/**
 * Request URI -> path relative to the WordPress home path ('' is the front page), or null if the URI is not a
 * plain, well-formed path (control characters, backslashes, dot segments, empty segments, bad UTF-8).
 */
function vensland_relative_path($request_uri, $home_path)
{
    if (!is_string($request_uri) || $request_uri === '' || strlen($request_uri) > 2048 || strpos($request_uri, '//') === 0) {
        return null;
    }
    $path = parse_url($request_uri, PHP_URL_PATH);
    if (!is_string($path) || $path === '' || $path[0] !== '/') {
        return null;
    }
    $decoded = rawurldecode($path);
    if (preg_match('//u', $decoded) !== 1 || preg_match('/[\x00-\x1f\x7f\\\\]/', $decoded) === 1) {
        return null;
    }
    $base = rtrim('/' . trim((string) $home_path, '/'), '/');
    if ($base !== '') {
        if ($decoded === $base) {
            $decoded = '/';
        } elseif (strpos($decoded, $base . '/') === 0) {
            $decoded = substr($decoded, strlen($base));
        } else {
            return null;
        }
    }
    if ($decoded === '/index.php') {
        $decoded = '/';
    } elseif (strpos($decoded, '/index.php/') === 0) {
        $decoded = substr($decoded, strlen('/index.php'));
    }
    $rel = substr($decoded, 1);
    if ($rel !== '' && substr($rel, -1) === '/') {
        $rel = substr($rel, 0, -1);
    }
    if ($rel === '') {
        return '';
    }
    foreach (explode('/', $rel) as $segment) {
        if ($segment === '' || $segment === '.' || $segment === '..') {
            return null;
        }
    }
    return $rel;
}

/**
 * Decide what a request is. Returns null (not ours: WordPress handles it) or one of
 *   array('kind' => 'page', 'slug' => ...)
 *   array('kind' => 'sitemap')
 *   array('kind' => 'legacy', 'slug' => <target route>, 'fragment' => ...)
 * Method handling is the caller's job: this only classifies the URL.
 */
function vensland_match_request($request_uri, array $get, $home_path, $manifest)
{
    if (!is_array($manifest)) {
        return null;
    }
    $live = isset($manifest['mode']) && $manifest['mode'] === 'live';
    $rel = vensland_relative_path($request_uri, $home_path);
    if ($rel === null) return null;
    // WordPress infrastructure, REST, feeds and core sitemaps always keep their core handling.
    if (preg_match('#^(wp-admin|wp-json|wp-content|wp-includes)(/|$)|(^|/)(feed|comments/feed)(/|$)|^wp-[^/]+\.php$|^wp-sitemap(?:[-.]|$)|^xmlrpc\.php$|^robots\.txt$#', $rel)
        || isset($get['rest_route']) || isset($get['feed']) || isset($get['sitemap']) || isset($get['sitemap-stylesheet'])) return null;
    foreach ($get as $key => $value) {
        if (!vensland_allowed_query($key, $value)) {
            // Preserve trial query isolation. In live mode ordinary query strings cannot bypass a page/404.
            if (!$live || preg_match('/^(customize_|wp_customize|nonce|vl_route|theme|changeset_uuid)/', (string) $key)) return null;
            if (in_array($key, array('p', 'page_id', 'name', 'pagename', 's', 'author', 'cat', 'tag', 'attachment_id'), true)) return array('kind' => 'page', 'slug' => 'not-found');
        }
    }
    if ($rel === '' && isset($get['vl_route'])) {
        $slug = $get['vl_route'];
        if (is_string($slug) && preg_match('/^[a-z0-9-]{1,120}$/', $slug) === 1 && isset($manifest['routes'][$slug]) && $slug !== 'home') {
            return array('kind' => 'page', 'slug' => $slug);
        }
        return $live ? array('kind' => 'page', 'slug' => 'not-found') : null;
    }
    if ($live && isset($manifest['migrations'][$rel])) {
        $to = $manifest['migrations'][$rel];
        return array('kind' => 'migration', 'slug' => $to['route'], 'fragment' => $to['fragment'] ?? '');
    }
    foreach ($manifest['routes'] as $slug => $route) {
        if ($route['path'] === $rel) {
            return array('kind' => 'page', 'slug' => $slug);
        }
    }
    if ($rel === 'sitemap.xml' && !empty($manifest['sitemap'])) {
        return array('kind' => 'sitemap');
    }
    if (isset($manifest['legacy'][$rel])) {
        return array('kind' => 'legacy', 'slug' => $manifest['legacy'][$rel]['route'], 'fragment' => $manifest['legacy'][$rel]['fragment']);
    }
    return $live ? array('kind' => 'page', 'slug' => 'not-found') : null;
}

/**
 * URL of an approved route. $ctx = array('home' => home_url('/'), 'pretty' => bool). With plain permalinks the
 * route travels in ?vl_route= (no rewrite rules are ever added). Returns null for an unknown slug.
 */
function vensland_route_url($manifest, $slug, array $ctx, array $args = array(), $fragment = '')
{
    if (!is_array($manifest) || !is_string($slug) || !isset($manifest['routes'][$slug])) {
        return null;
    }
    $path = $manifest['routes'][$slug]['path'];
    $home = rtrim($ctx['home'], '/') . '/';
    if ($path === '') {
        $url = $home;
    } elseif (!empty($ctx['pretty'])) {
        $url = $home . $path . ($path === '404.html' ? '' : '/');
    } else {
        $url = $home;
        $args = array_merge(array('vl_route' => $slug), $args);
    }
    if ($args) {
        $url .= '?' . http_build_query($args, '', '&', PHP_QUERY_RFC3986);
    }
    if ($fragment !== '') {
        $url .= '#' . rawurlencode($fragment);
    }
    return $url;
}

/**
 * Live-mode host canonicalisation (www.vensland.lt -> vensland.lt). Returns the 301 target on the home host with
 * the same path and query, or null when the request host already matches or either input is malformed.
 */
function vensland_host_redirect($request_host, $request_uri, $home_url)
{
    $home_host = is_string($home_url) ? parse_url($home_url, PHP_URL_HOST) : null;
    $scheme = is_string($home_url) ? parse_url($home_url, PHP_URL_SCHEME) : null;
    if (!is_string($home_host) || $home_host === '' || !in_array($scheme, array('http', 'https'), true)
        || !is_string($request_host) || preg_match('/^[A-Za-z0-9.-]{1,253}(?::[0-9]{1,5})?$/', $request_host) !== 1
        || !is_string($request_uri) || $request_uri === '' || $request_uri[0] !== '/' || strpos($request_uri, '//') === 0
        || preg_match('/[\x00-\x20\x7f]/', $request_uri) === 1) {
        return null;
    }
    $host = strtolower(preg_replace('/:[0-9]+$/', '', $request_host));
    $home_host = strtolower($home_host);
    if ($host === $home_host || $host !== 'www.' . $home_host) {
        return null;
    }
    return $scheme . '://' . $home_host . $request_uri;
}
