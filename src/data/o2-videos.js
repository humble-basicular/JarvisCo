/* VIDEO SLOT MAP (S2, 17 Nov 2026). One place for every YouTube embed on jarvisweb.lt.
   Channel „Jarvis Systems | Meistrams“ (@JarvisSystemsLT), playlist PLJBXwmnPzczU, embedding allowed, LT subtitles.
   Posters are our own covers (YouTube custom thumbnails unavailable until the channel is phone-verified).

   `id`    = the video that is LIVE today (old recording). Do not touch until S5.
   `newId` = the slot for the video filmed 17 Nov. 'TODO-ID' = not uploaded yet. S5: paste the new YouTube ID here, set
             `id = newId`, replace `poster` with the new cover, then delete `newId`. `node src/checks/video-slots-check.mjs`
             (run by `npm run check:video-slots`) fails if a slot is half-swapped or an ID is malformed.

   18 Nov (Matas): intro + susisieksime swapped to the new uploads; svetaine, skambuciai, atsiliepimai-sistema show the
   "Video tvarkomas" sign (`tvarkomas: true`, no player) until their new videos are uploaded; pokalbis (not on the site) waits.

   | key                  | where it shows                                   | new video (17 Nov)                                    | status |
   |----------------------|--------------------------------------------------|-------------------------------------------------------|--------|
   | intro                | home „Pažiūrėkite, kaip tai veikia“, /registracija | Jarvis Systems per 1 minutę (intro)                   | TODO-ID |
   | susisieksime         | /susisieksime, /kontaktai                         | SHORT /susisieksime video (site/ad visitors → we call) | TODO-ID |
   | svetaine             | home feature 1 demo + /funkcijos/funkcionali-svetaine | Funkcionali svetainė                              | TODO-ID |
   | skambuciai           | home feature 2 demo + /funkcijos/praleistas-skambutis | Automatinis pokalbis po praleisto skambučio       | TODO-ID |
   | atsiliepimai-sistema | home feature 3 demo + /funkcijos/atsiliepimu-rinkimas | Atsiliepimų rinkimas                              | TODO-ID |
   | pokalbis             | NOT on the site: sent to a lead after booking     | Detailed pre-call video (Ko tikėtis prieš pokalbį)    | TODO-ID |
   | kampanijos           | home feature 4 demo + /funkcijos/kampanijos       | keeps the old video                                   | keep   |
   | seo                  | home feature 5 demo + /funkcijos/vietinis-seo     | keeps the old video                                   | keep   |
   | dezute               | home, under the feature list                      | keeps the old video (viena dėžutė)                    | keep   |
*/
export const TODO_ID = 'TODO-ID';
export const VIDEOS = {
  intro: { id: 'XC5AcGkpsB8', title: 'Jarvis Systems per 1 minutę', poster: '/video/00-svetaines-intro.webp' },
  /* /susisieksime (booking page): unlisted. Matas 2026-11-17: this one is the SHORT video; the detailed one is `pokalbis`. */
  susisieksime: { id: 'UTHOH4o2tm4', title: 'Susisieksime | Jarvis Systems', poster: '/video/7-susisieksime.webp' },
  /* Detailed pre-call video: sent after booking, not embedded on any page (kept here so S5 has one map). */
  pokalbis: { id: '6rXDiad6J-w', title: 'Ko tikėtis prieš pokalbį', poster: '/video/0-pries-pokalbi.webp' },
  svetaine: { id: 'BKD3fftoCtA', title: 'Funkcionali svetainė', poster: '/video/1-funkcionali-svetaine.webp' },
  /* Renamed 2026-11-17 (Matas): „Automatinis pokalbis po praleisto skambučio“. The old cover still carries the old title; replace it with the new one. */
  skambuciai: { id: 'nqpCPtlR420', title: 'Automatinis pokalbis po praleisto skambučio', poster: '/video/2-zinute-po-praleisto-skambucio.webp' },
  'atsiliepimai-sistema': { id: 'J53inQA2SGE', title: 'Atsiliepimų rinkimas', poster: '/video/3-atsiliepimai.webp' },
  kampanijos: { id: '0HAYKTG8EjA', title: 'Kampanijos', poster: '/video/4-kampanijos.webp' },
  seo: { id: '8KRV7Yavkzc', title: 'SEO, AEO ir GEO', poster: '/video/5-seo-aeo-geo.webp' },
  dezute: { id: 'z7ns8qtnBbE', title: 'Visos žinutės vienoje dėžutėje', poster: '/video/6-viena-dezute.webp' },
};
