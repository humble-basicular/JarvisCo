# Handoff: two-site UI implementation checkpoint
From: codex · To: lead codex · Date: 2026-10-29, Europe/Vilnius

## Objective
Implement MesElektra/VensLand frontend/security/review changes, private input copy reconciliation and Vens WordPress candidate. CHILD DOES NOT DEPLOY.

## User decisions & constraints
User approved implementation/publication of only two sites, four exact LT copy pieces, Mes review routing and same Vens 1–3 private / 4–5 public routing. No ArbCut, tracking edits, delegation, live submissions, account actions or child deployment. Latest steer: soft 400k input budget exceeded; stop exploring, finish smallest complete result and report remaining work.

## State
- Source checkpoint 8ae6136 on feat/two-site-ui-20261029, baseline 43d1e35.
- Implemented optional publicWidget.sitekey in V3LiveSite/launch validation. Only meselektra/vensland; production refuses missing/dummy keys, test builds get explicit Cloudflare dummy key. No secret supported.
- Added interaction-only widget loader, status, per-form token lifecycle; reset at start of an attempted submission (snapshot token first) so validation and every later response/failure consume the old token. Existing shared uncertain-submit lock/receipt behavior retained. Explicit service field added only for two sites; existing composed message retained.
- Added bounded first-touch class/path session storage and request fields. No raw referrer/query/UTM/click IDs persisted/transmitted. Other sites skip classification/widget.
- Added helper/title fields and price title for approved content placement, but NO private copy has been applied.
- Added validated gbp.feedbackEmail separate from public contact fact, Paslaugos.lt rating-dialog support; low-star copy explicitly opens a draft. NO Vens recipient or review URL configured/verified.
- Restored requested WP adapter/scripts/docs from130ac74. Version0.2.2, callback-only form counts, trial widget-key stripping, live-only Cloudflare CSP. Existing pinned old baseline tests pass; NEW candidate unverified.
- Partial; do not call sites ready or deploy this checkpoint without the remaining acceptance work.

## Files & artifacts
See source commit8ae6136 and docs/wordpress/TWO-SITE-CANDIDATE-STATUS.md. No canonical private inputs, task backups, generated client candidates or new release ZIP created. No private client data committed. Temp baseline test ZIPs are test fixtures only.

## Checks run
- npm ci --ignore-scripts --no-audit --no-fund: PASS; no dependency manifest changes.
- npm run check: PASS (build/copy/JS budget/static12pages). Repeated after final form field conditional.
- node --test scripts/two-site-ui.test.mjs:2/2PASS (key gates, attribution12classes/precedence/path/session/opt-out).
- node --test scripts/wordpress-theme.test.mjs scripts/wordpress-theme-live.test.mjs:11/11PASS (old pinned private baseline; deterministic ZIP, PHP routing/CSP/Customizer).
- node --check src/templates/v3/form.js and scripts/wordpress-theme.mjs:PASS.
- git diff --check:PASS.
- T3 browser status initially unavailable; preview_open about:blank failed with `Preview automation open failed: Invalid preview URL (parse: https:; input length 11).` Corrected preview_open({}) succeeded, blank tab tab_2w_2668615d-4f33-4a52-89b3-2e962e1fa9bb. Changed interactions NOT browser-tested. No fallback needed; budget steer stopped further work.
- Backend148tests not rerun; tracking untouched.

## Pending approvals / questions
No new permission required for remaining implementation. Lead must supply real publicWidget.sitekey and verify backend secret/hostname rollout separately; recipient verification for info@vensland.lt is still pending. No secrets inspected or printed.

## External actions already taken
None: no deployment, upload, mail, live form, review submission, accounts or private input writes. Browser blank tab only.

## Next action + owner
Lead continues or explicitly reassigns; do not duplicate active work. Read PLAN.md/CONTENT-FOR-APPROVAL.md in management three-site-review-20261029 research/two-site-upgrades-2026-10-29. Reconcile canonical two inputs against main normalized cg6j485ktf/aewz4kawy3 and service catalogue, BACK UP before editing. Preserve all7/10services, URLs/photos/theme/client removals; apply exact approved pieces, exact current Vens review URL, separately verified feedback address.
Then regenerate only those two previews and run:
`node scripts/client-site.mjs previews/cg6j485ktf.json --site meselektra --domain meselektra.lt --test http://localhost:4330`
`node scripts/client-site.mjs previews/aewz4kawy3.json --site vensland --domain vensland.lt --test http://localhost:4330`
(Confirm domains from private launch config before production; above are local test commands.) For production use confirmed private --config path containing publicWidget.sitekey; missing key correctly blocks production build. Output under client-sites/<slug>, copy release artifacts only into existing private project task folder. Exact candidate paths currently NONE.
Remaining essential checks: isolated fake Turnstile/fetch success/expiry/errors/retry/files/multiple-form/503/uncertain locks and keyboard/focus, client JS budgets, all two-site routes/canonicals/sitemaps/noindex/404, candidate WP pinned hash/trial/live/new review form/router tests. Existing WP tests are old baseline only. Follow documented wordpress-theme build CLI with new pinned archive+manifest, save private deterministic zip, no upload. Other-provider review remains pending.

## Omitted context
Main source .agents/BOARD.md two-site row; backend tracking/README.md Two-site; authoritative management PLAN.md and CONTENT-FOR-APPROVAL.md. Source main/old WP worktree read-only. No private launch evidence retrieved this stage.
