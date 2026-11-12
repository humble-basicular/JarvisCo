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
      ['Užklausa – į telefoną', 'Kai klientas užpildo formą, jis gauna žinutę, o Jūs – pranešimą su jo kontaktais.'],
      ['Svetainė įeina į paketą', `Svetainės sukūrimas, optimizavimas ir prijungimas prie sistemos yra pilno ${O2_OFFER.monthly} paketo dalis.`],
      ['Patogi telefone', 'Forma ir puslapiai turi gerai veikti telefone, nes ten naršo dauguma žmonių.'],
    ],
    how: [
      ['Klientas užpildo formą', 'Vardas, telefonas, el. paštas ir ko reikia – tiek, kiek klausia Jūsų forma.'],
      ['Išeina pirma žinutė', 'Klientas gauna žinutę Jūsų vardu, kad užklausa gauta. Automatinė yra tik ši pirma žinutė.'],
      ['Toliau rašote Jūs', 'Pokalbis tęsiasi programėlėje, kaip įprastame SMS susirašinėjime.'],
    ],
    note: 'Animacija ir ekrano kopija yra demonstracija: realios „Dailius ir ko“ svetainės naujausia versija, forma neišsiunčia duomenų.',
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
      ['Žinutė po praleisto skambučio', 'Skambinęs žmogus gauna SMS, kad perskambinsite arba kad gali parašyti.'],
      ['Jūsų numeris lieka', 'Papildomai gaunate verslo numerį, kurį skelbiate ten, kur norite užklausų.'],
      ['Ir po darbo', 'Žinutė išeina ir tada, kai jau ilsitės.'],
    ],
    how: [
      ['Kažkas skambina', 'Skambutis ateina į verslo numerį ir peradresuojamas Jums.'],
      ['Neatsiliepiate', 'Sistema išsiunčia trumpą žinutę Jūsų vardu.'],
      ['Atsakote, kai galite', 'Atsakymą matote programėlėje ir tęsiate pokalbį.'],
    ],
    note: 'SMS paslaugų teikėjas dar neaktyvuotas: animacija rodo, kaip veiks, o ne išsiųstas žinutes.',
  },
  kampanijos: {
    slug: 'kampanijos',
    lead: 'Paruošta žinutė buvusiems klientams – peržiūrite ir paleidžiate vienu paspaudimu.',
    facts: [
      ['Grįžtantys klientai', 'Priminkite apie save su sezoniniu pasiūlymu tiems, kurie jau pirko.'],
      ['Rekomendacijos', 'Paprašykite patenkintų klientų papasakoti apie Jus draugams.'],
      ['Be skubos', 'Kampanija išeina palaipsniui dienos metu, ne visa iš karto ir ne naktį.'],
    ],
    how: [
      ['Pasirenkate kampaniją', 'Žinutės tekstą paruošiame kartu, Jūs jį peržiūrite.'],
      ['Peržiūra ir laikas', 'Galite paleisti iškart, suplanuoti arba atšaukti prieš išsiunčiant.'],
      ['Atsakymai – programėlėje', 'Atrašę klientai patenka į tą patį pokalbių sąrašą.'],
    ],
    note: 'Kampanijų rezultatų nežadame: kiek žmonių atsilieps, priklauso nuo pasiūlymo ir Jūsų klientų.',
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
    profile: 'JarvisCo Google verslo profilis',
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
    items: [
      {
        name: 'UAB „Dailius ir ko“', site: 'betonogaminiai.lt', url: 'https://www.betonogaminiai.lt/', shot: 'betono',
        text: 'Betoninių gaminių gamintojas Ražiškiuose. Naują svetainę paleidome 2026-10-28: prekių ir paslaugų puslapiai, kainos ir „Gauti pasiūlymą“ forma su apsauga nuo šlamšto.',
        period: 'Google Search Console, 3 mėn.: 2026-08-10 – 2026-11-09',
        stats: [
          ['778', 'paspaudimų iš Google paieškos'],
          ['10,7 tūkst.', 'parodymų Google paieškoje'],
          ['7,3 %', 'paspaudimų dalis (CTR)'],
          ['7,2', 'vidutinė pozicija'],
        ],
        points: [
          '#2 Google paieškoje „šulinių žiedai kaunas“',
          'Pirmas paminėtas Google AI režimo atsakyme apie šulinių žiedus Kaune',
          '36 puslapiai svetainės žemėlapyje',
          'Lighthouse mobiliam: greitis 94, SEO 100',
        ],
        note: 'Laikotarpis apima ir ankstesnę svetainę – naujoji veikia nuo 2026-10-28. Pozicijos ir AI atsakymas patikrinti 2026-11-09, vienkartinis stebėjimas: jie keičiasi pagal vietą ir įrenginį.',
        proof: [['betono-gsc-3m-2026-11-11', 'Search Console, 3 mėn. (2026-08-10 – 2026-11-09)']],
        tags: ['Svetainė', 'Vietinis SEO', 'Užklausos forma'],
      },
      {
        name: 'ArbCut – arboristas Kaune', site: 'arbcut.lt', url: 'https://arbcut.lt/', shot: 'arbcut',
        text: 'Medžių pjovimo ir darbų aukštyje svetainė: 12 paslaugų ir 18 miestų puslapių, užklausos forma, kuri siunčia užklausas tiesiai meistrui.',
        period: 'Google Search Console, 3 mėn.: 2026-08-10 – 2026-11-09 · Formos: rugpjūtis–spalis',
        stats: [
          ['604', 'paspaudimai iš Google paieškos'],
          ['12,3 tūkst.', 'parodymų Google paieškoje'],
          ['8,7', 'vidutinė pozicija'],
          ['24', 'formos užklausos rugpjūtį–spalį (7 + 13 + 4)'],
        ],
        points: [
          'arbcut.lt cituojamas Google AI apžvalgoje „medžių pjovimas Kaune“ (2026-11-11)',
          '31 formos užklausa nuo formos sukūrimo 2026-04-19, 0 šlamšto',
          '12 paslaugų ir 18 miestų puslapių',
        ],
        note: 'Formų skaičiai – Web3Forms, kalendoriniai mėnesiai, patikrinta 2026-11-11. Paspaudimai nėra užklausos, todėl jų nesumuojame.',
        proof: [
          ['arbcut-gsc-3m-2026-11-11', 'Search Console, 3 mėn. (2026-08-10 – 2026-11-09)'],
          ['arbcut-web3forms-overview-2026-11-11', 'Web3Forms: iš viso 31 užklausa, 0 šlamšto'],
          ['arbcut-web3forms-aug-2026-11-11', 'Web3Forms: 2026 m. rugpjūtis – 7'],
          ['arbcut-web3forms-sep-2026-11-11', 'Web3Forms: 2026 m. rugsėjis – 13'],
          ['arbcut-web3forms-oct-2026-11-11', 'Web3Forms: 2026 m. spalis – 4'],
        ],
        tags: ['Svetainė', 'Vietinis SEO', 'Užklausos forma'],
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
    need: ['Ko reikės iš Jūsų', ['Pagrindinė informacija apie verslą ir paslaugas', 'Turimos svetainės ir domeno prieigos, jei juos jau turite', 'Telefono numeris, į kurį peradresuosime skambučius', 'Jūsų patvirtinimas SMS tekstams prieš paleidimą']],
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
    rows: [['Telefonas', brand.phone, brand.telHref], ['El. paštas', brand.email, `mailto:${brand.email}`], ['Vieta', `${brand.city}, Lietuva`, null], ['Veikla', `${brand.owner}, ${brand.status.toLowerCase()}`, null]],
    app: 'Jau esate klientas? Prisijunkite prie programėlės',
  },
};
