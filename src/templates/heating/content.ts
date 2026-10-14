/* Lithuanian copy and derived content for the heating template.
   Rule for real leads (lead decision 8): nothing is claimed that is not in the
   answers. Years, certificates, warranties, reviews and numbers come only from
   `standout`, `about`, `reviews` etc.; everything below is neutral wording
   about how to reach the business or what a service is. */
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
  email: 'jarviswork.co@gmail.com',
  retention: 'Cloudflare serveriuose užklausos ir failai ištrinami automatiškai po 12 mėnesių.',
};
export const FORM_ENDPOINT = 'https://www.jarvisweb.lt/t/form';
export const BEACON_ENDPOINT = 'https://www.jarvisweb.lt/t/e';

export const t = {
  call: 'Skambinti',
  sms: 'Parašyti SMS',
  leave: 'Palikti numerį',
  navServices: 'Paslaugos',
  navContact: 'Kontaktai',
  servicesLabel: 'Paslaugos',
  servicesTitle: 'Ką atliekame',
  formLabel: 'Užklausa',
  formTitle: 'Palikite numerį, perskambinsiu',
  formLead: 'Įrašykite telefono numerį ir, jei norite, trumpai aprašykite problemą. Katilo ekrano ar gedimo nuotrauką galite pridėti žemiau.',
  name: 'Vardas',
  phoneField: 'Telefono numeris',
  message: 'Kas atsitiko arba ką norite įrengti?',
  files: 'Nuotraukos arba failai (nebūtina)',
  filesHint: 'Iki 8 failų, kiekvienas iki 10 MB, iš viso iki 25 MB. Nuotraukos, PDF, Word, Excel, TXT.',
  submit: 'Palikti numerį',
  sending: 'Siunčiama…',
  thanksTitle: 'Ačiū, užklausa gauta',
  thanksText: 'Susisieksime Jūsų nurodytu numeriu.',
  errorLead: 'Paskambinkite tiesiai:',
  worksLabel: 'Darbai',
  worksTitle: 'Atlikti darbai',
  aboutLabel: 'Apie mus',
  areasLabel: 'Vietovės',
  areasTitle: 'Kur dirbame',
  reviewsLabel: 'Klientų žodis',
  faqLabel: 'D.U.K.',
  faqTitle: 'Dažniausi klausimai',
  contactLabel: 'Kontaktai',
  contactTitle: 'Skambinkite arba parašykite',
  hours: 'Darbo laikas',
  email: 'El. paštas',
  areas: 'Vietovės',
  phone: 'Telefonas',
  privacy: 'Privatumo politika',
  inert: 'Tai peržiūra: forma dar niekur nesiunčia.',
  by: 'Svetainę sukūrė',
};

/* One neutral line per known service: what the work is, not what is included. */
const SERVICE_TEXT: { match: RegExp; text: string }[] = [
  { match: /katil\p{L}* (?:montav|keitim|įrengim)|montav\p{L}* katil|katil\p{L}* įrengim/iu, text: 'Naujo katilo parinkimas, įrengimas ir pajungimas prie šildymo sistemos.' },
  { match: /remont/iu, text: 'Gedimo paieška ir remontas.' },
  { match: /aptarnav|profilakt|priežiūr/iu, text: 'Planinė apžiūra ir priežiūra.' },
  { match: /šilumos siurbl|siurbl/iu, text: 'Šilumos siurblių parinkimas, įrengimas ir priežiūra.' },
  { match: /grindin/iu, text: 'Vandeninio grindinio šildymo įrengimas.' },
  { match: /radiator|vamzd/iu, text: 'Radiatorių keitimas, pajungimas ir vamzdynų darbai.' },
  { match: /katilin/iu, text: 'Katilinės įrengimas ir atnaujinimas.' },
  { match: /kamin|dūmtrauk|kaminkrėt/iu, text: 'Kaminų ir dūmtraukių valymas bei patikra.' },
  { match: /židin|krosn/iu, text: 'Židinių ir krosnelių įrengimas.' },
];

export function serviceList(data: SiteData): { name: string; text: string }[] {
  return data.services.map((s): { name: string; text: string } => {
    const item: SiteService = typeof s === 'string' ? { name: s } : s;
    return { name: item.name, text: item.text ?? SERVICE_TEXT.find((r) => r.match.test(item.name))?.text ?? '' };
  });
}

/** Kaunas → Kaune. null when the form is not a single known-pattern word. */
export function inCity(city: string): string | null {
  const w = city.trim();
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
  return text.split(/\n|;|(?<=\.)\s+/u).map((s) => s.trim().replace(/\.$/u, '')).filter(Boolean).slice(0, 4);
}

const lowerFirst = (s: string) => s.charAt(0).toLocaleLowerCase('lt') + s.slice(1);
export const joinList = (items: string[]) => items.join(', ');

export function headline(data: SiteData): string {
  if (data.tagline) return data.tagline;
  const loc = inCity(data.city);
  return loc ? `Šildymo sistemos ${loc}` : 'Šildymo sistemų paslaugos';
}

export function lead(data: SiteData): string {
  const names = serviceList(data).map((s) => s.name).slice(0, 3);
  return `${data.business}. ${names.map((n, i) => (i ? lowerFirst(n) : n)).join(', ')}.`;
}

export function aboutText(data: SiteData): string {
  return data.about || `${data.business} atlieka šildymo darbus: ${joinList(data.areas)}. Skambinkite arba palikite numerį formoje, ir susisieksime.`;
}

export function pageTitle(data: SiteData): string {
  const loc = inCity(data.city);
  return `${data.business} – šildymo sistemos${loc ? ` ${loc}` : ''}`;
}

export function pageDescription(data: SiteData): string {
  const names = serviceList(data).map((s) => lowerFirst(s.name)).slice(0, 4);
  return `${data.business}: ${joinList(names)}. ${joinList(data.areas.slice(0, 3))}. Tel. ${data.phone}.`.slice(0, 300);
}

export function faqList(data: SiteData, sms: boolean): { q: string; a: string }[] {
  const names = serviceList(data).map((s) => s.name);
  const brands = data.brands?.length ? ` Dirbame su markėmis: ${joinList(data.brands)}.` : '';
  const channels = sms ? `paskambinkite ${data.phone}, parašykite SMS` : `paskambinkite ${data.phone}`;
  return [
    { q: 'Kokias paslaugas teikiate?', a: `${joinList(names)}.${brands}` },
    { q: 'Kur dirbate?', a: `${joinList(data.areas)}. Nesate tikri, ar atvykstame pas Jus? Paskambinkite arba palikite numerį.` },
    { q: 'Ką pasakyti skambinant dėl gedimo?', a: 'Pasakykite, kur esate, kokia katilo markė ir modelis, ką rodo ekranas (klaidos kodas) ir ar veikia karštas vanduo. Formoje galite pridėti nuotrauką.' },
    { q: 'Kaip palikti užklausą?', a: `${channels[0].toLocaleUpperCase('lt')}${channels.slice(1)} arba palikite numerį formoje, ir perskambinsime.` },
    { q: 'Ką daryti, jei užuodžiu dujas?', a: 'Neįjunkite ir neišjunkite elektros prietaisų, atidarykite langus, išeikite į lauką ir skambinkite bendruoju pagalbos numeriu 112.' },
    { q: 'Kiek kainuos darbas?', a: 'Kaina priklauso nuo sistemos ir darbo apimties. Paskambinkite arba palikite numerį, ir aptarsime Jūsų atvejį.' },
    ...(data.faq ?? []),
  ];
}

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

/** schema.org LocalBusiness JSON-LD (live sites only). Facts from the data, nothing else. */
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
    description: pageDescription(data),
    address: { '@type': 'PostalAddress', addressLocality: data.city, addressCountry: 'LT', ...(data.legal?.address ? { streetAddress: data.legal.address } : {}) },
    areaServed: data.areas.map((name) => ({ '@type': 'City', name })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Paslaugos',
      itemListElement: serviceList(data).map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, ...(s.text ? { description: s.text } : {}) } })),
    },
  };
}
