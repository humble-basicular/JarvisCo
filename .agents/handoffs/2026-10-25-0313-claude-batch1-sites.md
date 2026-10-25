# Handoff — batch1 sites retry 2 (Claude Opus 5.5), 25 Oct 2026 — IN PROGRESS
Branch `client/batch1-20261024`, worktree `JarvisCo-worktrees/batch1-sites`, from ef321e4. Previous: 2026-10-24-2130-claude-batch1-sites.md.

## 1. Browser acceptance — DONE
cg6j485ktf + ejgb7a33zs served from this worktree's dist (ef321e4, npm run check 41 pages) on :4391. Headless Chrome (CDP) at 320/360/390: scrollWidth = viewport, dock hidden at top and shown after hero/form scroll away, menu opens/closes, quote dialog opens with focus + scroll lock and closes/unlocks, all tel: links +370…; 1440: no overflow, map iframe pin (Klaipėda / Kaunas). Only flagged item: MesElektra 320 px dock still hidden at 1600 px scroll because the hero quote form is still on screen (correct by design; shown at 2200 px). Screenshots viewed. Drive `previews/{meselektra-re307,laikam-ls671}/screenshots-20261025/`. No defects, no code change.

## 2. Martynas / MAS — PREVIEW BUILT (local, not deployed)
Slug **cfa9bwee8q** (http://localhost:4321/perziura/cfa9bwee8q, 8 town pages: Telšiai, Šiauliai, Mažeikiai, Plungė, Rietavas, Varniai, Kelmė, Naujoji Akmenė). Input Drive `previews/masaukstalipiai/input/preview-input.json`; profile grabbed to `source/` (70 photos, profile.json). 12 real Paslaugos photos, stamp cropped (bottom 13 %), in `input/photos/`; 49 excluded (phone status bar). Concept: "MAS — concrete slate + safety orange, Barlow Condensed, angle dividers, shield badge with new `rope` glyph, photo hero (climbers), process line". Prices/services/reviews from his profile (no star ratings: profile gives no per-review rating). Hours "Dirbame 7 dienas per savaitę". No street address published (form addresses Varnių 23 / Varnių g. 16 stay private). Fasadų plovimas + sniego valymas have no real photo → folded into the "Darbai aukštyje" tile until AI images exist. Browser acceptance ALL PASS (320/360/390/1440, menu, dock, dialog, map, direct tel). Screenshots Drive `previews/masaukstalipiai/screenshots-20261025/`.
Template change (needs Codex review r2): new logo glyph `rope` — src/templates/v3/theme.ts, scripts/preview/normalize.mjs (enum), src/templates/v3/parts/Badge.astro (comment).
Defect left: hero pill icon is blank for glyph `rope` (pill uses the glyph as an icon name; icons.ts has no `rope`). Fix: add a `rope` icon or fall back to `shield`.
Open: form says base "Šiauliai / visa Lietuva", priority "aplink Telšius 100 km", pin in Telšiai — built with Telšiai per lead; registrant vs pin house numbers differ (16 vs 23); process layout `line` reused (all 3 layouts used).

## Checks at this commit
NODE_OPTIONS=--experimental-strip-types: npm run check PASS 50 pages (41 + MAS 9); heating-contract-test 58/58; rytis-launch-check 11/11; git diff --check clean.

## NOT DONE (budget stop) — Next owner: next Claude round
3. Tomas / Vensland preview + QR (due Tue 27 Oct evening) — not started.
4. Launch candidates at ef321e4+ — not rebuilt this round. Configs exist from 24 Oct at Drive `previews/{meselektra-re307,laikam-ls671}/launch-2026-10-24/launch-config.json` (controller = business name + meselektra@gmail.com / info@laikam.lt, recipients + matas@jarvisweb.lt, origins apex+www, configured:false). Move to `launch/`, rebuild with --pending-worker, deploy-check --allow-pending-worker (passed on 24 Oct at 8da7140). LaiKam MX: Hostinger mx1/mx2.hostinger.com must be preserved.
5. AI shot list `previews/ai-shot-list-20261025.md` — not written. Known MAS needs: fasadų plovimas tile, sniego valymas nuo stogų tile (≥1536 px, 4:5, no faces/logos/text/vans). MesElektra: interim AI service tiles (client asked for better/real photos).
6. For Matas: "Gedimo atveju vykstame operatyviai" still appears in 6 places on MesElektra (hero check, trust strip, service tile, FAQ, Klaipėda + Kretingalė town texts); lead kept them.
