import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodePolyfills from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  define: {
    global: 'window',
  },
  base: './', // keep this for Vercel
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
