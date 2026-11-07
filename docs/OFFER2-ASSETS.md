# Jarvis Systems homepage — assets (Stone-reference rebuild, 2026-11-07)

The identity files below come from the approved kit (Drive `Business/JarvisWeb/branding-2026-11-07/kit/jarvis-systems-complete-v4/`). The original kit is preserved. Opposite phone/laptop, stock and demo derivatives are recorded separately below.

| Page file | Kit source | Use |
|---|---|---|
| `logo-on-white.webp` (560×205) | `logo/logo-on-white.png` | header, 200 px wide |
| `logo-on-navy.webp` (560×205) | `logo/logo-on-navy.png` | footer |
| `favicon/*` | `favicon/*` (mascot favicon) | `<link rel=icon>` / apple-touch |
| `mascot-arms-crossed.webp` (403×1100, transparent margins trimmed) | `mascot/pose-arms-crossed.png` | hero, right, hidden ≤900 px |
| `mascot-present.webp` (419×760, trimmed) | `mascot/pose-present-left.png` | talk card, right |
| `phone.webp` (1080×1336) | `website/feature-phone-1080x1336.png` | feature rows 1/3/5 (mascot left); elbow contact is part of the approved image |
| `phone-right-mascot.webp` (1080×1336) | lead-generated opposite-angle sibling, see `docs/jarvis-stone-lt-review/opposite-phone-provenance.md` | feature rows 2/4 (mascot right) |
| `og-1200x630.jpg` | `website/og-1200x630.jpg` | homepage share card |
| `fonts/sora-{400,600,700,800}.woff2`, `Sora-OFL.txt` | `website/fonts/`, `editable-source/branding/fonts/Sora-OFL.txt` | only font on the page |
| `trades-stock/*.webp` (10 × 742×400) | Pexels originals; source + license + hashes in `docs/jarvis-stone-source-match/stock-manifest.json` | two-row trades carousel; stock, never presented as client work |
| `laptop-blank.webp` (1080×1336) | generated own laptop, provenance in source-match/SPEC.md | first feature: Betono gaminiai form → SMS |
| `demo/bg-{hero,ziedai}.webp` | read-only own `betonogaminiai-site/src/assets/` images | laptop example website/background; no changes to that project |

## Phone screen overlay
Both original kit frames remain unchanged. `scripts/o2-device-masks.mjs` derives alpha glass masks from their pixels into `public/jarvis-systems/device/`. Current quads and fitted laptop glass are in `src/data/o2-device.js`. `Scene.astro` overlays the projected UI through those masks: rounded glass edges and the original Dynamic Island stay in the frame; there is no rectangular screen spill or duplicated island layer. `o2.ts` scales the 1080×1336 stage. All five cycles remain owned HTML/CSS UI, with no extra technical captions on the homepage.

## USER13 actual site and stock replacements (8 November)
- The laptop uses actual latest local `betonogaminiai-site` HEAD `9a94599`: `demo/betono-actual/{home,form-empty,form-filled,logo-light}.webp`. Root captured the current branded browser render at1440×783 in an isolated temp build; removed the preview banner in that capture DOM only. The original project was not edited. Exact rectangles/provenance: `docs/jarvis-stone-source-match/qa/betono-actual-capture-user14.json`.
- The 13.99s sequence shows the real home, UŽSISAKYTI click, real quote dialog and five typed fields, then phone acknowledgement/reply. Other phone scenes use Dailius ir ko identity where appropriate; neutral SEO cards are not actual ranking proof.
- All10trade photos replaced with topical equipment/site details whose served crops contain no people, with primary photo/license URLs and SHA256 in `stock-manifest.json`. Construction source's distant person is excluded by the recorded crop. Previous photos are retained in git history. No generated photos, paid stock or borrowed client-work claims.
- `work/arbcut-mobile.webp` is a resized derivative of owned `src/assets/proof/arbcut-mobile-2026-10-15.png`, used on `/musu-darbai`. Dates/figures come from existing `arbcut-proof.json`; that case source is unchanged.

## Not used / still missing
- Stone proof blocks with no Jarvis equivalent: testimonials (2nd slot), press, partners → omitted.
- Each “Trumpa demonstracija” button opens its own animated feature in a dialog. No filmed videos are claimed.
- The callback follow-up route `/pavyzdys/pokalbis` is a no-send, noindex local flow preview, linked only after validated preview-form use. No calendar. Own intro/testimonial footage is absent, so none is fabricated. Source questionnaire branches remain unknown; the existing short contact form is not claimed to reproduce them.
- Kit `website/screens/*.png` were not embedded; their wording guided the HTML screens.
