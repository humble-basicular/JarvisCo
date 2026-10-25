# Handoff: batch launch review1 fixes — retry1/2
From: codex implementation owner · To: lead thread39e2c6c2 / Claude2 final review2 · Date:2026-10-25T14:24:25+02:00
## Objective
Resume original implementation ownership and resolve bounded review1 findings. Initial210eb70/2c51836 was not accepted. Source branch infra/launch-automation-20261025; implementation fix ac45ce8ec6a4da49b21dd376f0f981563901de26. No new agents or chats.
## User decisions & constraints
Original role/model/ownership retained. Only own scripts/client-launch.mjs, scripts/launch/**, docs/launch/** and own handoff edited. Tracking, templates, private configs/inputs, lead frontend readiness-acceptance, source main and all boards unchanged. No remote/spend/client messages/forms/sync/CRM/DNS/GBP/deploy/trial/offline actions. Manual SMS; approved working launch starts60days while GBP external verification may be pending; silence expiry+72h, explicit rejection immediate, ordinary objections not rejection; QR Tomas-only.
## State
- F1 fixed: resolve/normalize evidence paths, Unicode/case-fold exclusion for APFS aliases, deny actual launch/batch-orchestration state/logs/locks and legacy/output dirs, actual config (including dated folders), hosting-preparation record and gate-evidence itself. External file content remains explicitly operator-attested, not semantically authenticated. Positive external-file evidence still succeeds;28 direct/normalized/case-alias references across MesElektra and MAS rejected in regression test.
- F2 fixed: pathspec-scoped git frontendDirty/frontendDirtyCount in JSON/private receipts, dirty source blocks build/check without --allow-dirty; preview/media/output/node_modules excluded from dirty scope while preview/media remain hashed. Public per-client inputsHash/outputHash and receipt copies added; absent output=null.
- F3 fixed: CLI help exit0=required evidence awaiting lead review; GBP verification can remain pending, no inferred live launch. Distinct frontend-lineage-mismatch.
- F4 retained/documented: source/tool fingerprint changes stale every attestation. Real source-change regression proves all gates stale; no gate-lifetime redesign.
- Lock note fixed: detect lost/replaced owned lock, fail/stale receipt, tolerate ENOENT in cleanup, preserve replacement inode, continue remaining clients. Removal and replacement reproduced synthetically.
## Checks run
node --test scripts/launch/batch.test.mjs →19/19PASS; node --check CLI/core/tests →PASS; git diff --check →PASS. Default read-only plan against lead readiness-acceptance HEADba0d439 →exit2, scoped dirtyfalse/count0,4pendingclients,4validpendingWorkerconfigs, all15gates/client pending; per-client inputs/output hashes surfaced. Before/after180scoped private/frontend-input/output hashes identical. No build/check run on actual private frontend in this retry. Parent's earlier independent Astro checks are parent evidence, not rerun here.
## Files & artifacts touched
Source four bounded code/test/doc files plus this handoff. Management assigned folder research/launch-automation-2026-10-25/REPORT.md gains retry response; retry1-private-plan.redacted.json stores actual read-only result; own management handoff. No main-board changes; lead owns them.
## Pending approvals / questions
Final other-provider review2 and lead acceptance remain; not integrated/accepted. Lead should review diff2c51836..ac45ce8 and run meaningful focused checks. No new user answers needed for these code fixes. Initial measured billedinput1,642,996 and2.3Mcumulative softbudget are user-supplied; no new usage/cost estimate asserted.
## External actions already taken
None. Existing projects not recreated, no client/domain uploads or notifications. No live trial/offline actions.
## Next action + owner
Lead: mark retry ready on owned boards and provide bounded response to Claude2 finalreview2 in existing reviewer context (no new review round beyond2). Keep exact current frontend checkout/commit selection and private evidence gates. Any further findings require lead-directed next step; do not infer acceptance from19tests or exit2.
## Omitted context
Review1 /Users/matasbasinskas/WebAgency Biz/research/launch-automation-review1-2026-10-25.md (5f37791); lead response research/readiness-continuation-2026-10-25/launch-review1-response.md (6d66661); docs/launch/BATCH.md; original implementation handoff2026-10-25-1403-codex-batch-launch-automation.md.
