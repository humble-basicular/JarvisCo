# V4 copy draft (jarvisweb.lt redesign) — for Jarvis to replace or approve

Status: **DRAFT, written by Claude 2026-10-14.** Plan §4.2/§4.3 example lines were used where they exist; everything else below was drafted under the honest wording rule (plan §1). The final Lithuanian copy is Jarvis's. Source of truth in code: `src/data/v4.js` (edit there; every line below maps to one key).

Rules applied: every "0 €" is followed by "iki pirmos užklausos, ne ilgiau kaip 3 mėn." and the domain fee is on the same screen (enforced by `npm run check:copy`); no rank guarantees; no invented numbers; no testimonial text (Jarvis: results speak for themselves).

| Key | Lithuanian (as shown) | From plan? |
|---|---|---|
| hero.home.lines | Svetainė, kuri / nieko nekainuoja, / kol neatneša užklausos. | §4.2 example |
| hero.heating.lines | Svetainė šildymo meistrui, / kuri nieko nekainuoja, / kol neatneša užklausos. | drafted |
| hero.heating.stamp | Šildymo meistrams | drafted |
| hero.sub[0] | Nemokama Jūsų svetainės peržiūra per 48 val. Paleidus svetainę mėnesio mokesčio nėra iki pirmos užklausos, ne ilgiau kaip 3 mėn. | drafted (§4.2 asks for "iki 3 mėn." + "domenas Jūsų vardu") |
| hero.sub[1] | Mokate tik už domeną (~15 € per metus), ir jis registruojamas Jūsų vardu. | drafted |
| MAIN_CTA | Gauti nemokamą peržiūrą | §4.2 |
| hero.sms | Parašyti SMS | §4.2 |
| offerRow | Nemokama peržiūra per 48 val. · 0 € iki pirmos užklausos, ne ilgiau kaip 3 mėn. · Domenas Jūsų vardu, ~15 € per metus · Atsisakyti galite bet kada | §4.2, reworded to fit the rule |
| proof.title | Kas vyksta arbcut.lt | §4.2 |
| proof.text | arbcut.lt – arboristo svetainė Kaune, kurią sukūriau. Žemiau – tikros ekrano kopijos iš jos paskyrų: tik apkirptos, skaičiai nepakeisti. | drafted |
| proof.gsc.stats labels | paspaudimai iš Google paieškos · parodymų Google paieškoje · vidutinis paspaudimų rodiklis · vidutinė pozicija | drafted |
| proof.gsc.caption / meta | Google paieška per 3 mėnesius, 2026-07-12 – 2026-10-10. · Ekrano kopija 2026-10-14 · Šaltinis: Google Search Console | drafted |
| proof.forms.stats labels | rugpjūtį · rugsėjį · spalį (iki 14 d.) · iš viso nuo 2026-04-19 | drafted |
| proof.forms.caption / meta | Užklausos per svetainės formą. Web3Forms suskaičiavo 28 pateiktas formas nuo 2026-04-19, kai forma buvo sukurta; šlamšto – 0. · Ekrano kopija 2026-10-14 · Šaltinis: Web3Forms | drafted |
| proof.forms.more | Rugpjūčio ekrano kopija · Spalio ekrano kopija | drafted |
| proof.honest | Paspaudimai iš Google nėra užklausos: ne kiekvienas lankytojas parašo. Todėl rodau abu skaičius atskirai. | drafted |
| compare.title / text | Katalogai ar sava svetainė · Katalogai ir svetainė gali veikti kartu. Štai kuo jie skiriasi. | Jarvis review 2026-10-15; source-neutral |
| compare.cols / rows | Katalogai (Paslaugos.lt, 1551.lt…) / Jūsų svetainė · Kur Jus randa: Tarp kitų paslaugų teikėjų. / Atskirame Jūsų paslaugų puslapyje. · Kaip prisistatote: Profilis pagal katalogo struktūrą ir taisykles. / Jūsų paslaugos, darbų nuotraukos ir kontaktai vienoje vietoje. · Kas lieka, jei sustojate: Profilį tvarkote pagal katalogo taisykles. / Domenas ir Google verslo profilis – Jūsų vardu. Jie lieka Jums. | Jarvis review; no claim about shared inquiries |
| how.title / text | Keturi žingsniai, mokate tik paskutiniame · Nuo formos iki veikiančios svetainės. Visą darbą darau pats. | drafted |
| how.steps | Forma, 2 min. · Peržiūra per 48 val. · Domenas ir paleidimas · Mokate tik po pirmos užklausos (+ one sentence each, see v4.js) | §4.2 structure, drafted text |
| examples | Kaip atrodytų Jūsų · Tikros svetainės, ne maketai. Šildymo pavyzdyje vardas ir duomenys išgalvoti. · Šildymo meistro svetainė / Pavyzdys / Žiūrėti pavyzdį · arbcut.lt – arboristas, Kaunas / Veikianti svetainė / Žiūrėti pavyzdį | §4.2 title, rest drafted |
| price | 39 € / mėn. · tik po pirmos užklausos arba po 3 mėn. nuo paleidimo – kas įvyks anksčiau. · Iki tol – 0 € iki pirmos užklausos, ne ilgiau kaip 3 mėn. Domeną (~15 € per metus) apmokate Jūs, ir jis registruojamas Jūsų vardu. | §4.2 + §1 |
| price.includes | Svetainė ir talpinimas · Smulkūs pakeitimai: tekstai, nuotraukos, kainos (iki ~30 min. per mėnesį) · Google verslo profilio priežiūra: nuotraukos, nuoroda įvertinimams · Kas mėnesį SMS ataskaita: kiek užklausų ir paspaudimų „Skambinti“ | §1 |
| price.inquiry | Tikro kliento žinutė per svetainės formą apie Jūsų paslaugą. Bandymai, šlamštas ir pasikartojimai neskaičiuojami – kiekvieną patikrinu rankomis. | §1 |
| price.cancel | Parašote SMS ar paskambinate, bet kada. Per bandomąjį laikotarpį tai nieko nekainuoja. Vėliau svetainė veikia iki apmokėto mėnesio pabaigos. Domenas, Google profilis, Jūsų nuotraukos ir tekstai lieka Jums. | §1 |
| price.billing | Sąskaita kas mėnesį, mokama mėnesiui į priekį, pavedimu. | §1 |
| about | Matas, Kaunas · Svetaines kuriu pats ir atsakau pats. · Individuali veikla. Rašote ar skambinate – atsiliepiu aš, ne skambučių centras. · Skambinti +370 676 99395 | §4.2 line + drafted |
| faq (7) | Darbo per valias, kam man? · Turėjau svetainę, nieko nedavė · Kas, jei neatneš užklausų? · Ar būsiu pirmas Google? · Kas, jei atsisakysiu? · Kodėl nemokamai pradžiai? · Neturiu nuotraukų ar logotipo — all answers drafted (see v4.js) | questions §4.2/§4.3 |
| cta | Pažiūrėkite, kaip atrodytų Jūsų svetainė · Keli trumpi klausimai, apie 2 minutes. Peržiūrą atsiųsiu per 48 val. Nepatiks – tiesiog neatsakykite. | drafted |
| steps (form) | Kokia Jūsų sritis? (Šildymas, Santechnika, Medžių darbai, Stogai, Elektra, Statyba ir remontas, Aplinkos tvarkymas, Kita) · Kokias paslaugas teikiate? · Kur dirbate? · Kiek metų dirbate šioje srityje? (Iki 3 / 3–10 / 10–20 / Daugiau nei 20 m.) · Kuo išsiskiriate? · Nuotraukos ir logotipas: Paimkite nuotraukas iš mano profilio internete (Paslaugos.lt, 1551.lt ar kt.) / Įkelsiu savo · Profilio nuoroda (nebūtina) · Kur atsiųsti peržiūrą? · Paskambinkite man · Nenorite pildyti? Paskambinkite man · Klausimas N iš 6 · Toliau / Atgal | §4.3 order, drafted wording |
| steps.consent | Spausdami mygtuką sutinkate, kad šiuos duomenis ir failus naudočiau tik Jūsų peržiūrai paruošti ir susisiekti dėl jos. Privatumo politika. | drafted |
| steps.extraErrors | Pasirinkite vieną variantą. · …: nepavyko paruošti nuotraukos. Pabandykite kitą arba mažesnę. | drafted |
| footer.line | Svetainės paslaugų meistrams. Kaunas, visa Lietuva. | drafted |
| meta.home / meta.heating | titles + descriptions (see v4.js) | drafted |

Unchanged from the funnel stage (`src/data/content.js` → `funnel.form`): field labels for name/phone/contact time, error texts, thank-you texts.

## Jarvis review 2026-10-15 — source-neutral wording

- FAQ „Neturiu nuotraukų ar logotipo“: „Nieko tokio. Su Jūsų leidimu paimsiu darbų nuotraukas iš Jūsų profilio internete (Paslaugos.lt, 1551.lt ar kt.), o vietoj logotipo bus tvarkingai užrašytas pavadinimas. Vėliau viską galima pakeisti.“
- Optional „Profilio nuoroda“ is composed into `standout` as „Profilis: <url>“; no new wire field.

## Jarvis review 2026-10-15 — real images, no quotes

- Removed the entire Mantas quote block and Cloudflare Web Analytics slot; no replacement claims.
- Homepage hero alt: „Mantas Gerulis dirba medžio lajoje“. Heating hero alt: „Šildymo meistro svetainės pavyzdys, mobilioji versija“.
- Portrait alt: „Mantas Gerulis su grandininiu pjūklu“; caption: „Mantas Gerulis, arboristas, Kaunas · arbcut.lt“.
- Example image alts: „Šildymo meistro svetainės mobilioji ekrano kopija“ / „arbcut.lt mobilioji ekrano kopija“.
- Both example links: „Žiūrėti pavyzdį“. Captions stay „Šildymo meistro svetainė“ / „Pavyzdys“ and „arbcut.lt – arboristas, Kaunas“ / „Veikianti svetainė“.
- Removed all photo placeholder labels; kept Jarvis's existing photo.
