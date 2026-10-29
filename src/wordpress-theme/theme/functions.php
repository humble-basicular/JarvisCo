<?php
/**
 * VensLand trial theme bootstrap. Nothing runs on activation (no options, no rewrite rules).
 */
if (!defined('ABSPATH')) {
    exit;
}

if (!defined('VENSLAND_THEME_VERSION')) {
    define('VENSLAND_THEME_VERSION', '0.1.1');
}

require_once __DIR__ . '/inc/routing.php';
require_once __DIR__ . '/inc/render.php';
require_once __DIR__ . '/inc/isolation.php';
require_once __DIR__ . '/inc/hooks.php';
