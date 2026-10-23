import { readFileSync } from 'node:fs';
import type { SiteData } from '../../heating/types';
import type { V3Input, V3LiveSite } from '../content';
export function loadBuild(): { data: SiteData & { v3: V3Input }; site: V3LiveSite } {
  const file = process.env.CLIENT_SITE_BUILD;
  if (!file) throw new Error('Build with scripts/client-site.mjs');
  return JSON.parse(readFileSync(file, 'utf8'));
}
