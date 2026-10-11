/* =====================================================================
   JARVISWEB — single text source for every page.
   Lithuanian, formal "Jūs", plain tone, no exclamation marks, no hype.
   Rules (spec docs/SPEC-2026-10-proof-site.md §2, §6):
   - every number shown must have its original screenshot on the same page;
   - no reviews, quotes, logos or figures that a source file does not back;
   - a new niche page = one more entry in `niches`, no new components.
   ===================================================================== */

import { TRACKING_PREFIXES } from './tracking.js';

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
  email: 'jarviswork.co@gmail.com',
  emailHref: 'mailto:jarviswork.co@gmail.com',
  gbp: 'https://www.google.com/maps/place/JarvisCo/@55.1680551,22.5645915,8z/data=!4m6!3m5!1s0x46e725ccf8f540d9:0x58d0ee5e75771802!8m2!3d55.1736006!4d23.8832615!16s%2Fg%2F11npf5rgkj',
  facebook: 'https://www.facebook.com/profile.php?id=61562921045681',
  instagram: 'https://www.instagram.com/jarvisworks_co/',
};

export const cta = {
  sms: 'Parašyti SMS',
  call: 'Skambinti',
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

/* ---------- Offer: the same on every page (spec §3.1.3–3.1.5) ---------- */

export const offer = {
  price: '199 €',
  includesTitle: 'Ką gaunate už 199 €',
  includes: [
    'Pagrindinis puslapis su paslaugomis, darbų pavyzdžiais ir kontaktais',
    'Iki 3 aptarnaujamų vietovių puslapių',
    'Užklausos forma',
    'Pritaikymas telefonui, paieškos (SEO) pagrindai',
    'Vienas korekcijų etapas',
  ],
  costsTitle: 'Kiek tai kainuoja',
  costs: [
    { label: 'Sukūrimas', value: '199 € vieną kartą' },
    { label: 'Domenas', value: '15 € per metus, registruojamas Jūsų vardu' },
    { label: 'Talpinimas', value: '0 €' },
    { label: 'Mėnesinis mokestis', value: 'Nėra' },
  ],
  ownership: 'Svetainė, failai ir domenas – Jūsų. Galite ją perkelti kur norite.',
  // Verified in Jarvis's Paslaugos.lt account: €49.99/month, 2026-10-06.
  comparison: 'Palyginimui: Paslaugos.lt PRO kainuoja apie 50 € kas mėnesį.',
};

export const steps = {
  title: 'Kaip vyksta darbas',
  items: [
    'Atsakote į SMS.',
    'Trumpai aptariame paslaugas ir vietoves.',
    'Atsiunčiu rašytinį pasiūlymą.',
    'Kuriu, Jūs peržiūrite, viena korekcija.',
    'Perduodu svetainę ir prieigas.',
  ],
};

export const about = {
  title: 'Kas aš',
  name: 'Matas Bašinskas',
  text: 'Matas Bašinskas, Kaunas. Individuali veikla. Svetaines kuriu pats ir atsakau pats – be tarpininkų.',
  gbpLabel: 'Google verslo profilis',
};

/* FAQ shared by all pages. D1 (changes after handover) is an open decision
   for Jarvis; the text below is the spec default. */
const faqCommon = [
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
    a: 'Mėnesinio mokesčio nėra. Po paleidimo 30 dienų smulkius pataisymus darau nemokamai. Vėliau – susitarsime atskirai, tik jei to norėsite.',
  },
  {
    q: 'Kodėl tokia kaina?',
    a: 'Tai nedidelės, aiškios apimties svetainė. Sudėtingos sistemos į 199 € neįeina.',
  },
];

/* ---------- Proof: ArbCut (arbcut.lt), one client ----------
   Images live in src/assets/proof (see PROVENANCE.md there). Every figure
   below is visible in the screenshot it sits next to. "Saved" dates are the
   creation dates of the original files in the jarvisworks.co Drive folder
   "Work - WebAgency/ArbCut rezultatu vaizdai" (2026-10-09). */

export const arbcutProof = {
  title: 'Rezultatai: originalios ekrano kopijos',
  lead: 'Arboristo Manto Gerulio svetainė arbcut.lt. Paspaudę ekrano kopiją, pamatysite ją visą.',
  items: [
    {
      id: 'uzklausos',
      figure: '20',
      label: 'formos užklausų per rugpjūtį ir rugsėjį',
      detail: 'Rugpjūtis – 7, rugsėjis – 13. Duomenys iš Web3Forms – sistemos, per kurią veikia arbcut.lt užklausos forma.',
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
      note: 'Tai formos užklausos, ne visos tapo užsakymais.',
    },
    {
      id: 'paieska',
      figure: '573',
      label: 'paspaudimai iš Google paieškos',
      detail: '11,4 tūkst. parodymų Google paieškoje. Laikotarpis 2026-07-05 – 2026-10-04. Google Search Console, arbcut.lt.',
      shots: [
        {
          card: 'search-console-card',
          full: 'search-console-full',
          alt: 'Google Search Console, arbcut.lt: 573 paspaudimai (Total clicks), 11,4 tūkst. parodymų (Total impressions), vidutinė pozicija 8,2.',
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
      detail: 'Paieškos „medziu pjovimas kaunas“ ir „medziu pjovimas jonava“.',
      shots: [
        {
          card: 'google-kaunas-card',
          full: 'google-kaunas-full',
          alt: 'Google paieškos „medziu pjovimas kaunas“ rezultatai, tarp jų arbcut.lt: Medžių pjovimas Kaunas – arboristas ArbCut.',
          caption: 'Paieška „medziu pjovimas kaunas“.',
        },
        {
          card: 'google-jonava-card',
          full: 'google-jonava-full',
          alt: 'Google paieškos „medziu pjovimas jonava“ rezultatai: arbcut.lt rezultatas ir ArbCut paminėjimas Google DI apžvalgoje.',
          caption: 'Paieška „medziu pjovimas jonava“: arbcut.lt rezultatuose ir DI apžvalgoje.',
        },
      ],
      saved: '2026-10-09',
      note: 'Google rezultatai priklauso nuo vietos ir laiko, todėl Jums gali atrodyti kitaip.',
    },
  ],
  notes: ['Tai vieno kliento rezultatas, ne garantija.'],
  savedLabel: 'Ekrano kopija išsaugota',
  zoomLabel: 'Padidinti',
  site: { label: 'Aplankyti arbcut.lt', href: 'https://arbcut.lt' },
  pdf: {
    label: 'Atsisiųsti įrodymus (PDF)',
    href: '/assets/arbcut-irodymai-2026-10.pdf',
    size: 'PDF',
  },
};

/* ---------- Pages ---------- */

const finalCta = {
  title: 'Ar tai Jums būtų naudinga?',
  lead: 'Parašykite – atsakau pats.',
};

export const niches = {
  arboristai: {
    slug: 'arboristams',
    trackingPrefix: 'a',
    meta: {
      ogImage: '/assets/og-arboristams.png',
      title: 'Svetainė arboristui – 199 € vieną kartą | jarvisweb.lt',
      description:
        '20 formos užklausų per rugpjūtį ir rugsėjį sulaukė arboristo Manto Gerulio svetainė arbcut.lt. Tokią pačią sukursiu ir Jums: 199 € vieną kartą, be mėnesinių mokesčių.',
    },
    hero: {
      h1: [{ text: '20', big: true }, { text: ' užklausų dėl medžių darbų per 3 mėnesius' }],
      sub: 'Tiek per rugpjūtį ir rugsėjį sulaukė mano sukurta svetainė arboristui Mantui Geruliui – arbcut.lt. Tokią pačią galiu sukurti ir Jums.',
      price: { big: '199 €', text: 'vieną kartą. Be mėnesinių mokesčių.' },
      payback: 'Užtenka vieno užsakymo, kad atsipirktų. Svetainė lieka Jūsų ir dirba toliau.',
    },
    proof: arbcutProof,
    audience: null,
    faq: faqCommon,
    finalCta,
    formSource: 'arboristams',
  },
};

export const home = {
  slug: '',
  trackingPrefix: null,
  meta: {
    ogImage: '/assets/og.png',
    title: 'Svetainė paslaugų verslui – 199 € vieną kartą | jarvisweb.lt',
    description:
      'Svetainė paslaugų verslui už 199 € vieną kartą, be mėnesinių mokesčių. Svetainė ir domenas – Jūsų. Pavyzdys: arboristo svetainė arbcut.lt ir jos rezultatai.',
  },
  hero: {
    h1: [{ text: 'Svetainė paslaugų verslui – ' }, { text: '199 €', big: true }, { text: ' vieną kartą' }],
    sub: 'Kuriu svetaines paslaugų verslams, kad klientai galėtų Jus rasti Google ir kreiptis tiesiogiai. Žemiau – ką per rugpjūtį ir rugsėjį sulaukė mano sukurta arboristo Manto Gerulio svetainė arbcut.lt.',
    price: { big: null, text: 'Be mėnesinių mokesčių.' },
    payback: 'Užtenka vieno užsakymo, kad atsipirktų. Svetainė lieka Jūsų ir dirba toliau.',
  },
  proof: arbcutProof,
  audience: {
    title: 'Kam tinka',
    text: 'Paslaugų verslams, kurie dirba savo mieste ar rajone: medžių darbai, aplinkos ir vejos priežiūra, santechnika, stogai, statybos ir remontas, valymas.',
  },
  faq: faqCommon,
  finalCta,
  formSource: 'pradinis',
};

export { TRACKING_PREFIXES };

export const footer = {
  privacy: { label: 'Privatumo politika', href: '/privatumo-politika' },
  terms: { label: 'Taisyklės', href: '/taisykles' },
};
