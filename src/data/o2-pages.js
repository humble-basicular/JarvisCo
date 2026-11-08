/* Jarvis Systems separate pages (USER13, 2026-11-08). Short truthful drafts; Matas locks wording later.
   Commercial source: O2_OFFER in src/data/o2.js; full package agreed by Matas on 2026-11-08. No statistics, team, reviews or video we do not have.
   Layout types follow the Stone page map in docs/jarvis-stone-source-match/USER13-DESIGN-CORRECTIONS.md. */
import { brand } from './content.js';
import { O2_OFFER } from './o2.js';
import proof from './arbcut-proof.json';

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
      ['Nuoroda kiekvienam', 'Prašymą gauna kiekvienas klientas, ne tik tie, kurie atrodo patenkinti.'],
    ],
    how: [
      ['Darbas baigtas', 'Programėlėje pažymite, kad darbas atliktas.'],
      ['Klientas gauna nuorodą', 'SMS su tiesiogine nuoroda į Jūsų Google atsiliepimų langą.'],
      ['Matote, kas atidarė', 'Programėlėje matote, kas nuorodą atidarė, o kam išėjo priminimas.'],
    ],
    note: 'Atsiliepimų nefiltruojame ir nerenkame tik teigiamų: nuoroda vienoda visiems klientams.',
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
      ['Tik sutikusiems', 'Žinutės siunčiamos sutikusiems gauti rinkodarą. Atsisakyti galima parašius STOP.'],
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
        ['30 dienų', 'pinigų grąžinimo garantija'],
        ['Viena kaina –', 'svetainė, optimizavimas ir visos klientų sistemos'],
      ],
      includes: O2_OFFER.includes,
      extra: O2_OFFER.guaranteeDetails,
    },
    faq: [1, 2, 3, 5].map(String),
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
    description: 'Tikri mūsų darbai: „Dailius ir ko“ (betonogaminiai.lt) nauja svetainė ir ArbCut (arbcut.lt) svetainė su užklausų ir paieškos duomenimis.',
    h: ['Mūsų darbai', 'tikri, ne pavyzdiniai'],
    items: [
      {
        name: 'UAB „Dailius ir ko“', site: 'betonogaminiai.lt',
        img: '/jarvis-systems/demo/betono-actual/home.webp', w: 1440, h: 783,
        img2: '/jarvis-systems/demo/betono-actual/details-filled.webp',
        text: 'Betoninių gaminių gamintojo svetainės naujausia versija: paslaugų puslapiai ir „Gauti pasiūlymą“ forma su vardu, telefonu, el. paštu ir preke.',
        tags: ['Svetainė', 'Užklausos forma', 'Telefone'],
      },
      {
        name: 'ArbCut – arboristas Kaune', site: 'arbcut.lt',
        img: '/jarvis-systems/work/arbcut-mobile.webp', w: 390, h: 844, mobile: true,
        text: `Svetainė su paslaugų ir miestų puslapiais. Per 3 mėnesius (${proof.gsc.from}–${proof.gsc.to}) – ${proof.gsc.clicks} paspaudimai iš Google paieškos; nuo ${proof.forms.created} iki ${proof.forms.captured} – ${proof.forms.total} formos užklausos. Duomenys iš Search Console ir Web3Forms ekrano kopijų.`,
        tags: ['Svetainė', 'Vietinis SEO', 'Užklausos forma'],
        more: ['Žiūrėti įrodymus', '/rezultatai'],
      },
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
