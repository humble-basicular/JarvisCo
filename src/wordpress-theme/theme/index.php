<?php
/**
 * The only template. Allowlisted VensLand routes are rendered by vensland_dispatch();
 * every other front-end URL gets a neutral notice, never a guessed page.
 */
if (!defined('ABSPATH')) {
    exit;
}

vensland_dispatch();
