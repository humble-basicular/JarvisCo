# Handoff: proof site — preview ready, Worker live, production awaits Jarvis
From: claude (Opus 5.5 parent) · To: next parent (claude or codex) · Date: 2026-10-11T17:15+03:00
## State
- Integration rebuild-2026-10 includes footer fix merge; commit named in git log after this note.
- Vercel preview https://jarvis-6yw6au1gs-jarvisworkscos-projects.vercel.app (Vercel auth protection). Production still old site dpl_3mb1Y1Sic2js48HF1KPvshnvQkoY.
- Worker jarvisweb-proof-tracking live on 4 routes, version 4b9d1c4b-1d90-4d18-a1de-78f896559f4f. Checks 3, 4, 5 passed live. /p/* currently redirects to /arboristams which 404s on the OLD production site until the site is promoted.
## Next action + owner
1. Jarvis: open preview, approve or list changes (spec §7.9).
2. Parent after approval: `vercel deploy --prod --yes` from main checkout; verify https://www.jarvisweb.lt/arboristams, apex→www keeps ?r=, beacon removes r from address bar, Lighthouse mobile on production (attach report, §7.7), 360px no overflow.
3. Jarvis: real Android tap on sms:/tel: (§7.6).
4. Optional with Jarvis approval: delete synthetic a2345 rows from D1.
## Rollback
Vercel: promote dpl_3mb1Y1Sic2js48HF1KPvshnvQkoY. Worker: remove only the 4 routes; keep D1.
