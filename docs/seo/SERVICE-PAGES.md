# v3 service pages — implementation receipt, 26 October 2026

Source owner: implementation stage, branch `feat/seo-services-20261026`, baseline `69ce164`.
Frozen interface: management `research/seo-implementation-2026-10-26/PLAN.md`.

## Contract and integration

The optional `v3.servicePages` array consumes the frozen service-catalog v1 page shape. The lead attaches each client's separately authored `servicePages` to that client's private input. The repository does not contain real catalogue copy or private inputs. Every existing service name must map exactly once; grouping is supported. Unknown/duplicate/missing mappings, reserved/traversal slugs, invalid text bounds and non-real/out-of-range photos fail validation. `sections` is required (at most six); factual optional lists can be omitted. Inputs without `servicePages` remain valid.

Preview URLs are `/perziura/<slug>/paslaugos/<serviceSlug>` and standalone URLs `/paslaugos/<serviceSlug>/`. Pages reuse the existing theme, header/footer, branding, quote form and direct telephone interfaces. They show supplied scope, preparation, price factors, FAQ, relevant real photos, related services and existing areas. No selected photo produces a layout without an unrelated hero photograph. Home/town service cards and footer link to mapped details; quote actions remain separate. The special enquiry card still calls directly.

Production pages have their own canonical, sitemap entry and title. Production town titles use the supplied activity/town tagline, falling back to the existing H1 wording. Production home/town/service schemas use a stable LocalBusiness identity; service pages add Service and BreadcrumbList. No inferred addresses, ratings, hours, trade categories or outcomes. JSON-LD escapes HTML characters and script terminators. Preview and test builds remain noindex and publish no business schema. Agency sitemap continues excluding previews.

The v3 standalone build emits top-level `404.html` with noindex,nofollow and no home canonical/redirect. Cloudflare documents that a top-level 404 disables its implicit SPA-home fallback: https://developers.cloudflare.com/pages/configuration/serving-pages/ (checked 26 October 2026, sections “Not Found behavior” and “Single-page application (SPA) rendering”). Actual host HTTP status still requires the lead's post-release check.

Build/deploy acceptance checks verify the 404, service links/canonicals/robots/schema/forms and sitemap documents. Deploy checking permits expected 404/thank-you noindex while rejecting accidental noindex elsewhere. Test markers and localhost endpoints remain deployment blockers.

## Verification

- `npm ci --no-audit --no-fund`: installed from existing lock; no package/lock changes.
- `node --test scripts/service-pages-test.mjs scripts/launch/batch.test.mjs`: 27 passed, zero failed (8 new contract/helper tests plus 19 existing launch tests).
- `node scripts/service-pages-artifact-test.mjs`: passed. Synthetic standalone without servicePages, test standalone with two grouped service pages, production standalone, actual preview wrappers; HTML/schema escaping, scope/photo absence, links and anchors, telephone/form wiring, activity/town metadata, sitemap and 404 checks. Production deploy check passes; test build and injected service noindex fail as required. No submissions/network delivery tested.
- `npm run check`: passed; copy, JavaScript budget and static checks across 65 generated pages. Includes five byte-identical frozen private inputs plus a labelled synthetic fixture, with no real service catalogue attached.
- `git diff --check`: passed. Approved favicon source/assets unchanged from baseline.

The artifact test retains its ignored synthetic input `previews/23456789ab.json`, synthetic photo and `previews/staging/seo-synthetic-config.json`, test-build backups and production-shaped output `client-sites/23456789ab/`. These are test fixtures, not release inputs. Never deploy the synthetic site. The five real inputs were copied unchanged from the released favicon worktree; asset files were hardlinked for read-only building. Do not edit hardlinked originals in this worktree.

## Remaining acceptance — lead owner

Attach and validate the independent real service catalogue, rebuild all five real service suites, inspect service-copy/photo relevance, then perform desktop/mobile browser and local form-isolation QA. Visual layout, performance, real client standalone service builds, cross-provider review, live HTTP status, deployment, DNS/Worker settings and search outcomes are unverified here. No deployments, forms/messages, account/CRM changes or ArbCut edits occurred. No management/integration board changed.

Before deployment, run `node scripts/client-site-deploy-check.mjs client-sites/<real-slug>` for each release artifact. Independently check all generated service routes and a random nonexistent path on the actual host. The current worktree has a synthetic preview alongside real fixtures; exclude it from release inputs before the lead's agency build.
