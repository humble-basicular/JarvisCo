# Jarvis Systems homepage — assets (Stone-reference rebuild, 2026-11-07)

All files in `public/jarvis-systems/` come from the approved kit (Drive `Business/JarvisWeb/branding-2026-11-07/kit/jarvis-systems-complete-v4/`). None were redrawn or regenerated; only resized to WebP with sharp (`q84`).

| Page file | Kit source | Use |
|---|---|---|
| `logo-on-white.webp` (560×205) | `logo/logo-on-white.png` | header, 200 px wide |
| `logo-on-navy.webp` (560×205) | `logo/logo-on-navy.png` | footer |
| `favicon/*` | `favicon/*` (mascot favicon) | `<link rel=icon>` / apple-touch |
| `mascot-arms-crossed.webp` (700×1050) | `mascot/pose-arms-crossed.png` | hero, right, hidden ≤900 px |
| `mascot-present.webp` (520×780) | `mascot/pose-present-left.png` | talk card, right |
| `phone.webp` (1080×1336) | `website/feature-phone-1080x1336.png` | five feature visuals; mascot elbow contact is part of the approved image |
| `fonts/sora-{400,600,700,800}.woff2`, `Sora-OFL.txt` | `website/fonts/`, `editable-source/branding/fonts/Sora-OFL.txt` | only font on the page |
| `trades/*.webp` | `src/templates/heating/assets/demo-*-768.webp` (own ChatGPT-imagegen illustrations, see that folder's PROVENANCE.md) | trades carousel, captioned as illustrations, not client work |

## Phone screen overlay
The kit frame has a blank screen. `src/data/o2-device.js` holds the glass quad measured from the frame's own pixels (TL 336,90 · TR 789,84 · BR 870,1128 · BL 430,1188 on the 1080×1336 canvas) and turns it into a `matrix3d`. `src/components/o2/Phone.astro` draws frame → HTML screen → a pixel copy of the Dynamic Island on top. `o2.ts` scales the 1080 px stage to its box. Screen content is illustrative (labelled "Pavyzdys" and captioned).

## Not used / still missing
- Stone proof blocks with no Jarvis equivalent: testimonials (2nd slot), press, partners → omitted.
- Feature "See short demo" videos are not filmed; buttons go to the call booking instead.
- Kit `website/screens/*.png` were not embedded; their wording guided the HTML screens.
