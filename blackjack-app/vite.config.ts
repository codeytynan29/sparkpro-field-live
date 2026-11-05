import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Built into ../blackjack so GitHub Pages serves it at /sparkpro-field-live/blackjack/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../blackjack',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
