import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// Obtenez le nom de votre dépôt GitHub depuis l'URL
const repositoryName = 'gestion-projet';

export default defineConfig({
  site: 'https://clarco-mada-digital.github.io',
  base: `/${repositoryName}/`,
  output: 'static',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    })
  ]
});