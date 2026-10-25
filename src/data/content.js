/* =====================================================================
   JARVISWEB — single text source for every page.
   Lithuanian, formal "Jūs", plain tone, no exclamation marks, no hype.
   Rules (docs/SPEC-2026-10-main-site.md §6, proof spec §2, §6, §7.10):
   - every number shown must have its original screenshot on the same page;
   - no reviews, quotes, logos or figures that a source file does not back;
   - allowed figures and their labels: src/assets/proof/PROVENANCE.md.
   ===================================================================== */

import { TRACKING_PREFIXES } from './tracking.js';
import { founderNote } from './founder.js';

const PHONE = '+370 676 99395';
const PHONE_E164 = '+37067699395';
const SMS_BODY = 'Sveiki, domina svetainė';

export const brand = {
  name: 'JarvisCo',
  owner: 'Matas Bašinskas',
  status: 'Individuali veikla',
  city: 'Kaunas',
  url: 'https://jarvisweb.lt',
  domain: 'jarvisweb.lt',
  phone: PHONE,
  // D2 decided 2026-10-11: this is the SIM the SMS batches are sent from.
  telHref: `tel:${PHONE_E164}`,
  // `?&body=` works on both Android and iOS (spec §3.4).
  smsHref: `sms:${PHONE_E164}?&body=${encodeURIComponent(SMS_BODY)}`,
  email: 'matas@jarvisweb.lt',
  emailHref: 'mailto:matas@jarvisweb.lt',
  gbp: 'https://www.google.com/maps/place/JarvisCo/@55.1680551,22.5645915,8z/data=!4m6!3m5!1s0x46e725ccf8f540d9:0x58d0ee5e75771802!8m2!3d55.1736006!4d23.8832615!16s%2Fg%2F11npf5rgkj',
  facebook: 'https://www.facebook.com/profile.php?id=61562921045681',
  instagram: 'https://www.instagram.com/jarvisworks_co/',
};

export const cta = {
  sms: 'Parašyti SMS',
  call: 'Skambinti',
  email: 'Rašyti el. paštu',
  contact: 'Susisiekti',
  results: 'Žiūrėti rezultatus',
  allResults: 'Visi rezultatai su ekrano kopijomis',
};

/* Header anchors. Order follows the page. */
export const nav = {
  home: [
    { label: 'Rezultatai', href: '#rezultatai' },
    { label: 'Paslauga', href: '#paslauga' },
    { label: 'Kaina', href: '#kaina' },
    { label: 'Procesas', href: '#procesas' },
    { label: 'Apie', href: '#apie' },
    { label: 'D.U.K.', href: '#duk' },
  ],
  results: [
    { label: 'Rezultatai', href: '#rezultatai' },
    { label: 'Kaina', href: '#kaina' },
    { label: 'Procesas', href: '#procesas' },
    { label: 'Apie', href: '#apie' },
    { label: 'D.U.K.', href: '#duk' },
  ],
  // Legal pages and 404: anchors point back to the home page.
  other: [
    { label: 'Rezultatai', href: '/rezultatai' },
    { label: 'Procesas', href: '/#procesas' },
    { label: 'Kaina', href: '/#kaina' },
    { label: 'Apie', href: '/#apie' },
    { label: 'D.U.K.', href: '/#duk' },
  ],
  menuLabel: 'Meniu',
  closeLabel: 'Uždaryti',
};

/* Web3Forms (no backend). Submissions are e-mailed to the account owner. */
export const form = {
  web3formsKey: '0f0633c6-ce11-4ca0-b088-962df8b05bbe',
  endpoint: 'https://api.web3forms.com/submit',
  title: 'Arba palikite užklausą',
  lead: 'Jei patogiau, palikite kontaktus. Atsakysiu pats.',
  fields: {
    name: 'Vardas',
    phone: 'Telefono numeris',
    email: 'El. paštas',
    message: 'Kokias paslaugas teikiate ir kur? (nebūtina)',
  },
  submit: 'Siųsti užklausą',
  sending: 'Siunčiama…',
  privacy: 'Duomenis naudoju tik atsakyti į Jūsų užklausą.',
  errors: {
    name: 'Įrašykite vardą.',
    phone: 'Įveskite teisingą telefono numerį, pvz. +370 612 34567.',
    email: 'Įveskite teisingą el. pašto adresą, pvz. vardas@pastas.lt.',
    summary: 'Patikrinkite pažymėtus laukus.',
  },
  success: 'Ačiū. Užklausą gavau ir atsakysiu pats.',
  failure: `Nepavyko išsiųsti. Parašykite SMS arba skambinkite ${PHONE}.`,
};

/* ---------- Offer: the same on every page (proof spec §3.1.3–3.1.5) ---------- */

export const offer = {
  eyebrow: 'Paslauga',
  title: 'Svetainė Jūsų paslaugoms. Nemokama pradžia.',
  lead: 'Kuriu svetaines paslaugų verslams, kad klientai galėtų Jus rasti Google ir kreiptis tiesiogiai.',
  price: '0 €',
  priceNote: 'pirmąsias 60 dienų nuo paleidimo',
  priceLine: 'pirmąsias 60 dienų nuo paleidimo',
  noMonthly: 'Mėnesio mokestis – tik jei po 60 dienų nuspręsite tęsti.',
  includesTitle: 'Ką gaunate',
  includes: [
    'Pagrindinis puslapis su paslaugomis, darbų pavyzdžiais ir kontaktais',
    'Iki 3 aptarnaujamų vietovių puslapių',
    'Užklausos forma',
    'Pritaikymas telefonui, paieškos (SEO) pagrindai',
    'Smulkūs pakeitimai: tekstai, nuotraukos, kainos',
  ],
  audienceTitle: 'Kam tinka',
  audienceText: 'Paslaugų verslams, kurie dirba savo mieste ar rajone.',
  audience: ['Medžių darbai', 'Aplinkos ir vejos priežiūra', 'Santechnika', 'Stogai', 'Statybos ir remontas', 'Valymas'],
  costsTitle: 'Kiek tai kainuoja',
  costs: [
    { label: 'Sukūrimas', value: '0 €' },
    { label: 'Domenas', value: '~15 € per metus, registruojamas Jūsų vardu' },
    { label: 'Talpinimas', value: '0 € pirmąsias 60 dienų nuo paleidimo' },
    { label: 'Mėnesinis mokestis', value: `49 €, jei po 60 dienų nuspręsite tęsti${founderNote}` },
  ],
  ownership: 'Domenas registruojamas Jūsų vardu. Jei atsisakote, domenas, Google profilis, nuotraukos ir tekstai lieka Jums.',
  // Verified in Jarvis's Paslaugos.lt account: €49.99/month, 2026-10-06.
  comparison: 'Palyginimui: Paslaugos.lt PRO kainuoja apie 50 € kas mėnesį.',
  payback: 'Pirmąsias 60 dienų mokate tik už domeną. Tada atsiunčiu ataskaitą: kiek žmonių rado svetainę Google, paspaudė „Skambinti“ ir parašė. Pagal ją nusprendžiate, ar tęsti.',
  year: {
    title: 'Per pirmus metus',
    lead: 'Paslaugos.lt PRO kainuoja apie 50 € kas mėnesį (patikrinta 2026-10-06).',
    rows: [
      { label: 'Paslaugos.lt PRO', value: '~600 €', detail: '12 mėn. × ~50 €', share: 100 },
      { label: 'Svetainė', value: '~505 €', detail: '15 € domenas + 10 mėn. × 49 €', share: 84 },
    ],
    note: 'Tai suma, jei po 60 nemokamų dienų nuspręsite tęsti. Jei ne, atsisakote ir mokate tik už domeną. Paslaugos.lt atsisakyti nereikia: svetainė – papildomas kanalas, kur klientai kreipiasi tiesiogiai Jums.',
  },
};

export const steps = {
  eyebrow: 'Procesas',
  title: 'Kaip vyksta darbas',
  lead: 'Penki žingsniai nuo Jūsų žinutės iki veikiančios svetainės.',
  items: [
    'Atsakote į SMS.',
    'Trumpai aptariame paslaugas ir vietoves.',
    'Atsiunčiu rašytinį pasiūlymą.',
    'Kuriu, Jūs peržiūrite, viena korekcija.',
    'Perduodu svetainę ir prieigas.',
  ],
  // Labels of the "site builds itself" frame on the home page.
  stages: ['Eskizas', 'Dizainas', 'Gyva svetainė'],
  frameUrl: 'arbcut.lt',
  annotations: ['Antraštė', 'Užklausos forma', 'Mygtukai'],
};

export const about = {
  eyebrow: 'Apie',
  title: 'Kas aš',
  name: 'Matas Bašinskas',
  text: 'Matas Bašinskas, Kaunas. Individuali veikla. Svetaines kuriu pats ir atsakau pats – be tarpininkų.',
  facts: ['Kaunas', 'Individuali veikla', 'Nuo pokalbio iki paleidimo – vienas žmogus'],
  photoAlt: 'Matas Bašinskas prie savo darbo vietos',
  gbpLabel: 'Google verslo profilis',
};

/* FAQ shared by all pages. D1 (changes after handover) = spec default. */
export const faq = {
  eyebrow: 'D.U.K.',
  title: 'Dažni klausimai',
  aside: 'Neradote atsakymo? Parašykite – atsakau pats.',
  items: [
    {
      q: 'Ar garantuojate klientų?',
      a: 'Ne. Konkretaus skaičiaus nežadu. Rezultatas priklauso nuo vietovės, konkurencijos, sezono ir paslaugų. Galiu parodyti, ką gavo Mantas.',
    },
    {
      q: 'Paslaugos.lt man ir taip veikia.',
      a: 'Jo atsisakyti nereikia. Svetainė – papildomas kanalas, kur klientai kreipiasi tiesiogiai Jums.',
    },
    {
      q: 'Jau turiu svetainę.',
      a: 'Tada šis pasiūlymas gali netikti. Jei ji neatneša užklausų, parašykite – pasižiūrėsiu.',
    },
    {
      q: 'Kas priklausys man?',
      a: offer.ownership,
    },
    {
      q: 'Ką reikės pateikti?',
      a: 'Paslaugas, vietoves, kelias darbų nuotraukas ir kontaktus. Tekstus parašysiu pats.',
    },
    {
      q: 'O jei vėliau reikės pakeitimų?',
      a: 'Smulkūs pakeitimai (tekstai, nuotraukos, kainos) įeina į mėnesio mokestį, o per bandomąjį laikotarpį juos darau nemokamai. Didesnius darbus aptariame atskirai.',
    },
    {
      q: 'Kodėl pradžia nemokama?',
      a: `Nes sunku patikėti svetaine, kol nematai rezultato. Pirmąsias 60 dienų nuo paleidimo mokate tik už domeną (~15 € per metus). Tada gaunate ataskaitą ir nusprendžiate, ar tęsti už 49 € per mėnesį${founderNote}.`,
    },
  ],
};

/* ---------- Proof: ArbCut (arbcut.lt), one client ----------
   Images live in src/assets/proof (see PROVENANCE.md there). Every figure
   below is visible in the screenshot it sits next to. "Saved" dates are the
   creation dates of the original files in the jarvisworks.co Drive folder
   "Work - WebAgency/ArbCut rezultatu vaizdai" (2026-10-09). */

export const arbcutProof = {
  eyebrow: 'Rezultatai · arbcut.lt',
  title: 'Skaičiai su originaliomis ekrano kopijomis.',
  lead: 'Arboristo Manto Gerulio svetainė arbcut.lt. Paspaudę ekrano kopiją, pamatysite ją visą.',
  items: [
    {
      id: 'uzklausos',
      figure: '20',
      label: 'formos užklausų per rugpjūtį ir rugsėjį',
      detail: 'Rugpjūtis – 7, rugsėjis – 13. Duomenys iš Web3Forms – sistemos, per kurią veikia arbcut.lt užklausos forma.',
      months: [
        { label: 'Rugpjūtis', value: 7 },
        { label: 'Rugsėjis', value: 13 },
      ],
      source: 'Web3Forms',
      shots: [
        {
          card: 'web3forms-rugpjutis-card',
          full: 'web3forms-rugpjutis-full',
          alt: 'Web3Forms skydelis: 2026 m. rugpjūtis, 7 pateikimai (Submissions 7).',
          caption: 'Web3Forms, 2026 m. rugpjūtis: 7 užklausos.',
        },
        {
          card: 'web3forms-rugsejis-card',
          full: 'web3forms-rugsejis-full',
          alt: 'Web3Forms skydelis: 2026 m. rugsėjis, 13 pateikimų (Submissions 13).',
          caption: 'Web3Forms, 2026 m. rugsėjis: 13 užklausų.',
        },
      ],
      saved: '2026-10-09',
      note: 'Tai tik formos užklausos: skambučiai neįskaičiuoti, iki 2026 m. spalio jų neskaičiavau. Ne visos užklausos tapo užsakymais.',
    },
    {
      id: 'paieska',
      figure: '573',
      label: 'paspaudimai iš Google paieškos',
      detail: '11,4 tūkst. parodymų Google paieškoje, vidutinis paspaudimų rodiklis (CTR) 5 %, vidutinė pozicija 8,2. Laikotarpis 2026-07-05 – 2026-10-04. Google Search Console, arbcut.lt.',
      stats: [
        { figure: '11,4 tūkst.', count: 11.4, decimals: 1, unit: 'tūkst.', label: 'parodymų Google paieškoje' },
        { figure: '5 %', count: 5, decimals: 0, unit: '%', label: 'vidutinis paspaudimų rodiklis (CTR)' },
        { figure: '8,2', count: 8.2, decimals: 1, unit: '', label: 'vidutinė pozicija Google' },
      ],
      period: '2026-07-05 – 2026-10-04',
      source: 'Google Search Console',
      shots: [
        {
          card: 'search-console-card',
          full: 'search-console-full',
          alt: 'Google Search Console, arbcut.lt: 573 paspaudimai (Total clicks), 11,4 tūkst. parodymų (Total impressions), vidutinis CTR 5 %, vidutinė pozicija 8,2.',
          caption: 'Google Search Console, Web paieška, 2026-07-05 – 2026-10-04.',
        },
      ],
      saved: '2026-10-09',
      note: 'Paspaudimai nėra užklausos.',
    },
    {
      id: 'google',
      figure: null,
      label: 'arbcut.lt Google paieškoje',
      detail: 'Paieškos „arboristas kaunas“, „medziu pjovimas kaunas“, „medziu pjovimas jonava“ ir „medziu pjovimas kazlu ruda“.',
      shots: [
        {
          card: 'google-arboristas-kaunas-card',
          full: 'google-arboristas-kaunas-full',
          alt: 'Google paieška „arboristas kaunas“: žemėlapis su įmonėmis, po jo pirmas rezultatas – arbcut.lt, Medžių pjovimas Kaunas – arboristas ArbCut.',
          caption: 'Paieška „arboristas kaunas“: arbcut.lt pirmas po Google žemėlapio.',
          place: 'Kaunas',
        },
        {
          card: 'google-kaunas-card',
          full: 'google-kaunas-full',
          alt: 'Google paieška „medziu pjovimas kaunas“: Paslaugos.lt, Skelbiu ir arbcut.lt rezultatai.',
          caption: 'Paieška „medziu pjovimas kaunas“.',
          place: 'Kaunas',
        },
        {
          card: 'google-jonava-card',
          full: 'google-jonava-full',
          alt: 'Google paieška „medziu pjovimas jonava“: arbcut.lt rezultatas ir ArbCut paminėjimas Google DI apžvalgoje.',
          caption: 'Paieška „medziu pjovimas jonava“: arbcut.lt rezultatuose ir DI apžvalgoje.',
          place: 'Jonava',
        },
        {
          card: 'google-kazlu-ruda-card',
          full: 'google-kazlu-ruda-full',
          alt: 'Google paieška „medziu pjovimas kazlu ruda“: DI apžvalga, po jos pirmas rezultatas – arbcut.lt.',
          caption: 'Paieška „medziu pjovimas kazlu ruda“: arbcut.lt pirmas po DI apžvalgos.',
          place: 'Kazlų Rūda',
        },
      ],
      saved: '2026-10-12',
      note: 'Google rezultatai priklauso nuo vietos ir laiko, todėl Jums gali atrodyti kitaip.',
    },
  ],
  notes: ['Tai vieno kliento rezultatas, ne garantija.'],
  savedLabel: 'Ekrano kopija išsaugota',
  zoomLabel: 'Padidinti',
  viewLabel: 'Peržiūrėti',
  site: { label: 'Aplankyti arbcut.lt', href: 'https://arbcut.lt' },
  pdf: {
    label: 'Atsisiųsti įrodymus (PDF)',
    href: '/assets/arbcut-irodymai-2026-10-12.pdf',
    size: 'PDF',
  },
};

/* ---------- Pages ---------- */

export const contact = {
  eyebrow: 'Kontaktai',
  title: 'Ar tai Jums būtų naudinga?',
  lead: 'Parašykite – atsakau pats.',
};

export const home = {
  meta: {
    ogImage: '/assets/og-v4.png',
    title: 'Svetainė paslaugų verslui – 60 dienų nemokamai | jarvisweb.lt',
    description:
      'Svetainė vietiniam paslaugų verslui: 0 € pirmąsias 60 dienų nuo paleidimo; mokate tik domeną. Arboristo svetainė arbcut.lt per rugpjūtį ir rugsėjį sulaukė 20 formos užklausų.',
  },
  hero: {
    eyebrow: 'Svetainės vietiniam paslaugų verslui',
    // h1 = before + highlighted part + after
    h1: { before: 'Svetainė, kuri ', highlight: 'atneša užklausas', after: ' iš Google.' },
    sub: 'Arboristo svetainė arbcut.lt per rugpjūtį ir rugsėjį sulaukė 20 formos užklausų. Tokią pačią galiu sukurti ir Jums.',
    chips: [
      { figure: '20', unit: 'užklausų', text: 'per rugpjūtį ir rugsėjį', href: '#rezultatai' },
      { figure: '573', unit: 'paspaudimai', text: 'iš Google paieškos per 3 mėn.', href: '#rezultatai' },
    ],
    by: 'Kuria Matas Bašinskas, Kaunas',
    deviceAlt: {
      desktop: 'Arboristo svetainė arbcut.lt kompiuterio ekrane.',
      mobile: 'Arboristo svetainė arbcut.lt telefono ekrane.',
    },
  },
  caseStudy: {
    eyebrow: 'Atvejis · ArbCut',
    title: 'Arboristo svetainė, kuri sulaukia užklausų.',
    facts: [
      { label: 'Klientas', text: 'Mantas Gerulis, arboristas. Dirba Kaune, Jonavoje ir aplink.' },
      { label: 'Ką sukūriau', text: 'Svetainę arbcut.lt: paslaugos, darbų galerija, D.U.K., užklausos forma, pritaikyta telefonui.' },
      { label: 'Kas įvyko', text: '20 formos užklausų per rugpjūtį ir rugsėjį, 573 paspaudimai iš Google paieškos per 3 mėnesius. Svetainė rodoma paieškose „arboristas kaunas“, „medziu pjovimas kaunas“, „medziu pjovimas jonava“ ir „medziu pjovimas kazlu ruda“.' },
    ],
    imageAlt: 'arbcut.lt pagrindinis puslapis kompiuterio ekrane.',
  },
};

export const resultsPage = {
  meta: {
    ogImage: '/assets/og-rezultatai-v4.png',
    title: '20 užklausų per 2 mėnesius – rezultatai ir kaina | jarvisweb.lt',
    description:
      'Arboristo svetainė arbcut.lt per rugpjūtį ir rugsėjį sulaukė 20 formos užklausų. Originalios ekrano kopijos; svetainė nemokama pirmąsias 60 dienų, vėliau 49 € per mėnesį.',
  },
  hero: {
    eyebrow: 'Rezultatai · arbcut.lt',
    figure: '20',
    h1: 'užklausų per 2 mėnesius',
    sub: 'Tiek formos užklausų per rugpjūtį ir rugsėjį sulaukė mano sukurta arboristo Manto Gerulio svetainė arbcut.lt. Tokią pačią galiu sukurti ir Jums.',
    by: 'Matas Bašinskas, svetainių kūrėjas, Kaunas',
  },
  stepsLead: 'Penki žingsniai. Kainą ir apimtį sutariame raštu prieš darbą.',
};

export { TRACKING_PREFIXES };

export const footer = {
  blurb: 'Svetainės vietiniam paslaugų verslui. Pirmąsias 60 dienų nemokamai; vėliau 49 € per mėnesį.',
  contactsTitle: 'Kontaktai',
  linksTitle: 'Puslapiai',
  socialTitle: 'Sekite',
  pages: [
    { label: 'Pradžia', href: '/' },
    { label: 'Rezultatai', href: '/rezultatai' },
  ],
  privacy: { label: 'Privatumo politika', href: '/privatumo-politika' },
  terms: { label: 'Taisyklės', href: '/taisykles' },
};

export const utility = {
  home: 'Į pradžią',
  updated: 'Atnaujinta',
  skip: 'Pereiti prie turinio',
  screenshot: 'Ekrano kopija',
  mainNav: 'Pagrindinė navigacija',
  menuNav: 'Meniu nuorodos',
  inquiriesByMonth: 'Užklausos pagal mėnesį',
  notFound: {
    metaTitle: 'Puslapis nerastas | jarvisweb.lt',
    title: 'Tokio puslapio nėra',
    text: 'Galbūt nuoroda pasenusi.',
  },
};

/* ---------- Free-preview funnel (docs/SPEC-2026-10-preview-funnel.md) ----------
   /noriu: SMS links with prefix `p` land here; the homepage links here without
   a code. Jarvis checks this copy before the form goes live. */

export const funnel = {
  meta: {
    title: 'Nemokama Jūsų svetainės peržiūra | jarvisweb.lt',
    description:
      'Atsakykite į kelis klausimus apie savo darbą, ir per 48 valandas atsiųsiu nuorodą į Jūsų svetainės peržiūrą. Nemokamai, be įsipareigojimų.',
  },
  nav: [
    { label: 'Pavyzdys', href: '#pavyzdys' },
    { label: 'Rezultatai', href: '#rezultatai' },
    { label: 'Peržiūra', href: '#kontaktai' },
  ],
  hero: {
    eyebrow: 'Nemokama svetainės peržiūra',
    h1: 'Nemokamai parodysiu, kaip atrodytų Jūsų svetainė.',
    sub: 'Atsakykite į kelis klausimus apie savo darbą. Per 48 valandas paruošiu Jūsų svetainės peržiūrą ir nuorodą atsiųsiu SMS žinute. Nieko nemokate ir niekuo neįsipareigojate.',
    jump: 'Noriu peržiūros',
    by: 'Matas Bašinskas, svetainių kūrėjas, Kaunas',
  },
  example: {
    eyebrow: 'Pavyzdys',
    title: 'Šildymo meistro svetainė',
    text: 'Taip galėtų atrodyti ir Jūsų svetainė: su Jūsų paslaugomis, vietovėmis ir darbų nuotraukomis. Vardas ir duomenys pavyzdyje išgalvoti.',
    open: 'Atidaryti pavyzdį',
    href: '/pavyzdys/sildymas',
  },
  cta: {
    title: 'Norite tokios peržiūros?',
    text: 'Tai nemokama. Jei peržiūra nepatiks, tiesiog neatsakykite.',
    button: 'Taip, noriu nemokamos peržiūros',
  },
  // Service checkboxes by proof-code prefix (spec §2). No list = free text.
  services: {
    p: [
      'Katilų montavimas',
      'Katilų remontas',
      'Katilų aptarnavimas',
      'Šilumos siurbliai',
      'Grindinis šildymas',
      'Radiatoriai ir vamzdynai',
      'Katilinių įrengimas',
      'Kaminai ir dūmtraukiai',
      'Židiniai ir krosnelės',
    ],
  },
  areas: ['Kaunas', 'Kauno r.', 'Vilnius', 'Vilniaus r.', 'Klaipėda', 'Šiauliai', 'Panevėžys', 'Alytus', 'Marijampolė', 'Jonava', 'Kėdainiai', 'Visa Lietuva'],
  form: {
    title: 'Keli klausimai apie Jūsų darbą',
    lead: 'Užtruks apie 2 minutes. Visi laukai nebūtini, išskyrus pažymėtus.',
    services: 'Kokias paslaugas parodyti?',
    servicesFree: 'Kokias paslaugas teikiate?',
    servicesFreeHint: 'Pvz. katilų montavimas, santechnika, stogų dengimas.',
    other: 'Kita',
    otherHint: 'Įrašykite, ko nėra sąraše.',
    areas: 'Kur dirbate?',
    areasOther: 'Kitos vietovės',
    photos: 'Ar galiu naudoti Jūsų darbų nuotraukas iš Paslaugos.lt profilio?',
    photosYes: 'Taip, naudokite',
    photosOther: 'Atsiųsiu kitas',
    standout: 'Kuo išsiskiriate?',
    standoutHint: 'Pvz. garantija, darbo patirtis metais, skubūs iškvietimai, sertifikatai.',
    time: 'Kada patogu pakalbėti?',
    times: [
      { value: 'morning', label: 'Rytas' },
      { value: 'day', label: 'Diena' },
      { value: 'evening', label: 'Vakaras' },
      { value: 'sms', label: 'Parašykite SMS' },
    ],
    files: 'Pridėkite failų',
    filesHint: 'Darbų nuotraukos, logotipas, kainoraštis. Iki 8 failų, iš viso iki 25 MB. Nuotraukas prieš siųsdamas sumažinu.',
    name: 'Vardas',
    phone: 'Telefono numeris',
    phoneHint: 'Čia atsiųsiu peržiūros nuorodą.',
    optional: '(nebūtina)',
    required: '(būtina)',
    submit: 'Gauti nemokamą peržiūrą',
    sending: 'Siunčiama…',
    preparing: 'Ruošiamos nuotraukos…',
    privacy: 'Duomenis ir failus naudoju tik Jūsų peržiūrai paruošti ir susisiekti dėl jos.',
    noscript: 'Naršyklėje išjungtas JavaScript: forma vis tiek išsiųs atsakymus, bet nuotraukos nebus sumažintos, o po išsiuntimo matysite tik trumpą techninį atsakymą. Jei kas nepavyks, skambinkite +370 676 99395.',
    errors: {
      phone: 'Įveskite telefono numerį, pvz. +370 612 34567.',
      phoneCallback: 'Įrašykite telefono numerį, kad galėčiau paskambinti.',
      email: 'Įveskite teisingą el. pašto adresą, pvz. vardas@pastas.lt.',
      files: 'Iki 8 failų, kiekvienas iki 10 MB, iš viso iki 25 MB.',
      fileType: 'Šio failo tipo priimti negaliu. Tinka nuotraukos, PDF, Word, Excel ir tekstiniai failai.',
      invalid: 'Patikrinkite pažymėtą laukelį.',
      tooLarge: 'Failai per dideli. Iš viso iki 25 MB.',
      rateLimited: 'Per daug bandymų iš eilės. Pabandykite po kelių minučių.',
      failure: `Nepavyko išsiųsti. Pabandykite dar kartą arba skambinkite ${PHONE}.`,
    },
    // {name} = vocative first name, {date} = +48 h in Europe/Vilnius.
    thanks: {
      preview: 'Ačiū{name}. Peržiūros nuorodą atsiųsiu {via} per 48 val., iki {date}.',
      callback: 'Ačiū{name}. {time}',
      times: {
        morning: 'Paskambinsiu rytą.',
        day: 'Paskambinsiu dieną.',
        evening: 'Paskambinsiu vakare.',
        sms: 'Parašysiu Jums SMS.',
        '': 'Paskambinsiu artimiausiu metu.',
      },
      sign: '– Matas',
    },
  },
};

/* Homepage button to the same form without a code (phone field shown). */
export const previewOffer = {
  title: 'Norite pamatyti savo svetainę prieš mokėdami?',
  text: 'Atsakykite į kelis klausimus, ir per 48 valandas atsiųsiu nemokamą Jūsų svetainės peržiūrą.',
  button: 'Gauti nemokamą peržiūrą',
  href: '/noriu#forma',
};
