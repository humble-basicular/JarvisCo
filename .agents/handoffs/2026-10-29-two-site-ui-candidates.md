# Handoff: two-site UI test candidates
From: codex · To: lead codex · Date: 2026-10-29, Europe/Vilnius

## Objective
Continuation of original two-site-ui assignment in same native session/worktree. Finish bounded test candidates; CHILD DOES NOT DEPLOY.

## User decisions & constraints
Two sites only; exact four approved LT pieces; retain Mes1–3private/4–5public flow and same Vens Paslaugos flow. No ArbCut/tracking/other private clients/delegation/account/live submissions/mail/deploy. Latest steer: stop exploration at soft input budget, finish smallest complete result and report gaps.

## State
Source d2f0c63 (on top of8ae6136/99b29f2) implements required widget appearance interaction-only, flexible size, Lithuanian; fails closed on missing frontend key. Actual form-code VM tests cover valid/rejected/expired token, reset on attempts and validation/file budgets, retained upload transmission, uncertain503/network/shared locks and no success redirect on failure. Session-source tests retained. Rejected/replayed tokens are mocked server responses, not live Siteverify tests.

Two canonical inputs backed up BEFORE edits in each project task folder below. Applied exact approved helper and pricing text/headings; removed Mes duplicate priceNote and Vens overlapping final pricing sentences (kept published rate conditions/minimum order). Both7/10servicePages reconciled from approved catalogue, matching retained normalized route slugs. Mes current rating-dialog preserved. Vens exact retained URL https://paslaugos.lt/atsiliepimas/tv1287 and dedicated gbp.feedbackEmail info@vensland.lt from existing wordpress-launch-20261026/launch-receipt.json; public contact email remains absent. Recipient verification UNKNOWN; mailto opens draft only.

Source-main previews named in task do not exist in main checkout. Used read-only seo-services-20261026/previews/{cg6j485ktf,aewz4kawy3}.json and Mes later meselektra-review-design-20261028 preview for review config. Removed historical Vens galleryNote and DI-illustration alt prefix when canonical normalization rejected them; AI flags retained, no AI gallery promotion. No other clients read/edited. Main source and old WP worktree unchanged.

Both local test sites generated and private copies saved. New Vens TEST theme version0.2.2 is deterministic, pinned archive/per-file manifest plus complete new form-script hash guard. Test input accepted ONLY for trial mode; strips widget/tracker and replaces full form script with inert notice handler, retains review mailto dialog/noindex. Original old production packager/hash guards and live/Customizer tests preserved. NO new production theme ZIP built.

## Files & artifacts
Source commit d2f0c63; preceding mechanics8ae6136, checkpoint99b29f2.
Private root: ~/Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/previews/
- meselektra-re307/two-site-ui-20261029/preview-input.before.json; input-update-receipt.json; candidate/manifest.json; candidate/site/ (108files).
- vensland/two-site-ui-20261029/preview-input.before.json; input-update-receipt.json; candidate/manifest.json; candidate/site/ (170files); candidate/vensland-test.tar.gz; candidate/archive.sha256.
- vensland/two-site-ui-20261029/test-theme/vensland-trial-20261025.zip and matching .manifest.json. ZIP SHA2565b58958788d779460dbf7a58ff1e6336f09f5b42ca202db1eb2e09e1b8f7ccf5, 24routes.
Superseded-attempt1/ and superseded-theme-header/ contain explicitly superseded local candidate copies; do not release those. Nothing deleted.
Local generated previews/public assets/client-sites are git-ignored. No private content committed.

## Checks run
PASS npm run check (build/copy/JS/static51pages).
PASS node --test scripts/two-site-ui.test.mjs scripts/two-site-form.test.mjs scripts/two-site-candidate.test.mjs scripts/wordpress-theme.test.mjs scripts/wordpress-theme-live.test.mjs:22tests. Includes all7/10service routes, sitemap entries/canonicals/noindex404, both deployment-check REFUSALS expected test-only, every page executable inline JS under15KiB gzip, new deterministic24route WP test ZIP, archive/full-script drift refusal, no live/test mixing, no fetch/widget/beacon in test theme, and original11baseline ZIP/PHP/router/CSP/Customizer checks. New candidate is trial, not new production runtime verification.
PASS syntax/diff checks. Backend148tests not rerun, tracking untouched.
Private manifests pin every candidate file, input backups and modified inputs have SHA256 receipts. Final candidate manifests sourceCommit d2f0c63.

## Exact build commands
Run from /Users/matasbasinskas/Work/Code projects/JarvisCo-worktrees/two-site-ui-20261029:
node scripts/preview/cli.mjs "$HOME/Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/previews/meselektra-re307/input/preview-input.json" --slug cg6j485ktf
node scripts/preview/cli.mjs "$HOME/Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Business/JarvisWeb/previews/vensland/input/preview-input.json" --slug aewz4kawy3
node scripts/client-site.mjs previews/cg6j485ktf.json --site meselektra --domain meselektra.lt --test http://localhost:4330
node scripts/client-site.mjs previews/aewz4kawy3.json --site vensland --domain vensland.lt --test http://localhost:4330
WP: node scripts/wordpress-theme.mjs build --baseline '<Vens task>/candidate/vensland-test.tar.gz' --expect-sha256 '<contents of candidate/archive.sha256>' --manifest '<Vens task>/candidate/manifest.json' --out '<NEW private folder>' --mode trial --test-input true
Candidate tar was generated with sorted regular members site/*, mode0644, mtime0, uid/gid0, deterministic gzip mtime0; manifest separately pins bytes/SHA256. ZIP determinism checked by two independent builds.

## Pending approvals / questions
No new permission needed for remaining QA. Lead supplies REAL per-site publicWidget.sitekey (no secret), backend keys/observe-enforce config, and confirmed production privacy/recipients/config. Production build refuses absent/dummy key. Confirm feedback mailbox verification. No independent visual/client-removal audit beyond stated source reconciliation.

## External actions already taken
Only the TWO authorized canonical Drive input writes, backups/receipts and private generated artifact copies. No messages, upload to hosting, deploy, account changes, CRM writes, actual review or form submissions. No new browser work this continuation due budget steer; previous native preview blank tab available.

## Next action + owner
Lead: inspect private candidates, native-browser visual/keyboard/focus and rating-routing QA (mock navigation/mailto only), real challenge QA without live submission, compare logo/photo appearance against client-approved live baseline. Rebuild production with actual sitekeys/confirmed launch configs, create/review NEW production-pinned WP archive+ZIP (preserve redirects/privacy/mapconsent/noindexCustomizer/trialoff), other-provider review when available, operations/release. Never deploy these dummy-key/localhost/noindex candidates. New production/Customizer behavior not covered by old-baseline tests; must verify after production rebuild.

## Omitted context
Exact approved content in management research/two-site-upgrades-2026-10-29/CONTENT-FOR-APPROVAL.md; prior99b29f2handoff, source docs/wordpress/TWO-SITE-CANDIDATE-STATUS.md; backend tracking/README Two-site unchanged.
