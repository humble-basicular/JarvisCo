# Handoff: launch-infra prepared for review
From: codex (implementation sub-agent, Codex2) · To: claude (review) → lead (deployment) · Date: 2026-10-25T03:22:42+03:00

## Objective
Prepare hosting/launch infrastructure for the four static client sites; code + tests + read-only checks + runbook. No production Worker deployment, DNS mutation or sends in this stage.

## User decisions & constraints (verbatim where possible)
- “Matas approved launching client sites ourselves.” This stage is preparation only; do not infer permission for production actions here.
- Own only `tracking/**`, new `docs/launch/**`, own handoff, plus explicitly requested management board status.
- “live version = commit d7605ac … preserve all of its behaviour”. Recipients from private configuration/secrets, never git.
- “this runs on Codex2, which must keep ≥40% free between 08:00 and 20:00 Vilnius”. Work took place around 03:14–03:22 local, outside the reserved window; remaining quota percentage is not exposed and is not claimed.
- No GUI, no new subagents/chats/automations, no source edits to the client branch, no CRM writes.

## State
- Done (verified): substantive commit **ccda9ed** on `infra/client-launch`, worktree `/Users/matasbasinskas/Work/Code projects/JarvisCo-worktrees/launch-infra`.
- Requested `main` does not exist. Branched from actual integration `rebuild-2026-10` @ `c2c9ed3` (main checkout board identifies integration); restored all `tracking/` from `d7605aca53031fb5e4e54f4c110e0d0ca603cfdd` before extending. The live alert work was not previously merged into integration. Reviewer should compare new logic against d7605ac, and integration diff against c2c9ed3.
- Four additive `kind: client` SITES entries, exact HTTPS apex+www, in `tracking/config/client-sites.json`. Private runtime SITES has NOT been modified; registration is prepared, not live.
- `FORM_SITE_RECIPIENTS` JSON config/secret maps validated site codes to 1–10 strict mailbox values. Launch gate requires the confirmed client + requested owner. Separate message per recipient, case-insensitive duplicate suppression preserving first spelling, independent send failures. Existing owner fallback for unmapped sites and preview/callback routing remains. Invalid map/selected route fails closed for site mail; storage/receipts persist. No customer email in source/tests.
- Persisted dedup, all request/origin/rate-limit/privacy paths untouched from d7605ac. Whole-attempt claim means no per-recipient retries/backfill. New recipients need account verification and an allowlist binding instead of old single-destination restriction.
- Read-only Cloudflare: Wrangler authenticated to account associated with jarvisworks.co@gmail.com; **0 Pages projects**, **1 active zone jarvisweb.lt**. Latest returned Worker deployment `3bbb6b97-3e77-4586-92dc-b2efe1b308c4`, 100% version **30f2e5ef-029b-4396-9272-4378913cd45f**, 2026-10-22T07:15:12.772147Z, annotation names reviewed d7605ac. Refresh version immediately before eventual deployment.
- DNS: LaiKam NS artemis/hermes.dns-parking.com; Vensland horizon/orbit.dns-parking.com. Both MX **5 mx1.hostinger.com / 10 mx2.hostinger.com**; existing Hostinger SPF. DNS provider attribution indicates Hostinger, human account control unknown. New domains NXDOMAIN, not registry-availability proof. Full RRsets in receipt.
- Runbook documents per-domain access gates, Pages projects/custom apex+www, full zone/NS migration and www-only Hostinger CNAME alternative, mail/DNSSEC preservation, Worker private config/secrets/bindings, deploy/rollback UUID handling, final build without pending flags, live form/inbox checks, Search Console + sitemap, CRM owner-only launched confirmation; rollback for each step.
- Management board stage/status updated in place only; main management checkout already had unrelated edits. Do NOT commit/discard those other changes. Lead owns board integration.
- Not done: external resources/configs/deployment; client standalone rebuilds; private recipient values; recipient verification; live mail/form/beacon checks; Search Console; CRM launched. None is claimed verified.

## Files & artifacts touched (path + what changed; versions/commits)
- [Runbook](../../docs/launch/RUNBOOK.md) and [read-only/test receipt](../../docs/launch/READ-ONLY-CHECKS.md).
- `tracking/src/alerts.ts`, `tracking/config/client-sites.json`, `tracking/test/worker.test.mjs`, `tracking/README.md`: additions beyond live d7605ac.
- `tracking/src/index.ts`, migrations/package/lock/Wrangler config/test email loader restored from live d7605ac; index/migrations/package/lock/Wrangler config match it byte-for-byte.
- Own handoff (this file), metadata commit follows ccda9ed.
- `/Users/matasbasinskas/WebAgency Biz/.agents/BOARD.md`: own launch-infra row and completion status under “Delivery automation implementation — 24 October 2026”; other authors' existing modifications preserved, not committed by this stage.

## Checks run (command → result)
- `tracking/npm ci --no-audit --no-fund` → dependencies installed; no lockfile change.
- `tracking/npm test` → **125/125 passed, 0 fail/skip**, including **13 new launch tests**. Final `/tmp/jarvisweb-launch-infra-tests-final.log`; temporary log, rerun is authoritative.
- `tracking/npm run typecheck` → pass.
- `tracking/npm run deploy:check` → pass; repository placeholder config, **local dry-run only**, 34.04 KiB / gzip 10.06 KiB. `/tmp/jarvisweb-launch-infra-dry-run.log`. Does not validate private production IDs/bindings.
- `git diff d7605ac --exit-code -- tracking/src/index.ts tracking/migrations tracking/package.json tracking/package-lock.json tracking/wrangler.toml` → pass.
- `git diff --check`, staged whitespace check → pass; relative Markdown references checked (7 valid before this handoff; handoff references checked at finalization).
- Wrangler whoami, Pages project list, read-only zones API GET with exhausted pagination, Worker deployments list; dig recursive+authoritative records → successful reads only.

## Pending approvals / questions for the user
No new permission request from this stage. Lead/Matas must resolve existing prerequisites: IV.lt purchases + NS, LaiKam DNS/registrar controller/access, Hostinger access from Tomas for Vensland, confirmed private client recipients and exact owner-address verification, Google login, reviewed privacy/builds (Masaukštalipiai/Vensland slugs unknown). Full apex Pages requires Cloudflare NS; www-only external CNAME is not a complete launch for current apex canonical builds.

## External actions already taken (sent, uploaded, published — never repeat)
Only authenticated/read-only Cloudflare inventory/deployment reads, public DNS, provider documentation reads and local build/tests/dry-run. **No remote writes, sends, purchases, production deploys, DNS edits, login-flow changes or GUI.** No new tasks/threads/subagents/automations. Private production config was not edited. Wrangler OAuth was consumed locally for zones GET; secret token was never output/copied.

## Next action + owner
1. **Claude review** this branch; focus new alert routing against d7605ac + restored live baseline integration. No review child spawned by this implementation stage.
2. **Lead** integrates reviewed tracking; never deploy the old main Worker without the d7605ac restoration. Follow runbook with actual private production configuration and fresh rollback UUID; retain existing routes/budgets/D1/KV/claims.
3. **Matas** resolves access/destinations/Google, confirms client copy. **Lead** then rebuilds approved client branch without `--pending-worker`, checks/deploys Pages and DNS, performs authorized live acceptance and asks Matas for CRM launched confirmation.

## Omitted context (where to find it)
Read-only client worktree `client/batch1-20261024` @ f275e93; original `.agents/handoffs/2026-10-24-2130-claude-batch1-sites.md` Next 2–3, newer `2026-10-25-0313-claude-batch1-sites.md` browser acceptance. Private client inputs/build configs stay in existing Drive project folders. Runbook is repo technical documentation explicitly requested for `docs/launch/`; no extra user-facing duplicate was created.
