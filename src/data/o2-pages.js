/* Jarvis Systems separate pages (USER13, 2026-11-08). Short truthful drafts; Matas locks wording later.
   Commercial source: O2_OFFER in src/data/o2.js; full package agreed by Matas on 2026-11-08. No statistics, team, reviews or video we do not have.
   Layout types follow the Stone page map in docs/jarvis-stone-source-match/USER13-DESIGN-CORRECTIONS.md. */
import { brand } from './content.js';
import { O2_OFFER } from './o2.js';

/** Feature detail routes /funkcijos/<slug>; `id` = homepage row id, `scene` = shared loop. */
export const FEATURE_PAGES = {
  svetaine: {
    slug: 'funkcionali-svetaine',
    lead: 'Sukuriame svetainę, optimizuojame ją Google ir AI paieškai bei prijungiame prie klientų sistemos. Užklausa tampa SMS pokalbiu, o Jūs gaunate pranešimą telefone.',
    facts: [
      ['Užklausa – į telefoną', 'Kai klientas užpildo formą, jis gauna atsakymą SMS žinute, o Jūs – vieną pranešimą su jo kontaktais ir sutartu perskambinimo laiku.'],
      ['Svetainė įeina į paketą', `Svetainės sukūrimas, optimizavimas ir prijungimas prie sistemos yra pilno ${O2_OFFER.monthly} paketo dalis.`],
      ['Patogi telefone', 'Forma ir puslapiai turi gerai veikti telefone, nes ten naršo dauguma žmonių.'],
    ],
    how: [
      ['Klientas užpildo formą', 'Vardas, telefonas, el. paštas ir ko reikia – tiek, kiek klausia Jūsų forma.'],
      ['Atsako AI asistentas', 'Žinutė iš atskiro žinučių numerio prasideda Jūsų verslo vardu ir atsako į kliento klausimą pagal Jūsų patvirtintus svetainės faktus ir joje nurodytas kainas, jei jos žinomos.'],
      ['Perskambinate Jūs', 'Asistentas klausia tik trūkstamų detalių ir susitaria dėl perskambinimo. Jūs gaunate vieną pranešimą ir perskambinate iš savo numerio, o pokalbį programėlėje galite perimti bet kada.'],
    ],
    note: 'AI ir dvipusės SMS dar ruošiamos ir tikrinamos. Animacija ir ekrano kopija yra demonstracija: realios „Dailius ir ko“ svetainės naujausia versija, forma neišsiunčia duomenų.',
    shot: true,
  },
  'atsiliepimai-sistema': {
    slug: 'atsiliepimu-rinkimas',
    lead: 'Pažymite darbą atliktu – klientas gauna SMS su nuoroda į Jūsų Google profilį.',
    facts: [
      ['Vienas paspaudimas', 'Prašymą išsiunčiate iš programėlės, kai darbas baigtas.'],
      ['Vienas priminimas', 'Jei klientas pamiršta, išeina vienas mandagus priminimas – ne daugiau.'],
      ['Pirmiausia – žvaigždutės', 'Patenkinti klientai nukreipiami į Google, o nepatenkinti parašo tiesiai Jums.'],
    ],
    how: [
      ['Darbas baigtas', 'Programėlėje pažymite, kad darbas atliktas.'],
      ['Klientas gauna nuorodą', 'SMS su tiesiogine nuoroda į Jūsų Google atsiliepimų langą.'],
      ['Matote, kas atidarė', 'Programėlėje matote, kas nuorodą atidarė, o kam išėjo priminimas.'],
    ],
    note: 'Klientas pirmiausia pasirenka žvaigždutes: 4–5 žvaigždutės nukreipia į Google, 1–3 – į privačią žinutę Jums.',
  },
  skambuciai: {
    slug: 'praleistas-skambutis',
    lead: 'Nespėjote atsiliepti? Skambinusiam žmogui išeina žinutė, ir pokalbis prasideda be Jūsų.',
    facts: [
      ['Žinutė po praleisto skambučio', 'Skambinęs žmogus gauna SMS ir gali iškart parašyti, ko jam reikia.'],
      ['Jūsų numeris lieka', 'Niekur nieko keisti nereikia: klientai skambina Jūsų numeriu, kaip ir dabar.'],
      ['Ir po darbo', 'Žinutė išeina ir tada, kai jau ilsitės.'],
    ],
    how: [
      ['Kažkas skambina', 'Žmogus skambina Jūsų numeriu, kaip įprastai.'],
      ['Neatsiliepiate', 'Operatorius skambutį nukreipia į sistemą, ir iš atskiro žinučių numerio žmogui išeina trumpa žinutė, prasidedanti Jūsų verslo vardu.'],
      ['Perskambinate sutartu laiku', 'AI asistentas atsako pagal Jūsų patvirtintus svetainės faktus, klausia trūkstamų detalių ir susitaria dėl perskambinimo. Gaunate vieną pranešimą ir perskambinate iš savo numerio.'],
    ],
    note: 'SMS paslaugų teikėjas dar neaktyvuotas: animacija rodo, kaip veiks, o ne išsiųstas žinutes.',
  },
  kampanijos: {
    slug: 'kampanijos',
    lead: 'Pirmą mėnesį pradedame nuo tikrų buvusių klientų: paruoštą žinutę peržiūrite ir paleidžiate vienu paspaudimu.',
    facts: [
      ['Tikri buvę klientai', 'Pirmiausia atsiliepimo prašymas, vėliau tinkamas priminimas apie save tiems, kurie jau pirko.'],
      ['Rekomendacijos', 'Paprašykite patenkintų klientų papasakoti apie Jus draugams.'],
      ['Be skubos', 'Kampanija išeina palaipsniui dienos metu, ne visa iš karto ir ne naktį.'],
    ],
    how: [
      ['Pasirenkate kampaniją', 'Sąrašą ir tekstą paruošiame kartu, Jūs patvirtinate. Senoms užklausoms, kurios netapo užsakymais, – tik tinkama tolesnė žinutė, be atsiliepimo prašymo.'],
      ['Peržiūra ir laikas', 'Galite paleisti iškart, suplanuoti arba atšaukti prieš išsiunčiant.'],
      ['Atsakymai – programėlėje', 'Atrašę klientai patenka į tą patį pokalbių sąrašą.'],
    ],
    note: 'Tai planuojamas veikimas: realus kampanijų siuntimas ir palaipsnis išsiuntimas dar nepatikrinti. Kampanijų rezultatų nežadame: kiek žmonių atsilieps, priklauso nuo pasiūlymo ir Jūsų klientų.',
  },
  seo: {
    slug: 'vietinis-seo',
    lead: 'Google paieška, žemėlapiai ir AI atsakymai: SEO, AEO ir GEO optimizavimas įeina į pilną paketą.',
    facts: [
      ['SEO: Google ir vietinė paieška', 'Sutvarkome svetainės struktūrą, paslaugų puslapius ir Google verslo profilį.'],
      ['AEO: atsakymai į klausimus', 'Turinyje aiškiai atsakome į klausimus apie Jūsų paslaugas, kad atsakymus būtų lengviau rasti ir suprasti.'],
      ['GEO: generatyvinė AI paieška', 'Sutvarkome turinį ir verslo informaciją, kad juos būtų lengviau suprasti AI paieškos sistemoms.'],
    ],
    how: [
      ['Peržiūrime Jūsų verslą', 'Aptariame paslaugas, vietoves ir klausimus, kuriuos užduoda klientai.'],
      ['Optimizuojame svetainę ir profilį', 'Tvarkome puslapių struktūrą, informaciją apie verslą ir atsakymus į klientų klausimus.'],
      ['Tikriname duomenis', 'Google paieškos paspaudimus ir svetainės užklausas stebime per Search Console bei formų duomenis.'],
    ],
    note: 'Optimizavimas įeina į paketą. Konkreti pozicija Google ar paminėjimas AI atsakymuose nėra garantuojami.',
  },
};

export const pages = {
  funkcijos: {
    title: 'Funkcijos – Jarvis Systems',
    description: 'Pilnas Jarvis Systems paketas: svetainė, SEO, AEO, GEO, užklausų ir žinučių sistemos, atsiliepimų prašymai bei klientų kampanijos vienoje programėlėje.',
    h: ['Svetainė ir klientų sistemos', 'viename pakete'],
    lead: `Svetainė, SEO, AEO, GEO ir visos žemiau esančios sistemos už ${O2_OFFER.monthly} Valdymas – vienoje programėlėje.`,
    more: 'Plačiau',
  },
  kainos: {
    title: 'Kainos – Jarvis Systems',
    description: `Pilnas paketas už ${O2_OFFER.monthly}: svetainė, SEO, AEO, GEO ir klientų sistemos vienoje programėlėje. ${O2_OFFER.guarantee}.`,
    h: ['Viskas viename pakete', `už ${O2_OFFER.monthly}`],
    plan: {
      badge: 'Pilnas paketas',
      name: 'Jarvis Systems',
      price: O2_OFFER.price, per: O2_OFFER.per,
      terms: [
        ['Be', 'įrengimo mokesčio'],
        ['30 dienų', 'pinigų grąžinimo garantija'],
        ['Atsisakyti', 'galite bet kada'],
        ['Paleidžiame', 'per 7 dienas'],
        ['Domenas', 'įskaičiuotas'],
        ['100 SMS', 'per mėnesį įskaičiuota, papildoma – 0,08 €'],
      ],
      includes: O2_OFFER.includes,
      extra: O2_OFFER.guaranteeDetails,
      exit: [O2_OFFER.cancelDetails, O2_OFFER.keepSite, O2_OFFER.number],
    },
    faq: [1, 2, 3, 4, 5].map(String),
  },
  atsiliepimai: {
    title: 'Atsiliepimai – Jarvis Systems',
    description: 'Mūsų Google verslo profilis ir atlikti darbai, kuriuos galite patikrinti patys.',
    h: ['Atsiliepimai'],
    lead: 'Esame nauji, todėl atsiliepimų kol kas mažai. Neišpūsime jų ir nekursime pavyzdinių.',
    profile: 'Jarvis Systems Google verslo profilis',
    profileMore: 'Atidaryti Google',
    work: ['Daugiau nei žodžiai – atlikti darbai', 'Svetainės, formų užklausos ir paieškos duomenys su datomis.', 'Žiūrėti darbus'],
    system: ['Norite daugiau atsiliepimų sau?', 'Atsiliepimų rinkimo sistema klientams išsiunčia nuorodą į Jūsų Google profilį.', 'Kaip tai veikia'],
  },
  darbai: {
    title: 'Mūsų darbai – Jarvis Systems',
    description: 'Mūsų sukurtos svetainės: betonogaminiai.lt, arbcut.lt, vensland.lt, meselektra.lt ir peržiūros klientams. Betono ir ArbCut atvejai su Search Console ir formų duomenimis.',
    h: ['Mūsų darbai', 'tikri, ne pavyzdiniai'],
    // Stats ONLY for Betono + ArbCut, exactly as shown in src/assets/proof/*-2026-11-11.png (see PROVENANCE.md, 2026-11-11):
    //  betono-gsc-3m: 778 clicks, 10,7 tūkst. impressions, CTR 7,3 %, position 7,2, 2026-08-10 – 2026-11-09 (new site live 2026-10-28,
    //  handoff 2026-10-28-1123-codex-betonogaminiai-closed.md, so the window also covers the previous site — stated on the page).
    //  arbcut-gsc-3m: 604 clicks, 12.3K impressions, CTR 4.9 %, position 8.7, 10 Aug – 9 Nov. Web3Forms (mbwebdv): Aug 7, Sep 13, Oct 4, total 31, spam 0.
    // Audit facts: Drive audits/betonogaminiai-2026-11-09/REPORT.md (E1, E5, E9, E10), audits/arbcut-2026-11-11/REPORT.md (C1, C2, F4).
    // Betono form counts not verified (WordPress admin not accessed) -> not shown. No testimonials.
    // Matas 2026-11-12: full-resolution GSC screenshots taken by Matas 2026-11-12 (ArbCut 605 / 12.3K, Betono 786 / 10,8 tūkst., 3 months to 2026-11-09); just the 3-month Search Console screenshots as the main proof; ArbCut forms = Web3Forms total only (31).
    items: [
      {
        name: 'UAB „Dailius ir ko“', site: 'betonogaminiai.lt', url: 'https://www.betonogaminiai.lt/', shot: 'betono',
        text: 'Betoninių gaminių gamintojas Ražiškiuose. Svetainė su prekių ir paslaugų puslapiais, kainomis ir „Gauti pasiūlymą“ forma.',
        gsc: ['betono-gsc-3m-2026-11-12', 'Google Search Console – paskutiniai 3 mėnesiai'],
        nums: [['786', 'paspaudimai iš Google'], ['10,8 tūkst.', 'parodymų Google']],
      },
      {
        name: 'ArbCut – arboristas Kaune', site: 'arbcut.lt', url: 'https://arbcut.lt/', shot: 'arbcut',
        text: 'Medžių pjovimo ir darbų aukštyje svetainė: 12 paslaugų ir 18 miestų puslapių, užklausos forma.',
        gsc: ['arbcut-gsc-3m-2026-11-12', 'Google Search Console – paskutiniai 3 mėnesiai'],
        forms: ['arbcut-web3forms-total-2026-11-12', 'Web3Forms – iš viso pateiktų užklausų formų'],
        nums: [['605', 'paspaudimai iš Google'], ['12,3 tūkst.', 'parodymų Google'], ['31', 'užklausa per formą']],
      },
    ],
    // Every site we built. Captures: headless Chrome 2026-11-11 (1440×900 and 390×844 @2x), resized to WebP, no edits.
    // live = client's own domain (200 on 2026-11-12); preview = draft on jarvisweb.lt/perziura, not launched by the client.
    allTitle: 'Visos mūsų svetainės',
    allLead: 'Telefone ir kompiuteryje. Atidarykite bet kurią ir patikrinkite patys.',
    status: { live: 'Veikia', preview: 'Peržiūra klientui' },
    all: [
      ['UAB „Dailius ir ko“', 'Betoniniai gaminiai, Ražiškiai', 'https://www.betonogaminiai.lt/', 'betono', 'live'],
      ['ArbCut', 'Arboristas, Kaunas', 'https://arbcut.lt/', 'arbcut', 'live'],
      ['VensLand', 'Vejos įrengimas ir priežiūra Vilniuje', 'https://vensland.lt/', 'vensland', 'live'],
      ['MesElektra', 'Elektrikas Klaipėdoje', 'https://meselektra.lt/', 'meselektra', 'live'],
      ['LaiKam', 'Vaizdo kamerų montavimas, Kaunas', 'https://jarvisweb.lt/perziura/ejgb7a33zs/', 'laikam', 'preview'],
      ['MasAukštalipiai', 'Aukštalipių paslaugos visoje Lietuvoje', 'https://jarvisweb.lt/perziura/cfa9bwee8q/', 'mas', 'preview'],
      ['Šilta srovė', 'Santechnika ir šildymas Panevėžyje', 'https://jarvisweb.lt/perziura/486rd84se6/', 'silta', 'preview'],
    ],
  },

  apie: {
    title: 'Apie – Jarvis Systems',
    description: `Jarvis Systems kuria ${brand.owner} iš Kauno: svetainės ir užklausų sistemos smulkiam verslui.`,
    h: ['Apie mus'],
    paras: [
      `Jarvis Systems – tai ${brand.owner} iš Kauno. Kuriu svetaines ir paprastas sistemas, kad smulkaus verslo užklausos ir skambučiai neliktų be atsakymo.`,
      'Dirbu vienas, todėl kalbatės su tuo, kuris viską ir daro. Tiksliai pasakau, ką padarysiu, ir to, ko nepadarysiu, nežadu.',
    ],
    facts: [['Kas', `${brand.owner}, ${brand.status.toLowerCase()}`], ['Kur', `${brand.city}, Lietuva`], ['Ką darome', 'Svetainės, SEO, AEO, GEO ir klientų sistemos']],
  },
  procesas: {
    title: 'Kaip dirbame – Jarvis Systems',
    description: `Pokalbis, svetainės ir sistemų paruošimas, bendras paleidimas. Pilnas paketas – ${O2_OFFER.monthly}, su 30 dienų pinigų grąžinimo garantija.`,
    h: ['Kaip dirbame'],
    lead: 'Nuo pirmo pokalbio iki veikiančios svetainės ir klientų sistemų – trys žingsniai.',
    need: ['Ko reikės iš Jūsų', ['Pagrindinė informacija apie verslą ir paslaugas', 'Turimos svetainės ir domeno prieigos, jei juos jau turite', 'Jūsų telefono numeris (skambučių nukreipimą nustatysime kartu)', 'Jūsų patvirtinimas SMS tekstams prieš paleidimą']],
  },
  sritys: {
    title: 'Sritys – Jarvis Systems',
    description: 'Dirbame su statybų, remonto, aplinkos tvarkymo, techninio aptarnavimo ir kitomis paslaugų sritimis.',
    h: ['Sritys, su kuriomis dirbame'],
    lead: 'Sistema tinka verslams, kurių užsakymai prasideda skambučiu ar rašytine užklausa. Neradote savo srities? Paklauskite.',
  },
  kontaktai: {
    title: 'Kontaktai – Jarvis Systems',
    description: `Susisiekite su Jarvis Systems: ${brand.phone}, ${brand.email}. ${brand.city}.`,
    h: ['Kontaktai'],
    lead: 'Greičiausia – užsiregistruoti pokalbiui. Paskambinsime Jums patogiu laiku.',
    rows: [['Telefonas', brand.phone, brand.telHref], ['El. paštas', brand.email, `mailto:${brand.email}`], ['Instagram', '@jarvissystemslt', brand.instagram], ['Facebook', 'Jarvis Systems', brand.facebook], ['YouTube', '@JarvisSystemsLT', brand.youtube], ['Vieta', `${brand.city}, Lietuva`, null], ['Veikla', `${brand.owner}, ${brand.status.toLowerCase()}`, null]],
    app: 'Jau esate klientas? Prisijunkite prie programėlės',
  },
};
