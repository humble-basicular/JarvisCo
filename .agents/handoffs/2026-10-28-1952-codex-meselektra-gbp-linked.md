# Handoff: MesElektra verified Google profile connections released
From: codex · To: either · Date: 2026-10-28T19:52:46.538460+02:00
## Objective
Connect the live MesElektra website to Rytis’s newly verified GBP; factual setup and formal Lithuanian draft, no sending or purchases.
## Decisions and constraints
User authorized setup/release and ChatGPT browser computer use in existing Chrome. Coverage Klaipėdoje ir aplink; named towns are examples. Keep existing city URLs, branding, forms, private addresses and trial dates intact.
## State
Code33020a9 reviewed by Claude Sonnet5.5 high (round2 approved8877c05) and independently verified. Integrated into source main and deployed to Cloudflare Pages95c08e7a-d08b-4c4c-9420-5e70c2d3fa92. Rollback1716171b-0fa7-4ae7-babf-6a6431b8288d. No further code change required by this source stage.
Own source worktree/client branch retains ignored private fixture/build. Canonical private Drive raw input backed up and only v3.gbp/v3.map added. Other clients were not deployed or changed.
## Changed files
V3Layout og:site_name; service-pages homepageWebSite and suppliedGBP sameAs; V3Site public Google embed behind consent, town maps preserved; content/normalizer optional strictembedUrl; focused tests. Two code commits6e392f8/33020a9. This handoff is documentation only after deployedcode33020a9.
## Checks
9schema tests,syntheticproduction/test/preview withconsent+disabledmaps/privacy/noopener,58existingcontractvisualchecks,8additionalmalformedembedvalidationcases,actualproductiondeployguard;19/19livepages+3exactbrandassets+robots/sitemap/404/www301 pass. NativeChrome map0iframesbeforeconsent→1after,correctMeselektra mapvisible,nooverflow1470px. Reviewlink openscorrectemptyreviewdialog;no posting. No liveform submission in this release;Worker routingunchanged.
## Remaining / external
Description accepted;6GBPservices still pendingGoogle. Originalclientlogo and3genuineworkphotosNOTuploaded:ChatGPTChromeextensionfileURLaccessoff;do notbypass. GSCsitemapSuccess19/home+Palangaindexed;onefreshhomepagerecrawlrequestFAILEDGoogle-reCAPTCHAconnectivity,noretry/noacceptedrequestclaimed. FutureGooglebranding/rankings/results,realphone,cloudsyncnotverified.
## Canonical evidence and next owner
Management own worktree ../WebAgency-Biz-worktrees/meselektra-search-20261028, research/meselektra-gbp-completion-2026-10-28/{REPORT.md,release.json,live-http-acceptance.json,profile-readback.json}. Canonical Drive Business/JarvisWeb/management/meselektra-gbp-completion-2026-10-28 contains report,unsentLTdraft andproofPNG.
Matas enables ChatGPTextension AllowaccesstofileURLs oruploadsoriginalimagesthemselves;agentfinishesnormalGoogleuploadUI. Google ownsserviceapproval. No nextdue date agreed; no automation created. No message/review/form submitted,paidAPI/purchase,CRM/trialchangeoroldprofiledeletion.
