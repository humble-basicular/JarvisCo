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
| google-jonava-full.jpg | 13-google-jonava-original.jpg (1530×1545) | none (re-encode) |
| google-jonava-card.jpg | same | crop 690×470+100+575 (arbcut.lt result + DI apžvalga) |
| google-kaunas-full.jpg | 14-google-kaunas-original.jpg (5006×8021, mostly empty page) | crop 770×3560+230+0 (results column from query to arbcut.lt result) |
| google-kaunas-card.jpg | same | crop 700×170+260+3385 (arbcut.lt result) |

Dates: "Ekrano kopija išsaugota 2026-10-09" = `kMDItemContentCreationDate` of the source files
(2026-10-09 13:28–13:32 UTC). The Web3Forms review (`Personal Everything/research/
arborist-outreach-2026-10-09/web3forms-proof-review.md`, main Drive) confirms the dashboard
was reviewed on 2026-10-09. Search Console period 2026-07-05 – 2026-10-04 comes from the same
research notes and matches the chart axis.

Figure sources: 7 + 13 = 20 (tooltips), 573 clicks and "11.4K" impressions (Search Console
tiles). The exact 11 362 is not visible in the screenshot, so the site shows "11,4 tūkst.".

`public/assets/arbcut-irodymai-2026-10.pdf` is printed (headless Chrome) from
`irodymai-pdf.html` using only the files above.
