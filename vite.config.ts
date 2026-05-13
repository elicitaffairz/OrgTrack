import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',

      workbox: {
        // Keep precache small to avoid Workbox's default 2 MiB per-file limit.
        // OCR assets (tesseract core wasm + eng.traineddata.gz) are cached at runtime instead.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        globIgnores: ['**/tesseract/**', '**/tesseract-core/**', '**/tessdata/**'],

        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/tesseract/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-worker',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/tesseract-core/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-core',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/tessdata/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-tessdata',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },

      manifest: {
        name: 'OrgTrack',
        short_name: 'OrgTrack',
        description: 'Organization Tracking App',

        theme_color: '#111827',
        background_color: '#111827',

        display: 'standalone',
        start_url: '/',
        scope: '/',

        icons: [
          {
            src: '/orgtrack-logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/orgtrack-logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
}))