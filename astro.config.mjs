import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import pwa from '@vite-pwa/astro';

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
    }),
    pwa({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['favicon.svg', 'icons/*.png', 'images/*.png'],
      manifest: {
        name: 'GestionProjet',
        short_name: 'GestionProjet',
        description: 'Application de gestion de projets et tâches avec mode hors-ligne',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#0B0F1A',
        theme_color: '#3b82f6',
        orientation: 'portrait-primary',
        lang: 'fr',
        dir: 'ltr',
        icons: [
          {
            src: 'icons/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png'
          },
          {
            src: 'icons/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'classic',
        navigateFallback: '/',
      }
    })
  ],
  build: {
    format: 'directory',
    inlineStylesheets: 'never'
  },
  vite: {
    base: base,
    ssr: {
      noExternal: [
        '@uiw/react-md-editor',
        '@uiw/react-markdown-preview',
        '@uiw/react-markdown-preview/esm/preview'
      ]
    }
  }
});