# Receipt: fix round 1 + visual QA — 2026-10-12

Source commit: `c64a3f2` (branch `rebuild-2026-10-claude-finish`, rebased on `rebuild-2026-10`; its content is identical to pre-rebase `8045eeb`, and `1a67062` is identical to reviewed `a978d49` outside `.agents/`).
Local preview: `npx astro preview --port 4328 --host 127.0.0.1` from the worktree (built `dist/`).

## Review findings
| # | Result | Evidence |
|---|---|---|
| F1 | Fixed | Built H1: `<span …>20</span> <span …>užklausų per 2 mėnesius</span>`; browser `h1.textContent` = "20 užklausų per 2 mėnesius". copy-check now compares each H1's real textContent; mutating dist back to no space → `H1 textContent "20užklausų per 2 mėnesius"`, FAILED. |
| F4 | Fixed | Home hero sub: "…sulaukė 20 formos užklausų." H1 unchanged. |
| F5 | Fixed | Browser: `.price` has a single running animation `spin` (no `::before` animation); `::before` = static `conic-gradient(from 200deg …)` + `blur(18px)`. |
| F6 | Fixed | 5 counters `aria-hidden="true"` + sibling `.visually-hidden` final value (no duplicate accessible numbers). `[data-count]` inline-block, fixed `inline-size` during count. 390 px: 573 counted 141→573 at a constant 313.82 px; the `tūkst.` sibling stayed at x = 126.1–126.2 px. Under reduced motion the final values show (Lighthouse probe). |
| F7 | Fixed | Bans `€/mėn`, `mėnesin… plan…`, "20 (formos) užklausų … iš/per Google". It self-tests on each run: the Paslaugos.lt "~50 € kas mėnesį" comparison and "12 mėn. × ~50 €" are allowed; "47 €/mėn.", "20 užklausų iš Google" and "mėnesinis planas" are blocked. `offer.year.lead` is required on `/` and `/rezultatai`. |
| F8 | Fixed | 390 px zoom widths: the 770 px Kaunas original renders at 770 (was 896); 1600/1530 px originals at 896. Focus returns to the opener after each close (6/6). |
| F2/F3 | Deferred to the logo round | Logo option 2 was selected after this round started. The board assigns header/footer/favicon/OG to the next Claude integration round. No assets were deleted. |

## Additional QA fixes (actual defects found in screenshots)
- The zoom pill covered the evidence: Web3Forms "Submissions 13" (and partly 7), and GSC "Average position 8.2". The pill moved top-right (as in the approved concept). It is icon-only on the small Web3Forms thumbnails.
- Kaunas Google tile (≥1024 px): the short crop is centred, so there is no single large gap.
- "Ekrano kopija išsaugota 2026-10-09" no longer splits the date across lines.
- The footer wordmark "o" was clipped at the right edge (textLength 1000 → 986, x 2).
- Footer "· Kaunas" no longer starts a line (non-breaking space before the separators).
- The privacy link's 48 px tap target no longer stretches the wrapped line (negative block margin).
- Hero laptop was cut off by the viewport at 1024–1439 px (8% bleed > gutter). Limited at those widths only. Measured laptop right edge: 1000/1024 and 1258/1280. 1440 is unchanged.

## Checks
- `npm run check` → build 6 pages; copy-check ok; JS gzip `/` 4498 B ≤ 30 KB, `/rezultatai` 4498 B ≤ 15 KB, legal/404 2591 B; static-check ok. `git diff --check rebuild-2026-10...HEAD` clean. Protected paths (tracking/**, track.ts, inquiry-form.ts, email_validation.js, legal pages) are unchanged.
- Lighthouse (serial, local preview), Perf/A11y/BP/SEO:
  - mobile 390: `/` 93/100/100/100 (LCP 3.08 s simulated, CLS 0); `/rezultatai` 95/100/100/100 (CLS 0)
  - desktop 1440: `/` 100/100/100/100 (LCP 623 ms, CLS 0.0001); `/rezultatai` 100/100/100/100
  - The parent baseline was 94/96 mobile, so the drop is within simulated-throttling noise. TBT is 0 everywhere.
- Reduced motion (`--force-prefers-reduced-motion` + the parent's motion-audit config): 0 running animations at load/menu/proof/process on both pages at 390/768/1024/1440. scrollWidth equals the width (no overflow).
- Browser (T3 preview, 390/1024/1280): sendBeacon/fetch stubbed and sms/tel/external link defaults prevented. No form submitted, no beacon sent.

## Screenshots (full page, reduced motion, lossless)
`/private/tmp/jarvisweb-claude-qa-20261012/final/`: `home-390-full.png`, `home-1440-full.png`, `results-390-full.png`, `results-1440-full.png`, `rm-home-768-full.png`, `rm-results-768-full.png`. Lighthouse JSON: `/private/tmp/jarvisweb-claude-qa-20261012/r2/`.
These were captured before the 1024–1439 hero-stage tweak, which does not affect 390/768/1440. 1024/1280 were verified by measurement.

## Not verified
- Real-device sms:/tel: taps, hosted `/arboristams?r=` 301 query forwarding, and live Worker/beacons (needs deploy).
- Screen-reader speech output. Accessibility semantics were verified by DOM only (aria-hidden + visually-hidden).
- OG/social images and the logo (next round).
