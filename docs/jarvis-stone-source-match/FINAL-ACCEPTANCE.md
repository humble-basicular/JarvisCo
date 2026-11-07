# Galutinė vietinės peržiūros patikra — 2026-11-07

**Verdict: approved** — vietinės pagrindinio puslapio peržiūros apimčiai. Matas dar nepriėmė dizaino; leidimo publikuoti nėra.

Kodas: `04b5ed409dc25fceb1553a24807a47ef39f44a28`, šaka `review/jarvis-stone-lt-20261107`. Claude Opus 5.5 high kandidatas `e60a939` integruotas atskirame Codex checkout kaip `534138f`; Codex GPT-6.1-Sol xhigh atliko nepriklausomą patikrą ir ribotus taisymus. Autoriaus ir pagrindinis checkout nekeisti (main tik board).

Peržiūra: http://127.0.0.1:4381/ . Atskiras pokalbio žingsnis: http://127.0.0.1:4381/pavyzdys/pokalbis . Abu HTTP 200; vietinis Astro preview procesas paliktas peržiūrai (PID28599). Tai nėra produkcinis ar išorinis deploy.

## Palyginimas su šaltiniu

Sutartis: `SPEC.md`, vartotojo 9 ekrano nuotraukos; Stone gyvas puslapis ir anksčiau išsaugoti desktop00–13/mobile00–20 kadrai. Peržiūrėti visi penki originalių GIF timeline lapai, trys originalių blokų kadrai, mūsų visų penkių ciklų 40 tarpinių kadrų lapai, penki reduced-motion galutiniai kadrai, viso puslapio 6 pločių kadrai ir 15 atskirų sričių (header, hero, Google, funkcijų įžanga, 5 mechanizmai, sritys, procesas, kodėl mes, DUK, pokalbis, footer) ties1440/390. Peržiūrėti atskiri laptopo, dialogų ir callback kadrai.

Eilė: hero → tikras Google įvertinimas → funkcijos (svetainė, atsiliepimai, praleistas skambutis, kampanija, SEO) → dvi stock kortelių eilės → 3 žingsniai → 6 kairėje lygiuotos kortelės → DUK → pokalbio kortelė → footer. Atskiros programėlės/SMS formos sekcijos, raidžių vietoj nuotraukų, techninių užrašų prie ekranų nėra. Prisijungimas veda į anksčiau patikrintą Jarvis programėlės įėjimą; paskyros nenaudotos.

Visų ciklų prasminės fazės matomos: laptopo užklausos pildymas ir paspaudimas → telefonas/SMS/atsakymas; atsiliepimo mygtukas → žvaigždės/tekstas/paskelbimas; gaunamas skambutis → SMS/atsakymas; kampanijos forma → paleidimas/konfeti → SMS/atsakymas; SEO kortelė iš3į1, indikatorius20→1. Kadencijos13,99/9,99/13,99/13,99/9,99s. Tai nuosavos HTML/CSS demonstracijos ant patvirtintų Jarvis kadrų, ne Stone GIF kopijos ar tikrų SMS pristatymo įrodymai.

Sąmoningos, SPEC numatytos adaptacijos: vienas tikras Google įvertinimas vietoj Stone klientų citatų/video; neperimti spaudos/partnerių/antro atsiliepimų bloko duomenys; savas siauresnis žmogaus siluetas vietoj Stone roboto; dabartinis Dynamic Island; nėra nepatvirtinto atsiliepimų filtravimo. Tikslus pikselių sutapimas neteigiamas. Google5,0 patikrinta ankstesnėje šaltinio analizėje;1atsiliepimas — vartotojo pateiktas skaičius. Autorius/citata neišgalvoti.

## Taisymai

- CSS specifiškumas: balti5,0 skaičiai tamsioje kortelėje, auksinis Prisijungti.
- 768px tamsus sekcijos kraštas nebedengia proceso antraštės (atskiras diagnostinis kadras).
- Ilgas lietuviškas footerio CTA telpa savo stulpelyje, nedengia nuorodų.
- Mobile: šaltinio karuselės rodyklės, dviejų stulpelių nuorodos, pokalbio kortelė be apačioje pridėto talismano. Rodyklių SVG4px išlindimas pašalintas.
- Pašalintas papildomas „užtenka šalmo“ pokštas; „Diplomo nereikia“ atitinka šaltinio mintį. Kampanijos atsakyme ištaisytas netinkamas kreipinys.
- Dvi ankstesnės fokuso testų klaidos buvo sinchroninio tikrinimo prieš native dialog close įvykį artefaktai. Patikrinta ir T3 gyvame puslapyje; QA dabar laukia tikro close įvykio. UI fokuso kodo keisti nereikėjo.
- Papildomas playback testas iš pradžių pats .play() perėmė CSS pristabdymą; testas pataisytas neperimti valdymo. Natūralus judėjimas ir CSS pristabdymas patikrinti atskirai.
- Asset aprašas atnaujintas: stock-manifest/provenance, laptopas, Scene.astro, tikri demo dialogai.

## Callback papildymas4ed231c

`/pavyzdys/pokalbis` yra atskira noindex,nofollow vietinė peržiūra. Po validžios NEIŠSIŲSTOS užklausos dialoge atsiranda nuoroda peržiūrėti kitą žingsnį. Užklausa neišsaugoma; nėra asmens duomenų URL, naujos formos, kalendoriaus, JS ar tracking. Aiškiai pasakoma, kad skambutis neužsakytas. Tikras Google įrodymas, o ne išgalvotos klientų citatos.

Iš originalo perimta pagrįsta seka/kryptis: susisiekiama telefonu, kalendoriuje laiko rinktis nereikia. Tikro kvalifikacinio klausimyno klausimai/šakos ir video garso turinys nežinomi. Nuosavų intro/testimonial video nėra; jie nepridėti. Tai nėra teiginys, kad visas Stone callback funnel jau atkurtas ar kad veikia CRM/provider integracija.

## Patikros

- `O2_BOOKING=preview npm run check` PASS: build, copy14puslapių, JS, static.
- `node src/checks/o2-check.mjs` PASS; `git diff --check` PASS.
- Homepage JS1716B gzip iš30720B leidžiamos ribos. Nodev26.7.0.
- `node scripts/o2-qa.mjs /tmp/o2-final12-qa` PASS; receipt `qa/receipt-final-20261107.json`. 320/390/768/1024/1280/1440 be horizontalaus išlindimo; visi assetai įkelti;10stock nuotraukų; karuselė slenka.
- Menu Escape/opener, išorinio fokuso grąžinimas, booking iš meniu, klaidingas/validus telefonas, no-send, įjungtas submit po bandymo,5teisingi demo dialogai ir fokuso grąžinimas PASS.
- Penkių scenų laikas realiai juda matomoje srityje, pasikartoja po ciklo ir sustoja už ekrano; reduced motion5scenos/0veikiančiųanimacijų PASS.
- Callback320/390/1440 be išlindimo, be formų/JS, noindex ir teisinga no-send būsena PASS.
- Išoriniai POST0, užblokuotos išorinės užklausos0, trūkstami assetai0. QA tinklo barjeras leidžia tik vietinio serverio GET.
- Ankstesnė Node22 TypeScript statinės patikros problema nėra šio kandidato regresija: importas `src/checks/static-check.mjs:11` yra bazėjee04a251, įvestas5abefa2d. Su dabartiniu Node26 patikra praeina; svetimas šablonas nekeistas. Konkretaus ankstesnio Node22 minor šioje patikroje nepakartojau.
- T3 pradžioje atvėrė ir patikrino puslapį/fokusą; vėliau screenshot du kartus grąžino `Preview automation snapshot timed out after 15000ms.`. Naudotas esamas repo CDP QA workflow ir atskira trumpa diagnostika su nuosavu headless profiliu. Dialogų screenshot helperis pataisytas fotografuoti viewport (captureBeyondViewport:false), nes dokumento clip neteisingai rodė fixed dialogus; toks pats parametras diagnostikoje patikrintas. Vėlyvas preview_open pakibo, laukimas nutrauktas; nerodomas klaidingas teiginys, kad T3 panelė matoma. Tiesioginiai URL ir kadrai patikrinti.

## Ribos

Netikrinta reali SMS/CRM/pristatymo integracija, produkciniai redirectai, Lighthouse, Safari/fiziniai telefonai, pilnas kvalifikacinis klausimynas ar video turinys. Šios užduoties rezultatas — patikrinta vietinė peržiūra, ne viešas paleidimas. Canonical Drive kopijų SHA256 readback patikrintas (`qa/final-readback.json`), cloud sync nepatikrintas.

## Modelių sąnaudų momentinė išklotinė

Claude2Opus5.5high įgyvendinimas; CodexGPT6.1-Solxhigh koordinavimas/patikra. `stage_outcomes`: žinomas bendras list-price įvertis≥8,9115038USD (lead5,07748; stages3,8340238), `costComplete:false`, `wastedCostUsd:0,3422056`. Tai ne mokėjimas už API. `costPerAcceptedStageUsd:null` — patikima kaina vienam priimtam etapui nežinoma. Tool pateiktas lower bound4,4557519 remiasi2machine-completed etapais, o ne2nepriklausomais dizaino priėmimais. Naujasis lead turn įvertį gali dar padidinti. Taupymo teiginių nėra.

Done · vietinė peržiūra ir riboti taisymai · Verified · build/static/copy/JS, browser receipt, visi skyriai/ciklai, HTTP200 · Not verified · realus SMS/CRM, visas callback funnel, produkcija · Next · Matas peržiūri dizainą ir tekstus.
