import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('@tanstack')) return 'query'
          if (id.includes('react-router')) return 'router'
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod')) {
            return 'forms'
          }
          if (id.includes('axios')) return 'http'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
    },
  },
})
