import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
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
  base: './',
  // Ignorer les avertissements spécifiques
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  define: {
    // Ignorer les avertissements de React
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
