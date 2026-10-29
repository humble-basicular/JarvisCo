# Two-site source checkpoint — 2026-10-29

Restored adapter and tests from source commit 130ac74. Packager live version is 0.2.2; callback-form counting excludes the new private review mailto form. Trial/Customizer strips the public widget attribute before render; live CSP permits only the added challenges.cloudflare.com script/frame/connect host.

Baseline adapter tests pass, including deterministic ZIP, pinned archive/fetch/tracker hashes, PHP routes and inert Customizer. These tests exercise the old approved archive, **not a new two-site candidate**. New widget/attribution code and review dialog have not been packaged or browser verified. No new release ZIP is prepared. Existing baseline test ZIPs are temporary fixtures, not release artifacts.

Before release, reconcile the two canonical private inputs with current main normalized inputs, apply the four approved copy pieces and all 7/10 service pages, verify Vens feedback recipient independently, build locally and test mocked widget/fetch lifecycles, then package a pinned new archive. Validate trial remains inert with the new widget script present. Production two-site builds now require a real `publicWidget.sitekey`; `--test` supplies Cloudflare's explicit test key and must never be deployed. Never put the secret in this config. Backend enablement and release belong to the lead.
