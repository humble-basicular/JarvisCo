/* Data and runtime types for the heating template. One SiteData object (the
   previews/<slug>.json shape, see scripts/preview/README.md) fills both the
   preview page and the live client site. Every optional field drives one
   section: absent data → the section is not rendered (nothing is invented). */

export interface SitePhoto { src: string; width: number; height: number; alt?: string; srcset?: string }
export interface SiteService { name: string; text?: string }
/** Only rendered when real quotes are in the input (never invented). */
export interface SiteReview { text: string; name: string; place?: string; source?: string; url?: string; date?: string }
/** One row of the price/terms table, e.g. {name: 'Iškvietimas Kaune', price: 'nuo 40 €'}. */
export interface SitePrice { name: string; price: string; note?: string }

/** The client's logo mark (square SVG/PNG, read on a light background). Replaces the
 *  initials circle; `line` is a short descriptor set under the name in the header. */
export interface SiteLogo { src: string; line?: string }

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
  /** Permissions, attestations, manufacturer training: exactly as the client states them. */
  qualifications?: string[];
  /** Visit / diagnostic / service prices the client gave. */
  prices?: SitePrice[];
  /** One line under the price table, e.g. what is agreed separately. */
  priceNote?: string;
  /** #rrggbb brand colour; the template picks white or ink text on it (accent.ts). */
  accent?: string;
  logo?: SiteLogo;
  /** Towns with their own page (/perziura/<slug>/<vietove>, /<vietove>/ on client sites). */
  towns?: SiteTown[];
  reviews?: SiteReview[];
  faq?: { q: string; a: string }[];
  legal?: { name?: string; code?: string; address?: string };
  photos: SitePhoto[];
  /** Overrides the generated hero lead (demo town pages). */
  lead?: string;
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

/** A town from the input (PreviewInput `towns`). Only towns with their own `text` get a page;
 *  every word on that page comes from these fields or the business data, never a swapped-name template. */
export interface SiteTown {
  name: string;
  /** URL part, ASCII ("Kėdainiai" → "kedainiai"). */
  slug: string;
  /** Locative ("Jonavoje"); derived from the name when absent. */
  loc?: string;
  /** Town-specific copy: what is typical there, how the trip works. */
  text?: string;
  heading?: string;
  tagline?: string;
  lead?: string;
  /** Distance / travel note, e.g. "Apie 30 km nuo Kauno". */
  distance?: string;
  note?: string;
  /** Nearby places named on the page. */
  places?: string[];
  /** Services typical in this town (names as on the site). */
  services?: string[];
  faq?: { q: string; a: string }[];
}

/** Town (GEO) page content, rendered by parts/Town.astro (demo and real towns). */
export interface TownPage {
  name: string;
  /** Locative: "Jonavoje". */
  loc: string;
  heading: string;
  /** Small label above the heading; default "Šildymas <loc>" (demo wording). */
  label?: string;
  distance?: string;
  arrival?: string;
  text: string;
  note?: string;
  /** Nearby places the page names; the Details areas panel lists them. */
  places: string[];
  /** Services typical in the town, shown as a list. */
  services?: string[];
}
export interface TownLink { slug: string; name: string; loc: string; href: string; places: string[]; /** Tile text; default: the first places. */ blurb?: string }
