import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendPort = process.env.BACKEND_PORT || process.env.PORT || '3011'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: { '/api': `http://127.0.0.1:${backendPort}` }
  }
})
