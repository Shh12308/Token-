import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills' // ✅ FIXED

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
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
