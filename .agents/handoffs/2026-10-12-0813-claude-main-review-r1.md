# Handoff: M2 source review round 1 — JarvisWeb main site
From: claude (Opus 5.5 high, cross-provider reviewer) · To: codex parent (GPT-6-Astra) · Date: 2026-10-12T08:13+03:00
## Objective
Source-review a978d4983f7abc4e3df4d59b3a929f0933bfafb7 against integration 94a92d5 (`git diff 94a92d5...a978d49`, 44 files). Look at correctness, tracking/form lifecycle, content provenance, a11y/performance risk. Read only; no browser.
## User decisions & constraints
Approved design: docs/design/concept-2026-10-11.html (not re-litigated). The source corrections override the stale spec: 20 inquiries over 2 months, 11,4 tūkst., 5 %, 8,2; the 20 must never be attributed to Google. No browser/Computer Use in this review. No deletion without approval and a backup.
## Verdict
**Approve after one small fix round.** Nothing blocks on correctness, security or contracts. F1 must be fixed. F2 needs Jarvis's deletion approval. F3–F8 are optional and low-risk.

## Findings (ranked)
| # | Sev | Location | Finding | Fix |
|---|---|---|---|---|
| F1 | Medium | src/components/ResultsHero.astro:12; masked by src/checks/html.mjs:10 | The /rezultatai H1 builds as `<span>20</span><span>užklausų per 2 mėnesius</span>` with no whitespace (verified in dist/rezultatai/index.html). textContent and indexing get "20užklausų per 2 mėnesius". The accessible name depends on the AT. copy-check passes only because `text()` joins every child node with `' '`. | Add `{' '}` between the spans. Optionally make `text()` stop inserting spaces (or add a raw-HTML assertion) so the check catches this class of bug. |
| F2 | Low-Med | public/assets/og-arboristams.png | Unreferenced, but it still ships to production and its image text reads "20 užklausų dėl medžių darbų **per 3 mėnesius**". That is the stale claim. Text checks do not scan images. | Remove it after Jarvis approves the deletion and a backup is made, or regenerate it with "2 mėnesius". public/assets/images/matas-avatar.webp (59 KB) is also unreferenced. |
| F3 | Low (design, user call) | public/assets/og.png | The OG image used by both pages is the old light, system-font card Jarvis rejected. Link previews of every SMS link (preview bot → /p → /rezultatai) show it. | Regenerate in the ink/lime/Bricolage style, with "20 užklausų per 2 mėnesius" for /rezultatai. Needs a design OK. |
| F4 | Low (copy) | src/data/content.js hero.h1 + hero.sub | H1 "…atneša užklausas iš Google." is followed directly by "…sulaukė 20 užklausų". Read together, the 20 look Google-sourced (proof spec §9: attribution not confirmed). The H1 is concept-approved, so keep it. | Make the sub say "20 formos užklausų" (the Web3Forms source) to soften the implied attribution. Lead/Jarvis decide. |
| F5 | Low (perf) | src/components/Offer.astro:132-152 | The price border animates registered `--angle` forever on `.price` **and** `.price::before`, which has `filter: blur(18px)`. Custom-property gradient animation is not composited, so it repaints a blurred layer every frame while visible (mobile jank/battery). | Keep the ::before glow static, or pause with `animation-play-state` when offscreen. Reduced motion is already static. |
| F6 | Low (a11y/CLS) | src/scripts/effects.ts count-up; ResultsBento.astro:30,55,67,77,81 | The count-up rewrites text inside `<h3>`s that also name the articles (`aria-labelledby`), so AT can read intermediate values. For the inline impressions/CTR `<span data-count>`, `min-inline-size` has no effect (inline box), so "0,0"→"11,4" shifts the `tūkst.` sibling (tiny CLS). | Set `display:inline-block` on `[data-count]`. Animate an `aria-hidden` copy and keep the final value in a visually-hidden span (or set `aria-hidden` on the animating node). |
| F7 | Low (guard) | src/checks/copy-check.mjs | The old ban `/€\s?\/\s?mėn/` (monthly-plan phrasing) was dropped. No regex guards against attributing the 20 to Google. | Restore the `€/mėn` ban (the "50 € kas mėnesį" comparison does not match it). Optionally ban `/20[^.]{0,40}iš Google/`. |
| F8 | Nit | src/components/ZoomDialog.astro `.zoom img` | The Kaunas full image is 770 px wide. `width:max(100%,56rem)` upscales it to 896 px on phones, so it looks slightly soft. | Cap the width at natural size (`max-width` from data-w) for narrow originals. |

## Verified OK (static reasoning + build)
- tracking/**, src/scripts/track.ts, inquiry-form.ts, email_validation.js, privatumo-politika/taisykles text: **unchanged** (`git diff --stat` empty). TRACKING_PREFIXES a → /rezultatai matches tracking/src/index.ts:22.
- Beacons: every sms:/tel: CTA carries data-track cta_sms/cta_call with brand.smsHref/telHref (+37067699395, `?&body=`). PDF/arbcut links are tracked. data-proof-anchor is present on both pages. Click delegation is on document, so no per-element lifecycle. MPA + cross-document @view-transition: track.ts runs per page load; sessionStorage carries the code; the bfcache restore sends no duplicate view. No ClientRouter.
- Web3Forms key and endpoint unchanged. One form per page; ids are unique (static-check).
- Zoom: native dialog, button-0/modifier guard, focus returns to the opener, FLIP skipped under reduced motion. Header sheet: native modal dialog, aria-expanded synced, closes at ≥64rem. Sticky bar hidden with `visibility` (not focusable while hidden).
- Reduced motion: effects.ts disposes all observers/listeners/frames and restores text. Global `animation/transition:none!important`. View transitions off. Build frame falls back to its final "Gyva svetainė" state, unstuck.
- Content: 20 = 7 + 13 over Aug+Sep ("2 mėnesius"), 573, 11,4 tūkst., 5 %, 8,2, period 2026-07-05 – 2026-10-04, saved 2026-10-09. Every figure sits next to (or opens) its original screenshot on the same page. Honest notes are present. No 11 362, no "per 3" in copy, no reviews/logos/quotes, no exclamation marks. 199 € / 15 € domain / 0 € hosting / Nėra. ~600 € vs 214 € first-year comparison is in the approved concept. The PDF source (irodymai-pdf.html) uses the correct figures.
- /arboristams: vercel.json 301 for both slash forms. The astro.config static fallback is a meta refresh that drops `?r` and is only reached if the Vercel redirect is not applied.

## Checks run
- `git archive a978d49` → /private/tmp/jw-review-r1, `npm ci`, `npm run check` → exit 0: build 5 pages; copy-check ok; JS gzip `/` 4476 B (≤30 KB), `/rezultatai` 4476 B (≤15 KB), legal/404 2595 B; static-check ok.
- `git diff --check 94a92d5...a978d49` → clean.
- Built-HTML inspection of the H1s, script tags, zoom data-w/h, and the /arboristams fallback. Viewed og.png and og-arboristams.png.

## Not verified (parent-owned, needs a browser/host)
- Rendered layout at 360–1440, the hero device stage/chips overlap on phones, the mobile build-frame sticky area vs the steps, the bento at 1024, keyboard/screen-reader passes, Lighthouse/LCP/CLS (the hero stage starts at opacity 0 with a 0.15 s delay, so it may affect LCP timing).
- **Hosted:** `curl -sI <preview>/arboristams?r=a2345` must 301 to `/rezultatai?r=a2345`. This matters because the live Worker (M1b not deployed) still targets /arboristams. I believe Vercel forwards the query string, but I have not verified it.
- Tablet 768–1023 px: no sticky bar and no header CTA (burger only). Check that this is acceptable visually.

## Pending approvals / questions for the user
F2 deletion of public/assets/og-arboristams.png (+ unused matas-avatar.webp). F3 new OG design. F4 hero sub wording.
## External actions already taken
None. No deploy, sends, form submits, or live beacons. Temp build in /private/tmp/jw-review-r1 only.
## Next action + owner
Parent assigns fix round 1 (F1 required; F5–F8 optional) to the implementation owner. After that, re-review only the fix diff.
## Omitted context
docs/SPEC-2026-10-main-site.md, docs/SPEC-2026-10-proof-site.md §3.1/§4/§6/§9, src/assets/proof/PROVENANCE.md, the main board "Finish and acceptance — 2026-10-12".
