import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { buildingsDataPlugin } from './plugins/buildingsData.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    buildingsDataPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.svg', 'pwa-512.svg'],
      manifest: {
        name: 'Seattle Buildings History Map',
        short_name: 'SEA Buildings',
        description:
          'Explore notable historic buildings around Seattle on an interactive map.',
        theme_color: '#1e3a5f',
        background_color: '#f0f4f8',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/[abcd]\.basemaps\.cartocdn\.com\/light_all\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
  ],
})
