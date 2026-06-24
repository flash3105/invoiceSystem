// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Ensure public directory is copied to build
  publicDir: 'public',
  server: {
    // Vite handles SPA fallback automatically; remove webpack-specific option
  },
})