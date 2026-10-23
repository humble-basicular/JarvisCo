# Handoff: all three previews dial directly; approved copy released
From: Codex GPT-6.1-Sol high · To: either · Date: 2026-10-23T17:53:00+03:00
## Objective
Matas approved direct call links and “Neradote reikiamos paslaugos?” / “Paskambinkite – aptarsime, kuo galime padėti.” on all three previews; subsequently explicitly said “and push prod after”. Thread918284f8.
## User decisions & constraints
All business call buttons dial directly; quote buttons keep opening the form. Generic demo and preview forms remain inert. No real customer test calls, sends or purchases.
## State
Done: source5abefa2 pushed on preview-direct-calls-20261023 from live8aa01be; management Brain04/decision321e458. Production dpl_HnuvewAGcaWRf3yAkEDy68g3zkZp at https://jarvisweb.lt, inspect READY/aliases verified. Rollback dpl_2x5ewrDLpXunUH5FJAg2DmrFQLiX.
## Files & artifacts touched
Source owns src/templates/v3/V3Site.astro, scripts/heating-contract-test.mjs, src/checks/static-check.mjs and own handoff. Management owns brains/04-websites.md, DECISIONS.md and own handoff. Lead owns own board sections only; unrelated dirty files/board sections preserved. Release archive /var/folders/97/v6pgyj7d0fs7hvz5ht8sztm00000gn/T/jarvisweb-direct-calls-20261023-15hfkrq4 contains committed source and3private preview JSON/assets.
## Checks run
npm run check PASS41pages; contract PASS58 including every call on29home/town pages; focused browser6cases(3sites×320/390) no overflow,10call links/page and quote dialog works. LaiKam screenshot visually inspected. Production archive build/static PASS. Live GET assertions PASS29pages/290directtel links,exact approved copy,noindex,inert forms; generic demo no dialing;49€ retained;sitemap no previews. vercel inspect confirms ID. git diff --check PASS. No actual call placed.
## Pending approvals / questions for the user
None. Real phone dialer not tested. Cross-provider review unavailable: Claude1weekly100%,Claude2session100%; routine edit kept on lead per user token-efficiency exception. No delegated child.
## External actions already taken
Source branch pushed and production deployed as above. No Worker/CRM change/customer send/purchase.
## Next action + owner
Matas optionally checks on phone. Next source release must start from preview-direct-calls-20261023 (or descendant), retaining49€ and3private previews.
## Omitted context
Source main board release history. /tmp/preview-direct-{check,contract,vercel-build}.log; browser/live scripts and3PNGs in /tmp. Whole-thread cost known>=17.6313129USD incomplete; historical wasted3.6810282USD; cost per accepted stage and this follow-up isolated cost unavailable. Initial browser assertion corrected for CSS uppercase; npm offline old CLI failed cache, used installed65.2.0. Management git identity supplied per-command as existing Codex<codex@localhost>, no global config edited.
