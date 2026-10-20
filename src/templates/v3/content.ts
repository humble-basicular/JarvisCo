/* Template v3 content: the `v3` block of previews/<slug>.json (validated by
   scripts/preview/normalize.mjs, shape in scripts/preview/README.md) and the
   helpers that turn SiteData + v3 into what V3Site renders. A new client = one
   input JSON (business facts + this block); no template code changes. */
import type { IconName } from './icons';
import type { Theme } from './theme';
import type { SitePhoto } from '../heating/types';

export interface V3Item { icon: IconName; title: string; text: string }
export type V3LinkKind = 'google' | 'facebook' | 'paslaugos';

export interface V3Input {
  theme: Theme;
  /** H1 = lead + accent word + tail; on town pages the tail becomes the town ("Pasvalyje"). */
  h1: { lead: string; hot: string; tail?: string };
  /** Small line above the H1; default: the first areas. */
  pill?: string;
  heroChecks: string[];
  trust: V3Item[];
  aboutTitle: string;
  aboutChecks?: string[];
  /** Dark pill on the about photo. */
  stamp?: { title: string; text: string };
  quoteSub?: string;
  formHint?: string;
  attachLabel?: string;
  /** `tiles` layout: photo index (0-based) per service, same order as `services`. */
  tilePhotos?: number[];
  steps: V3Item[];
  stepsTitle?: string;
  galleryNote?: string;
  promise?: { title: string; text: string };
  areasTitle?: string;
  areasText?: string;
  /** Second line of each town card: "<townLabel> <loc>". */
  townLabel?: string;
  /** Where the business is based, shown in the top bar and footer. */
  baseLine?: string;
  links?: { kind: V3LinkKind; url?: string }[];
  ctaTitle: string;
  ctaText: string;
  /** Photo indexes (0-based) for the fixed photo slots. */
  photo?: { hero?: number; pins?: number[]; about?: number; faq?: number; cta?: number };
}

/** Photos as V3Site uses them (previews have no srcset). */
export type V3Photo = SitePhoto & { srcset?: string };

/** Card icon from the service name (cards layout). First match wins; fallback wrench. */
const SERVICE_ICON: [RegExp, IconName][] = [
  [/grindin/i, 'floor'],
  [/siurbl|geoterm/i, 'pump'],
  [/radiator|boiler|gyvatuk/i, 'radiator'],
  [/vėdin|vedin|rekuperac|kondicion/i, 'fan'],
  [/skalbim|indaplov|buitin|džiovykl/i, 'washer'],
  [/vanden|kanaliz|santechn|vamzd/i, 'drop'],
  [/šildym|katil|kuro|dūmtrauk/i, 'flame'],
];
export const serviceIcon = (name: string): IconName => SERVICE_ICON.find(([re]) => re.test(name))?.[1] ?? 'wrench';

/** Gallery: big photo + rows of 4 (desktop) / 2 (mobile), so no row is left half empty. */
export const galleryPhotos = <T>(photos: T[]): T[] => photos.slice(0, photos.length < 5 ? photos.length : 1 + Math.floor((photos.length - 1) / 4) * 4);

export const LINK_LABEL: Record<V3LinkKind, string> = { google: 'Google Maps', facebook: 'Facebook', paslaugos: 'Paslaugos.lt' };
export const LINK_ICON: Record<V3LinkKind, IconName> = { google: 'pin', facebook: 'facebook', paslaugos: 'verified' };

/* Approximate town centres (lat, lon) for the area map. Add a town here when a client needs it. */
const GEO: Record<string, [number, number]> = {
  Vilnius: [54.687, 25.28], Kaunas: [54.898, 23.904], Klaipėda: [55.703, 21.144], Šiauliai: [55.934, 23.314],
  Panevėžys: [55.734, 24.357], Alytus: [54.397, 24.032], Marijampolė: [54.559, 23.354], Mažeikiai: [56.309, 22.341],
  Jonava: [55.083, 24.28], Utena: [55.497, 25.6], Kėdainiai: [55.288, 23.974], Telšiai: [55.981, 22.247],
  Tauragė: [55.252, 22.29], Ukmergė: [55.245, 24.776], Visaginas: [55.598, 26.438], Plungė: [55.912, 21.844],
  Kretinga: [55.889, 21.242], Palanga: [55.918, 21.068], Radviliškis: [55.811, 23.546], Druskininkai: [54.017, 23.97],
  Rokiškis: [55.962, 25.586], Biržai: [56.201, 24.756], Gargždai: [55.712, 21.401], Elektrėnai: [54.786, 24.661],
  Jurbarkas: [55.078, 22.765], Garliava: [54.817, 23.872], Vilkaviškis: [54.651, 23.035], Raseiniai: [55.381, 23.116],
  Anykščiai: [55.526, 25.103], Prienai: [54.633, 23.946], Joniškis: [56.24, 23.616], Kelmė: [55.631, 22.932],
  Varėna: [54.221, 24.578], Kaišiadorys: [54.866, 24.453], Pasvalys: [56.062, 24.4], Kupiškis: [55.84, 24.98],
  Zarasai: [55.731, 26.247], Trakai: [54.638, 24.934], Širvintos: [55.044, 24.957], Molėtai: [55.233, 25.418],
  Šilutė: [55.349, 21.483], Ignalina: [55.34, 26.162], Pakruojis: [55.976, 23.856], Šakiai: [54.954, 23.048],
  Birštonas: [54.606, 24.031], 'Kazlų Rūda': [54.749, 23.49], Skuodas: [56.27, 21.528], Švenčionys: [55.131, 26.159],
};

export interface MapPin { name: string; x: number; y: number; base: boolean; current: boolean }
export interface AreaMap { pins: MapPin[]; rings: { r: number; km: number }[]; base: { x: number; y: number }; zoom: number; query: string }

/** Pins for the base city and every town with a page, projected to a 500×400 box (true proportions). */
export function areaMap(baseName: string, towns: string[], current?: string): AreaMap | null {
  const base = GEO[baseName];
  if (!base) return null;
  const known = [baseName, ...towns.filter((t) => t !== baseName && GEO[t])];
  const k = Math.cos((base[0] * Math.PI) / 180);
  const pts = known.map((n) => ({ n, x: (GEO[n][1] - base[1]) * k * 111.3, y: -(GEO[n][0] - base[0]) * 111.3 })); // km from base
  const maxKm = Math.max(25, ...pts.map((p) => Math.hypot(p.x, p.y)));
  const scale = 165 / maxKm; // the farthest town sits ~165 units from the base
  const cx = 250 - ((Math.max(...pts.map((p) => p.x)) + Math.min(...pts.map((p) => p.x))) / 2) * scale;
  const cy = 205 - ((Math.max(...pts.map((p) => p.y)) + Math.min(...pts.map((p) => p.y))) / 2) * scale;
  const step = maxKm > 120 ? 50 : maxKm > 50 ? 25 : 10;
  const rings = Array.from({ length: Math.ceil(maxKm / step) }, (_, i) => ({ km: (i + 1) * step, r: (i + 1) * step * scale }));
  return {
    pins: pts.map((p) => ({ name: p.n, x: Math.round(cx + p.x * scale), y: Math.round(cy + p.y * scale), base: p.n === baseName, current: p.n === current })),
    rings,
    base: { x: Math.round(cx), y: Math.round(cy) },
    zoom: maxKm > 70 ? 8 : maxKm > 30 ? 9 : 10,
    query: `${baseName}, Lietuva`,
  };
}
