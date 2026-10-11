// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Must match `brand.url` in src/data/content.js
export const SITE_URL = 'https://jarvisweb.lt';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  redirects: { '/arboristams': { status: 301, destination: '/rezultatai' } },
  integrations: [
    sitemap({
      filter: (page) => !/\/(arboristams|privatumo-politika|taisykles|404)\/?$/.test(page),
      // Match the canonical URLs (no trailing slash except the root).
      serialize: (item) => ({ ...item, url: item.url === `${SITE_URL}/` ? item.url : item.url.replace(/\/$/, '') }),
    }),
  ],
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
});
