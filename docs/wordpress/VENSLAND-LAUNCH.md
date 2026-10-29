# VensLand WordPress launch — lead runbook (26 October 2026)

This is a **locally tested launch candidate, not authorization or proof of a live launch**. The implementation task never accessed live administration or changed WordPress, Worker, DNS or accounts. Lead owns review, backup, configuration, installation, activation and live verification. Stop before activation if any gate below is open.

## Candidate and prerequisites

- Approved source: `release/seo-services-20261026`, `ed988f7`, ignored `previews/aewz4kawy3.json` and `public/previews/aewz4kawy3/`; original upright logo SHA-256 `259fb13675f523acb98c37f7f4fbe2d710ffe53957d5b0db9e8e8525bb4b2c6e`. The standalone builder optimizes the delivered logo; its delivered asset hash is in the baseline manifest.
- Private Drive project folder: `Business/JarvisWeb/previews/vensland/wordpress-launch-20261026/`. `candidate/vensland-launch-20261026.zip` + `.manifest.json`; `baseline/` holds the hash-verified standalone archive and per-file manifest; `acceptance/` holds local test evidence/screens. Use the receipt's final hashes, not an older candidate.
- Adapter branch: `client/vensland-wordpress-launch-20261026` from `99c0fe2`. Both modes reuse the same adapter. Default is still `trial`; explicit `--mode live` selects a distinct theme slug `vensland-launch-20261026`.
- Need WordPress administrator plus Hostinger file/database backup and restore access. Have working SFTP/file manager and database access independent of WordPress before starting. Record WordPress/PHP versions, active plugins, `hostinger-ai-theme` version, permalink settings, homepage settings, search-engine visibility, caching and coming-soon configuration. Local acceptance uses WordPress 7.1.3/PHP 8.5; host versions/plugins remain unverified.
- The package is about 23 MB. Confirm PHP upload/post limits and available disk space; use host-supported theme upload/file-manager extraction if needed. Theme directory must contain `style.css` directly, not another nested theme folder.

## Gates before activation

1. **Worker/mail:** register and verify the site and intended destinations below, then rebuild standalone without `--pending-worker` and repackage/retest. Current baseline explicitly has `workerRegistered:false`.
2. **Privacy:** the supplied draft says “Svetainė talpinama Cloudflare Pages”, but the requested host is WordPress/Hostinger. Lead must obtain/record correct hosting/controller/recipient facts, update the private launch config, and rebuild the approved standalone baseline and package. This candidate preserves approved bytes; it does not silently change the client's text. Recipient `info@vensland.lt` is unverified.
3. **Inventory:** public GETs currently return Hostinger's `Netrukus` HTML for home, pages, robots and sitemap requests. Public REST pages/posts reveal only home, `/paslaugos/`, `/kontaktai/`. Compare a fresh authenticated WordPress page/post export and plugin-generated URLs with the receipt. If further public URLs exist, map them to the most specific new service/town page, rebuild with the revised migration map, and retest. An undiscovered URL has no claimed migration coverage.
4. **WordPress:** verified full backup and isolated restore rehearsal; read-only lead review of source/receipt; local tests green on the final rebuilt ZIP. Ensure pretty permalinks route nested paths to WordPress. No runtime rewrite/option/DB changes are made by the theme.
5. **Hostinger/caches:** coming-soon mode presently hides the site. Lead must explicitly disable it in the authorized activation window and purge Hostinger/LiteSpeed/other relevant caches. Theme activation alone may leave the holding page visible. Record previous settings for rollback.

## Full WordPress backup — before any installation/settings change

1. Record timestamp/timezone, domain, active theme `hostinger-ai-theme`, plugins/versions, document root, DB name/prefix, WordPress/PHP versions and current settings. Export screenshots/settings without passwords. Preserve existing plugin/host backup separately; never overwrite the only backup.
2. Create a full Hostinger backup if available. Download **all WordPress files** through the host's backup/file manager/SFTP: root files including `.htaccess`, `wp-config.php`, hidden files, `wp-content` (all themes including Hostinger AI, plugins, mu-plugins, uploads, languages and caches as available), `wp-admin`, `wp-includes`. Keep credentials in the private backup only, never git or chat. Include relevant files outside document root if the host uses them.
3. Export the **entire matching database**, all tables, structure + data, in one consistent snapshot (Hostinger/phpMyAdmin export or host-supported `mysqldump --single-transaction --routines --triggers --events`). Do not expose credentials in command history. Match database to this site's `wp-config.php`; include nonstandard/plugin tables. For nontransactional tables use the host's consistent snapshot/maintenance procedure. No public traffic/data writes between paired file and DB snapshots; if needed use a brief maintenance window.
4. Download files archive and SQL dump to the private existing Drive launch backup folder. Record source, start/end times, bytes, SHA-256, table list/row counts, upload count and `.htaccess`/config presence. Validate archive listing and integrity (`unzip -t` or `gzip -t`/`tar -tzf` as appropriate); check SQL is nonempty and ends normally. Compare downloaded hashes twice.
5. **Verify by restoring to an isolated local or private staging clone**, with outgoing mail/webhooks disabled and external form/beacon requests blocked. Import SQL into an empty separate DB and restore files; adjust clone URL/config only in the clone. Verify administrator login, homepage, `/paslaugos/`, `/kontaktai/`, media, theme/plugin inventory, settings and representative DB row counts. A “backup created” badge alone does not prove recoverability.
6. Keep the verified originals immutable. Record the restore location, tested commands, expected restoration time and operator. Do not proceed without working restore access and a matching file+DB pair.

## Worker registration prerequisites (lead only)

Follow the existing tracking infrastructure runbook; do not deploy from this WordPress task.

- Site key `vensland`; form `https://www.jarvisweb.lt/t/form` (`kind=site_inquiry`, `site=vensland`, honeypot `website`, multipart `files`), event endpoint meta `https://www.jarvisweb.lt/t/e`. Preserve the standalone tracker module, which also contains `https://jarvisweb.lt/t/e`; CSP permits those two exact origins.
- Allowed origins exactly `https://vensland.lt` and `https://www.vensland.lt` (no wildcard). Confirm scheme and apex/www behavior against actual host HTTPS. Origin allowlisting is for both form and event handling as required by the existing Worker contract.
- Verify the intended client mailbox **exists and receives mail**: `info@vensland.lt`. Verify owner destination `matas@jarvisweb.lt` and owner-forwarding routing. Do not use the draft recipient array as evidence of verification. Preserve existing Hostinger MX; no DNS change is required for the theme.
- In the existing Worker deployment, register site/origins in `SITES`/the canonical site configuration and private per-site recipient map/allowlist using the current infra tooling. Preserve other sites, rate limits, honeypot handling, upload limits, D1/R2 retention and notification/error behavior. Capture previous Worker version and rollback configuration first.
- Read back deployed site/origins/recipients, privacy and consent configuration; only then set `worker.configured:true` in the private launch config. Retain evidence. Rebuild standalone **without** `--pending-worker`, rerun deploy checks, freeze new archive/file hashes, and rebuild/test this theme against that baseline.
- A labelled end-to-end inquiry with one small attachment and both inbox receipts remains lead-owned and requires task authorization for the real submission. Current tests intercept all Worker traffic locally; no real inquiry or email was sent.

## Reproduce build and local acceptance

Use `/opt/homebrew/bin/node` (Node 26). In the approved source worktree, read/build only into its ignored output directories:

```sh
/opt/homebrew/bin/node scripts/client-site.mjs previews/aewz4kawy3.json --site vensland --domain vensland.lt --config '<private launch-config.json>' --pending-worker
```

Remove `--pending-worker` only after the Worker gate above. Copy output to private `baseline/site/`; record all files, hashes, source commit, private input hash and original/delivered logo hashes. Archive regular files under `site/` using the same frozen baseline convention as [VENSLAND.md](VENSLAND.md).

In the adapter worktree:

```sh
/opt/homebrew/bin/node scripts/wordpress-theme.mjs build --mode live --baseline '<baseline.tar.gz>' --expect-sha256 '<archive SHA-256>' --manifest '<baseline/manifest.json>' --migrations '<migration-map.json>' --out '<new empty output folder>'
/opt/homebrew/bin/node --test scripts/wordpress-theme.test.mjs scripts/wordpress-theme-live.test.mjs
/opt/homebrew/bin/node --test src/wordpress-theme/tests/wp-live.test.mjs
```

`VENSLAND_LIVE_BASELINE` overrides the private launch baseline folder for live unit tests. `VENSLAND_LIVE_OUTPUT` overrides the parent folder with `baseline/` and `candidate/` for local integration. Existing `VENSLAND_WP_ACCEPTANCE` points to the loopback synthetic fixture runtime/auth described in [VENSLAND.md](VENSLAND.md); it refuses non-loopback URLs. `wp-live.test.mjs` temporarily activates only the fixture theme and enables fixture indexing, restores `stylesheet`, `template`, `blog_public` afterwards, and compares six browser cases. Browser requests to real Worker URLs are intercepted and fulfilled locally; all other external requests are blocked. Never point these tests at live WordPress.

All 24 HTML outputs (home, ten towns, ten services, privacy, thanks, 404) generate routes recursively. Robots/sitemap are copied byte-for-byte. `/aciu/` stays `noindex,follow`; the 404 stays `noindex,nofollow`; indexable pages keep approved `index,follow` and self-canonicals. Unknown front-end paths return the approved 404 with HTTP 404. WordPress core admin/login/REST/feed/upload/core-sitemap routes are excluded. Existing core sitemaps are not rewritten and may advertise old WP records; submit the theme `/sitemap.xml`, and review duplicate/stale core-sitemap exposure separately.

Customizer previews always use inert form/tracking variants and noindex; live mode is effective only for the active theme. Trial mode retains the previous notices, no outbound endpoints and legacy 302 behavior. WordPress Pages/Posts editing still does not change these static page bodies.

## Install, preview, activate (lead only, after gates close)

1. Read back ZIP SHA-256 and compare with the final manifest/receipt. Ensure the backed-up `hostinger-ai-theme` remains installed. Record a rollback operator and retain the backup outside the site.
2. Appearance → Themes → Add Theme → Upload Theme → select verified ZIP → Install Now. Do not activate yet. If host upload limits block installation, use the host-supported extraction path into `wp-content/themes/vensland-launch-20261026/` and verify extracted files against the manifest; do not overwrite Hostinger's theme.
3. Open Live Preview. Check logo, home, town/service navigation, privacy, thanks, mobile/desktop, consent map; ensure noindex and no enquiries/tracking sent. Do not use preview to validate real delivery. Close preview without publishing until gates close.
4. In the activation window, activate `VensLand Launch 2026-10-26`; record time, active theme and package hash. Disable the recorded Hostinger coming-soon setting, ensure public indexing is enabled in Settings → Reading, and purge relevant caches. Do not change MX, DNS, Worker or unrelated account settings as part of theme activation.
5. Check as an anonymous visitor in a fresh browser and direct HTTP GET (cache-busted if necessary). Keep administrator access open until acceptance completes.

## Post-activation acceptance — tell the lead to verify live

- Both apex and www valid HTTPS; chosen canonical origin `https://vensland.lt`; no certificate/mixed-content/redirect loops. Correct client logo/text and all 24 expected HTML routes, assets/fonts/photos; compare home and two services at 360/1440. `404.html` and a random unknown URL return HTTP 404 with approved design, not 200 or the holding page.
- `/paslaugos/` → **301** `https://vensland.lt/#paslaugos`; `/kontaktai/` → **301** `https://vensland.lt/#uzklausa`; `/` remains 200. Also test no trailing slash and any additional map entries discovered by the lead. No redirect loops; target anchors exist.
- Indexable page robots `index,follow`, self-canonicals on vensland.lt; thanks/404 exclusions retained; Customizer noindex. `/robots.txt` allows public crawl and references `/sitemap.xml`; sitemap contains 22 indexable pages (home + ten towns + ten services + privacy), excludes thanks/404. Check actual final count from manifest/sitemap, not this narrative if the baseline changes.
- Form action/multipart/site/honeypot/file controls and tracker match standalone; CSP permits only intended Worker origins. Inspect browser console and failed requests. Map loads only after explicit click. Run the separately authorized labelled real inquiry, check success receipt + attachment + both inboxes, and verify Worker event/report readback. No real submission is included in this stage's verification.
- `/wp-admin/`, `/wp-login.php`, REST (pretty + `?rest_route=`), feeds, existing uploads and WordPress core sitemaps behave as before. No unintended plugin pixels/chat in themed output; plugin functionality needed outside the themed pages still works. Confirm Hostinger coming-soon/caches no longer mask anonymous responses.
- Record time, operator, package hash, checked URLs/status/headers and remaining issues. Search Console submission/indexing is a separate lead action; package tests do not prove indexing or email delivery.

## Rollback and escalation

If public routing, form delivery, admin access, consent/security or content fails: pause acceptance and tell Matas/lead exactly which check failed; do not debug on live traffic without scope.

1. Reactivate **`hostinger-ai-theme`** from Appearance → Themes. Restore the recorded Reading/permalink/homepage/coming-soon/cache settings, purge caches, and verify anonymous home, old URLs, login/admin, REST and media.
2. If admin is unavailable, use Hostinger/SFTP and the independent DB access prepared above. Restore the verified **matching full files and database** backup (maintenance window; preserve a fresh forensic copy first). Restore the original document-root files, `wp-config.php`, hidden files, all themes/plugins/uploads and all DB tables to their original location. Follow the host's restore procedure; replacing only theme files is insufficient for changed settings/plugin state. Do not delete synced backup originals.
3. Recheck hashes/integrity, DB table/row counts, site URLs, active Hostinger theme, plugins and settings; test anonymous home + old pages, admin login, REST and representative media. Purge caches again. Record rollback time and result.
4. This task changes no Worker/DNS/MX. If the lead changed Worker configuration in a separate stage, use that stage's recorded prior version/configuration and runbook independently; never overwrite unrelated site registrations.
5. Preserve candidate, receipts and failure evidence privately. Lead decides whether to rebuild or restore service; Matas owns client communication. Never claim a backup/restore/launch succeeded without readback checks.
