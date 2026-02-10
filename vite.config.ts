import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Configuration pour GitHub Pages
const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const repositoryName = 'gestion-projet';
const base = isGithubPages ? `/${repositoryName}/` : '/';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@uiw/react-md-editor'],
  },
  ssr: {
    noExternal: ['@uiw/react-md-editor'],
  },
  base: base,
  // Ignorer les avertissements spécifiques
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  define: {
    // Ignorer les avertissements de React
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'import.meta.env.BASE_URL': JSON.stringify(base)
  },
  server: {
    fs: {
      // Autoriser l'accès aux fichiers en dehors du projet
      allow: [
        // Autoriser le dossier Téléchargements
        '/home/programmeur/Téléchargements',
        // Garder les autorisations par défaut
        '..'
      ]
    }
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
        },
        manualChunks: {
          // Isoler les packages problématiques
          'md-editor': ['@uiw/react-md-editor'],
        }
      }
    }
  },
});
