/* Jarvis Systems O2 copy. Commercial decision: Matas, 2026-11-08, current thread user2.
   One full package: 97 €/month; website + SEO/AEO/GEO + enquiry/SMS systems,
   one-click review requests, reactivation/marketing campaigns and connected app.
   30-day money-back guarantee replaces first-five / 50 € setup / free-trial offer.
   User3: guarantee starts with the first 97 € payment.
   User4 (2026-11-09): Historical60% superseded16Nov2026 (4ec2c8eb): refund50% of first97€ payment =48,50€; time is excluded from cash costs.
   Do not invent refund restrictions,
   usage caps, unlimited messaging, billing mechanics or promised search/AI results.
   Accepted Stone design, real proof and verified Betono media remain unchanged.
   SMS provider is not active; demos do not prove real delivery.
   2026-11-10 closed terms (~/WebAgency Biz/brains/v2/OFFER.md §1): no setup fee, cancel anytime,
   7-day launch, domain = 15 € ONE-TIME only when the client has none (17 Nov, dd149652), 100 SMS/month then 0,08 € each (same monthly invoice), everything
   switched off on cancel, 999 € one-off to keep the website, business number switched off at exit.
   Marketing texts carry no STOP line (OFFER.md §6). */
import { brand } from './content.js';

export const NAME = 'Jarvis Systems';
export const O2_CTA = 'Užsiregistruoti pokalbiui';
export const APP_URL = 'https://jarvisweb-sistema.jarvisworks-co.workers.dev/';
export const O2_OFFER = {
  price: '97 €', per: '/mėn.', monthly: '97 €/mėn.',
  guarantee: '30 dienų pinigų grąžinimo garantija',
  guaranteeDetails: '30 dienų skaičiuojame nuo pirmo 97 € mokėjimo. Per šį laikotarpį paprašius grąžinti pinigus, grąžiname 50 % pirmo mokėjimo (48,50 €). Likusi dalis padengia jau atliktus paleidimo darbus.',
  setup: 'Be įrengimo mokesčio',
  launch: 'Paleidžiame per 7 dienas',
  cancel: 'Atsisakyti galite bet kada',
  domain: 'Jei domeno dar neturite, taikomas vienkartinis 15 € domeno mokestis. Jei domeną jau turite, papildomo mokesčio nėra.',
  domainShort: '15 € vienkartinai, jei domeno dar neturite',
  sms: '100 SMS segmentų per mėnesį įskaičiuota, kiekvienas papildomas segmentas – 0,08 €',
  smsDetails: 'Į kainą įskaičiuota 100 SMS segmentų per mėnesį. Kiekvienas papildomas segmentas kainuoja 0,08 € ir pridedamas prie tos pačios mėnesio sąskaitos. Ilga žinutė ar žinutė su lietuviškomis raidėmis gali sudaryti kelis segmentus.',
  cancelDetails: 'Prenumerata mėnesinė, atsisakyti galite bet kada. Atsisakius viskas išjungiama, taip pat ir svetainė.',
  keepSite: 'Jei norite pasilikti svetainę, ją galite išsipirkti už 999 € vienkartinai. Svetainė lieka be sistemų, su paprasta el. pašto forma.',
  number: 'Sistemos numeriai išjungiami ir neperduodami. Jūsų paties numeris niekada nesikeičia – tereikia išjungti skambučių nukreipimą.',
  includes: [
    'Svetainės sukūrimas ir prijungimas prie sistemos',
    'Optimizavimas Google ir AI paieškai: SEO, AEO ir GEO',
    'Svetainės užklausos – SMS pokalbiai ir pranešimai Jums',
    'AI registracijų centras: automatinis pokalbis po praleisto skambučio ir svetainės užklausos – iki susitarimo perskambinti',
    'Atsiliepimų prašymai vienu paspaudimu ir automatinis priminimas',
    'Pirmo mėnesio pagalba: atsiliepimai ir kampanijos tikriems buvusiems klientams',
    'Rinkodaros kampanijos vienu paspaudimu',
    'Atskiras žinučių numeris ir viską sujungianti programėlė',
  ],
};
export const GOOGLE = { rating: '5,0', count: '1 atsiliepimas', url: brand.gbp };
/* Landing + /susisieksime proof (Matas 2026-11-12): ArbCut only. 605 = GSC organic clicks, 3 months; 26 = Web3Forms submissions 2026-08-01..2026-11-17 (33 total as of 17 Nov minus 7 before Aug per arbcut-proof.json; Matas 18 Nov 14550b84: show a period, not 'iš viso'). Was: 33 = Web3Forms total as of 2026-11-17
   (31 on the 12 Nov screenshot + 2 more, user-reported by Matas 17 Nov, dd149652). Sources: src/assets/proof/PROVENANCE.md. Betono stays on /musu-darbai only. */
export const PROOF = [
  ['605', 'organiniai paspaudimai iš Google per 3 mėn.', 'arbcut.lt · iki lapkr. 9 d.'],
  ['26', 'užklausos per svetainės formą per 3,5 mėn.', 'arbcut.lt · nuo rugpj. 1 d.'],
];

export const o2 = {
  meta: {
    title: 'Jarvis Systems – svetainės ir rinkodaros sistemos Jūsų verslui',
    description: `Svetainė, SEO, AEO, GEO, automatinės žinutės, atsiliepimų prašymai ir klientų kampanijos vienoje programėlėje. Pilnas paketas – ${O2_OFFER.monthly} ${O2_OFFER.guarantee}.`,
  },
  nav: [
    { label: 'Funkcijos', href: '/funkcijos' },
    { label: 'Kainos', href: '/kainos' },
    { label: 'Atsiliepimai', href: '/atsiliepimai' },
    { label: 'Mūsų darbai', href: '/musu-darbai' },
    { label: 'Apie', href: '/apie' },
  ],
  login: 'Prisijungti',
  menu: 'Meniu', close: 'Uždaryti',
  hero: {
    title: ['Svetainės ir', 'rinkodaros sistemos', 'Jūsų verslui'],
    // Matas 2026-11-13: Stone-style honesty line instead of the feature/price summary.
    lead: ['Be pasakų – rinkodara nėra raketų mokslas.', 'Jokia agentūra (taip, ir mūsų) neturi stebuklingos formulės visoms Jūsų problemoms. Duosime Jums įrankius laimėti, bet turite įsipareigoti jais naudotis!', 'Be įrengimo mokesčio, su 30 dienų pinigų grąžinimo garantija.'],
    mascotAlt: 'Jarvis Systems talismanas – statybininkas geltona liemene, rankos sukryžiuotos',
  },
  features: {
    title: ['Paprastos sistemos, kurios tiesiog veikia', 'Naudotis jomis diplomo nereikia'],
    demoBtn: 'Trumpa demonstracija', moreBtn: 'Plačiau',
    items: [
      {
        id: 'svetaine', scene: 'web', title: 'Funkcionali svetainė',
        quote: 'Svetainė, kuri užklausas iškart paverčia SMS pokalbiais, keliaujančiais TIESIAI į Jūsų telefoną.',
        points: [
          ['Jus tikrai randa internete', 'Jei klientas ieško Jūsų Google ir neranda – nejauku… Nesijaudinkite, pasirūpinsime, kad taip nenutiktų.'],
          ['Parodykite tikrus atsiliepimus', 'Tikri klientų atsiliepimai svetainėje parodo naujam klientui, kad Jumis jau pasitiki kiti.'],
          ['Patogi telefone', 'Dauguma žmonių svetaines naršo telefone. Pasirūpinsime, kad Jūsų verslas telefone atrodytų puikiai.'],
          ['Pritaikyta Google ir AI paieškai', 'Svetainę optimizuojame Google paieškai ir AI atsakymams. SEO, AEO ir GEO įeina į bendrą paketą.'],
        ],
      },
      {
        id: 'skambuciai', scene: 'missed', title: 'Automatinis pokalbis po praleisto skambučio',
        // Round 2 (17 Nov, Matas 2eeb25e4): stand out from competitors, say plainly it is an AI registracijų centras,
        // strong first point. Variant A (implemented); variant B in Drive management/site-animations-r2-20261117/COPY.md.
        quote: 'Tai ne viena šabloninė žinutė. Tai AI registracijų centras: per kelias sekundes atrašo klientui, atsako į jo klausimus ir susitaria, kada perskambinsite.',
        points: [
          ['Klientas gauna pokalbį, ne tylą', 'Kol dirbate objekte, AI iškart atrašo klientui, atsako pagal Jūsų kainas ir svetainės faktus, sužino, ko reikia, ir sutaria, kada perskambinsite.'],
          ['Jums – tik esmė', 'Viena žinutė telefone: kas skambino, ko nori, kur ir iki kada perskambinti. Jokio susirašinėjimo – tik paskambinate.'],
          ['Ne „perskambinsime“, o tikras pokalbis', 'Įprasta automatinė žinutė pasako tik „perskambinsime“ ir tyli. Mūsų AI tęsia pokalbį: klausia vardo, kiekio, adreso ir laiko – kaip geras administratorius.'],
          ['Dirba ir po darbo valandų', 'Skambutis 21 val.? Klientas atsakymą gauna iškart, o Jūs pokalbio santrauką pamatote, kai patogu.'],
        ],
      },
      {
        id: 'atsiliepimai-sistema', scene: 'reviews', title: 'Atsiliepimų rinkimo sistema',
        quote: '„Būtinai parašysiu atsiliepimą“, – sako visi, bet žmonės pamiršta. Mes mandagiai priminsime.',
        points: [
          ['Nuoroda tiesiai į Google', 'Pažymite darbą atliktu, ir klientas gauna SMS su nuoroda į Jūsų Google profilį.'],
          ['Automatinis priminimas', '„Būtinai parašysiu“, bet pamiršta. Vienas mandagus priminimas – ne dešimt.'],
          ['Prašymas vienu paspaudimu', 'Kaip žadėjome – paprasta. Jei susipainiosite, kalti mes ir mums labai gėda.'],
          ['Nebereikia spėlioti', 'Nuorodą gauna kiekvienas klientas, o programėlėje matote, kas ją atidarė.'],
        ],
      },
      {
        id: 'kampanijos', scene: 'campaign', title: 'Kampanijos vienu paspaudimu',
        quote: 'Jūs žinote, ir mes žinome… Rekomendacijos ir grįžtantys klientai – tai, ko reikia labiausiai. Gaukime abu!',
        points: [
          ['Paruošta už Jus', 'Vėl – paprastai. Paruoštą žinutę peržiūrite ir paleidžiate vienu paspaudimu.'],
          ['Rekomendacijų kampanijos', 'Dirbate gerai, ir klientai Jus mėgsta. Priminkime jiems papasakoti apie Jus draugams.'],
          ['Grįžtančių klientų kampanijos', 'Lojalūs klientai – sėkmingo verslo pagrindas. Priminkite apie save su specialiu pasiūlymu.'],
          ['Kampanijos po ranka', 'Peržiūrite žinutę ir paleidžiate kampaniją vienu paspaudimu. Žinutės išeina palaipsniui, ne visos iš karto.'],
        ],
      },
      {
        id: 'seo', scene: 'seo', title: 'SEO, AEO ir GEO',
        quote: 'Kad Jūsų verslą būtų lengviau rasti Google ir AI paieškoje. Optimizavimas jau įeina į paketą.',
        points: [
          ['Google paieška ir žemėlapiai', 'Tvarkome svetainės struktūrą, paslaugų puslapius ir Google verslo profilį pagal Jūsų paslaugas bei vietoves.'],
          ['Aiškūs atsakymai klientams', 'AEO – atsakymų paieškos optimizavimas. Aiškiai atsakome į klausimus, kuriuos klientai užduoda apie Jūsų paslaugas.'],
          ['Turinys AI paieškai', 'GEO – optimizavimas generatyvinei paieškai. Sutvarkome turinį ir verslo informaciją, kad AI sistemoms būtų lengviau juos suprasti.'],
        ],
      },
    ],
  },
  /* Round 2 (17 Nov, Matas 2eeb25e4 "maybe the all-in-one inbox shouldn't be just a video"): animated inbox row
     replaces the lone video box; the old video stays one click away behind the demo button. */
  inbox: {
    id: 'dezute', scene: 'inbox', video: 'dezute', title: 'Visos užklausos vienoje vietoje',
    quote: 'Skambučiai, SMS ir svetainės užklausos – viename sąraše Jūsų telefone. Matote, ką atsakė AI, ir nieko nepamirštate.',
    points: [
      ['Viskas viename sąraše', 'Praleisti skambučiai, SMS žinutės, svetainės užklausos ir nauji atsiliepimai – vienoje programėlėje, naujausi viršuje.'],
      ['Matote, ką atsakė AI', 'Kiekviename pokalbyje matote visą susirašinėjimą ir galite bet kada perimti pokalbį patys.'],
      ['Niekas nepasimeta', 'Užklausa nepradings tarp asmeninių žinučių – iškart matote, kam reikia perskambinti.'],
    ],
  },
  trades: {
    title: 'Dirbame su visomis šiomis sritimis ir ne tik…',
    cta: 'Paklauskite apie savo sritį',
    prev: 'Ankstesnės sritys', next: 'Kitos sritys',
  },
  process: {
    title: 'Kaip atrodo darbas su mumis…',
    steps: [
      ['Pokalbis', '(15–20 min.)', 'Iš tikrųjų tai pardavimo pokalbis – tik nenorėjome Jūsų išgąsdinti. O rimtai: atsakysime į klausimus ir parodysime, kaip sistema veiktų Jūsų versle.'],
      ['Paruošiame visą paketą', '(per 7 dienas)', 'Sukuriame svetainę, optimizuojame ją Google ir AI paieškai, prijungiame užklausas, žinutes, atsiliepimų prašymus ir kampanijas prie vienos programėlės.'],
      ['Paleidžiame ir parodome', `(${O2_OFFER.monthly})`, 'Kartu patikriname svetainę ir sistemas, parodome programėlę bei atsakome į klausimus. Pirmą mėnesį aktyviai padedame: pradedame nuo atsiliepimų iš tikrų buvusių klientų. Įrengimo mokesčio nėra, o pilnam paketui taikoma 30 dienų pinigų grąžinimo garantija.'],
    ],
  },
  why: {
    title: ['Kodėl mes „visiškai unikalūs“…', 'kaip ir visi kiti, tiesa?'],
    items: [
      ['easy', 'Paprasta naudoti', 'Jarvis Systems kūrėme su viena pagrindine mintimi – kad būtų paprasta naudoti. Todėl viskas taip ir veikia.'],
      ['price', 'Viena aiški kaina', `Svetainė, SEO, AEO, GEO ir klientų sistemos – viename pakete už ${O2_OFFER.monthly}`],
      ['contract', '30 dienų garantija', O2_OFFER.guaranteeDetails],
      ['straight', 'Be pasakų', 'Netikime tuščiais žodžiais: tiksliai pasakome, ką padarysime, ir tai padarome. Taškas.'],
      ['proof', 'Turime įrodymų', ['Žinome, kas veikia, o mūsų ', ['atliktus darbus', '/musu-darbai'], ' galite patikrinti patys.']],
      ['improve', 'Nuolat tobuliname', 'Reguliariai atnaujiname ir tobuliname sistemas, kad už savo pinigus gautumėte kuo daugiau.'],
    ],
  },
  faq: {
    title: 'Dažniausi klausimai',
    items: [
      { q: 'Kada pamatysiu rezultatus?', a: 'Sistema pradeda veikti nuo paleidimo dienos: užklausa iš svetainės ar praleistas skambutis iškart sulaukia žinutės. Pirmą mėnesį nelaukiame vien naujos svetainės: pradedame nuo Jūsų tikrų buvusių klientų (pirmiausia atsiliepimų prašymai, vėliau tinkami priminimai ar rekomendacijos), o senoms užklausoms, kurios netapo užsakymais, – tik tinkama tolesnė žinutė, be atsiliepimo prašymo. Daugiau užsakymų nežadame – ar žmogus taps klientu, vis dar priklauso ir nuo Jūsų.' },
      { q: 'Kiek kainuoja?', a: `Pilnas paketas kainuoja ${O2_OFFER.monthly} Įrengimo mokesčio nėra. ${O2_OFFER.domain} Svetainė, SEO, AEO, GEO, automatinės žinutės, atsiliepimų prašymai, klientų kampanijos ir bendra programėlė įeina į šią kainą. Taikoma 30 dienų pinigų grąžinimo garantija.` },
      { q: 'Kiek SMS įeina?', a: O2_OFFER.smsDetails },
      { q: 'Ar galiu atsisakyti?', a: `Taip, bet kada – prenumerata mėnesinė. Atsisakius viskas išjungiama, taip pat ir svetainė. ${O2_OFFER.keepSite}` },
      { q: 'Per kiek laiko paleidžiate?', a: 'Per 7 dienas nuo tada, kai gauname informaciją apie Jūsų verslą ir prieigas. Prieš paleidimą kartu patikriname svetainę ir SMS tekstus.' },
      { q: 'Ar yra pinigų grąžinimo garantija?', a: `Taip. ${O2_OFFER.guaranteeDetails}` },
      { q: 'Ar įeina optimizavimas Google ir AI paieškai?', a: 'Taip. Į paketą įeina svetainė ir jos optimizavimas Google bei vietinei paieškai (SEO), aiškiems atsakymams į klientų klausimus (AEO) ir generatyvinei AI paieškai (GEO). Konkreti pozicija Google ar paminėjimas AI atsakyme nėra garantuojami.' },
      { q: 'Kam to reikia, jei klientų atveda rekomendacijos?', a: 'Rekomenduotas žmogus vis tiek pirmiausia paskambina ar parašo. Sistema pasirūpina, kad toks skambutis ar užklausa neliktų be atsakymo, o laimingi klientai būtų paprašyti atsiliepimo.' },
      { q: 'Ar už svetainę ir SEO reikės mokėti papildomai?', a: `Ne. Svetainė ir SEO, AEO bei GEO optimizavimas yra pilno ${O2_OFFER.monthly} paketo dalis, kartu su užklausų, žinučių, atsiliepimų ir kampanijų sistemomis. Vienintelis papildomas mokestis – vienkartinis 15 € už naują domeną, jei jo dar neturite.` },
      { q: 'Ar pasikeis mano numeris?', a: 'Ne. Jūsų numeris lieka visur, kur yra dabar, ir klientams skambinate iš jo. Kai neatsiliepiate, operatorius skambutį nukreipia į sistemą, o žinutės klientams išeina iš atskiro sistemos numerio. Nutraukus paslaugą tereikia išjungti nukreipimą.' },
      { q: 'Ar veiks mano telefone? Ar atsako robotas?', a: 'Taip, ir iPhone, ir Android: programėlė atsidaro naršyklėje ir įsidiegia į telefono ekraną. AI ir dvipusės SMS dar ruošiamos ir tikrinamos; tai planuojamas veikimas po paleidimo. Į kliento žinutes automatiškai atsakys AI asistentas: tik pagal Jūsų patvirtintus svetainės faktus ir joje nurodytas kainas, klausia tik trūkstamų detalių ir susitaria, kada perskambinsite. Jums ateina vienas trumpas pranešimas su kliento numeriu ir sutartu laiku, o perskambinate iš savo numerio. Paklaustas asistentas neslepia, kad yra AI, o pokalbį bet kada galite perimti patys.' },
    ],
  },
  talk: {
    title: 'Norite susitarti dėl pokalbio?',
    text: `Parodysime, kaip svetainė, SEO, AI paieškos optimizavimas ir klientų sistemos veiktų Jūsų versle. Pilnas paketas – ${O2_OFFER.monthly}, atsisakyti galite bet kada.`,
    errEmail: 'Įveskite teisingą el. pašto adresą.', errPhone: 'Įveskite teisingą Lietuvos telefono numerį.',
    errName: 'Įveskite vardą.', errCompany: 'Įrašykite įmonę arba veiklą.',
    /* Stone-style booking quiz (Matas 2026-11-12): one question per slide, choices auto-advance, then four required fields. */
    quiz: {
      title: 'Daugiau užklausų Jūsų verslui už', price: O2_OFFER.monthly,
      back: '← Atgal', next: 'Tęsti', submit: 'Taip, noriu daugiau užklausų', progress: 'Užpildyta',
      questions: [
        ['audience', 'Kam dirbate?', ['Gyventojams', 'Įmonėms', 'Abiem', 'Neturiu paslaugų verslo']],
        ['state', 'Kaip dabar sekasi?', ['Trūksta darbų', 'Darbų yra, bet nepastoviai', 'Užimtas, darbų pilna', 'Tik pradedu']],
        ['when', 'Kada norėtumėte tai išspręsti?', ['Iš karto', 'Per 1–2 mėn.', 'Vėliau šiais metais', 'Tik domiuosi']],
        ['revenue', 'Mėnesio apyvarta?', ['iki 3 000 €', '3–10 tūkst. €', '10–30 tūkst. €', 'daugiau nei 30 tūkst. €']],
      ],
      // Stone wording: a question heading, a visually hidden label and a placeholder per field.
      fields: [
        ['phone', 'Jūsų mobilaus telefono numeris', 'Mobilaus telefono numeris', { type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: '20', placeholder: '+370 612 34567' }],
        ['email', 'Koks Jūsų el. paštas?', 'El. pašto adresas', { type: 'email', inputmode: 'email', autocomplete: 'email', maxlength: '120', placeholder: 'vardas@imone.lt' }],
        ['name', 'Jūsų vardas', 'Vardas', { autocomplete: 'name', maxlength: '60', placeholder: 'Vardas ir pavardė' }],
        ['company', 'Kaip vadinasi Jūsų įmonė ar veikla?', 'Įmonė ar veikla', { autocomplete: 'organization', maxlength: '80', placeholder: 'pvz. Stogų dengimas, Kaunas' }],
      ],
    },
    submit: 'Užsiregistruoti pokalbiui', open: 'Užsiregistruoti pokalbiui', dialogTitle: 'Užsiregistruoti pokalbiui', close: 'Uždaryti', sending: 'Siunčiama…',
    dialogText: '15–20 minučių. Parodysime, kaip tai veiktų Jūsų versle. Jei netiks – pasakysime patys.',
    ok: 'Ačiū{name}. Paskambinsime artimiausiu metu.',
    previewOk: 'Tai peržiūros versija, todėl registracija neišsiųsta. Pokalbiui paskambinkite:',
    err: `Nepavyko išsiųsti. Skambinkite ${brand.phone}.`,
    orCall: 'Arba paskambinkite', context: 'Jarvis Systems: pokalbis dėl sistemos',
    mascotAlt: 'Jarvis Systems talismanas rodo į pokalbio mygtuką',
  },
  demo: { close: 'Uždaryti demonstraciją' },
  footer: {
    ready: 'Pasiruošę pradėti?', learn: 'Norite sužinoti daugiau, kaip galime padėti?',
    colLinks: 'Nuorodos', colAbout: 'Apie', colFeatures: 'Funkcijos',
    links: [['Kainos', '/kainos'], ['Atsiliepimai', '/atsiliepimai'], ['Mūsų darbai', '/musu-darbai'], ['Svetainės', '/funkcijos/funkcionali-svetaine']],
    about: [['Kaip dirbame', '/kaip-dirbame'], ['Sritys', '/sritys'], ['Apie', '/apie'], ['Kontaktai', '/kontaktai']],
    privacy: 'Privatumo politika', terms: 'Taisyklės',
  },
};
