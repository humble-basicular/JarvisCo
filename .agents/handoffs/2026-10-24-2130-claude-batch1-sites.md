# Handoff — batch1 sites (Claude Opus 5.5), 24 Oct 2026 — STOPPED EARLY (input-token budget)
Branch `client/batch1-20261024` @ worktree `JarvisCo-worktrees/batch1-sites`, from 122468f. Commit 8da7140 (template/scripts review fixes) + this handoff.

## Done (verified)
- Reviewed 122468f, fixed in 8da7140: restored `.v3-util__hours` hide ≤60rem (122468f changed all previews); removed AI footer note from client sites (brain 04); standalone builds load anonymous call/form tracking (`src/scripts/inquiry-track.ts` via heating Tracking part; endpoint www.jarvisweb.lt/t/e); thank-you redirect `/aciu/?receipt=`; privacy text covers counts; new `--pending-worker` launch-candidate mode (config `worker.configured:false`; manifest `workerRegistered:false`; deploy-check refuses unless `--allow-pending-worker`); `rytis-launch-check.mjs` now deletes its synthetic previews (before, they stayed in previews/ + public/previews/ and a later build would have published them).
- MesElektra raw input (Drive `meselektra-re307/input/preview-input.json`, backup `preview-input-before-rytis-fixes-2026-10-24.json`, `logo.jpg` = received Logo.jpg sha256 25dceb30…): price rows "Kaitlentės/Orkaitės pajungimas ir keitimas nuo 20 €" + "Varžų matavimai nuo 140 € / vnt." (Codex had "ar"; client wrote "ir"), footnote, step-2 sentence removed, hours "I–V 08:00–17:00. Skambinti galima ir savaitgaliais.", logo header+card, tagline hidden, wordmark larger, Google pending box hidden. Home address absent. Rebuilt in place `--slug cg6j485ktf` (local only).
- LaiKam raw input (backup `preview-input-before-laimis-answers-2026-10-24.json`): "bazė" wording → "Esame Kaune" (5 places), Kaunas heading "Kaunas – mūsų miestas", `legal` (Vilnius registration) removed, hours "Lankstus darbo grafikas – prisitaikome prie kliento.", review box stays "ruošiamas". Rebuilt in place `--slug ejgb7a33zs` (local only).
- Checks: `NODE_OPTIONS=--experimental-strip-types npm run check` PASS 41 pages (Node 22.14 needs that flag); contract 58/58; rytis-launch-check 10/10 (synthetic); git diff --check clean.

## Not done
- No browser/mobile acceptance (320/360/390/1440), dialog, map or screenshots on the rebuilt previews.
- No standalone launch builds for meselektra.lt / laikam.lt; no private launch configs written.
- No production deploy; live is still dpl_HnuvewAGcaWRf3yAkEDy68g3zkZp. Nothing sent.
- build-input.py in both Drive input folders is stale; preview-input.json is now the source.

## Next (owner: next Claude stage)
1. Browser acceptance + screenshots on cg6j485ktf and ejgb7a33zs.
2. Launch configs (private, Drive launch folders): mapMode consent; controller = business name + client email (no legal identity, per user); processor/retention/basis/rights reuse heating `PROCESSOR` text (Matas to confirm); hosting Cloudflare Pages; worker {configured:false, site meselektra|laikam, origins apex+www, recipients [client email, matas@jarvisweb.lt]}. Build: `node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <domain> --config <cfg> --pending-worker`, then deploy-check `--allow-pending-worker`.
3. Infra stage must: add SITES entries meselektra + laikam (kind client, origins https://<domain>, https://www.<domain>) on top of the live d7605ac Worker; add client-recipient routing (live alerts go to one owner inbox only); keep laikam.lt MX/email (info@laikam.lt); then rebuild without --pending-worker.
4. Deploy: archive this branch + ONLY 3 previews (486rd84se6 unchanged, cg6j485ktf, ejgb7a33zs), verify 49 € offer, GET checks, record dpl id + rollback dpl_HnuvewAGcaWRf3yAkEDy68g3zkZp.
5. Codex review of template changes: scripts/client-site.mjs, scripts/client-site-deploy-check.mjs, scripts/rytis-launch-check.mjs, src/templates/v3/{build-config.mjs,content.ts,form.js,v3.css,V3Layout.astro,V3Site.astro,site/pages/privatumo-politika.astro} (8da7140 on top of unreviewed 122468f).
6. Ask Matas: "Gedimo atveju vykstame operatyviai" still appears in hero check, trust strip, service tile, FAQ, 2 town texts; Rytis asked removal from step 2 only.
