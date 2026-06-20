import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Bodrum Blue Secret',
        short_name: 'Bodrum Tour',
        description: 'A self-guided adventure through Bodrum\'s ancient wonders and hidden gems.',
        theme_color: '#041a3d',
        background_color: '#041a3d',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/bodrum-tour/',
        start_url: '/bodrum-tour/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Let the freshly-activated SW take control of the open page so the
        // "Reload" banner's controllerchange-based reload actually fires.
        // (skipWaiting stays off — prompt mode controls when we activate.)
        clientsClaim: true,
        // Delete previous-build precaches on activation so stale code-split
        // chunks can't 404 after an update (the post-update blank screen).
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', expiration: { maxAgeSeconds: 60 * 5 } },
          },
        ],
      },
    }),
  ],
  base: '/bodrum-tour/',
  server: {
    host: true,
    port: 5173,
  },
})
