import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

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
  server: {
    host: true,
  },
})
