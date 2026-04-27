import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Assets to precache (in /public)
      includeAssets: [
        'favicon.svg',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png',
        'channels.json',
        'movies.json',
      ],

      // Web App Manifest
      manifest: {
        name: 'Animux Streaming',
        short_name: 'Animux',
        description: 'Tu plataforma de TV, Cine y Streaming en alta definición',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui', 'browser'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        lang: 'es',
        dir: 'ltr',
        categories: ['entertainment', 'video'],
        screenshots: [
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Animux en móvil',
          }
        ],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        shortcuts: [
          {
            name: 'Películas',
            short_name: 'Películas',
            description: 'Ver películas',
            url: '/?category=Películas&source=pwa',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Series',
            short_name: 'Series',
            description: 'Ver series',
            url: '/?category=Series&source=pwa',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'En Vivo',
            short_name: 'En Vivo',
            description: 'Canales en vivo',
            url: '/?category=Inicio&source=pwa',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
      },

      // Workbox strategies for offline support
      workbox: {
        // Precache all build assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Clean old caches on SW update
        cleanupOutdatedCaches: true,

        // Skip waiting to activate new SW immediately
        skipWaiting: true,
        clientsClaim: true,

        // Runtime caching strategies
        runtimeCaching: [
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'animux-google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'animux-gstatic-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firebase Firestore — Network first (fresh data preferred)
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'animux-firestore-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 10 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 5,
            },
          },
          // Images (Unsplash, tmdb, etc.) — StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/(images\.unsplash\.com|image\.tmdb\.org|.*\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'animux-images-cache',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Local JSON data files — StaleWhileRevalidate
          {
            urlPattern: /\/(channels|movies)\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'animux-data-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Navigation fallback to index.html (SPA routing)
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/backend\//],
      },

      // Dev mode: keeps SW active during development
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
})
