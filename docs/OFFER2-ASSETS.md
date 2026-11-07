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
Both frames have blank screens. `src/data/o2-device.js` `FRAMES` holds each glass quad, fitted to the inner bezel line of the frame's own pixels (left: TL 325,90 · TR 789,82 · BR 879,1129 · BL 436,1187; right: TL 302,89 · TR 761,79 · BR 645,1191 · BL 189,1121; islands 523,105 114×49 and 452,105 122×49) and turns it into a `matrix3d`. `src/components/o2/Scene.astro` draws frame → HTML screen → a pixel copy of the Dynamic Island on top. `o2.ts` scales the 1080 px stage to its box. Screen content is a Lithuanian mechanism animation. Per user correction it has no extra captions or pills. All five cycles use own hardware and UI, not Stone media.

## Not used / still missing
- Stone proof blocks with no Jarvis equivalent: testimonials (2nd slot), press, partners → omitted.
- Each “Trumpa demonstracija” button opens its own animated feature in a dialog. No filmed videos are claimed.
- The callback follow-up route `/pavyzdys/pokalbis` is a no-send, noindex local flow preview, linked only after validated preview-form use. No calendar. Own intro/testimonial footage is absent, so none is fabricated. Source questionnaire branches remain unknown; the existing short contact form is not claimed to reproduce them.
- Kit `website/screens/*.png` were not embedded; their wording guided the HTML screens.
