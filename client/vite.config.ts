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
        // Only isolate heavy, lazily used map libs. Over-aggressive manualChunks
        // created circular imports (e.g. query → motion) that pulled framer-motion
        // onto every route including the public menu.
        manualChunks(id) {
          if (
            id.includes(`${path.sep}leaflet${path.sep}`) ||
            id.includes(`${path.sep}react-leaflet${path.sep}`)
          ) {
            return 'maps'
          }
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
