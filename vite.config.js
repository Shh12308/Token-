import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(), // ✅ modern fix
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
      },
      manifest: {
        name: "CryptoBean",
        short_name: "CryptoBean",
        description: "Advanced Web3 wallet and NFT marketplace",
        theme_color: "#1a1a1a",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },

  define: {
    global: "globalThis"
  }
});
