import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Dev-only proxy so fetch("/api/packet") works locally
  // This does NOT affect production builds.
  server: {
    proxy: {
      '/api': {
        target: 'https://5zlqeedlcc.execute-api.us-east-1.amazonaws.com',
        changeOrigin: true,
        secure: true,
        // /api/packet -> /dev/api/packet
        rewrite: (path) => path.replace(/^\/api/, '/dev/api'),
      },
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})