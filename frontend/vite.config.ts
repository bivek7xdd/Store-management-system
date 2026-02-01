import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true, // Enable PWA in development
        type: "module",
      },
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Store Manager - Nepal",
        short_name: "Store Manager",
        description: "Offline-first store management system for small businesses in Nepal",
        theme_color: "#1a9b8e",
        background_color: "#fafbfc",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/placeholder.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/placeholder.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Different navigation fallback strategy for dev vs prod
        navigateFallback: mode === "development" ? undefined : "/index.html",
        navigateFallbackDenylist: [
          // Exclude Vite dev server specific routes
          /^\/@vite\/.*$/,
          /^\/@react-refresh$/,
          /^\/@vite-plugin-pwa\/.*$/,
          /^\/src\/.*$/,
          /^\/api\/.*$/,
          /^\/node_modules\/.*$/,
          /\.map$/,
        ],
        // Only cache in production, or minimal caching in dev
        globPatterns: mode === "development"
          ? ["offline.html"] // Only cache offline fallback in dev
          : ["**/*.{js,css,html,ico,png,svg,woff,woff2}"], // Full caching in prod
        runtimeCaching: [
          // In development, only cache essential resources
          ...(mode === "development" ? [
            {
              // Cache the offline fallback page
              urlPattern: /\/offline\.html$/,
              handler: "CacheFirst" as const,
              options: {
                cacheName: "offline-page",
              },
            },
            {
              // Cache API responses but with shorter expiration in dev
              urlPattern: /^.*\/api\/.*$/,
              handler: "NetworkFirst" as const,
              options: {
                cacheName: "api-cache-dev",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5, // 5 minutes in dev
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ] : [
            // Production caching strategies
            {
              // Cache API responses with longer expiration in prod
              urlPattern: /^.*\/api\/.*$/,
              handler: "NetworkFirst" as const,
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ]),
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate" as const,
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
