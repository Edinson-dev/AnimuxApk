import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Animux',
        short_name: 'Animux',
        description: 'La mejor experiencia de Anime puro',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        icons: [
          {
            src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=192&h=192',
            sizes: '192x192',
            type: 'image/jpeg',
            purpose: 'any maskable'
          },
          {
            src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=512&h=512',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
