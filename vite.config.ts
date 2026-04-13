import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

// Expose the package version at build time via import.meta.env.VITE_APP_VERSION
// (used by notification device registration payload).
const pkgJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
) as { version: string }

const spaFallbackPlugin = () => ({
  name: 'spa-fallback-404',
  apply: 'build' as const,
  closeBundle() {
    const distIndex = path.resolve(__dirname, 'dist/index.html')
    const dist404 = path.resolve(__dirname, 'dist/404.html')
    if (fs.existsSync(distIndex)) {
      fs.copyFileSync(distIndex, dist404)
    }
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkgJson.version),
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
    spaFallbackPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React framework — cached long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data layer — React Query + Zustand + Axios
          'vendor-data': ['@tanstack/react-query', 'zustand', 'axios'],
          // Charts — only loaded when analytics pages are visited
          'vendor-charts': ['recharts'],
          // Date/time library
          'vendor-luxon': ['luxon'],
          // UI utilities
          'vendor-ui': ['sonner', 'lucide-react', 'zod'],
        },
      },
    },
    // Warn if a chunk exceeds 500KB (default is 500KB)
    chunkSizeWarningLimit: 500,
  },
  server: {
    host: true,
  },
})
