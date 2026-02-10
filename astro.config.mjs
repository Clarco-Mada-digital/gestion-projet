import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// Configuration pour GitHub Pages
const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const repositoryName = 'gestion-projet';
const base = isGithubPages ? `/${repositoryName}/` : '/';

export default defineConfig({
  site: 'https://clarco-mada-digital.github.io',
  base: base,
  output: 'static',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    })
  ],
  build: {
    format: 'directory',
    inlineStylesheets: 'never'
  },
  vite: {
    base: base === '/' ? '' : base,
    ssr: {
      noExternal: [
        '@uiw/react-md-editor',
        '@uiw/react-markdown-preview',
        '@uiw/react-markdown-preview/esm/preview'
      ]
    }
  }
});