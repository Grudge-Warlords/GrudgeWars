import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  appType: 'spa',
  build: {
    outDir: 'dist-puter',
    chunkSizeWarningLimit: 1200,
  },
})
