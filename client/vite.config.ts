import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 2000,
    allowedHosts: true,
  },
  build: {
    // Screenshots dominate the payload; keep JS chunks honest.
    chunkSizeWarningLimit: 700,
    // The brand marks are referenced from a shared module that every page
    // pulls in. Emitting them as files instead of data URIs keeps that module
    // small and lets the browser fetch each icon only when it renders one.
    assetsInlineLimit: (file) => (file.endsWith('.svg') ? false : undefined),
  },
})
