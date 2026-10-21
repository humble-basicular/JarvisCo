/* v3 content of the labelled "Pavyzdys" heating demo (Šilumos ratas, fictional).
   Same business facts as templates/heating/demo.ts, in the same shape a real client
   has in previews/<slug>.json: SiteData + the `v3` block. Photos are the 2026-10-15 DI illustrations (heating/assets/PROVENANCE.md):
   allowed here as generic pictures; on client sites the gallery is real work only. */
import { demo as base } from '../heating/demo';
import type { V3Input } from './content';
import type { Theme } from './theme';
import installed from '../heating/assets/demo-boiler-installed-1536.webp?url';
import installedMid from '../heating/assets/demo-boiler-installed-1024.webp?url';
import installedSmall from '../heating/assets/demo-boiler-installed-768.webp?url';
import service from '../heating/assets/demo-boiler-service-1280.webp?url';
import serviceSmall from '../heating/assets/demo-boiler-service-768.webp?url';
import radiator from '../heating/assets/demo-radiator-1280.webp?url';
import radiatorSmall from '../heating/assets/demo-radiator-768.webp?url';
import underfloor from '../heating/assets/demo-underfloor-1280.webp?url';
import underfloorSmall from '../heating/assets/demo-underfloor-768.webp?url';
import room from '../heating/assets/demo-boiler-room-1280.webp?url';
import roomSmall from '../heating/assets/demo-boiler-room-768.webp?url';

export interface Img { src: string; srcset: string; width: number; height: number; alt: string }
const img = (src: string, small: string, width: number, height: number, alt: string, mid?: string): Img => ({
  src, width, height, alt,
  srcset: mid ? `${small} 768w, ${mid} 1024w, ${src} ${width}w` : `${small} 768w, ${src} ${width}w`,
});

export const IMG = {
  installed: img(installed, installedSmall, 1536, 1024, 'Sieninis dujinis katilas su variniais vamzdžiais', installedMid),
  service: img(service, serviceSmall, 1280, 853, 'Katilo priežiūros įrankiai'),
  radiator: img(radiator, radiatorSmall, 1254, 1254, 'Radiatorius gyvenamajame kambaryje'),
  underfloor: img(underfloor, underfloorSmall, 1280, 853, 'Grindinio šildymo vamzdžiai'),
  room: img(room, roomSmall, 1254, 1254, 'Namo katilinė su katilu, siurbliu ir kolektoriumi'),
};

/** Theme card: Heat archetype (design plan, first cards). Deliberately unlike the Nerijus card. */
export const theme: Theme = {
  archetype: 'heat',
  base: '#17181b',
  base2: '#24262a',
  accent: '#c43c0c',
  accentHi: '#ff7a3d',
  paper: '#f4f1ec',
  heading: 'archivo-black',
  divider: 'angle',
  hero: 'photo',
  services: 'tiles',
  logo: { shape: 'round', glyph: 'flame', ring: 'Kaunas · šildymas', line: 'Šildymo meistrai · Kaunas' },
};

/* Photo order: 0 room, 1 installed, 2 underfloor, 3 radiator, 4 service (gallery order). */
export const site = {
  ...base,
  lead: 'Dujinių katilų remontas, metinė priežiūra, katilų keitimas ir šilumos siurbliai. Kainą pasakome prieš atvykstant.',
  services: [
    { name: 'Katilų remontas ir priežiūra', text: 'Gedimai, klaidų kodai, metinė apžiūra' },
    { name: 'Katilų keitimas', text: 'Parinkimas, išmontavimas, aprišimas' },
    { name: 'Šilumos siurbliai', text: 'Oras–vanduo įrengimas ir priežiūra' },
    { name: 'Grindinis šildymas', text: 'Kontūrai, kolektoriai, balansavimas' },
    { name: 'Radiatoriai ir vamzdynai', text: 'Keitimas, plovimas, nuorinimas' },
  ],
  photos: [IMG.room, IMG.installed, IMG.underfloor, IMG.radiator, IMG.service],
  faq: [
    { q: 'Kiek kainuoja iškvietimas?', a: 'Iškvietimas ir gedimo diagnostika Kaune – nuo 40 €. Tikslią remonto kainą pasakome nustatę gedimą, prieš pradėdami darbą.' },
    { q: 'Kokių markių katilus taisote?', a: 'Bosch, Vaillant, Viessmann, Baxi ir Protherm. Kitos markės? Parašykite modelį arba atsiųskite duomenų lentelės nuotrauką.' },
    { q: 'Ką pasakyti skambinant dėl gedimo?', a: 'Kur esate, kokia katilo markė ir modelis, ką rodo ekranas (klaidos kodas) ir ar veikia karštas vanduo.' },
    { q: 'Ar atvykstate į Kauno rajoną?', a: 'Taip: Garliava, Akademija, Raudondvaris, Karmėlava ir kitos vietovės aplink Kauną. Nesate tikri? Paskambinkite.' },
    { q: 'Kada daryti metinę katilo priežiūrą?', a: 'Prieš šildymo sezoną, rugpjūtį–spalį. Tada lengviau suderinti laiką ir katilas nesustos per pirmus šalčius.' },
    { q: 'Ką daryti, jei užuodžiu dujas?', a: 'Nejunkite ir neišjunkite elektros prietaisų, neuždekite ugnies, atidarykite langus, išeikite į lauką ir skambinkite ESO dujų avarinei tarnybai 1804 arba 112.' },
  ],
};

export const v3: V3Input = {
  theme,
  h1: { lead: 'Katilų remontas ir', hot: 'šildymas', tail: 'Kaune' },
  pill: 'Kaunas · Garliava · Akademija · Raudondvaris',
  heroChecks: ['Kaina – prieš darbus', 'Bosch, Vaillant, Viessmann ir kt.', 'Kaunas ir Kauno rajonas'],
  trust: [
    { icon: 'team', title: 'Du meistrai', text: 'iš Kauno' },
    { icon: 'tag', title: 'Kaina iš anksto', text: 'prieš atvykstant' },
    { icon: 'verified', title: '5 markės', text: 'Bosch, Vaillant ir kt.' },
    { icon: 'pin', title: 'Kaunas', text: 'ir Kauno rajonas' },
    { icon: 'clock', title: 'I–V 8–18', text: 'sezonu ir šeštadieniais' },
  ],
  aboutTitle: 'Du meistrai, kurie atvažiuoja patys',
  aboutChecks: [
    'Prieš darbus pasakome kainą, po darbų paaiškiname, ką padarėme.',
    'Detales atsivežame arba užsakome patys, Jums nereikia jų ieškoti.',
    'Po remonto paleidžiame sistemą ir patikriname, ar viskas veikia.',
  ],
  stamp: { title: 'Šildymo meistrai', text: 'Kaunas ir Kauno r.' },
  quoteSub: 'Parašykite, kas atsitiko. Perskambinsime ir pasakysime kainą prieš atvykstant.',
  formHint: 'Pvz. Vaillant katilas rodo klaidą F28',
  tilePhotos: [4, 1, 0, 2, 3],
  steps: [
    { icon: 'camera', title: 'Paskambinate arba atsiunčiate nuotrauką', text: 'Trumpai parašykite, kas atsitiko. Katilo ar klaidos ekrano nuotrauka padeda įvertinti iš karto.' },
    { icon: 'tag', title: 'Pasakome kainą prieš atvykstant', text: 'Įvertiname darbą ir pasakome kainą ar jos ribas. Jokių staigmenų sąskaitoje.' },
    { icon: 'calendar', title: 'Suderiname laiką ir dalis', text: 'Atvykstame sutartu laiku. Reikalingas dalis atsivežame arba užsakome patys.' },
    { icon: 'wrench', title: 'Atliekame darbą ir išbandome', text: 'Paleidžiame sistemą, patikriname slėgį ir degimą, parodome, kas padaryta.' },
    { icon: 'wallet', title: 'Atsiskaitote po darbo', text: 'Mokate už atliktą ir suderintą darbą. Papildomus darbus pirma aptariame su Jumis.' },
  ],
  stepsTitle: 'Nuo skambučio iki šilto namo',
  galleryNote: 'Pavyzdyje – DI iliustracijos. Kliento svetainėje čia būna tik tikros jo darbų nuotraukos.',
  promise: { title: 'Kainą pasakome prieš darbus', text: 'Jei prireikia papildomų darbų ar detalių, pirma paskambiname ir suderiname su Jumis.' },
  areasTitle: 'Kaunas, Jonava, Kėdainiai ir aplinkui',
  areasText: 'Bazė – Kaune. Kiekvienas miestas turi savo puslapį su atvykimo laiku ir kainomis.',
  townLabel: 'Katilų remontas',
  baseLine: 'Kaunas ir Kauno rajonas',
  links: [{ kind: 'google' }, { kind: 'facebook' }, { kind: 'paslaugos' }],
  ctaTitle: 'Sugedo katilas? Paskambinkite dabar.',
  ctaText: 'Pasakysime, kas galėjo atsitikti, ir kainą – dar prieš atvykstant.',
  photo: { hero: 1, about: 0, faq: 3, cta: 2 },
};
