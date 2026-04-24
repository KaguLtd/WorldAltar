import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 1420,
    strictPort: true
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('maplibre-gl')) {
            return 'maplibre';
          }

          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }

          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  clearScreen: false
});
