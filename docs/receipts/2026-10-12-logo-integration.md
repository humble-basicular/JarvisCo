# Receipt: logo, favicon and OG integration (Claude, 2026-10-12)

Branch `rebuild-2026-10-claude-finish`, based on `e62b93f`. Source commits `3223021` (integration) and `48ef4ff` (QA fixes). Reports: `docs/receipts/2026-10-12-logo-integration/`.

## Changes
| Item | Result |
|---|---|
| Header logo (`Header.astro`) | `jarvisco-wordmark-dark.svg`, `width="160" height="36"`, CSS `width: 10rem; aspect-ratio: 1010/228`. Bar link keeps `aria-label="JarvisCo, pradžia"`, so `alt=""`. Menu sheet logo `alt="JarvisCo"`. |
| Footer (`Footer.astro`) | `.ftr__logo` = wordmark 200×45, `alt="JarvisCo"`. `.ftr__mark` (giant SVG text) → the same wordmark `<img>` 1010×228, `alt=""`, full width, mask fade 100 % → 10 % (same look as the old gradient). Both are `loading="lazy"`. |
| Light variant | Not used: the header, the menu sheet and the footer are always on ink. |
| Favicon | `<link rel="icon">` → `/brand/editorial/jarvisco-favicon.svg`. `public/assets/favicon.svg` overwritten with the same J mark. |
| Apple touch icon | `public/apple-touch-icon.png` 180×180, rendered with sharp from the favicon SVG with a full-bleed tile (iOS rounds the corners itself), plus `<link rel="apple-touch-icon">`. |
| OG images | `og.png` (home: "Svetainė, kuri atneša užklausas iš Google." + "199 € vieną kartą") and `og-rezultatai.png` ("20 užklausų per 2 mėnesius" + "arbcut.lt rezultatai su ekrano kopijomis"). Both 1200×630, ink/lime/paper, editorial wordmark (inline SVG), Bricolage Grotesque + Inter from `node_modules/@fontsource-variable` (latin + latin-ext). Rendered with headless Chrome. Script: `render-og.mjs`. All fonts confirmed loaded and every text box fits; each PNG was checked by eye for diacritics and clipping. |
| `/rezultatai` OG | `content.js` `resultsPage.meta.ogImage = '/assets/og-rezultatai.png'`. |
| `og-arboristams.png` | Backup first (see below), then overwritten with the `/rezultatai` image. Nothing deleted. |
| Meta | `og:image` was already absolute (`new URL(path, brand.url)`). Built: `https://jarvisweb.lt/assets/og.png` and `https://jarvisweb.lt/assets/og-rezultatai.png`. `twitter:card` `summary_large_image` was already there. Added `twitter:image` and `og:image:type`. |
| QA fixes | Keyboard-opened menu autofocused the logo link and drew a lime ring around the wordmark → `autofocus` on the close button. Footer no longer breaks "199 € \| vieną kartą" or "Individuali \| veikla" (NBSP in `Footer.astro` only; the content strings are unchanged). |

## Backup
`My Drive/Business/JarvisWeb/rebuild-2026-10/backups/og-arboristams-original-2026-10-12.png`. sha256 `ff36bd4235bbf601353b2eca7152a0cd705a35b283a39204a29da168c3cf3e12` matches the original repo file (53 014 B).

## Checks
- `npm run check`: build of 6 pages; copy-check ok; JS gzip `/` 4498 B, `/rezultatai` 4498 B, legal/404 2591 B; static-check ok.
- `git diff --check e62b93f` clean. Protected paths are unchanged versus `e62b93f`: tracking/**, src/data/tracking.js, track.ts, inquiry-form.ts, email_validation.js, legal pages, LegalPage.astro, vercel.json.
- Lighthouse mobile (local `astro preview`, Lighthouse from the npx cache, Chrome headless), Perf/A11y/BP/SEO:
  - `/` 93/100/100/100, LCP 3083 ms (simulated), CLS 0, TBT 0
  - `/rezultatai` 95/100/100/100, LCP 2780 ms, CLS 0, TBT 0
  - Identical to round 1 (93/95). The logo change did not move performance.
- Overflow (`qa.mjs`, reduced motion): `scrollWidth ≤ innerWidth` on `/`, `/rezultatai`, `/privatumo-politika`, `/taisykles` and `/404` at 360/390/430/768/1024/1440. 30/30 pass.
- Header at 360 px: wordmark 160×36.1, with a 90 px gap to the menu button. At 1440, 160×36.1.
- Keyboard (both pages, 360 px): Tab reaches the menu button, Enter opens the sheet, Esc closes it and focus returns to the button. The FAQ `<summary>` toggles with Enter. The zoom link opens the dialog with Enter, Esc closes it and focus returns.
- External requests were aborted and `sendBeacon` stubbed in puppeteer. No forms, SMS, calls or beacons.

## Screenshots (reduced motion)
`/private/tmp/jw-logo/qa/r2/`: `home-390-full.png`, `home-1440-full.png`, `results-390-full.png`, `results-1440-full.png`, `home-360-header.png`, `results-360-header.png` (2×), `home-360-menu.png`, `results-360-menu.png`, `footer-390.png`, `footer-1440.png`, `home-390-footer-base.png`. OG sources: `/private/tmp/jw-logo/og/`.

## Not verified
- Favicon/touch icon in real browser tabs and on iOS home screen; OG preview in Facebook/Messenger/LinkedIn debuggers (needs deploy).
- No PNG/ICO favicon fallback (`/favicon.ico` will 404 on old clients that ignore SVG icons).
- `qa.mjs`/`render-og.mjs` load puppeteer-core from the local npx cache path; they are receipts, not project tooling.
