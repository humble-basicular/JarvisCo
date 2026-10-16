/* Reads the build input written by scripts/client-site.mjs (path in env). */
import { readFileSync } from 'node:fs';
import type { Direction, LiveSite, SiteData } from '../types';

export interface ClientBuild { data: SiteData; site: LiveSite; }

export function loadBuild(): ClientBuild {
  const file = process.env.CLIENT_SITE_BUILD;
  if (!file) throw new Error('CLIENT_SITE_BUILD is not set: build client sites with scripts/client-site.mjs');
  return JSON.parse(readFileSync(file, 'utf8')) as ClientBuild;
}

/** Design direction for generated sites while A and B are under review:
 *  HEATING_DIRECTION=b builds B; anything else (or unset) builds the default A. */
export const direction = (): Direction => (process.env.HEATING_DIRECTION === 'b' ? 'b' : 'a');
