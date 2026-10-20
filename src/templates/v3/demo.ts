/* v3 content of the labelled "Pavyzdys" heating demo (Šilumos ratas, fictional).
   Same business facts as templates/heating/demo.ts; adds the theme card and the
   v3 sections. Photos are the 2026-10-15 DI illustrations (heating/assets/PROVENANCE.md):
   allowed here as generic pictures; on client sites the gallery is real work only. */
import { demo as base } from '../heating/demo';
import type { IconName } from './icons';
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
  logo: { shape: 'round', ring: 'Kaunas · šildymas', line: 'Šildymo meistrai · Kaunas' },
};

export const site = {
  ...base,
  h1: { lead: 'Katilų remontas ir', hot: 'šildymas', tail: 'Kaune' },
  heroLead: 'Dujinių katilų remontas, metinė priežiūra, katilų keitimas ir šilumos siurbliai. Kainą pasakome prieš atvykstant.',
  heroChecks: ['Kaina – prieš darbus', 'Bosch, Vaillant, Viessmann ir kt.', 'Kaunas ir Kauno rajonas'],
  trust: [
    { icon: 'team', title: 'Du meistrai', text: 'iš Kauno' },
    { icon: 'tag', title: 'Kaina iš anksto', text: 'prieš atvykstant' },
    { icon: 'verified', title: '5 markės', text: 'Bosch, Vaillant ir kt.' },
    { icon: 'pin', title: 'Kaunas', text: 'ir Kauno rajonas' },
    { icon: 'clock', title: 'I–V 8–18', text: 'sezonu ir šeštadieniais' },
  ] satisfies { icon: IconName; title: string; text: string }[],
  aboutTitle: 'Du meistrai, kurie atvažiuoja patys',
  aboutChecks: [
    'Prieš darbus pasakome kainą, po darbų paaiškiname, ką padarėme.',
    'Detales atsivežame arba užsakome patys, Jums nereikia jų ieškoti.',
    'Po remonto paleidžiame sistemą ir patikriname, ar viskas veikia.',
  ],
  tiles: [
    { name: 'Katilų remontas ir priežiūra', text: 'Gedimai, klaidų kodai, metinė apžiūra', img: IMG.service },
    { name: 'Katilų keitimas', text: 'Parinkimas, išmontavimas, aprišimas', img: IMG.installed },
    { name: 'Šilumos siurbliai', text: 'Oras–vanduo įrengimas ir priežiūra', img: IMG.room },
    { name: 'Grindinis šildymas', text: 'Kontūrai, kolektoriai, balansavimas', img: IMG.underfloor },
    { name: 'Radiatoriai ir vamzdynai', text: 'Keitimas, plovimas, nuorinimas', img: IMG.radiator },
  ],
  steps: [
    { icon: 'camera', title: 'Paskambinate arba atsiunčiate nuotrauką', text: 'Trumpai parašykite, kas atsitiko. Katilo ar klaidos ekrano nuotrauka padeda įvertinti iš karto.' },
    { icon: 'tag', title: 'Pasakome kainą prieš atvykstant', text: 'Įvertiname darbą ir pasakome kainą ar jos ribas. Jokių staigmenų sąskaitoje.' },
    { icon: 'calendar', title: 'Suderiname laiką ir dalis', text: 'Atvykstame sutartu laiku. Reikalingas dalis atsivežame arba užsakome patys.' },
    { icon: 'wrench', title: 'Atliekame darbą ir išbandome', text: 'Paleidžiame sistemą, patikriname slėgį ir degimą, parodome, kas padaryta.' },
    { icon: 'wallet', title: 'Atsiskaitote po darbo', text: 'Mokate už atliktą ir suderintą darbą. Papildomus darbus pirma aptariame su Jumis.' },
  ] satisfies { icon: IconName; title: string; text: string }[],
  gallery: [IMG.room, IMG.installed, IMG.underfloor, IMG.radiator, IMG.service],
  faq: [
    { q: 'Kiek kainuoja iškvietimas?', a: 'Iškvietimas ir gedimo diagnostika Kaune – nuo 40 €. Tikslią remonto kainą pasakome nustatę gedimą, prieš pradėdami darbą.' },
    { q: 'Kokių markių katilus taisote?', a: 'Bosch, Vaillant, Viessmann, Baxi ir Protherm. Kitos markės? Parašykite modelį arba atsiųskite duomenų lentelės nuotrauką.' },
    { q: 'Ką pasakyti skambinant dėl gedimo?', a: 'Kur esate, kokia katilo markė ir modelis, ką rodo ekranas (klaidos kodas) ir ar veikia karštas vanduo.' },
    { q: 'Ar atvykstate į Kauno rajoną?', a: 'Taip: Garliava, Akademija, Raudondvaris, Karmėlava ir kitos vietovės aplink Kauną. Nesate tikri? Paskambinkite.' },
    { q: 'Kada daryti metinę katilo priežiūrą?', a: 'Prieš šildymo sezoną, rugpjūtį–spalį. Tada lengviau suderinti laiką ir katilas nesustos per pirmus šalčius.' },
    { q: 'Ką daryti, jei užuodžiu dujas?', a: 'Nejunkite ir neišjunkite elektros prietaisų, neuždekite ugnies, atidarykite langus, išeikite į lauką ir skambinkite ESO dujų avarinei tarnybai 1804 arba 112.' },
  ],
  ctaTitle: 'Sugedo katilas? Paskambinkite dabar.',
  ctaText: 'Pasakysime, kas galėjo atsitikti, ir kainą – dar prieš atvykstant.',
};
export type V3Site = typeof site;
