<?php
/**
 * Page rendering: approved HTML with %%VL_*%% tokens -> final document. No WordPress state is read here
 * except through the escaping helpers (esc_url / esc_attr), which core provides.
 */
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Read a page body from pages/. The file name comes from the validated route table, and the real path must
 * stay inside pages/ (defence in depth against a tampered routes.json).
 */
function vensland_read_page($manifest, $slug, $preview = false)
{
    if (!is_array($manifest) || !is_string($slug) || !isset($manifest['routes'][$slug])) {
        return null;
    }
    $dir = realpath(dirname(__DIR__) . '/pages');
    $file = $dir === false ? false : realpath($dir . '/' . ($preview && isset($manifest['routes'][$slug]['previewFile']) ? $manifest['routes'][$slug]['previewFile'] : $manifest['routes'][$slug]['file']));
    if ($file === false || strpos($file, $dir . DIRECTORY_SEPARATOR) !== 0 || !is_file($file)) {
        return null;
    }
    $html = file_get_contents($file);
    return is_string($html) ? $html : null;
}

/**
 * Asset base URL must be a plain absolute URL made of URL-safe characters: it is written into HTML attributes
 * and into CSS url(), so anything else fails closed.
 */
function vensland_safe_asset_base($url)
{
    $url = rtrim((string) $url, '/');
    return preg_match('#^https?://[A-Za-z0-9.:/_~%@+-]+$#', $url) === 1 ? $url : null;
}

/**
 * Resolve tokens in one pass (replacement text is never rescanned).
 * $ctx: home, pretty, assets (base URL), preview (bool), args (preview query args), slug (current route),
 *       parts (HEAD / BODY_OPEN / FOOTER markup captured from WordPress).
 */
function vensland_render_html($html, $manifest, array $ctx)
{
    $assets = vensland_safe_asset_base($ctx['assets']);
    if ($assets === null || !is_string($html) || !isset($manifest['routes'][$ctx['slug']])) {
        return null;
    }
    $robots = $ctx['preview'] ? 'noindex,nofollow' : $manifest['routes'][$ctx['slug']]['robots'];
    $args = $ctx['preview'] ? $ctx['args'] : array();
    return preg_replace_callback(
        '/%%VL_([A-Z_]+)(?::([a-z0-9-]+))?%%/',
        function ($m) use ($manifest, $ctx, $assets, $robots, $args) {
            switch ($m[1]) {
                case 'ASSET':
                    return $assets;
                case 'URL':
                    $url = isset($m[2]) ? vensland_route_url($manifest, $m[2], $ctx, $args) : null;
                    return $url === null ? '' : esc_url($url);
                case 'SELF':
                    return esc_url((string) vensland_route_url($manifest, $ctx['slug'], $ctx, $args));
                case 'ROBOTS':
                    return esc_attr($robots);
                case 'HEAD':
                case 'BODY_OPEN':
                case 'FOOTER':
                    return isset($ctx['parts'][$m[1]]) ? $ctx['parts'][$m[1]] : '';
            }
            return '';
        },
        $html
    );
}

/**
 * Response headers for a rendered page. connect-src/form-action 'self' make a stray beacon or form post fail in the
 * browser even if some script tried one; frames are limited to the consent-gated Google map the approved page already has.
 */
function vensland_security_headers($preview, $live = false)
{
    $headers = array(
        'Content-Type' => 'text/html; charset=UTF-8',
        'X-Content-Type-Options' => 'nosniff',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        'Content-Security-Policy' => "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src https://maps.google.com https://www.google.com; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'",
    );
    if ($live && !$preview) {
        $headers['Content-Security-Policy'] = str_replace(
            array("script-src 'self' 'unsafe-inline'", "frame-src https://maps.google.com https://www.google.com", "connect-src 'self'"),
            array("script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com", "frame-src https://maps.google.com https://www.google.com https://challenges.cloudflare.com", "connect-src 'self' https://challenges.cloudflare.com"),
            $headers['Content-Security-Policy']
        );
        $headers['Content-Security-Policy'] = str_replace("connect-src 'self'", "connect-src 'self' https://jarvisweb.lt https://www.jarvisweb.lt", $headers['Content-Security-Policy']);
        $headers['Content-Security-Policy'] = str_replace("form-action 'self'", "form-action 'self' https://www.jarvisweb.lt", $headers['Content-Security-Policy']);
    }
    if ($preview) {
        $headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive';
    }
    return $headers;
}

/** Neutral notice for front-end URLs that are not part of the approved page set. Fixed text, no request data echoed. */
function vensland_fallback_html($home_url)
{
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex,nofollow"><title>VensLand trial theme</title></head><body>'
        . '<p>This address is not one of the 13 VensLand trial pages.</p>'
        . '<p><a href="' . esc_url($home_url) . '">VensLand</a></p></body></html>';
}
