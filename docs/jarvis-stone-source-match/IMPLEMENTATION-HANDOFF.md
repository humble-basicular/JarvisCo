# Handoff — jarvis-stone-source-match implementation (Claude Opus 5.5) — 2026-11-07

Status: STOPPED at soft input budget (1.61M > 1.6M steer). NO source edits made. Not done, not verified.
Branch/cwd: t3/jarvis-stone-source-match @ /Users/matasbasinskas/.ai-powerhouse/worktrees/JarvisCo/t3-df9e82cd
Base: fast-forwarded main e04a251 → a5a752e (frozen candidate + SPEC/assets). This note is the only new commit.

## Read (no need to re-read; reuse these findings)
- SPEC.md in full. User screenshots: SOURCEhero (5febd71e), SOURCEwhy (72777071), FunctionalWebsite (d2c12eea), badtrades (c398bc2d).
- All 5 timeline sheets in mainDrive source-evidence; media-durations.json (13.99/9.99/13.99/13.99/9.99 s, loop 0); computed-metrics.json; extra-details.json; google-profile.json (Maps cid=6399877159958550530 shows JarvisCo 5,0; no review text).
- Archive desktop-01 (proof cards), -06/-07 (trades, 3×2 photo cards ~371×200, white caption, gold chevron arrows, CTA "See All Trades…", navy V-bottom), -08 (process: 3 gold circles, dotted wave, centred text), -11 (FAQ: gold open row, chevron icon right), -12 (talk card: centred copy left, presenting mascot right), -13 (footer: logo + "Ready to get started?" CTA row; rule; "Want to learn more…"+CTA | Links | About | Products 2 cols; legal row; ©).
- Full source copy is in archive text.txt (features/bullets/process/why/FAQ questions/footer).

## Section order to build (source)
header (static 100px: logo · Produktai/Kainos/Atsiliepimai/Mūsų darbai/Blog?/Apie · gold "Prisijungti" text link · CTA)
→ hero navy (3-line H1 w/ left rule, lead para + CTA, Google 5,0 badge only, mascot 748px right)
→ proof grey + chevron (one genuine Google 5,0 card linking brand.gbp; no quote/author)
→ features white: H2 "Paprastos sistemos, kurios tiesiog veikia / …" + 5 rows (website laptop→phone L, reviews R, missed-call L, campaigns R, Local SEO L), each "Trumpa demonstracija" → feature-specific demo (e.g. dialog replaying that row's scene)
→ trades navy slant (2-row carousel, stock photo in EVERY card, licences recorded internally, no public note)
→ process grey chevron → why white (3×348 gap16 pad16 r8, white 50px outline icons top-left, left-aligned white text, source 6 concepts in order) → navy join chevron → FAQ grey → talk card → footer (source columns).
REMOVE: #demo two-card SMS section + its o2.ts demo code (section 4) and data `demo`; "Pavyzdys" pill (Phone.astro .scr__app small); `screenNote` figcaption; trades `note`; hero "Kad nė viena…"; why "Septintos neradome"; app feature row; hero face/phone-number nav.
FIX in o2.ts: menu close → `if (!menuNav) menuOpener?.focus()` unconditionally; booking keeps truthful no-send status only after use.

## Open items / unknowns
- App login URL: NOT found yet. Was about to read jarvisweb-sistema handoffs (`/Users/matasbasinskas/Work/Code projects/jarvisweb-sistema`) — grep there timed out; bounded lookup needed. Do not invent a URL.
- Truthfulness traps in source copy: "Showcase your best reviews / bad reviews hidden", "5-Star Reviews Only", "guiding to 5-star" = review gating → must be rephrased to the neutral real mechanism (everyone gets the link). "87% visit on phone" statistic not verified → drop or rephrase without number. Process "7–10 days" / "20 mins" → use own facts (15–20 min call, 50 € first 5, 30 days free) only.
- Blog: no blog page exists → omit or point to /rezultatai; no dead pages.
- Stock photos: not sourced yet (Unsplash/Pexels; record URL + licence in docs/OFFER2-ASSETS.md).
- Betono gaminiai demo website for laptop glass: not built; laptop-blank.webp glass quad not measured yet.
- None of acceptance (build, check:o2 update, 1440/390/320/768/1024/1280 renders, 5 animation cycle evidence, keyboard/reduced-motion) has been run.

## Next (owner: lead decides — new implementation round with fresh budget)
Implement from this note + SPEC directly; estimated remaining work is the entire reconstruction (copy, 5 animated scenes, stock, CSS, checks, full visual QA).
