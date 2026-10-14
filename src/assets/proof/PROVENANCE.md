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


## Offer v2 proof crops (2026-10-14, used on `/`, `/sildymui`, `/noriu`)
Jarvis's own browser screenshots, attached in the T3 thread on 2026-10-14 (files in
`~/.ai-powerhouse/userdata/attachments/`, created 21:36–21:37 local time). Processing =
crop only (no resize, no pixel edits); Astro converts to WebP at build time. The page
shows each crop big with caption, date ("Ekrano kopija 2026-10-14") and source.

| File here | Source (size, sha256 prefix) | Processing |
|---|---|---|
| arbcut-gsc-3m-2026-10-14.png | `33f44fe4-…-3e4db911-….png` (3758×1614, 861d8a1c) | crop to 3758×1335 (performance tiles + chart) |
| arbcut-web3forms-{aug,sep,oct}-2026-10-14.png | `33f44fe4-…-{e4173a7f,cbb77d26,d9681979}-….png` (each 4480×2520; 55669b89, ef7d84c0, a986e7c8) | crop to 3965×1935 (dashboard + history chart). The month of each crop is the one in its own chart tooltip; the source→month mapping was not recorded |

Figures shown on the page, and where each is visible:
- Search Console, "3 months", chart axis 7/12/26 – 10/10/26 → period **2026-07-12 – 2026-10-10**: Total clicks **595**, Total impressions **11.9K** (shown "11,9 tūkst."; the exact count is not visible), Average CTR **5%**, Average position **8.1**. Search type: Web.
- **The property name is not visible in the crop.** That this is arbcut.lt comes from Jarvis (he took it from his own login); **Jarvis to confirm before production.**
- Web3Forms: form "ArbCut", "Created Apr 19, 2026" → **2026-04-19**; "Total Submissions" **28**; "Total Spam Blocked" **0**; chart tooltips "August 2026 · Submissions **7**", "September 2026 · Submissions **13**", "October 2026 · Submissions **1**" (October as of 2026-10-14, "Submissions this month 1 out of 250"). The 28 is Web3Forms's own total; it was not checked by hand for test submissions, so the page says "Web3Forms suskaičiavo 28 pateiktas formas".
- Cloudflare Web Analytics: **not supplied**. The page shows a marked empty slot, no numbers.
- Google clicks are not inquiries: the page states this and never adds the two figures together.
