// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Must match `brand.url` in src/data/content.js
export const SITE_URL = 'https://jarvisweb.lt';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      filter: (page) => !/\/(privatumo-politika|taisykles|404)\/?$/.test(page),
    }),
  ],
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
});
