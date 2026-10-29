# VensLand WordPress trial theme

Theme `vensland-trial-20261025` serves the approved static VensLand design (13 routes, frontend f43736a) from WordPress.
Build: `node scripts/wordpress-theme.mjs build --baseline <vensland-approved-static-f43736a.tar.gz> --expect-sha256 3ec1686a…9240 --manifest <baseline manifest.json> --out <NEW dir>`
(verifies archive hash and every file against the manifest, then writes a deterministic ZIP + `.manifest.json`). Tests: `node --test scripts/wordpress-theme.test.mjs`.

## What the adapter changes (and nothing else)
- Asset and internal-link paths become theme/WordPress URLs; page HTML, CSS, text and image bytes are otherwise the approved ones.
- Removed: the tracking beacon module and `jw-endpoint` meta.
- Forms keep their UI, validation and upload list; the submit handler makes **no request** and shows a notice (`Bandomoji versija: užklausa nebuvo išsiųsta ir niekur nesaugoma…`). The form `action` points at its own page; a no-JS POST gets HTTP 405 and nothing is stored. There is no live-delivery mode: that needs a new reviewed package once the Worker/recipient gates close.
- Canonical, title, description, `sitemap.xml`, `robots.txt` are the approved bytes. In Customizer preview the robots meta is `noindex,nofollow` (+ `X-Robots-Tag`).
- Google map keeps its click-to-consent embed (user-initiated; CSP allows only `https://maps.google.com` frames).
- `/paslaugos/` → home `#paslaugos`, `/kontaktai/` → home `#uzklausa` (302; the approved site has no separate pages or a `#kontaktai` anchor).

## Safety model
Route = exact lookup of the normalised path in `routes.json`; file names come only from that table; query keys outside a small allowlist mean "not ours". `/wp-admin`, `wp-login.php`, REST, feeds and every other URL are untouched by routing; non-approved front-end URLs get a neutral English notice (finding: if the theme is ever activated, existing WP posts/pages outside the 13 routes would show it). No options, rewrite rules or DB writes by the theme. While rendering, `wp_head/wp_body_open/wp_footer` keep only WordPress-core callbacks (plugin analytics/pixels are dropped), queued scripts/styles other than Customizer-preview and admin bar are dequeued, and a CSP (`connect-src 'self'`, `form-action 'self'`) is sent.

## Preview and rollback
1. Appearance → Themes → Add Theme → Upload Theme → the ZIP → **Install Now**. Do not click Activate.
2. On the theme's card choose **Live Preview** (Customizer). Never click **Activate & Publish**; close with the X. Links stay inside the preview (state params are carried). Core may create a Customizer changeset row; the theme itself writes nothing.
3. Rollback while inactive: Appearance → Themes → theme details → Delete (or just leave it; it affects nothing). If it were ever activated: re-activate the previous theme (note its name first) and restore the separate full WordPress backup that must exist before activation.
ZIP is ~4.4 MB (photos are incompressible); the host's `upload_max_filesize` must allow it.

## Customizer preview transport (fix1)
Core loads the preview either by GET (`customize_changeset_uuid` + `customize_theme`, or `wp_customize=on&nonce=…`) or by a POST (`wp_customize=on`, `nonce`/`customize_preview_nonce`, `customized`, …). The theme accepts the core GET fields (shape-validated, inert for routing) and exactly one kind of POST: core preview transport, which needs core previewing this theme, `current_user_can('customize')`, `wp_customize=on`, a valid `preview-customize_<theme>` nonce, and only core's own body fields. Anything else, including any enquiry-shaped POST (even with a valid nonce), gets 405 with nothing read or stored. Nonces and `wp_customize` are never copied into links; links carry only changeset uuid, theme and messenger channel.

## Verification (local synthetic WordPress 7.1.3, PHP 8.5, MariaDB; see `src/wordpress-theme/tests/`)
- `node --test scripts/wordpress-theme.test.mjs`: build/ZIP/PHP lint/stub routing.
- `node --test src/wordpress-theme/tests/wp-integration.test.mjs`: real core (needs the fixture): core GET/POST preview, forged POSTs, 13 routes + assets by hash, plain and pretty permalinks, legacy redirects, core/admin routes, plugin-output isolation, protected state unchanged.
- `node src/wordpress-theme/tests/visual-acceptance.mjs <outDir>`: headless Chrome, DNS-blocked except 127.0.0.1, original vs WordPress preview (in a same-origin iframe, as the Customizer does), 360/1440, 13 routes.
Not covered: the theme rendered while *active* (robots/canonical non-preview path is only unit-tested), real hosting, other WordPress versions, real browsers/devices.

## Polish 1 (2026-10-25): upright logo, divider seams, editability
- Logo: `--logo <png> --logo-sha256 <hex>` replaces only `assets/foto/logo.png` (hash-pinned, must be 2172x724 RGBA) and is listed under `overrides` in the manifest. Used: `vensland-upright-v4.png`, sha256 `259fb136…2c6e`. Every placement uses that one file.
- Seams: reproduced natively in headless Chrome (`tests/seam-repro.mjs`); the divider SVG paints after block backgrounds and is anti-aliased on its edge at fractional layout/zoom positions. The packager injects `<style id="vl-seam-fix">`: a 2px strip in the target colour over the bottom edge plus a 1px overlap with the previous section. Silhouette and colours are unchanged; each in-flow divider shortens the page by 1px.
- Editability assessment: see the management receipt `research/vensland-wordpress-polish-2026-10-25/EDITABILITY.md`. Today WordPress Pages/Posts edits (including Hostinger AI MCP) do not change the rendered pages; a "text slots" option is proposed, not built.

## Production launch extension (26 October 2026)
The original trial commands and safety behavior remain supported. Explicit `--mode live` generates routes recursively from the new frozen standalone baseline and packages a separate launch theme. Read [VENSLAND-LAUNCH.md](VENSLAND-LAUNCH.md) for gates, exact differences, tests, backup/activation and rollback. The older statements above about no live mode describe the 25 October baseline only.
