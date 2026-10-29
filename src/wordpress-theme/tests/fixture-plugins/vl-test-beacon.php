<?php
/* TEST-ONLY mu-plugin for the local synthetic fixture: pretends to be a third-party analytics/pixel plugin.
   Active only for requests carrying the header X-VL-Test-Inject: 1; the host name tracker.invalid never resolves. */
if (!isset($_SERVER['HTTP_X_VL_TEST_INJECT'])) {
    return;
}
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script('vl-beacon-enq', 'https://tracker.invalid/enq.js', array(), null, false);
    wp_enqueue_style('vl-beacon-css', 'https://tracker.invalid/enq.css');
});
add_action('wp_head', function () { echo '<script id="vl-beacon-head">navigator.sendBeacon("https://tracker.invalid/head")</script>'; }, 1);
add_action('wp_head', function () { echo '<meta name="vl-beacon-meta" content="tracker.invalid">'; }, 99);
add_action('wp_body_open', function () { echo '<img id="vl-beacon-pixel" src="https://tracker.invalid/p.gif">'; });
add_action('wp_footer', function () { echo '<script id="vl-beacon-foot">fetch("https://tracker.invalid/foot")</script>'; }, 5);
add_action('wp_footer', 'vl_beacon_named_footer', 50);
function vl_beacon_named_footer() { echo '<!--vl-beacon-named tracker.invalid-->'; }
