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