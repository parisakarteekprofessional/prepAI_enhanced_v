import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: '../Backend/public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('canonicalProblems.json') || id.includes('companyProblems.json')) {
            return 'dsa-datasets';
          }
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  plugins: [react()],
})
