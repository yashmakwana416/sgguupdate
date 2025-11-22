import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: mode === 'development' },
      includeAssets: ['splogo.png', 'favicon.ico'],
      manifest: {
        name: 'Shree Ganesh Gruh Udhyog',
        short_name: 'SGGU',
        description: 'Billing and Inventory app',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/splogo.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/splogo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
      },
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
