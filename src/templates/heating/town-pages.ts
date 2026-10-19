/* Town (GEO) pages for real businesses: previews (/perziura/<slug>/<vietove>) and client sites
   (/<vietove>/). Built only from the input's `towns` (scripts/preview/README.md): a town gets a page
   only when it has its own `text`, so no page is the home page with a swapped name. No demo import
   here (towns.ts pulls in the demo illustrations). */
import { inCity } from './content';
import type { SiteData, SiteTown, TownLink, TownPage } from './types';

const locOf = (town: SiteTown) => town.loc ?? inCity(town.name) ?? town.name;

/** Towns that have a page. */
export const pagedTowns = (data: SiteData) => (data.towns ?? []).filter((t) => t.text);

/** Links for the home page tiles and the footer; `base` is '' (client site) or '/perziura/<slug>'. */
export function siteTownLinks(data: SiteData, base: string): TownLink[] | undefined {
  const towns = pagedTowns(data);
  if (!towns.length) return undefined;
  return towns.map((t) => ({
    slug: t.slug,
    name: t.name,
    loc: locOf(t),
    href: base ? `${base}/${t.slug}` : `/${t.slug}/`,
    places: t.places ?? [],
    blurb: t.distance ?? (t.places?.length ? `${t.places.slice(0, 4).join(', ')}.` : undefined),
  }));
}

/** The business data re-pointed at one town (same services, photos and look) + the town block. */
export function siteTownPage(data: SiteData, slug: string): { town: TownPage; data: SiteData; source: SiteTown } {
  const source = pagedTowns(data).find((t) => t.slug === slug);
  if (!source) throw new Error(`Unknown town: ${slug}`);
  const loc = locOf(source);
  const town: TownPage = {
    name: source.name,
    loc,
    label: `Darbai ${loc}`,
    heading: source.heading ?? `${source.name} ir apylinkės`,
    text: source.text!,
    distance: source.distance,
    note: source.note,
    places: source.places ?? [],
    services: source.services,
  };
  const page: SiteData = {
    ...data,
    city: source.name,
    areas: [source.name, ...(source.places ?? []).filter((p) => p !== source.name)],
    tagline: source.tagline,
    lead: source.lead,
    faq: source.faq ?? data.faq,
  };
  return { town, data: page, source };
}
