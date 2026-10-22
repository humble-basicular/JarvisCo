/* Offer v2 copy (plan 2026-10-14 §1, §4.2, §4.3). DRAFT: the final Lithuanian
   copy is Jarvis's; every drafted line is listed in docs/COPY-DRAFT-V4.md.
   Honest wording rule (§1, offer changed 2026-10-18 to a fixed 60-day trial + report):
   every "0 €" claim says "pirmąsias 60 dienų" and mentions the domain fee nearby. No rank guarantees,
   no invented numbers, no testimonial text. */
import { brand } from './content.js';
import { founderLaunch, founderNote } from './founder.js';
import arbcut from './arbcut-proof.json' with { type: 'json' };
import towns from './arbcut-towns-proof.json' with { type: 'json' };

/** Dates with non-breaking hyphens, so they never wrap mid-date. */
const d = (date) => date.replace(/-/g, '\u2011');

/* arbcut.lt proof figures come only from arbcut-proof.json, which
   scripts/proof-refresh.mjs writes from the screenshots it takes. Search
   Console shows English figures ("11.9K", "5%", "8.1"); the page shows them
   in Lithuanian notation without changing the value. */
const MONTH_IN = ['sausį', 'vasarį', 'kovą', 'balandį', 'gegužę', 'birželį', 'liepą', 'rugpjūtį', 'rugsėjį', 'spalį', 'lapkritį', 'gruodį'];
const MONTH_KEY = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_GEN = ['Sausio', 'Vasario', 'Kovo', 'Balandžio', 'Gegužės', 'Birželio', 'Liepos', 'Rugpjūčio', 'Rugsėjo', 'Spalio', 'Lapkričio', 'Gruodžio'];
const lt = (figure) => figure.replace('.', ',');
const monthIndex = (ym) => Number(ym.slice(5, 7)) - 1;
/** Lithuanian noun form for a whole number: 1, 21 → one; 2–9, 22 → few; 0, 10–20, 613 → many. */
export function ltPlural(n, [one, few, many]) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && (n100 < 12 || n100 > 19)) return few;
  return many;
}
const CLICKS = ['paspaudimas', 'paspaudimai', 'paspaudimų'];
/** "11.9K" → {value: '11,9', unit: 'tūkst.'}; "573" → {value: '573'}. */
function count(figure) {
  const k = /^([\d.]+)K$/i.exec(figure);
  return k ? { value: lt(k[1]), unit: 'tūkst.' } : { value: lt(figure) };
}
export function gscProof(g) {
  const imp = count(g.impressions);
  const ctr = lt(g.ctr).replace('%', ' %');
  const pos = lt(g.position);
  const impText = `${imp.value}${imp.unit ? ` ${imp.unit}` : ''}`;
  const clicks = ltPlural(Number(g.clicks.replace(/\D/g, '')), CLICKS);
  return {
    file: g.file,
    stats: [
      { ...count(g.clicks), label: `${clicks} iš Google paieškos` },
      { ...imp, label: 'parodymų Google paieškoje' },
      { value: ctr, label: 'vidutinis paspaudimų rodiklis' },
      { value: pos, label: 'vidutinė pozicija' },
    ],
    alt: `Google Search Console ataskaita: ${lt(g.clicks)} ${clicks}, ${impText} parodymų, ${ctr} CTR, vidutinė pozicija ${pos}, laikotarpis ${g.from} – ${g.to}`,
    caption: `Google paieška per 3 mėnesius, ${d(g.from)} – ${d(g.to)}.`,
    meta: `Ekrano kopija ${d(g.captured)} · Šaltinis: Google Search Console`,
  };
}
/** Thousands with a space, Lithuanian style: 1017 → "1 017" (notation only). */
const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
/* City-page proof (arbcut-towns-proof.json): the Search Console Pages tab. Only figures visible in the
   screenshot; townClicks is the sum of its 10 town rows, said so on the page. */
export function townsProof(t) {
  return {
    file: t.file,
    stat: { value: String(t.townClicks), of: `iš ${t.totalClicks}`, label: `paspaudimų iš Google per 3 mėn. atėjo į ${t.rows.length} miestų puslapių` },
    sum: `${t.townClicks} – tai ${t.rows.length} miestų eilučių suma iš ekrano kopijos žemiau; ${t.totalClicks} – visi paspaudimai per tą patį laikotarpį (ekrano kopija skiltyje „Rezultatai“). Kiti paspaudimai atėjo į pradžios, paslaugų ir tinklaraščio puslapius.`,
    head: ['Miesto puslapis', 'Paspaudimai', 'Parodymai'],
    rows: t.rows.map((r) => ({ town: r.town, path: r.path, clicks: thousands(r.clicks), impressions: thousands(r.impressions) })),
    alt: `Google Search Console, puslapiai pagal paspaudimus: ${t.rows.map((r) => `${r.town} ${r.clicks}`).join(', ')}`,
    caption: `Google Search Console, puslapiai pagal paspaudimus, ${d(t.from)} – ${d(t.to)}. Miestų puslapių adresai – „medziu-pjovimas-miestas“.`,
    meta: `Ekrano kopija ${d(t.captured)} · Šaltinis: Google Search Console`,
  };
}
export function formsProof(f) {
  const months = f.months.slice(-3);
  const current = f.captured.slice(0, 7);
  // The biggest month is the screenshot shown; the others open from links under it.
  const main = months.reduce((a, b) => (b.submissions > a.submissions ? b : a));
  return {
    file: main.file,
    stats: [
      ...months.map((m) => ({
        value: String(m.submissions),
        label: m.month === current ? `${MONTH_IN[monthIndex(m.month)]} (iki ${Number(f.captured.slice(8, 10))} d.)` : MONTH_IN[monthIndex(m.month)],
      })),
      { value: String(f.total), label: `iš viso nuo ${d(f.created)}` },
    ],
    alt: `Web3Forms paskyra: forma ArbCut, iš viso ${f.total} ${ltPlural(f.total, ['pateikta forma', 'pateiktos formos', 'pateiktų formų'])}, ${f.spam} šlamšto, ${MONTH_IN[monthIndex(main.month)]} ${main.submissions}`,
    caption: `Užklausos per svetainės formą. Web3Forms suskaičiavo ${f.total} ${ltPlural(f.total, ['pateiktą formą', 'pateiktas formas', 'pateiktų formų'])} nuo ${d(f.created)}, kai forma buvo sukurta; šlamšto – ${f.spam}.`,
    meta: `Ekrano kopija ${d(f.captured)} · Šaltinis: Web3Forms`,
    more: [
      // The overview is the screenshot that shows the total, the spam count and the creation date.
      ...(f.overview ? [{ label: `Paskyros apžvalga: iš viso ${f.total}, šlamšto ${f.spam}`, key: 'overview', file: f.overview }] : []),
      ...months.filter((m) => m !== main).map((m) => ({ label: `${MONTH_GEN[monthIndex(m.month)]} ekrano kopija`, key: MONTH_KEY[monthIndex(m.month)], file: m.file })),
    ],
  };
}

export const ZERO = '0 € pirmąsias 60 dienų nuo paleidimo.';
export const DOMAIN = 'Domeną (~15 € per metus) apmokate Jūs, ir jis registruojamas Jūsų vardu.';
export const MAIN_CTA = 'Gauti nemokamą peržiūrą';

export const header = {
  nav: [
    { label: 'Rezultatai', href: '#rezultatai' },
    { label: 'Kaina', href: '#kaina' },
    { label: 'Kaip tai veikia', href: '#kaip' },
    { label: 'Apie mane', href: '#apie' },
    { label: 'D.U.K.', href: '#duk' },
  ],
  call: `Skambinti ${brand.phone}`,
  cta: MAIN_CTA,
  menu: 'Meniu',
  close: 'Uždaryti',
};

/* August + September 2026 form submissions (arbcut-proof.json, Web3Forms screenshots): the "20 per 2 months" in the SMS. */
const formsTwoMonths = arbcut.forms.months.filter((m) => m.month === '2026-08' || m.month === '2026-09').reduce((sum, m) => sum + m.submissions, 0);

export const hero = {
  home: {
    lines: ['Svetainė 60 dienų nemokamai.', 'Tęsite tik pamatę rezultatus.'],
  },
  heating: {
    stamp: 'Šildymo meistrams',
    lines: ['Svetainė šildymo meistrui', '60 dienų nemokamai.'],
  },
  // /rezultatai is the SMS link: its headline repeats the SMS hook, and the figure comes from the Web3Forms screenshots.
  results: {
    stamp: 'Rezultatai · arbcut.lt',
    lines: [`${formsTwoMonths} užklausų vien per formą`, 'per 2 mėnesius.'],
    sub: [
      `Tiek užklausų per svetainės formą per rugpjūtį ir rugsėjį gavo arboristas Mantas Gerulis (arbcut.lt). Skambučiai neįskaičiuoti. Žemiau – originalios ekrano kopijos.`,
      'Tokią pat svetainę galiu sukurti ir Jums: pirmąsias 60 dienų mėnesio mokesčio nėra, mokate tik už domeną (~15 € per metus). Tada pagal ataskaitą nusprendžiate, ar tęsti.',
    ],
  },
  sub: [
    'Nemokama Jūsų svetainės peržiūra per 48 val. Paleidus svetainę pirmąsias 60 dienų mėnesio mokesčio nėra, o tada pagal ataskaitą nusprendžiate, ar tęsti.',
    'Mokate tik už domeną (~15 € per metus), ir jis registruojamas Jūsų vardu.',
  ],
  sms: 'Parašyti SMS',
  // Hero plan §4 (concept A1): an illustration, not a client. The flat lay is AI-generated; the screen is a real screenshot of our demo.
  photoAlt: 'Atidaryta metalinė įrankių dėžė: variniai fitingai, raktai, sandarinimo juosta, o viename skyriuje – telefonas su atidaryta šildymo meistro svetaine',
  caption: 'Iliustracija: įrankių dėžė sukurta DI, ekrane – tikra mano pavyzdinės šildymo meistro svetainės ekrano kopija. Paspauskite – atsidarys gyvai.',
};

export const offerRow = [
  { big: 'Nemokama', text: 'peržiūra per 48 val.' },
  { big: '0 €', text: 'pirmąsias 60 dienų nuo paleidimo' },
  { big: 'Domenas', text: 'Jūsų vardu, ~15 € per metus' },
  { big: 'Atsisakyti', text: 'galite bet kada' },
];

export const proof = {
  label: 'Rezultatai',
  title: 'Kas vyksta arbcut.lt',
  portraitAlt: 'Mantas Gerulis su grandininiu pjūklu',
  portraitCaption: 'Mantas Gerulis, arboristas, Kaunas',
  site: 'arbcut.lt',
  text: 'arbcut.lt – arboristo svetainė Kaune, kurią sukūriau. Žemiau – tikros ekrano kopijos iš jos paskyrų: tik apkirptos, skaičiai nepakeisti.',
  gsc: gscProof(arbcut.gsc),
  forms: formsProof(arbcut.forms),
  // Jarvis 2026-10-17: nobody may read the form counts as all inquiries; calls were never counted.
  zoom: 'Paspauskite ekrano kopiją – atsidarys didelė, galėsite priartinti pirštais.',
  formsOnly: {
    title: 'Tik užklausos per formą. Skambučiai neįskaičiuoti.',
    text: 'Žmonės, kurie svetainėje paspaudė „Skambinti“ ir paskambino Mantui tiesiai, šiuose skaičiuose nesimato: iki 2026 m. spalio skambučių neskaičiavau. Dabar mano kuriamose svetainėse skaičiuojami ir skambučio mygtuko paspaudimai.',
  },
  honest: 'Paspaudimai iš Google nėra užklausos: ne kiekvienas lankytojas parašo ar paskambina. Todėl rodau abu skaičius atskirai.',
  site: 'Atidaryti arbcut.lt',
};

/* "Miestų puslapiai" (W4a). No figure is published without its dated screenshot: when Chat 3 has
   captured the Search Console Pages tab (scripts/proof-refresh.mjs), add the figure block to
   TownPages.astro beside the list. Until then the section carries no numbers. */
export const townPages = {
  label: 'Miestų puslapiai',
  title: 'Atskiras puslapis miestui',
  text: 'Žmonės paieškoje rašo paslaugą ir miestą: „medžių pjovimas Šiauliai“, „katilų remontas Jonavoje“. Kai kiekvienam miestui yra atskiras puslapis su to miesto pavadinimu, vietovėmis ir atvykimo laiku, Google jį rodo būtent tų paieškų žmonėms. Todėl iki trijų miestų, kuriuose dirbate, paruošiu atskirus puslapius. Tai ne teorija – žemiau tikri arbcut.lt skaičiai.',
  open: 'Atidaryti pavyzdį',
  demoTitle: 'Taip atrodytų Jūsų miestų puslapiai',
  proof: townsProof(towns),
  note: 'Pavyzdyje įmonė, atvykimo laikai ir kainos išgalvoti; miestai ir vietovės tikri. Vietos puslapiai padeda būti randamam paieškoje, bet vietos Google rezultatuose negarantuoju.',
};

export const compare = {
  label: 'Palyginimas',
  title: 'Portalai ar sava svetainė',
  text: 'Portalai ir svetainė gali veikti kartu. Štai kuo jie skiriasi.',
  cols: ['Paslaugos.lt ir panašūs užklausų portalai', 'Jūsų svetainė'],
  rows: [
    { q: 'Kur Jus randa', a: 'Tarp kitų paslaugų teikėjų.', b: 'Atskirame Jūsų paslaugų puslapyje.' },
    { q: 'Kaip prisistatote', a: 'Profilis pagal portalo struktūrą ir taisykles.', b: 'Jūsų paslaugos, darbų nuotraukos ir kontaktai vienoje vietoje.' },
    { q: 'Kas lieka, jei sustojate', a: 'Profilį tvarkote pagal portalo taisykles.', b: 'Domenas ir Google verslo profilis – Jūsų vardu. Jie lieka Jums.' },
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
    { title: 'Po 60 dienų – ataskaita', text: 'Atsiunčiu ataskaitą: kiek žmonių rado svetainę Google, paspaudė „Skambinti“ ir parašė. Tęsiate už 59 € per mėnesį arba atsisakote, ir tai nieko nekainuoja.' },
  ],
};

export const examples = {
  label: 'Pavyzdys',
  title: 'Tokia būtų Jūsų svetainė',
  text: 'Šildymo meistro svetainės pavyzdys: įmonė ir duomenys išgalvoti. Jūsų peržiūroje bus Jūsų paslaugos, vietovės ir nuotraukos. Viskas rėmeliuose – tikros ekrano kopijos, ne maketas.',
  open: 'Atidaryti gyvai',
  href: '/pavyzdys/sildymas',
  showcase: {
    url: 'jarvisweb.lt/pavyzdys/sildymas',
    caption: 'Pavyzdys: šildymo meistro svetainė',
    desktopAlt: 'Pavyzdinės šildymo meistro svetainės „Šilumos ratas“ ekrano kopija kompiuteryje: antraštė „Šildymo sistemos Kaune ir Kauno rajone“, skambučio ir užklausos mygtukai',
    phoneAlt: 'Ta pati pavyzdinė svetainė telefone: pirmas ekranas su skambučio mygtuku',
    pause: 'Sustabdyti slinkimą',
  },
  // Hero plan §5 D3: generic portal card, demo data only, no real portal, rating or person.
  beforeAfter: {
    from: 'Iš to, ką jau turite internete',
    to: 'tokia svetainė per 48 val.',
    beforeTag: 'Prieš: profilis portale',
    afterTag: 'Po: Jūsų svetainė',
    portal: 'Paslaugų portalas',
    demo: 'Pavyzdys',
    meta: 'Šildymo sistemos · Kaunas, Kauno r.',
    text: 'Katilų remontas ir priežiūra, šilumos siurbliai, grindinis šildymas. Dirbame Kaune ir Kauno rajone.',
    contact: 'Susisiekti per portalą',
    portalAlt: 'Pavyzdinis meistro profilis paslaugų portale: pavadinimas, trumpas aprašymas ir trys darbų nuotraukos',
    siteAlt: 'Iš to paties profilio padaryta svetainė telefone: Kauno miesto puslapis „Katilų remontas ir šildymo sistemos Kaune“',
    note: 'Pavyzdys: profilis išgalvotas, portalas bendrinis, nuotraukos – DI iliustracijos. Tikras profilis ir svetainė būtų su Jūsų duomenimis.',
  },
};

export const price = {
  label: 'Kaina',
  amount: '59 €',
  unit: '/ mėn.',
  when: 'tik jei po 60 dienų nuspręsite tęsti.',
  // Jarvis 2026-10-22: 39 € is the founder price for the first 5 clients only (slot rule A2); everyone else pays 59 €, locked while subscribed.
  // The founder line follows FOUNDER_SLOTS_LEFT in ./founder.js (edit only that number).
  launch: founderLaunch,
  before: `${ZERO} ${DOMAIN}`,
  includesTitle: 'Į kainą įeina',
  includes: [
    'Svetainė ir talpinimas',
    'Smulkūs pakeitimai: tekstai, nuotraukos, kainos (iki ~30 min. per mėnesį)',
    'Google verslo profilio priežiūra: nuotraukos, nuoroda įvertinimams',
    'Kas mėnesį SMS ataskaita: kiek užklausų ir paspaudimų „Skambinti“',
  ],
  inquiryTitle: 'Ką rodo ataskaita',
  inquiry: 'Po 60 dienų: kiek kartų svetainė parodyta Google paieškoje, kiek žmonių ją atidarė, kiek paspaudė „Skambinti“ ir kiek parašė per formą. Bandymus ir šlamštą atmetu rankomis.',
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
    { q: 'Turėjau svetainę, nieko nedavė', a: 'Dažniausiai tokia svetainė tiesiog niekam nerodoma: nėra Google verslo profilio, nėra puslapių pagal paslaugas ir miestus. Čia jie įeina. Ir pirmąsias 60 dienų mėnesio mokesčio nėra, todėl rezultatą pamatysite prieš mokėdami.' },
    { q: 'Kas, jei neatneš užklausų?', a: `Pirmąsias 60 dienų nuo paleidimo mėnesio mokesčio nėra – mokate tik už domeną (~15 € per metus). Tada atsiunčiu ataskaitą. Jei rezultatas netenkina, atsisakote, ir tai nieko nekainuoja. Jei liksite, toliau – 59 € per mėnesį${founderNote}.` },
    { q: 'Ar būsiu pirmas Google?', a: 'To pažadėti negaliu, ir niekas sąžiningai negali. Padarau tai, kas priklauso nuo manęs: greita svetainė, puslapiai pagal paslaugas ir miestus, Google verslo profilis. Kaip sekasi, matysite mėnesio ataskaitoje.' },
    { q: 'Kas, jei atsisakysiu?', a: 'Parašote SMS arba paskambinate. Per bandomąjį laikotarpį tai nieko nekainuoja. Vėliau svetainė veikia iki apmokėto mėnesio pabaigos ir tada išjungiama. Domenas, Google profilis, Jūsų nuotraukos ir tekstai lieka Jums.' },
    { q: 'Kodėl nemokamai pradžiai?', a: 'Nes sunku patikėti svetaine, kol nematai rezultato. Rizikuoju savo laiku: jei po 60 dienų rezultatai Jūsų netenkins, nieko neuždirbu. Jūs mokate tik už domeną, ir jis lieka Jūsų vardu.' },
    { q: 'Neturiu nuotraukų ar logotipo', a: 'Nieko tokio. Su Jūsų leidimu paimsiu darbų nuotraukas iš Jūsų profilio internete (pvz., Paslaugos.lt), o vietoj logotipo bus tvarkingai užrašytas pavadinimas. Vėliau viską galima pakeisti.' },
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
    yes: 'Paimkite nuotraukas iš mano profilio internete (pvz., Paslaugos.lt)',
    profile: 'Profilio nuoroda',
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
  composed: { trade: 'Sritis', years: 'Patirtis', yearsUnit: 'm.', profile: 'Profilis' },
  extraErrors: {
    photos_ok: 'Pasirinkite vieną variantą.',
    contact_time: 'Pasirinkite vieną variantą.',
    prepare: 'nepavyko paruošti nuotraukos. Pabandykite kitą arba mažesnę.',
  },
  noscriptPromise: 'Jarvis pats paruoš Jūsų svetainės peržiūrą. Nemokamai, be įsipareigojimų.',
  noscriptCall: 'Skambinti',
  noscriptSms: 'Parašyti SMS',
  noscriptLine: 'Formai reikia JavaScript — paskambinkite, parašykite SMS arba el. paštu',
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
  results: {
    title: `${formsTwoMonths} užklausų per 2 mėnesius – arbcut.lt rezultatai | jarvisweb.lt`,
    description: `Arboristo svetainė arbcut.lt per rugpjūtį ir rugsėjį sulaukė ${formsTwoMonths} užklausų vien per formą. Originalios ekrano kopijos. Jūsų svetainė: ${ZERO} Mokate tik už domeną (~15 € per metus).`,
  },
};
