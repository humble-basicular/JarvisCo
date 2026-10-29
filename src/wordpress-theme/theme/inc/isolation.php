<?php
/**
 * Keeps third-party code out of the rendered VensLand pages. Plugins routinely print analytics, pixels, chat
 * widgets and consent banners from wp_head / wp_footer; the approved pages carry none of that, and the trial must
 * make no outbound calls. Only WordPress core callbacks (and the Customizer preview they power) are kept.
 */
if (!defined('ABSPATH')) {
    exit;
}

/** Core wp_head output that would duplicate or contradict the approved page head. */
function vensland_denied_core_callbacks()
{
    return array(
        'wp_print_speculation_rules', 'wp_generator', 'rel_canonical', 'wp_robots', 'noindex', 'feed_links', 'feed_links_extra', 'rsd_link', 'wlwmanifest_link',
        'wp_shortlink_wp_head', 'rest_output_link_wp_head', 'wp_oembed_add_discovery_links', 'wp_resource_hints',
        'wp_preload_resources', 'print_emoji_detection_script', 'wp_enqueue_emoji_styles', 'wp_site_icon', 'locale_stylesheet',
        'adjacent_posts_rel_link_wp_head', '_wp_render_title_tag', 'wp_custom_css_cb', 'wp_enqueue_global_styles',
        'wp_enqueue_block_template_skip_link', 'the_block_template_skip_link', 'wp_print_font_faces', 'wp_enqueue_classic_theme_styles',
    );
}

/** True when the callback is declared in WordPress core (wp-includes or wp-admin) and is not a denied head item. */
function vensland_callback_allowed($callback)
{
    try {
        if ($callback instanceof Closure) {
            $reflection = new ReflectionFunction($callback);
        } elseif (is_string($callback) && strpos($callback, '::') === false) {
            if (in_array($callback, vensland_denied_core_callbacks(), true)) {
                return false;
            }
            $reflection = new ReflectionFunction($callback);
        } elseif (is_array($callback) && count($callback) === 2 && (is_object($callback[0]) || is_string($callback[0])) && is_string($callback[1])) {
            $reflection = new ReflectionMethod($callback[0], $callback[1]);
        } else {
            return false;
        }
        $file = $reflection->getFileName();
    } catch (Throwable $e) {
        return false;
    }
    if (!is_string($file) || $file === '') {
        return false;
    }
    $file = wp_normalize_path($file);
    $abspath = wp_normalize_path(ABSPATH);
    return strpos($file, $abspath . WPINC . '/') === 0 || strpos($file, $abspath . 'wp-admin/') === 0;
}

function vensland_prune_hook($tag)
{
    global $wp_filter;
    if (!isset($wp_filter[$tag]) || !($wp_filter[$tag] instanceof WP_Hook)) {
        return;
    }
    $remove = array();
    foreach ($wp_filter[$tag]->callbacks as $priority => $callbacks) {
        foreach ($callbacks as $entry) {
            if (!vensland_callback_allowed($entry['function'])) {
                $remove[] = array($entry['function'], $priority);
            }
        }
    }
    foreach ($remove as $item) {
        remove_action($tag, $item[0], $item[1]);
    }
}

/** Queue handles that may stay: the Customizer preview scripts/styles and the admin bar for logged-in users. */
function vensland_asset_handle_allowed($handle)
{
    return is_string($handle) && preg_match('/^(customize-|admin-bar$)/', $handle) === 1;
}

function vensland_prune_assets()
{
    foreach (array(wp_scripts(), wp_styles()) as $dependencies) {
        foreach ($dependencies->queue as $handle) {
            if (!vensland_asset_handle_allowed($handle)) {
                $dependencies->dequeue($handle);
            }
        }
    }
}

/** Call once, right before the page's wp_head/wp_body_open/wp_footer output is captured. */
function vensland_isolate_output()
{
    foreach (array('wp_head', 'wp_body_open', 'wp_footer') as $tag) {
        vensland_prune_hook($tag);
    }
    // Plugins may enqueue late (inside wp_head / wp_footer): prune again just before WordPress prints.
    add_action('wp_head', 'vensland_prune_assets', 7);
    add_action('wp_footer', 'vensland_prune_assets', 1);
}
