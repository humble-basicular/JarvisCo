/* Labelled "Pavyzdys" demo (/pavyzdys/sildymas). The only place invented values
   are allowed: the business, number and facts are fictional. */
import type { SiteData } from './types';

export const demo: SiteData = {
  slug: 'sildymas',
  demo: true,
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
  brands: ['Bosch', 'Vaillant', 'Viessmann'],
  hours: 'I–V 8:00–18:00, šildymo sezonu ir šeštadieniais',
  email: 'info@pavyzdys.example',
  photos: [],
};
