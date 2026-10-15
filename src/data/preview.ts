/* Preview sites (funnel spec §8). One template, filled either from a
   previews/<slug>.json file written by `npm run preview -- <input.json>` or
   from the demo below (/pavyzdys/sildymas). Everything shown on a preview comes
   from this data; nothing is fetched at runtime. */

export interface PreviewPhoto {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

/** Shape of previews/<slug>.json (see scripts/preview/README.md). */
export interface PreviewData {
  slug: string;
  business: string;
  phone: string;
  city: string;
  areas: string[];
  services: string[];
  standout?: string;
  tagline?: string;
  about?: string;
  email?: string;
  photos: PreviewPhoto[];
}

/* Heating (code prefix `p`). One plain line per known service; unknown
   services render without a line. Terms: heating trade primer §1, §8. */
const SERVICE_INFO: { match: RegExp; icon: IconName; text: string }[] = [
  { match: /katil\p{L}* (?:montav|keitim)|montav\p{L}* katil/iu, icon: 'flame', text: 'Parenkame ir sumontuojame dujinius, kietojo kuro, granulinius ir elektrinius katilus. Paleidžiame ir suderiname.' },
  { match: /remont/iu, icon: 'wrench', text: 'Atvykstame, randame gedimą ir sutaisome. Prieš darbą pasakome kainą.' },
  { match: /aptarnav|profilakt/iu, icon: 'check', text: 'Kasmetinė katilo profilaktika: išvalome, patikriname ir suderiname, kad žiemą nesustotų.' },
  { match: /šilumos siurbl|siurbl/iu, icon: 'fan', text: 'Oras–vanduo ir žemė–vanduo šilumos siurbliai: parinkimas, montavimas ir priežiūra.' },
  { match: /grindin/iu, icon: 'waves', text: 'Vandeninis grindinis šildymas: kolektoriai, kontūrai, slėgio bandymas ir balansavimas.' },
  { match: /radiator|vamzd/iu, icon: 'radiator', text: 'Radiatorių keitimas ir pajungimas, vamzdynų montavimas, sistemos plovimas ir nuorinimas.' },
  { match: /katilin/iu, icon: 'gauge', text: 'Visa katilinė: katilas, talpos, siurbliai, vožtuvai ir valdymas. Darbų apimtį sutariame raštu.' },
  { match: /kamin|dūmtrauk/iu, icon: 'chimney', text: 'Kaminų valymas ir patikra, įdėklų montavimas, traukos problemų sprendimas.' },
  { match: /židin|krosn/iu, icon: 'fire', text: 'Židinių ir krosnelių montavimas, pajungimas prie kamino ir priežiūra.' },
];

export type IconName = 'flame' | 'wrench' | 'check' | 'fan' | 'waves' | 'radiator' | 'gauge' | 'chimney' | 'fire' | 'phone' | 'pin' | 'star';

export function serviceInfo(name: string) {
  return SERVICE_INFO.find((s) => s.match.test(name)) ?? { icon: 'wrench' as IconName, text: '' };
}

/** Standout text → short bullets (one per line, `;` or sentence). */
export function standoutPoints(text = ''): string[] {
  return text
    .split(/\n|;|(?<=\.)\s+/u)
    .map((s) => s.trim().replace(/\.$/u, ''))
    .filter(Boolean)
    .slice(0, 4);
}

export const TRADE_DEFAULTS = {
  tagline: 'Šildymo sistemų montavimas, remontas ir priežiūra',
  about:
    'Dirbame su šildymo sistemomis privačiuose namuose ir butuose. Prieš darbą atvykstame, įvertiname ir aiškiai pasakome kainą. Po darbų paliekame tvarką ir paaiškiname, kaip prižiūrėti sistemą.',
  steps: [
    { title: 'Paskambinate arba parašote', text: 'Trumpai papasakojate, kas neveikia arba ką norite įrengti.' },
    { title: 'Atvykstame ir įvertiname', text: 'Apžiūrime sistemą ir pasakome kainą prieš pradedant darbus.' },
    { title: 'Atliekame darbus', text: 'Sumontuojame arba sutaisome, paleidžiame ir paliekame tvarką.' },
  ],
};

/* Demo heating business for /pavyzdys/sildymas. Invented name and number:
   the phone is shown but never dialled (preview links are inert). */
export const demo: PreviewData = {
  slug: 'sildymas',
  business: 'Šilumos ratas',
  phone: '+370 600 00000',
  city: 'Kaunas',
  areas: ['Kaunas', 'Kauno r.', 'Jonava', 'Kėdainiai', 'Garliava'],
  services: [
    'Katilų montavimas',
    'Katilų remontas',
    'Katilų aptarnavimas',
    'Šilumos siurbliai',
    'Grindinis šildymas',
    'Radiatoriai ir vamzdynai',
  ],
  standout: '12 metų patirtis\nGarantija darbams 2 metai\nSkubūs iškvietimai šildymo sezonu\nDirbame su Bosch, Vaillant ir Viessmann',
  photos: [],
};

export const previewText = {
  banner: 'Peržiūra',
  bannerNote: 'Svetainės juodraštis, paruoštas jarvisweb.lt',
  bannerCta: 'Parašyti Matui',
  call: 'Skambinti',
  ask: 'Gauti pasiūlymą',
  servicesTitle: 'Paslaugos',
  whyTitle: 'Kodėl renkasi mus',
  galleryTitle: 'Atlikti darbai',
  galleryEmpty: 'Čia bus Jūsų darbų nuotraukos.',
  areasTitle: 'Kur dirbame',
  areasText: 'Atvykstame į šias vietoves ir aplinkines gyvenvietes.',
  stepsTitle: 'Kaip dirbame',
  aboutTitle: 'Apie mus',
  contactTitle: 'Susisiekite',
  contactText: 'Parašykite, kas neveikia arba ką norite įrengti. Atsakysime tą pačią darbo dieną.',
  form: { name: 'Vardas', phone: 'Telefono numeris', message: 'Kas atsitiko arba ką norite įrengti?', submit: 'Siųsti užklausą' },
  inert: 'Tai peržiūra: forma dar niekur nesiunčia.',
  footer: 'Svetainę sukūrė jarvisweb.lt',
};
