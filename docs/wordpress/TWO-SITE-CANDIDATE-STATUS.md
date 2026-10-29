# Two-site test candidates — 2026-10-29

The two canonical inputs were backed up and updated with the exact approved Lithuanian helper/pricing copy and 7/10 service pages. Vens uses the retained Paslaugos.lt review URL and a separate feedbackEmail; its mailbox verification is unknown. Main-checkout normalized previews were absent. Reconciliation used retained SEO release previews plus Mes's later review-design preview. Historical Vens gallery/alt AI disclaimers were removed; AI image flags remain so they are excluded from the work gallery.

Private artifacts live under each existing Drive project `previews/{meselektra-re307,vensland}/two-site-ui-20261029/`: input backup/hash receipt, `candidate/site`, per-file candidate manifest. Vens also has the pinned candidate tar/hash and `test-theme` deterministic ZIP/manifest. Superseded attempts remain labelled separately. These are **test-only, never deploy**.

Version0.2.2 WP adapter accepts `--test-input true` only with trial mode. It validates the exact complete new form script hash before replacing it with a local-only notice handler; it preserves the review mailto dialog, removes tracker/widget loading, and retains noindex. Existing production baseline guards remain unchanged. Test fixtures reject archive/source drift, live mode with test input, unsafe ZIP paths and PHP outside the allowlist. Production/live and Customizer checks against the old approved baseline also pass; a new production archive/ZIP is not prepared.

Commands (from allocated code worktree):

```sh
node scripts/preview/cli.mjs '<canonical input path>' --slug '<existing slug>'
node scripts/client-site.mjs previews/cg6j485ktf.json --site meselektra --domain meselektra.lt --test http://localhost:4330
node scripts/client-site.mjs previews/aewz4kawy3.json --site vensland --domain vensland.lt --test http://localhost:4330
node scripts/wordpress-theme.mjs build --baseline '<private candidate/vensland-test.tar.gz>' --expect-sha256 '<candidate/archive.sha256 contents>' --manifest '<candidate/manifest.json>' --out '<NEW private output directory>' --mode trial --test-input true
node --test scripts/two-site-ui.test.mjs scripts/two-site-form.test.mjs scripts/two-site-candidate.test.mjs scripts/wordpress-theme.test.mjs scripts/wordpress-theme-live.test.mjs
npm run check
```

Mocked tests execute actual form code with isolated fetch/Turnstile: valid/rejected/expired token, missing key, validation/upload limits, shared locks, uncertain503/network, retained files/fields and bounded session attribution. No live form submitted. Candidate tests check all sitemap/service routes/canonicals/noindex/404, initial executable JS under15KiB gzip/page, exact configured content and deployment refusal. They do not verify visual layout, actual Cloudflare challenge behavior or mailbox delivery. Native browser interaction/keyboard QA remains pending.

Lead must supply a real publicWidget.sitekey, backend secrets/config and confirmed launch privacy/recipients, rebuild production candidates and verify those artifacts. No client-side secret. No production deployment/upload/accounts/mail/CRM changes were performed. New production WordPress/Customizer verification and other-provider review remain pending.
