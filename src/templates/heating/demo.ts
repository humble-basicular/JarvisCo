/* Labelled "Pavyzdys" demo (/pavyzdys/sildymas). The only place invented values
   are allowed: the business, number, prices and facts are fictional, and every
   page that shows it carries the PAVYZDYS banner. No invented reviews, even here. */
import type { SiteData } from './types';
import installed from './assets/demo-boiler-installed-1536.webp?url';
import installedMid from './assets/demo-boiler-installed-1024.webp?url';
import installedSmall from './assets/demo-boiler-installed-768.webp?url';
import service from './assets/demo-boiler-service-1280.webp?url';
import serviceSmall from './assets/demo-boiler-service-768.webp?url';
import radiator from './assets/demo-radiator-1280.webp?url';
import radiatorSmall from './assets/demo-radiator-768.webp?url';
import underfloor from './assets/demo-underfloor-1280.webp?url';
import underfloorSmall from './assets/demo-underfloor-768.webp?url';
import room from './assets/demo-boiler-room-1280.webp?url';
import roomSmall from './assets/demo-boiler-room-768.webp?url';

export const demo: SiteData = {
  slug: 'sildymas',
  demo: true,
  business: 'Šilumos ratas',
  phone: '+370 600 00000',
  city: 'Kaunas',
  areas: ['Kaunas', 'Kauno r.', 'Garliava', 'Akademija', 'Raudondvaris', 'Karmėlava'],
  services: [
    'Dujinių katilų remontas',
    'Dujinių katilų priežiūra',
    'Katilų keitimas ir montavimas',
    'Šilumos siurbliai',
    'Grindinis šildymas',
    'Radiatoriai ir vamzdynai',
  ],
  tagline: 'Šildymo sistemos Kaune ir Kauno rajone',
  standout: 'Du meistrai iš Kauno\nKainą pasakome prieš darbus',
  brands: ['Bosch', 'Vaillant', 'Viessmann', 'Baxi', 'Protherm'],
  hours: 'I–V 8:00–18:00, šildymo sezonu ir šeštadieniais',
  email: 'info@pavyzdys.example',
  about: 'Šilumos ratas – du meistrai iš Kauno. Taisome ir prižiūrime dujinius katilus, keičiame senus katilus naujais ir įrengiame šilumos siurblius. Prieš darbus pasakome kainą, po darbų paaiškiname, ką padarėme ir į ką atkreipti dėmesį.',
  prices: [
    { name: 'Iškvietimas ir gedimo diagnostika Kaune', price: 'nuo 40 €' },
    { name: 'Dujinio katilo metinė priežiūra', price: 'nuo 90 €' },
    { name: 'Katilo keitimas', price: 'po apžiūros', note: 'Kaina priklauso nuo katilo ir aprišimo' },
  ],
  priceNote: 'Tiksli remonto kaina – nustačius gedimą ir suderinus su Jumis. Detalės skaičiuojamos atskirai.',
  photos: [
    { src: installed, srcset: `${installedSmall} 768w, ${installedMid} 1024w, ${installed} 1536w`, width: 1536, height: 1024, alt: 'Sieninis katilas ir variniai vamzdžiai. DI sukurta pavyzdinė iliustracija.' },
    { src: service, srcset: `${serviceSmall} 768w, ${service} 1280w`, width: 1280, height: 853, alt: 'Katilo priežiūros įrankiai. DI iliustracija, ne atliktas darbas.' },
    { src: radiator, srcset: `${radiatorSmall} 768w, ${radiator} 1254w`, width: 1254, height: 1254, alt: 'Radiatorius gyvenamajame kambaryje. DI iliustracija, ne atliktas darbas.' },
    { src: underfloor, srcset: `${underfloorSmall} 768w, ${underfloor} 1280w`, width: 1280, height: 853, alt: 'Grindinio šildymo vamzdžiai. DI iliustracija, ne atliktas darbas.' },
    { src: room, srcset: `${roomSmall} 768w, ${room} 1254w`, width: 1254, height: 1254, alt: 'Namo katilinės įranga. DI iliustracija, ne atliktas darbas.' },
  ],
};
