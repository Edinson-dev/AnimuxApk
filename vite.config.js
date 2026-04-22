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
        description: 'Plataforma Premium de Televisión y Streaming',
        theme_color: '#030305',
        background_color: '#030305',
        display: 'standalone',
        icons: [
          {
            src: 'https://ui-avatars.com/api/?name=AX&background=020617&color=4f46e5&size=192&font-size=0.4',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://ui-avatars.com/api/?name=AX&background=020617&color=4f46e5&size=512&font-size=0.4',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
