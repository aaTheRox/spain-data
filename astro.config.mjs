// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Dominio de producción. Sustituir por el dominio real antes de desplegar:
// se usa para canonical, sitemap y Open Graph.
const SITE_URL = process.env.SITE_URL ?? 'https://indicadores-espana.example.org';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: 'directory',
  },
});
