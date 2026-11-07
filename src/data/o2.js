/* Jarvis Systems homepage copy (Stone-reference rebuild, 2026-11-07). Single text source for
   src/pages/index.astro. DRAFT for Matas's wording review on the rendered page: no hero headline is
   approved yet (the two rejected lines in the brand-kit handoff are not used).

   Facts (do not change without a new decision):
   - Bundle: website enquiry/form → SMS conversation + owner alert; review requests + one reminder;
     missed call → SMS; past-customer campaigns (STOP opt-out, preview/schedule/cancel); one client app.
   - First 5 only: 50 € preparation upfront, 30 days free from a verified working launch, then 97 €/mėn.
     only after an explicit "tęsiam". Needed new domain is client-owned and extra. New website / ads
     spend not included. Refund principle: 3 Nov DECISIONS (four cases below).
   - SMS provider is NOT active: the demo is a simulator and says so. Never claim handset delivery.
   - NOT decided, never stated: SMS allowance, later setup price, setup duration, support hours.
   App facts: push/Telegram alert, 10-min unanswered reminder, review-link opens counted, monthly report. */
import { brand } from './content.js';

export const NAME = 'Jarvis Systems';
export const O2_CTA = 'Užsiregistruoti pokalbiui';
export const DEMO = { api: 'https://jarvisweb-sistema.jarvisworks-co.workers.dev', tenant: 'jarvisweb' };

export const o2 = {
  meta: {
    title: 'Jarvis Systems – užklausos, skambučiai, atsiliepimai ir SMS vienoje programėlėje',
    description: 'Svetainės užklausos tampa SMS pokalbiais, praleistas skambutis gauna atsakymą, atsiliepimų prašymai ir žinutės buvusiems klientams – vienoje programėlėje. Pirmiems 5: 50 € paruošimas ir 30 dienų nemokamai.',
  },
  nav: [
    { label: 'Funkcijos', href: '#funkcijos' },
    { label: 'Kaip dirbame', href: '#procesas' },
    { label: 'Kodėl mes', href: '#kodel' },
    { label: 'D.U.K.', href: '#duk' },
    { label: 'Svetainės', href: '/svetaines' },
  ],
  menu: 'Meniu', close: 'Uždaryti',
  hero: {
    // DRAFT headline for review.
    title: ['Kad nė viena', 'užklausa nedingtų', 'tyliai'],
    lead: 'Be stebuklų ir be pažadų iš oro. Jokia sistema (net ir mūsų) darbo už Jus neatliks. Bet kai klientas paskambina ar parašo, jis gauna atsakymą, o Jūs viską matote vienoje programėlėje.',
    face: 'Kalbėsite su manimi – Matas',
    mascotAlt: 'Jarvis Systems talismanas – statybininkas geltona liemene, rankos sukryžiuotos',
  },
  demo: {
    title: ['Geriau vieną kartą pamatyti…', 'Išbandykite patys, kaip tai veikia'],
    text: 'Palikite užklausą taip, kaip ją paliktų Jūsų klientas, ir pažiūrėkite, kokią žinutę jis gautų.',
    formTitle: 'Užklausos forma', formNote: 'Tokią formą prijungiame prie Jūsų svetainės.',
    name: 'Vardas', phone: 'Telefono numeris', phoneHint: 'Pvz., +370 612 34567 arba 8 612 34567.',
    service: 'Ko reikia? Trumpai', serviceHint: 'Iki 30 simbolių.', servicePlaceholder: 'Pvz.: reikia pasiūlymo',
    consent: 'Sutinku, kad šis numeris būtų naudojamas demonstracijai, o Matas galėtų susisiekti dėl šios užklausos.',
    privacyLink: 'Privatumo politika',
    submit: 'Išbandyti', sending: 'Tikrinama…',
    simBadge: 'Bandomasis režimas: tikra SMS neišsiunčiama, užklausa tik įrašoma.',
    previewBadge: 'Peržiūros režimas: demonstracija vyksta tik Jūsų naršyklėje. Niekas nesiunčiama ir neišsaugoma.',
    noJs: 'Demonstracijai reikia JavaScript. Galite tiesiog paskambinti.',
    phoneTitle: 'Ką gautų klientas', phoneNote: 'Pavyzdys. SMS tiekėjas dar neprijungtas, todėl tai simuliacija.',
    idleBubble: 'Čia atsiras žinutė, kurią gautų Jūsų klientas.',
    ok: {
      live: 'Užklausa gauta. SMS turėtų ateiti į {phone}. Atsakykite į ją – pamatysite, kaip atrodo pokalbis.',
      liveNoAck: 'Užklausą gavome, bet SMS šiuo numeriu neišsiųsta. Susisieksime patys.',
      previewLive: 'Peržiūros versijoje tikros SMS nesiunčiamos, o demo dabar sujungtas su tikru siuntimu, todėl nieko nesiunčiame.',
      previewUnknown: 'Nepavyko patikrinti demo būsenos, todėl peržiūros versijoje nieko nesiunčiame. Pabandykite vėliau.',
      unknown: 'Užklausa gauta, bet nepavyko patikrinti, ar SMS išsiųsta. Jei žinutės nesulauksite, susisieksime patys.',
      sim: 'Užklausa įrašyta. Demo veikia bandomuoju režimu, todėl tikra SMS neišsiųsta. Štai ką gautumėte:',
      simLabel: 'Simuliacija – realiai neišsiųsta',
      previewSim: 'Peržiūros režimas: niekas neišsiųsta ir neišsaugota. Tai vietinė simuliacija – štai ką gautų klientas:',
    },
    errors: {
      phone: 'Patikrinkite telefono numerį, pvz., +370 612 34567.',
      consent: 'Pažymėkite sutikimą.',
      limit: 'Šiuo numeriu jau bandyta kelis kartus. Pabandykite po valandos.',
      network: 'Ryšys nutrūko, todėl nežinome, ar užklausa pasiekė. Palaukite kelias minutes ir bandykite dar kartą.',
      other: `Nepavyko. Paskambinkite ${brand.phone}.`,
    },
    demoAck: 'Sveiki, cia Matas, Jarvis Systems. Gavau uzklausa: {req}. Susisieksiu. Galite atsakyti cia.',
  },
  features: {
    title: ['Paprastos sistemos, kurios tiesiog veikia', 'Diplomo nereikia – užtenka telefono'],
    demoBtn: 'Užsiregistruoti pokalbiui',
    screenNote: 'Iliustracija. Vardai ir žinutės pavyzdiniai.',
    items: [
      {
        id: 'uzklausos', title: 'Užklausa iš svetainės tampa SMS pokalbiu',
        quote: '„Susisieksime artimiausiu metu“, – sako visi. Klientas tuo metu jau rašo kitiems.',
        points: [
          ['SMS klientui iš karto', 'Vos klientas užpildo formą ar parašo pokalbio lange, jis gauna žinutę nuo Jūsų verslo ir žino, kad buvo išgirstas.'],
          ['Pranešimas Jums', 'Apie kiekvieną naują užklausą sužinote iš pranešimo telefone arba Telegram.'],
          ['Atsakymai – vienoje vietoje', 'Kliento atsakymas atkeliauja į programėlę, o ne į el. paštą, kurį atsidarysite penktadienį.'],
          ['Priminimas po 10 minučių', 'Jei užklausa liko neatsakyta, programėlė primins. Kad niekas nelauktų iki vakaro.'],
        ],
        screen: { app: 'Užklausos', msgs: [['event', 'Nauja užklausa iš svetainės'], ['in', 'Sveiki, reikėtų pasiūlymo. Kada galėtumėte?'], ['out', 'Sveiki, gavome Jūsų užklausą. Netrukus parašysime ar paskambinsime. Galite atsakyti čia.'], ['alert', 'Pranešimas savininkui: nauja užklausa']] },
      },
      {
        id: 'atsiliepimai', title: 'Atsiliepimų prašymai ir priminimai',
        quote: '„Būtinai parašysiu atsiliepimą.“ Visi taip sako. Paskui pamiršta.',
        points: [
          ['Pažymite „Darbas atliktas“', 'Klientas gauna trumpą padėką SMS žinute su nuoroda į Jūsų Google profilį.'],
          ['Vienas mandagus priminimas', 'Jei pamiršo – vienas priminimas. Ne dešimt.'],
          ['Prašome visų, ne tik patenkintų', 'Nuorodą gauna kiekvienas klientas. Jokio rūšiavimo, kas gali rašyti.'],
          ['Matote, kas paspaudė', 'Programėlėje matote, kiek žmonių atidarė atsiliepimo nuorodą.'],
        ],
        screen: { app: 'Atsiliepimai', msgs: [['event', 'Darbas pažymėtas: atliktas'], ['out', 'Ačiū, kad rinkotės mus. Būtume dėkingi, jei skirtumėte minutę atsiliepimui.'], ['link', 'Palikti atsiliepimą Google'], ['event', 'Nuoroda atidaryta']] },
      },
      {
        id: 'skambuciai', title: 'Praleistas skambutis sulaukia žinutės',
        quote: '„Jei reikės, perskambins.“ Neperskambins. Paskambins kitam iš sąrašo.',
        points: [
          ['Atsiliepiate – nieko nesikeičia', 'Skambučiai į verslo numerį skamba Jūsų telefone, kaip visada.'],
          ['Neatsiliepiate – žinutė išeina pati', 'Klientas gauna SMS, kad skambutį matėte, ir gali parašyti, ko reikia.'],
          ['Perskambinate žinodami, dėl ko', 'Programėlėje spaudžiate „Skambinti“, ir telefonas pats surenka numerį.'],
          ['Rankos užimtos? Tam ir sukurta', 'Žinutė išeina, kol Jūs dirbate, vairuojate ar kalbate su kitu klientu.'],
        ],
        screen: { app: 'Skambučiai', msgs: [['event', 'Praleistas skambutis · 14:02'], ['out', 'Sveiki, nespėjome atsiliepti. Parašykite, kuo galime padėti.'], ['in', 'Norėčiau aptarti montavimą kitą savaitę.'], ['alert', 'Perskambinti vienu paspaudimu']] },
      },
      {
        id: 'klientai', title: 'Žinutės buvusiems klientams',
        quote: 'Buvę klientai Jus mėgsta. Tik pamiršo, kur užsirašė Jūsų numerį.',
        points: [
          ['Kvietimas sugrįžti', 'Pavyzdžiui, prieš sezoną: „Turime laisvų laikų – parašykite, jei reikia pagalbos.“'],
          ['Prašymas rekomenduoti', 'Paprašykite perduoti Jūsų kontaktą pažįstamiems.'],
          ['Peržiūrite prieš siunčiant', 'Matote, kam ir kas bus išsiųsta. Galite suplanuoti laiką arba atšaukti.'],
          ['Tik tiems, kam galima', 'Kiekvienos žinutės gale – „Atsisakyti: STOP“. Kas atsisakė, daugiau negauna.'],
        ],
        screen: { app: 'Kampanijos', msgs: [['event', 'Juodraštis · buvę klientai'], ['out', 'Sveiki, kitą mėnesį turime laisvų laikų. Parašykite, jei reikia pagalbos. Atsisakyti: STOP'], ['alert', 'Suplanuota · galite atšaukti'], ['in', 'Sveiki, kaip tik reikėtų. Parašykite kainą.']] },
      },
      {
        id: 'programele', title: 'Viskas vienoje programėlėje',
        quote: '„Užsirašiau ant lapelio.“ Lapelis liko darbo kelnių kišenėje. Skalbimo mašinoje.',
        points: [
          ['Visi pokalbiai viename sąraše', 'Svetainės užklausos, praleisti skambučiai ir SMS – kiekvienas klientas atskirai.'],
          ['Atsakote verslo numeriu', 'Rašote programėlėje, klientas gauna SMS iš to paties verslo numerio.'],
          ['iPhone ir Android', 'Programėlė atsidaro naršyklėje ir įsidiegia į telefono ekraną.'],
          ['Jūsų vardu', 'Programėlėje ir žinutėse – Jūsų verslo pavadinimas.'],
        ],
        screen: { app: 'Pokalbiai', rows: [['Svetainės užklausa', 'Reikėtų pasiūlymo…', 'Nauja'], ['Praleistas skambutis', 'Norėčiau aptarti…', '10 min.'], ['Atsiliepimas', 'Nuoroda atidaryta', ''], ['Kampanija', 'Kaip tik reikėtų…', 'Atsakė']] },
      },
    ],
  },
  trades: {
    title: 'Tinka visiems, kurių užsakymai prasideda nuo pokalbio…',
    text: 'Prekyba, montavimas ar paslaugos – jei klientas pirmiausia paskambina ar parašo, sistema Jums tinka.',
    items: [
      ['boiler-installed', 'Šildymo įranga'],
      ['underfloor', 'Grindinis šildymas'],
      ['radiator', 'Radiatoriai ir montavimas'],
      ['boiler-service', 'Aptarnavimas ir remontas'],
      ['boiler-room', 'Katilinės ir projektai'],
    ],
    more: ['Langai ir durys', 'Stogai ir fasadai', 'Elektra', 'Santechnika', 'Baldai ir prekyba', 'Aplinkos tvarkymas', 'Valymas', 'Kitos paslaugos'],
    note: 'Nuotraukos – iliustracijos, ne klientų darbai.',
    prev: 'Ankstesnės', next: 'Kitos',
  },
  process: {
    title: 'Kaip atrodo darbas su mumis',
    steps: [
      ['Pokalbis', '(15–20 min.)', 'Parodome sistemą ir kartu pasižiūrime, ar ji Jūsų verslui apsimoka. „Ne“ – visiškai normalus atsakymas.'],
      ['Paruošimas', '(50 € pirmiems 5)', 'Verslo numeris, programėlė, SMS tekstai Jūsų vardu ir formos prijungimas. Viską patikriname patys.'],
      ['Paleidimas', '(30 dienų nemokamai)', 'Kartu patikriname, kad viskas veikia. Nuo tos dienos – 30 nemokamų dienų, toliau tik jei pasakote „tęsiam“.'],
    ],
  },
  why: {
    title: ['Kodėl verta?', 'Šešios priežastys. Septintos neradome.'],
    items: [
      ['Paprasta', 'Sąrašas, pokalbis, mygtukas „Skambinti“. Jei prireiks instrukcijos – kalti mes.'],
      ['Be spąstų', 'Jokios metinės sutarties. Mėnesinis mokestis prasideda tik Jums pasakius „tęsiam“.'],
      ['Be robotų', 'Automatinė tik pirma žinutė. Toliau su klientu kalbatės Jūs, savo žodžiais.'],
      ['Jūsų vardu', 'SMS pasirašytos Jūsų vardu, programėlėje – Jūsų verslo pavadinimas.'],
      ['Atsiliepia žmogus', 'Be skambučių centro. Jei kas neveiks, skambinsite Matui.'],
      ['Be pažadų iš oro', 'Nežadame daugiau užsakymų. Pasirūpiname, kad užklausos nedingtų tyliai.'],
    ],
  },
  faq: {
    title: 'Dažniausi klausimai',
    items: [
      { q: 'Kiek kainuoja?', a: 'Pirmiems 5 klientams: 50 € paruošimas, mokamas iš anksto. Tada 30 dienų nemokamai, skaičiuojant nuo dienos, kai patikriname, kad viskas veikia. Toliau 97 € per mėnesį – tik jei aiškiai pasakote, kad tęsiame. Niekas savaime nenuskaičiuojama.' },
      { q: 'Kas į kainą neįeina?', a: 'Naujas domenas, jei jo prireikia (registruojamas Jūsų vardu, apmokamas atskirai). Nauja svetainė ir reklamos biudžetas – aptariame atskirai. SMS naudojimo, pagalbos ir nutraukimo sąlygas surašome raštu prieš mokėjimą.' },
      { q: 'O jei kas nors nepavyks?', a: 'Persigalvojote, kol dar nepradėjome darbų – grąžiname visus 50 €. Dėl mūsų kaltės nepavyko paleisti to, ką sutarėme – grąžiname visus 50 €. Nutraukiate paruošimo metu – grąžiname likutį, atskaičiavę jau atliktą sutartą darbą. Viskas veikia, bet nusprendėte netęsti – 50 € lieka už paruošimą, mėnesinio mokesčio nėra.' },
      { q: 'Ar tinka ne tik meistrams?', a: 'Taip. Tinka visiems, kurių užsakymai prasideda nuo kliento skambučio ar žinutės: prekybai, montavimui ir paslaugoms.' },
      { q: 'Ar veiks mano telefone?', a: 'Taip, ir iPhone, ir Android. Programėlė atsidaro naršyklėje ir įsidiegia į telefono ekraną.' },
      { q: 'Ar pasikeis mano numeris?', a: 'Ne. Jūsų telefonas ir numeris lieka. Papildomai gaunate verslo numerį, kurį skelbiate ten, kur norite gauti užklausų. Nutraukus paslaugą verslo numeris išjungiamas ir neperduodamas.' },
      { q: 'Ar atsako robotas?', a: 'Ne. Automatinė yra tik pirma žinutė. Toliau rašote Jūs, kaip įprastai.' },
      { q: 'Ar demonstracija šiame puslapyje siunčia tikras SMS?', a: 'Kol kas ne. SMS tiekėjas dar neprijungtas, todėl demonstracija veikia bandomuoju režimu ir tai aiškiai parodo.' },
      { q: 'Ar žadate daugiau užsakymų?', a: 'Ne, ir saugokitės tų, kurie žada. Pasirūpiname, kad užklausa ar praleistas skambutis nedingtų tyliai. Ar žmogus taps klientu, vis dar priklauso nuo Jūsų.' },
    ],
  },
  talk: {
    title: 'Norite pasikalbėti?',
    text: '15–20 minučių. Parodysime, kaip tai veiktų Jūsų versle. Jei netiks – pasakysime patys.',
    name: 'Vardas', phone: 'Telefono numeris', company: 'Įmonė ar veikla (nebūtina)', time: 'Kada patogu?',
    times: [['morning', 'Rytą'], ['day', 'Dieną'], ['evening', 'Vakare']],
    submit: 'Užsiregistruoti pokalbiui', open: 'Užsiregistruoti pokalbiui', dialogTitle: 'Užsiregistruoti pokalbiui', close: 'Uždaryti', sending: 'Siunčiama…',
    ok: 'Ačiū{name}. Paskambinsime {time}.',
    timesSpoken: { morning: 'rytą', day: 'dieną', evening: 'vakare', '': 'artimiausiu metu' },
    previewNote: 'Peržiūros versija: ši forma nieko nesiunčia.',
    previewOk: 'Peržiūros režimas: duomenys patikrinti, bet niekas neišsiųsta ir pokalbis neužregistruotas. Tikram pokalbiui skambinkite.',
    err: `Nepavyko išsiųsti. Skambinkite ${brand.phone}.`, errPhone: 'Patikrinkite telefono numerį.',
    orCall: 'Arba paskambinkite', context: 'Jarvis Systems: pokalbis dėl sistemos (pradžios puslapis)',
    mascotAlt: 'Jarvis Systems talismanas rodo į pokalbio formą',
  },
  footer: {
    ready: 'Pasiruošę pradėti?', learn: 'Norite sužinoti daugiau, kaip galime padėti?',
    line: 'Užklausų, skambučių, atsiliepimų ir SMS sistema verslams. Kaunas, visa Lietuva.',
    colLinks: 'Nuorodos', colFeatures: 'Funkcijos', colContact: 'Kontaktai',
    sites: 'Svetainės', results: 'Svetainių rezultatai', privacy: 'Privatumo politika', terms: 'Taisyklės',
  },
};
