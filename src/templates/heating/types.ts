/* Data and runtime types for the heating template. One SiteData object (the
   previews/<slug>.json shape, see scripts/preview/README.md) fills both the
   preview page and the live client site. */

export interface SitePhoto { src: string; width: number; height: number; alt?: string }
export interface SiteService { name: string; text?: string }
/** Only rendered when real quotes are in the input (never invented). */
export interface SiteReview { text: string; name: string; place?: string }

export interface SiteData {
  slug: string;
  business: string;
  phone: string;
  city: string;
  areas: string[];
  /** A plain name, or {name, text} to override the generic description. */
  services: (string | SiteService)[];
  standout?: string;
  tagline?: string;
  about?: string;
  email?: string;
  hours?: string;
  brands?: string[];
  /** #rrggbb, white text on it must reach 4.5:1 (checked by the generator). */
  accent?: string;
  reviews?: SiteReview[];
  faq?: { q: string; a: string }[];
  legal?: { name?: string; code?: string; address?: string };
  photos: SitePhoto[];
  /** Marks the labelled "Pavyzdys" demo; the only place invented values are allowed. */
  demo?: boolean;
}

/** Live client site wiring (offer-v2 spec §2, §3). Absent in previews. */
export interface LiveSite {
  code: string;
  domain: string;
  formEndpoint: string;
  beaconEndpoint: string;
  /** Built against a local stub: never deploy. */
  testBuild?: boolean;
}

export type Mode = 'preview' | 'live';

export interface Banner { tag: string; note: string; href: string; label: string }
