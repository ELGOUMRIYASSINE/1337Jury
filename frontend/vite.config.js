

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://1337jury-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: true,
  },
})