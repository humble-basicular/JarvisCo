# Proof image provenance

Source folder (read only): jarvisworks.co Google Drive, `Work - WebAgency/ArbCut rezultatu vaizdai/`.
All files are original browser screenshots. No AI redraws: `01–03 *-maketas.png` and the
old `ArbCut-formos-rezultatai-2026-08-09.pdf` (contains redraws marked "Rezultatų iliustracija")
are NOT used. Processing = crop and/or resize only (ImageMagick, 2026-10-11); pixels are not
edited. Astro converts to WebP at build time.

| File here | Source file | Processing |
|---|---|---|
| web3forms-rugpjutis-full.png | 11-web3forms-rugpjutis-original.png (4480×2348) | resize 50% |
| web3forms-rugpjutis-card.png | same | crop 820×620+574+1112 (chart + "August 2026 · Submissions 7") |
| web3forms-rugsejis-full.png | 10-web3forms-rugsejis-original.png (4480×2340) | resize 50% |
| web3forms-rugsejis-card.png | same | crop 820×600+2140+1142 ("September 2026 · Submissions 13") |
| search-console-full.jpg | 12-google-search-console-original.jpg (1840×640) | none (re-encode) |
| search-console-card.jpg | same | crop 740×235+0+0 (Total clicks 573, Total impressions 11.4K) |

Dates: "Ekrano kopija išsaugota 2026-10-09" = `kMDItemContentCreationDate` of the source files
(2026-10-09 13:28–13:32 UTC). The Web3Forms review (`Personal Everything/research/
arborist-outreach-2026-10-09/web3forms-proof-review.md`, main Drive) confirms the dashboard
was reviewed on 2026-10-09. Search Console period 2026-07-05 – 2026-10-04 comes from the same
research notes and matches the chart axis.

Figure sources: 7 + 13 = 20 (tooltips), 573 clicks and "11.4K" impressions (Search Console
tiles). The exact 11 362 is not visible in the screenshot, so the site shows "11,4 tūkst.".


## Google search captures (replaced 2026-10-12)
Jarvis's own browser screenshots, attached in the T3 thread on 2026-10-12 (created 06:01–06:02 UTC). They replace the 2026-10-09 Kaunas/Jonava captures (the Kaunas one was a mostly empty full-page capture with the result at the very bottom). Full = original converted to JPEG q88 (no resize); card = crop of the arbcut.lt result only (880×210).

| File here | Query | Original (sha256 prefix) | Card crop |
|---|---|---|---|
| google-arboristas-kaunas-* | arboristas kaunas | 1530×1726 (bb7812af) | 880×210+362+1478 |
| google-kaunas-* | medziu pjovimas kaunas | 1712×1106 (eb043367) | 880×210+364+872 |
| google-jonava-* | medziu pjovimas jonava | 1818×1550 (afbd124f) | 880×210+362+578 |
| google-kazlu-ruda-* | medziu pjovimas kazlu ruda | 1548×984 (2fb142c3) | 880×210+292+768 |

`public/assets/arbcut-irodymai-2026-10-12.pdf` (4 pages) is printed (headless Chrome) from
`irodymai-pdf.html` using only the files above.
