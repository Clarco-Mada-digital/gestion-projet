import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Configuration pour GitHub Pages
const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const repositoryName = 'gestion-projet';
const base = isGithubPages ? `/${repositoryName}/` : '/';

export default defineConfig({
  plugins: [react({
    // Ignorer les avertissements spécifiques
    babel: {
      plugins: [
        ['@babel/plugin-transform-react-jsx', {
          runtime: 'automatic',
        }],
      ],
    },
  })],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: base,
  // Ignorer les avertissements spécifiques
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  define: {
    // Ignorer les avertissements de React
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'import.meta.env.BASE_URL': JSON.stringify(base),
  },
  build: {
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Copier le favicon à la racine du dossier de build
          if (assetInfo.name === 'favicon.svg') {
            return 'favicon.svg';
          }
          // Conserver le comportement par défaut pour les autres assets
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
  },
});
