/* Offer v2 copy (plan 2026-10-14 §1, §4.2, §4.3). DRAFT: the final Lithuanian
   copy is Jarvis's; every drafted line is listed in docs/COPY-DRAFT-V4.md.
   Honest wording rule (§1): every "0 €" claim says "iki pirmos užklausos, ne
   ilgiau kaip 3 mėn." and mentions the domain fee nearby. No rank guarantees,
   no invented numbers, no testimonial text without Mantas's permission. */
import { brand } from './content.js';

/** Dates with non-breaking hyphens, so they never wrap mid-date. */
const d = (date) => date.replace(/-/g, '\u2011');

export const ZERO = '0 € iki pirmos užklausos, ne ilgiau kaip 3 mėn.';
export const DOMAIN = 'Domeną (~15 € per metus) apmokate Jūs, ir jis registruojamas Jūsų vardu.';
export const MAIN_CTA = 'Gauti nemokamą peržiūrą';

export const header = {
  nav: [
    { label: 'Rezultatai', href: '#rezultatai' },
    { label: 'Kaina', href: '#kaina' },
    { label: 'Kaip tai veikia', href: '#kaip' },
    { label: 'D.U.K.', href: '#duk' },
  ],
  call: `Skambinti ${brand.phone}`,
  cta: MAIN_CTA,
  menu: 'Meniu',
  close: 'Uždaryti',
};

export const hero = {
  home: {
    lines: ['Svetainė, kuri', 'nieko nekainuoja,', 'kol neatneša užklausos.'],
    photo: 'NUOTRAUKA: telefonas su arbcut.lt ant nupjauto rąsto, baltame fone',
  },
  heating: {
    stamp: 'Šildymo meistrams',
    lines: ['Svetainė šildymo meistrui,', 'kuri nieko nekainuoja,', 'kol neatneša užklausos.'],
    photo: 'NUOTRAUKA: telefonas su šildymo pavyzdžiu šalia katilo ar radiatoriaus',
  },
  sub: [
    'Nemokama Jūsų svetainės peržiūra per 48 val. Paleidus svetainę mėnesio mokesčio nėra iki pirmos užklausos, ne ilgiau kaip 3 mėn.',
    'Mokate tik už domeną (~15 € per metus), ir jis registruojamas Jūsų vardu.',
  ],
  sms: 'Parašyti SMS',
  quote: {
    photo: 'NUOTRAUKA: Mantas',
    text: 'CITATA: vienas Manto sakinys jo paties žodžiais – tik gavus jo sutikimą.',
    who: 'Mantas Gerulis, arboristas, Kaunas',
  },
};

export const offerRow = [
  { big: 'Nemokama', text: 'peržiūra per 48 val.' },
  { big: '0 €', text: 'iki pirmos užklausos, ne ilgiau kaip 3 mėn.' },
  { big: 'Domenas', text: 'Jūsų vardu, ~15 € per metus' },
  { big: 'Atsisakyti', text: 'galite bet kada' },
];

export const proof = {
  label: 'Rezultatai',
  title: 'Kas vyksta arbcut.lt',
  text: 'arbcut.lt – arboristo svetainė Kaune, kurią sukūriau. Žemiau – tikros ekrano kopijos iš jos paskyrų: tik apkirptos, skaičiai nepakeisti.',
  gsc: {
    stats: [
      { value: '595', label: 'paspaudimai iš Google paieškos' },
      { value: '11,9', unit: 'tūkst.', label: 'parodymų Google paieškoje' },
      { value: '5 %', label: 'vidutinis paspaudimų rodiklis' },
      { value: '8,1', label: 'vidutinė pozicija' },
    ],
    alt: 'Google Search Console ataskaita: 595 paspaudimai, 11,9 tūkst. parodymų, 5 % CTR, vidutinė pozicija 8,1, laikotarpis 2026-07-12 – 2026-10-10',
    caption: `Google paieška per 3 mėnesius, ${d('2026-07-12')} – ${d('2026-10-10')}.`,
    meta: `Ekrano kopija ${d('2026-10-14')} · Šaltinis: Google Search Console`,
  },
  forms: {
    stats: [
      { value: '7', label: 'rugpjūtį' },
      { value: '13', label: 'rugsėjį' },
      { value: '1', label: 'spalį (iki 14 d.)' },
      { value: '28', label: `iš viso nuo ${d('2026-04-19')}` },
    ],
    alt: 'Web3Forms paskyra: forma ArbCut, iš viso 28 pateiktos formos, 0 šlamšto, rugsėjį 13',
    caption: `Užklausos per svetainės formą. Web3Forms suskaičiavo 28 pateiktas formas nuo ${d('2026-04-19')}, kai forma buvo sukurta; šlamšto – 0.`,
    meta: `Ekrano kopija ${d('2026-10-14')} · Šaltinis: Web3Forms`,
    more: [
      { label: 'Rugpjūčio ekrano kopija', key: 'aug' },
      { label: 'Spalio ekrano kopija', key: 'oct' },
    ],
  },
  analytics: {
    photo: 'EKRANO KOPIJA: Cloudflare Web Analytics, lankytojai per 3 mėn. (dar nepateikta)',
    caption: 'Lankytojai svetainėje.',
    meta: 'Šaltinis: Cloudflare Web Analytics · laukiama ekrano kopijos',
  },
  honest: 'Paspaudimai iš Google nėra užklausos: ne kiekvienas lankytojas parašo. Todėl rodau abu skaičius atskirai.',
  site: 'Atidaryti arbcut.lt',
};

export const compare = {
  label: 'Palyginimas',
  title: 'Paslaugos.lt ar sava svetainė',
  text: 'Kainų čia nelyginu. Tik tai, kas nutinka su užklausa.',
  cols: ['Paslaugos.lt', 'Jūsų svetainė'],
  rows: [
    { q: 'Kas mato užklausą', a: 'Užklausą gali matyti ir kiti meistrai.', b: 'Tik Jūs.' },
    { q: 'Kieno klientas', a: 'Klientas ieško platformoje ir renkasi iš sąrašo.', b: 'Klientas ieško Jūsų ir rašo tiesiai Jums.' },
    { q: 'Kas lieka, jei sustojate', a: 'Profilis priklauso platformai ir jos taisyklėms.', b: 'Domenas ir Google verslo profilis – Jūsų vardu. Jie lieka Jums.' },
  ],
};

export const how = {
  label: 'Kaip tai veikia',
  title: 'Keturi žingsniai, mokate tik paskutiniame',
  text: 'Nuo formos iki veikiančios svetainės. Visą darbą darau pats.',
  steps: [
    { title: 'Forma, 2 min.', text: 'Atsakote į kelis klausimus apie savo darbą.' },
    { title: 'Peržiūra per 48 val.', text: 'Atsiunčiu nuorodą į Jūsų svetainės peržiūrą. Nepatinka – tiesiog neatsakote.' },
    { title: 'Domenas ir paleidimas', text: 'Patinka – registruoju domeną Jūsų vardu (~15 € per metus, mokate Jūs). Paleidžiu svetainę ir Google verslo profilį.' },
    { title: 'Mokate tik po pirmos užklausos', text: 'Mėnesio mokestis prasideda po pirmos tikros užklausos per svetainę, bet ne vėliau kaip po 3 mėn. nuo paleidimo.' },
  ],
};

export const examples = {
  label: 'Pavyzdžiai',
  title: 'Kaip atrodytų Jūsų',
  text: 'Tikros svetainės, ne maketai. Šildymo pavyzdyje vardas ir duomenys išgalvoti.',
  items: [
    {
      photo: 'NUOTRAUKA: ranka laiko telefoną su šildymo pavyzdžiu šalia katilo',
      title: 'Šildymo meistro svetainė',
      note: 'Pavyzdys',
      link: 'Žiūrėti pavyzdį',
      href: '/pavyzdys/sildymas',
    },
    {
      photo: 'NUOTRAUKA: ranka laiko telefoną su arbcut.lt prie medžio',
      title: 'arbcut.lt – arboristas, Kaunas',
      note: 'Veikianti svetainė',
      link: 'Žiūrėti arbcut.lt',
      href: 'https://arbcut.lt',
    },
  ],
};

export const price = {
  label: 'Kaina',
  amount: '39 €',
  unit: '/ mėn.',
  when: 'tik po pirmos užklausos arba po 3 mėn. nuo paleidimo – kas įvyks anksčiau.',
  before: `Iki tol – ${ZERO} ${DOMAIN}`,
  includesTitle: 'Į kainą įeina',
  includes: [
    'Svetainė ir talpinimas',
    'Smulkūs pakeitimai: tekstai, nuotraukos, kainos (iki ~30 min. per mėnesį)',
    'Google verslo profilio priežiūra: nuotraukos, nuoroda įvertinimams',
    'Kas mėnesį SMS ataskaita: kiek užklausų ir paspaudimų „Skambinti“',
  ],
  inquiryTitle: 'Kas laikoma užklausa',
  inquiry: 'Tikro kliento žinutė per svetainės formą apie Jūsų paslaugą. Bandymai, šlamštas ir pasikartojimai neskaičiuojami – kiekvieną patikrinu rankomis.',
  cancelTitle: 'Jei atsisakote',
  cancel: 'Parašote SMS ar paskambinate, bet kada. Per bandomąjį laikotarpį tai nieko nekainuoja. Vėliau svetainė veikia iki apmokėto mėnesio pabaigos. Domenas, Google profilis, Jūsų nuotraukos ir tekstai lieka Jums.',
  billing: 'Sąskaita kas mėnesį, mokama mėnesiui į priekį, pavedimu.',
};

export const about = {
  label: 'Apie',
  title: 'Matas, Kaunas',
  lead: 'Svetaines kuriu pats ir atsakau pats.',
  text: 'Individuali veikla. Rašote ar skambinate – atsiliepiu aš, ne skambučių centras.',
  photoAlt: 'Matas Bašinskas',
  call: `Skambinti ${brand.phone}`,
};

export const faq = {
  label: 'D.U.K.',
  title: 'Dažni klausimai',
  items: [
    { q: 'Darbo per valias, kam man?', a: 'Svetainė nebūtinai reiškia daugiau darbo. Daugiau užklausų – daugiau pasirinkimo, kuriuos darbus imti. O ramesniu sezonu ji jau būna Google.' },
    { q: 'Turėjau svetainę, nieko nedavė', a: 'Dažniausiai tokia svetainė tiesiog niekam nerodoma: nėra Google verslo profilio, nėra puslapių pagal paslaugas ir miestus. Čia jie įeina. Ir mėnesio mokestį pradedate mokėti tik po pirmos užklausos, ne vėliau kaip po 3 mėn.' },
    { q: 'Kas, jei neatneš užklausų?', a: 'Per pirmus 3 mėn. nuo paleidimo mėnesio mokesčio nėra – mokate tik už domeną (~15 € per metus). Jei per tą laiką užklausų nebus, galite atsisakyti, ir tai nieko nekainuos. Jei liksite, toliau – 39 € per mėnesį.' },
    { q: 'Ar būsiu pirmas Google?', a: 'To pažadėti negaliu, ir niekas sąžiningai negali. Padarau tai, kas priklauso nuo manęs: greita svetainė, puslapiai pagal paslaugas ir miestus, Google verslo profilis. Kaip sekasi, matysite mėnesio ataskaitoje.' },
    { q: 'Kas, jei atsisakysiu?', a: 'Parašote SMS arba paskambinate. Per bandomąjį laikotarpį tai nieko nekainuoja. Vėliau svetainė veikia iki apmokėto mėnesio pabaigos ir tada išjungiama. Domenas, Google profilis, Jūsų nuotraukos ir tekstai lieka Jums.' },
    { q: 'Kodėl nemokamai pradžiai?', a: 'Nes sunku patikėti svetaine, kol nematai rezultato. Rizikuoju savo laiku: jei svetainė neatneša užklausų, nieko neuždirbu. Jūs mokate tik už domeną, ir jis lieka Jūsų vardu.' },
    { q: 'Neturiu nuotraukų ar logotipo', a: 'Nieko tokio. Su Jūsų leidimu paimsiu darbų nuotraukas iš Jūsų Paslaugos.lt profilio, o vietoj logotipo bus tvarkingai užrašytas pavadinimas. Vėliau viską galima pakeisti.' },
  ],
};

export const cta = {
  label: 'Peržiūra',
  title: 'Pažiūrėkite, kaip atrodytų Jūsų svetainė',
  text: 'Keli trumpi klausimai, apie 2 minutes. Peržiūrą atsiųsiu per 48 val. Nepatiks – tiesiog neatsakykite.',
};

/* Step-by-step form (§4.3). Trade and years have no wire field: the script
   writes them into `standout` as "Sritis: …; Patirtis: … m." + free text. */
export const steps = {
  progress: 'Klausimas {n} iš {total}',
  next: 'Toliau',
  back: 'Atgal',
  skip: 'Praleisti',
  trade: {
    q: 'Kokia Jūsų sritis?',
    options: ['Šildymas', 'Santechnika', 'Medžių darbai', 'Stogai', 'Elektra', 'Statyba ir remontas', 'Aplinkos tvarkymas', 'Kita'],
    heating: 'Šildymas',
    other: 'Kita',
    otherLabel: 'Įrašykite savo sritį',
  },
  services: { q: 'Kokias paslaugas teikiate?', other: 'Kitos paslaugos', free: 'Išvardinkite paslaugas', hint: 'Pvz. katilų montavimas, santechnika, stogų dengimas.' },
  area: { q: 'Kur dirbate?', other: 'Kitos vietovės' },
  years: {
    q: 'Kiek metų dirbate šioje srityje?',
    options: ['Iki 3', '3–10', '10–20', 'Daugiau nei 20'],
    standout: 'Kuo išsiskiriate?',
    standoutHint: 'Pvz. garantija, skubūs iškvietimai, sertifikatai.',
  },
  photos: {
    q: 'Nuotraukos ir logotipas',
    yes: 'Paimkite iš mano Paslaugos.lt profilio',
    own: 'Įkelsiu savo',
    files: 'Įkelkite nuotraukas ar logotipą',
    filesHint: 'Darbų nuotraukos, logotipas, kainoraštis. Iki 8 failų, iš viso iki 25 MB. Nuotraukas prieš siųsdamas sumažinu.',
  },
  contact: {
    q: 'Kur atsiųsti peržiūrą?',
    via: 'Pasirinkite, kaip gauti peržiūros nuorodą',
    sms: 'SMS',
    email: 'El. paštu',
    channel: { sms: 'SMS', email: 'el. paštu' },
    withCode: 'Peržiūrą atsiųsiu SMS į numerį, iš kurio gavote mano žinutę.',
    emailLabel: 'El. paštas',
    emailHint: 'Čia atsiųsiu peržiūros nuorodą.',
    phoneOptionalHint: 'Nebūtina. Numerio prireiks, jei paspausite „Paskambinkite man“.',
  },
  consent: 'Spausdami mygtuką sutinkate, kad šiuos duomenis ir failus naudočiau tik Jūsų peržiūrai paruošti ir susisiekti dėl jos.',
  callback: 'Paskambinkite man',
  callbackNote: 'Arba paskambinsiu aš: įrašykite telefono numerį. Visus atsakymus matysiu.',
  composed: { trade: 'Sritis', years: 'Patirtis', yearsUnit: 'm.' },
  extraErrors: {
    photos_ok: 'Pasirinkite vieną variantą.',
    contact_time: 'Pasirinkite vieną variantą.',
    prepare: 'nepavyko paruošti nuotraukos. Pabandykite kitą arba mažesnę.',
  },
  noscriptPromise: 'Jarvis pats paruoš Jūsų svetainės peržiūrą. Nemokamai, be įsipareigojimų.',
  noscriptCall: 'Skambinti',
  noscriptSms: 'Parašyti SMS',
  noscriptLine: 'Formai reikia JavaScript — paskambinkite arba parašykite SMS',
};

export const footer = {
  line: 'Svetainės paslaugų meistrams. Kaunas, visa Lietuva.',
  owner: `${brand.owner} · ${brand.status}, ${brand.city}`,
};

export const meta = {
  home: {
    title: 'Svetainės paslaugų meistrams, nemokama peržiūra | jarvisweb.lt',
    description: `Nemokama Jūsų svetainės peržiūra per 48 val. Paleidus – ${ZERO} Mokate tik už domeną (~15 € per metus), jis Jūsų vardu.`,
  },
  heating: {
    title: 'Svetainė šildymo meistrui | jarvisweb.lt',
    description: `Šildymo meistrams: nemokama svetainės peržiūra per 48 val. Paleidus – ${ZERO} Mokate tik už domeną (~15 € per metus).`,
  },
};
