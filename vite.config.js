import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/punch/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      scope: "/punch/",
      base: "/punch/",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "Netkathir HRMS",
        short_name: "NKT HRMS",
        description: "Netkathir HRMS — office attendance punch in/out",
        start_url: "/punch/",
        scope: "/punch/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#16a34a",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: ["ecosystem-speed-balancing.ngrok-free.dev"],
  },
  preview: {
    port: 4173,
    host: "0.0.0.0",
    allowedHosts: ["ecosystem-speed-balancing.ngrok-free.dev"],
  },
});
