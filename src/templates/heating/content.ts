/* Lithuanian copy and derived content for the heating template.
   Rule for real leads (lead decision 8): nothing is claimed that is not in the
   answers. Years, certificates, warranties, reviews, prices and numbers come
   only from `standout`, `about`, `qualifications`, `prices`, `reviews` etc.;
   everything below is neutral wording about how to reach the business, what a
   service is, or what the visitor can send. */
import type { LiveSite, SiteData, SiteService } from './types';

export const DEFAULT_ACCENT = '#b93c0b';

/** JarvisCo is the processor of every client-site form (spec §3). Legal text
 *  below is a DRAFT for Jarvis to approve before the first live site. */
export const PROCESSOR = {
  name: 'JarvisCo',
  owner: 'Matas Bašinskas',
  status: 'individuali veikla',
  city: 'Kaunas',
  site: 'jarvisweb.lt',
  siteUrl: 'https://jarvisweb.lt',
  email: 'matas@jarvisweb.lt',
  retention: 'Cloudflare serveriuose užklausos ir failai ištrinami automatiškai po 12 mėnesių.',
};
export const FORM_ENDPOINT = 'https://www.jarvisweb.lt/t/form';
export const BEACON_ENDPOINT = 'https://www.jarvisweb.lt/t/e';

/** Same limits as the Worker (funnel spec §4): 8 files, 10 MiB each, 25 MiB together. */
export const FILE_LIMITS = { count: 8, each: 10 * 1024 * 1024, total: 25 * 1024 * 1024 };
export const FILE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif,.heic,.heif,application/pdf,.doc,.docx,.xls,.xlsx,.txt,text/plain';
export const CONTACT_TIMES = [
  { value: 'morning', label: 'Ryte' },
  { value: 'day', label: 'Dieną' },
  { value: 'evening', label: 'Vakare' },
  { value: 'sms', label: 'Geriau SMS' },
];

export const t = {
  call: 'Skambinti',
  sms: 'Parašyti SMS',
  leave: 'Palikti užklausą',
  leaveLong: 'Palikite numerį\u00a0– perskambinsime',
  navServices: 'Paslaugos',
  navWorks: 'Darbai',
  navAreas: 'Kur dirbame',
  navContact: 'Kontaktai',
  routerLabel: 'Nuo ko pradėti',
  routerTitle: 'Kuo galime padėti?',
  routerAsk: 'Palikti užklausą',
  servicesLabel: 'Paslaugos',
  servicesTitle: 'Ką atliekame',
  serviceAsk: 'Užklausti',
  brandsLead: 'Dirbame su markėmis:',
  processLabel: 'Kaip vyksta darbas',
  processTitle: 'Nuo skambučio iki atlikto darbo',
  worksLabel: 'Darbai',
  worksTitle: 'Atlikti darbai',
  aboutLabel: 'Apie',
  qualificationsTitle: 'Kvalifikacija',
  pricesLabel: 'Kainos',
  pricesTitle: 'Kainos ir sąlygos',
  areasLabel: 'Kur dirbame',
  areasTitle: 'Vietovės ir darbo laikas',
  areasBase: 'Bazė',
  galleryDemoLabel: 'Nuotraukos',
  galleryDemoTitle: 'Šildymas iš arčiau',
  gallerySwipe: 'Nuotraukos, slinkite į šoną',
  areasUnsure: 'Nerandate savo vietovės? Paskambinkite arba palikite užklausą – pasakysime, ar atvyksime.',
  reviewsLabel: 'Klientų žodis',
  reviewsTitle: 'Ką sako klientai',
  faqLabel: 'D. U. K.',
  faqTitle: 'Dažniausi klausimai',
  formLabel: 'Užklausa',
  formTitle: 'Palikite numerį\u00a0– perskambinsime',
  formOrCall: 'Arba skambinkite:',
  service: 'Ko reikia?',
  servicePick: 'Pasirinkite paslaugą',
  serviceOther: 'Kita / nežinau',
  location: 'Vietovė',
  locationHint: 'Miestas, rajonas ar kaimas. Tikslaus adreso nereikia.',
  name: 'Vardas',
  optional: 'nebūtina',
  phoneField: 'Telefono numeris',
  phoneHint: 'Pvz. 0 612 34567 arba +370 612 34567',
  message: 'Kas atsitiko?',
  messageHint: 'Trumpai aprašykite gedimą arba darbą.',
  more: 'Katilo duomenys ir patogus laikas skambinti',
  brand: 'Katilo markė ir modelis',
  code: 'Klaidos kodas ekrane',
  contactTime: 'Kada patogu skambinti?',
  files: 'Nuotraukos ar failai',
  filesText: 'Pridėkite katilo, duomenų lentelės ir klaidos ekrano nuotraukas. Fotografuokite saugiai: neatidarykite katilo korpuso. Neįtraukite asmens dokumentų.',
  filesButton: 'Pridėti nuotraukų ar failų',
  filesHint: 'Iki 8 failų: kiekvienas iki 10 MiB, kartu iki 25 MiB (1 MiB = 1 048 576 baitai). Nuotraukos (taip pat HEIC), PDF, Word, Excel, TXT.',
  submit: 'Siųsti užklausą',
  sending: 'Siunčiama…',
  thanksTitle: 'Užklausa gauta',
  thanksText: 'Tai dar nėra patvirtintas atvykimo laikas. Susisieksime Jūsų nurodytu numeriu.',
  errorLead: 'Paskambinkite tiesiai:',
  gasTitle: 'Užuodžiate dujas?',
  gasText: 'Tai ne remonto užklausa. Nejunkite elektros prietaisų, išeikite į lauką ir skambinkite',
  contactLabel: 'Kontaktai',
  hours: 'Darbo laikas',
  email: 'El. paštas',
  areas: 'Vietovės',
  phone: 'Telefonas',
  privacy: 'Privatumo politika',
  inert: 'Tai peržiūra: forma dar niekur nesiunčia.',
  by: 'Svetainę sukūrė',
};

/* Demo only: one line per demo service. Real previews and client sites show supplied wording only. */
const SERVICE_TEXT: { match: RegExp; text: string }[] = [
  { match: /remont/iu, text: 'Gedimo paieška pagal klaidos kodą, degiklio, siurblio, šilumokaičio ir valdymo plokštės remontas.' },
  { match: /priežiūr|aptarnav|profilakt/iu, text: 'Metinė apžiūra: degimo patikra, valymas, slėgio ir saugos įtaisų patikra, įrašas į aptarnavimo knygelę.' },
  { match: /keitim|montav|įrengim/iu, text: 'Katilo parinkimas pagal namą, senojo išmontavimas, aprišimas, paleidimas ir derinimas.' },
  { match: /šilumos siurbl/iu, text: 'Oras–vanduo šilumos siurblių įrengimas ir priežiūra, derinimas su esamais radiatoriais.' },
  { match: /grindin/iu, text: 'Vandeninio grindinio šildymo kontūrai, kolektoriai, balansavimas ir sandarumo bandymas.' },
  { match: /radiator|vamzd/iu, text: 'Radiatorių keitimas ir pajungimas, sistemos plovimas, nuorinimas ir balansavimas.' },
];

/** Service names without bracketed notes: "Katilų priežiūra (profilaktika)" → "Katilų priežiūra". */
const bare = (name: string) => name.replace(/\s*\([^)]*\)/gu, '').replace(/\s+/gu, ' ').trim();
const lowerFirst = (s: string) => s.charAt(0).toLocaleLowerCase('lt') + s.slice(1);
const upperFirst = (s: string) => s.charAt(0).toLocaleUpperCase('lt') + s.slice(1);
export const joinList = (items: string[]) => items.join(', ');
/** "a, b ir c" */
export const andList = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ir ${items.at(-1)}`);

/** Lithuanian count forms: 1 paslauga, 2–9 paslaugos, 10–20 (and …0) paslaugų, 21 paslauga. */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const d = n % 10, h = n % 100;
  if (d === 1 && h !== 11) return one;
  if (d >= 2 && h < 10 || d >= 2 && h > 20) return few;
  return many;
}
/** "a, b, c ir kt." for a short preview of a longer list. */
const preview = (items: string[]) => (items.length > 3 ? `${items.slice(0, 3).join(', ')} ir kt.` : andList(items));

export function serviceList(data: SiteData): { name: string; text: string }[] {
  return data.services.map((s): { name: string; text: string } => {
    const item: SiteService = typeof s === 'string' ? { name: s } : s;
    return { name: item.name, text: item.text ?? (data.demo ? SERVICE_TEXT.find((r) => r.match.test(item.name))?.text : undefined) ?? '' };
  });
}

/** Kaunas → Kaune, "Kauno r." → "Kauno rajone". null when the form is not a known pattern. */
export function inCity(city: string): string | null {
  const w = city.trim();
  const district = /^(\p{L}+o)\s+(?:r\.|raj\.|rajonas|rajono savivaldybė|r\. sav\.)$/iu.exec(w);
  if (district) return `${district[1]} rajone`;
  if (!/^\p{L}+$/u.test(w)) return null;
  const rules: [RegExp, string][] = [
    [/ius$/iu, 'iuje'], [/ys$/iu, 'yje'], [/iai$/iu, 'iuose'], [/ai$/iu, 'uose'], [/us$/iu, 'uje'],
    [/as$/iu, 'e'], [/is$/iu, 'yje'], [/ė$/iu, 'ėje'], [/a$/iu, 'oje'],
  ];
  for (const [re, end] of rules) if (re.test(w)) return w.replace(re, '') + end;
  return null;
}

/** Standout text → short facts (one per line, `;` or sentence). */
export function standoutPoints(text = ''): string[] {
  // A trailing full stop goes, unless it ends an abbreviation ("nuo 2014 m.", "Kauno r.").
  return text.split(/\n|;|(?<=[\p{L}\d)]\.)(?<!(?:^|[\s(])(?:m|val|min|r|raj|g|tel|pvz|nr|kt|t|d|mėn|vnt)\.)\s+(?=\p{Lu})/u).map((s) => s.trim().replace(/(?<!(?:^|[\s\d])\p{L}{1,3})\.$/u, '')).filter(Boolean).slice(0, 4);
}

/** Two services as one phrase, shared leading words said once
 *  ("Dujinių katilų remontas" + "Dujinių katilų priežiūra" → "Dujinių katilų remontas ir priežiūra").
 *  null when they share no leading words or either already contains "ir". */
function merge(a: string, b: string): string | null {
  if (/ ir /u.test(a) || / ir /u.test(b)) return null;
  const wa = a.split(' ');
  const wb = b.split(' ');
  let i = 0;
  while (i < wa.length - 1 && i < wb.length - 1 && wa[i].toLocaleLowerCase('lt') === wb[i].toLocaleLowerCase('lt')) i++;
  return i > 0 ? `${a} ir ${wb.slice(i).join(' ')}` : null;
}
/** Services with neighbours that share leading words merged. */
function serviceGroups(data: SiteData): string[] {
  const out: string[] = [];
  for (const name of serviceList(data).map((s) => bare(s.name))) {
    const merged = out.length ? merge(out[out.length - 1], name) : null;
    if (merged) out[out.length - 1] = merged;
    else out.push(name);
  }
  return out;
}
function servicePhrase(data: SiteData): string {
  const groups = serviceGroups(data);
  const [a, b] = groups;
  if (/ ir /u.test(a) || !b || / ir /u.test(b)) return a;
  const phrase = `${a} ir ${lowerFirst(b)}`;
  return phrase.length <= 64 ? phrase : a;
}

/** H1: the client's tagline, else their first services + city ("… Kaune"). */
export function headline(data: SiteData): string {
  if (data.tagline) return data.tagline;
  const phrase = servicePhrase(data);
  const loc = inCity(data.city);
  return loc ? `${phrase} ${loc}` : phrase;
}

/** Where the business works, as one sentence ("Dirbame Kaune, Kauno rajone ir dar 4 vietovėse."). */
export function coverage(data: SiteData, short = false): string {
  const areas = data.areas.length ? data.areas : [data.city];
  const shown = short && areas.length > 3 ? areas.slice(0, 2) : areas;
  const locs = shown.map(inCity);
  if (locs.some((l) => !l)) return `Dirbame: ${andList(areas)}.`;
  const rest = areas.length - shown.length;
  const more = rest ? ` ir dar ${rest} ${rest === 1 ? 'vietovėje' : rest < 10 ? 'vietovėse' : 'vietovių'}` : '';
  return `Dirbame ${more ? (locs as string[]).join(', ') : andList(locs as string[])}${more}.`;
}

export function lead(data: SiteData): string {
  if (data.lead) return data.lead;
  if (data.demo) return 'Katilų remontas, priežiūra ir naujos šildymo sistemos – nuo katilinės iki radiatorių.';
  // Up to four service groups, fewer when the names are long, so the hero stays short on a phone.
  const groups: string[] = [];
  for (const g of serviceGroups(data).map(lowerFirst).slice(0, 4)) {
    if (groups.length && andList([...groups, g]).length > 110) break;
    groups.push(g);
  }
  return `${data.business} – ${andList(groups)}. ${coverage(data, true)}`;
}

export function pageTitle(data: SiteData): string {
  return `${headline(data)} | ${data.business}`.slice(0, 90);
}

export function pageDescription(data: SiteData): string {
  return `${lead(data)} Tel. ${data.phone}.`.slice(0, 300);
}

/** Counted facts for the About block, all read from the data (areas, brands, services): never invented. */
export function aboutFacts(data: SiteData): { n: number; label: string; detail: string }[] {
  const areas = data.areas.length ? data.areas : [data.city];
  const names = serviceList(data);
  const facts = [
    ...(areas.length > 1 ? [{ n: areas.length, label: plural(areas.length, ['vietovė', 'vietovės', 'vietovių']), detail: preview(areas) }] : []),
    ...(data.brands?.length ? [{ n: data.brands.length, label: plural(data.brands.length, ['markė', 'markės', 'markių']), detail: preview(data.brands) }] : []),
    { n: names.length, label: plural(names.length, ['paslauga', 'paslaugos', 'paslaugų']), detail: '' },
  ];
  return facts.length >= 2 ? facts : [];
}

/** Symptom-first entry points (report §4 wireframe 4). Only for services the site really lists. */
export type RouteKind = 'repair' | 'servicing' | 'install';
const ROUTES: { kind: RouteKind; match: RegExp; title: string; text: string }[] = [
  { kind: 'repair', match: /remont|gedim|klaid/iu, title: 'Katilas neveikia ar rodo klaidą?', text: 'Nurodykite katilo markę, modelį ir klaidos kodą. Galite pridėti ekrano ar duomenų lentelės nuotrauką.' },
  { kind: 'servicing', match: /priežiūr|aptarnav|profilakt/iu, title: 'Reikia metinės priežiūros?', text: 'Planinę katilo apžiūrą patogiausia suderinti prieš šildymo sezoną.' },
  { kind: 'install', match: /keitim|montav|įreng|šilumos siurbl/iu, title: 'Planuojate keisti ar įrengti šildymą?', text: 'Pasakykite, kokį šildymą turite dabar ir kokį namą ar butą reikia šildyti.' },
];
export function routes(data: SiteData): { kind: RouteKind; title: string; text: string; service: string }[] {
  const names = serviceList(data).map((s) => s.name);
  return ROUTES.flatMap((r) => {
    const service = names.find((n) => r.match.test(n));
    return service ? [{ kind: r.kind, title: r.title, text: r.text, service }] : [];
  });
}

/** How a request goes. Contact flow only, no promise about timing or guarantees. */
const DEMO_PROCESS = [
  { title: 'Paskambinate arba paliekate užklausą', text: 'Trumpai aprašykite, kas atsitiko ir kur esate. Galite pridėti katilo ar klaidos ekrano nuotrauką.' },
  { title: 'Aptariame telefonu', text: 'Išsiaiškiname gedimą ar darbą, suderiname atvykimo laiką ir kainos sąlygas.' },
  { title: 'Atvykstame ir atliekame darbą', text: 'Jei prireikia papildomų darbų ar detalių, pirmiausia suderiname su Jumis.' },
];

/** Real inputs do not establish a visit/price/parts policy: use visitor guidance. */
export function processSteps(data: SiteData) {
  return data.demo ? DEMO_PROCESS : [
    { title: 'Papasakokite, ko reikia', text: 'Nurodykite paslaugą ir vietovę. Jei galite, pridėkite įrenginio ar klaidos ekrano nuotrauką.' },
    { title: 'Aptarkite sąlygas', text: 'Susisiekę pasitikslinkite darbų apimtį, galimą atvykimo laiką ir iškvietimo kainą.' },
    { title: 'Suderinkite darbus', text: 'Prieš darbus aptarkite pasiūlymą, detales ir papildomų darbų sąlygas.' },
  ];
}

/** Proof line under the hero: the client's own standout facts, then hours and brands. */
export function proofItems(data: SiteData): { label?: string; text: string }[] {
  const items: { label?: string; text: string }[] = standoutPoints(data.standout).map((text) => ({ text }));
  if (data.hours) items.push({ label: t.hours, text: data.hours });
  if (data.brands?.length) items.push({ label: 'Markės', text: joinList(data.brands) });
  return items.slice(0, 4);
}

export function faqList(data: SiteData): { q: string; a: string }[] {
  const names = serviceList(data).map((s) => bare(s.name));
  const brands = data.brands?.length ? ` Dirbame su markėmis: ${joinList(data.brands)}.` : '';
  return [
    { q: 'Kokias paslaugas teikiate?', a: `${andList(names.map((n, i) => (i ? lowerFirst(n) : upperFirst(n))))}.${brands}` },
    { q: 'Kur dirbate?', a: `${coverage(data)} Nesate tikri, ar atvykstame pas Jus? Paskambinkite arba palikite užklausą.` },
    { q: 'Ką pasakyti skambinant dėl gedimo?', a: 'Kur esate, kokia katilo markė ir modelis, ką rodo ekranas (klaidos kodas) ir ar veikia karštas vanduo. Formoje galite pridėti nuotraukų.' },
    { q: 'Kiek kainuos darbas?', a: data.prices?.length ? 'Pagrindines kainas rasite skyriuje „Kainos ir sąlygos“. Tikslią kainą aptariame telefonu, kai žinome gedimą ar darbo apimtį.' : 'Kaina priklauso nuo sistemos ir darbo apimties. Paskambinkite arba palikite užklausą, ir aptarsime Jūsų atvejį.' },
    { q: 'Ką daryti, jei užuodžiu dujas?', a: 'Nejunkite ir neišjunkite elektros prietaisų, neuždekite ugnies, atidarykite langus, išeikite į lauką ir iš ten skambinkite ESO dujų avarinei tarnybai 1804 arba bendruoju pagalbos numeriu 112.' },
    ...(data.faq ?? []),
  ];
}

/** Two letters for the mark: "Šilumos ratas" → "ŠR"; legal forms and short words are skipped
 *  ("UAB Šildymo ir vėdinimo sprendimai" → "ŠV"). */
const SKIP = /^(?:uab|mb|iį|ii|ab|všį|vsi|ir|bei|ar|su|iš|į|ui)$/iu;
export const initials = (business: string) => {
  const words = business.replace(/["„“”']/gu, '').split(/\s+/u).filter(Boolean);
  const main = words.filter((w) => !SKIP.test(w) && /\p{L}/u.test(w));
  return (main.length ? main : words).slice(0, 2).map((w) => [...w][0]).join('').toLocaleUpperCase('lt');
};

/** +370 600 00000 / 8 600 00000 / 860000000 / 060000000 / 60000000 → +37060000000. null if not a phone. */
export function toE164(phone: string): string | null {
  const p = phone.trim();
  const digits = p.replace(/\D/g, '');
  if (p.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.startsWith('00')) return digits.length >= 10 ? `+${digits.slice(2)}` : null;
  if (digits.startsWith('370') && digits.length === 11) return `+${digits}`;
  if (/^[08]\d{8}$/.test(digits)) return `+370${digits.slice(1)}`;
  if (/^[3-9]\d{7}$/.test(digits)) return `+370${digits}`;
  return null;
}
export const isMobile = (e164: string | null) => !!e164 && /^\+3706\d{7}$/.test(e164);

/** schema.org HVACBusiness JSON-LD (live sites only). Facts from the data, nothing else:
 *  no street address unless the client gave one, no ratings. */
export function jsonLd(data: SiteData, site: LiveSite) {
  const url = `https://${site.domain}/`;
  const photo = data.photos[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    '@id': `${url}#business`,
    name: data.business,
    url,
    telephone: toE164(data.phone) ?? data.phone,
    ...(data.email ? { email: data.email } : {}),
    ...(photo ? { image: `${url}${photo.src.replace(/^\//, '')}` } : {}),
    ...(data.legal?.name && data.legal.name !== data.business ? { legalName: data.legal.name } : {}),
    description: pageDescription(data),
    address: { '@type': 'PostalAddress', addressLocality: data.city, addressCountry: 'LT', ...(data.legal?.address ? { streetAddress: data.legal.address } : {}) },
    areaServed: data.areas.map((name) => ({ '@type': 'Place', name })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Paslaugos',
      itemListElement: serviceList(data).map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, ...(s.text ? { description: s.text } : {}) } })),
    },
  };
}
