/* Demo-only town (GEO) pages for /pavyzdys/sildymas/<vietove>. Shows what a client gets: one
   short page per town with its own heading, service area, arrival time and questions.
   The business, arrival times and prices are invented for the labelled PAVYZDYS; place names are real. */
import { demo } from './demo';
import type { SiteData, SitePrice, TownLink, TownPage } from './types';

interface Town extends TownPage {
  slug: string;
  tagline: string;
  title: string;
  description: string;
  lead: string;
  price: SitePrice;
  faq: { q: string; a: string }[];
}

export const DEMO_PATH = '/pavyzdys/sildymas';

const TOWNS: Town[] = [
  {
    slug: 'kaunas',
    name: 'Kaunas',
    loc: 'Kaune',
    tagline: 'Katilų remontas ir šildymo sistemos Kaune',
    title: 'Katilų remontas Kaune | Šilumos ratas – pavyzdys',
    description: 'Dujinių katilų remontas, priežiūra ir keitimas Kaune: Žaliakalnyje, Šilainiuose, Dainavoje, Eiguliuose ir kituose rajonuose. Pavyzdinė šildymo meistro svetainė.',
    lead: 'Kaune esame bazėje: dujinių katilų remontas, metinė priežiūra ir katilų keitimas butuose bei namuose visuose miesto rajonuose.',
    heading: 'Kaune esame bazėje',
    distance: 'Bazė mieste',
    arrival: 'Dažniausiai tą pačią dieną',
    text: 'Meistrų dirbtuvės yra Kaune, todėl į butus ir namus miesto rajonuose atvažiuojame greičiausiai. Paskambinus ryte, dažniausiai atvykstame tą pačią dieną; vakaro skambučius perimame kitą rytą.',
    note: 'Daugiabučiuose prieš keisdami katilą ar radiatorių visada pasitikriname, ar tam reikia bendrijos sutikimo.',
    places: ['Žaliakalnis', 'Šilainiai', 'Dainava', 'Eiguliai', 'Panemunė', 'Aleksotas', 'Petrašiūnai', 'Vilijampolė'],
    price: { name: 'Iškvietimas ir gedimo diagnostika Kaune', price: 'nuo 40 €' },
    faq: [
      { q: 'Per kiek laiko atvykstate Kaune?', a: 'Kauno rajonuose paprastai atvykstame tą pačią dieną, jei paskambinate iki 15 val. Vėliau gautas užklausas aptariame kitą rytą.' },
      { q: 'Ar taisote katilus Kauno daugiabučiuose?', a: 'Taip. Daugiabučiuose taisome ir prižiūrime butų dujinius katilus; keitimo ar aprišimo darbus pirma suderiname telefonu.' },
    ],
  },
  {
    slug: 'jonava',
    name: 'Jonava',
    loc: 'Jonavoje',
    tagline: 'Katilų remontas ir šildymo sistemos Jonavoje',
    title: 'Katilų remontas Jonavoje | Šilumos ratas – pavyzdys',
    description: 'Dujinių katilų remontas ir priežiūra Jonavoje, Bukonyse, Upninkuose ir Ruklos apylinkėse. Išvykstame iš Kauno. Pavyzdinė šildymo meistro svetainė.',
    lead: 'Į Jonavą ir apylinkes važiuojame iš Kauno: dujinių katilų remontas, priežiūra ir naujų šildymo sistemų įrengimas.',
    heading: 'Į Jonavą atvykstame iš Kauno',
    distance: 'Apie 30 km nuo Kauno',
    arrival: 'Dažniausiai per 1 darbo dieną',
    text: 'Į Jonavą važiuojame iš Kauno, todėl vizitus planuojame iš anksto. Paskambinus iki vidurdienio, dažniausiai atvykstame tą pačią ar kitą darbo dieną, o iškvietimo kainą pasakome telefonu.',
    note: 'Į kaimus aplink Jonavą kelią įskaičiuojame į iškvietimą, todėl kainą pasakome prieš atvykdami.',
    places: ['Bukonys', 'Upninkai', 'Rukla', 'Žeimiai', 'Šveicarija', 'Kuigaliai'],
    price: { name: 'Iškvietimas ir gedimo diagnostika Jonavoje', price: 'nuo 50 €' },
    faq: [
      { q: 'Ar atvykstate į kaimus aplink Jonavą?', a: 'Taip: į Bukonis, Upninkus, Ruklą ir kitas apylinkes. Vietovę pasakykite skambindami, ir iškvietimo kainą suderiname iš anksto.' },
      { q: 'Kodėl Jonavoje iškvietimas kainuoja daugiau nei Kaune?', a: 'Į iškvietimo kainą įskaičiuotas kelias iš Kauno. Kitos kainos – darbo valanda ir detalės – tokios pačios kaip Kaune.' },
    ],
  },
  {
    slug: 'kedainiai',
    name: 'Kėdainiai',
    loc: 'Kėdainiuose',
    tagline: 'Katilų remontas ir šildymo sistemos Kėdainiuose',
    title: 'Katilų remontas Kėdainiuose | Šilumos ratas – pavyzdys',
    description: 'Dujinių katilų remontas, priežiūra ir keitimas Kėdainiuose, Dotnuvoje, Josvainiuose ir Šėtoje. Išvykstame iš Kauno. Pavyzdinė šildymo meistro svetainė.',
    lead: 'Į Kėdainius ir rajoną važiuojame iš Kauno pagal iš anksto suderintą laiką: katilų remontas, priežiūra ir keitimas.',
    heading: 'Į Kėdainius atvykstame iš Kauno',
    distance: 'Apie 55 km nuo Kauno',
    arrival: 'Dažniausiai per 1–2 darbo dienas',
    text: 'Kėdainių rajone dirbame sutartu laiku: kelias iš Kauno užima apie valandą, todėl kelis vizitus stengiamės sujungti į vieną dieną. Skubų gedimą aptarkite telefonu, ir pasakysime, kada realiai galime atvykti.',
    note: 'Metinę katilo priežiūrą Kėdainių rajone patogiausia planuoti prieš šildymo sezoną, kai galime sujungti keletą vizitų.',
    places: ['Dotnuva', 'Josvainiai', 'Šėta', 'Surviliškis', 'Krakės'],
    price: { name: 'Iškvietimas ir gedimo diagnostika Kėdainiuose', price: 'nuo 60 €' },
    faq: [
      { q: 'Ar atvykstate skubiai į Kėdainius?', a: 'Skubius gedimus aptariame telefonu ir pasakome realų atvykimo laiką. Kėdainiuose paprastai atvykstame per 1–2 darbo dienas.' },
      { q: 'Ar galima suplanuoti kelis darbus per vieną vizitą?', a: 'Taip. Į Kėdainių rajoną važiuojame iš Kauno, todėl katilo priežiūrą ir smulkų remontą verta suderinti per vieną atvykimą.' },
    ],
  },
];

export const townLinks = (): TownLink[] =>
  TOWNS.map((t) => ({ slug: t.slug, name: t.name, loc: t.loc, href: `${DEMO_PATH}/${t.slug}`, places: t.places }));
export const townSlugs = () => TOWNS.map((t) => t.slug);

/** The demo SiteData re-pointed at one town; shared services, photos and look. */
export function townPage(slug: string) {
  const town = TOWNS.find((t) => t.slug === slug);
  if (!town) throw new Error(`Unknown demo town: ${slug}`);
  const data: SiteData = {
    ...demo,
    city: town.name,
    areas: [town.name, ...town.places],
    tagline: town.tagline,
    lead: town.lead,
    standout: `Kainą pasakome prieš darbus\nAtvykimas ${town.loc}: ${town.arrival.toLocaleLowerCase('lt')}`,
    prices: [town.price, ...(demo.prices ?? []).filter((p) => !/^Iškvietimas/.test(p.name))],
    faq: town.faq,
  };
  return { town, data };
}
