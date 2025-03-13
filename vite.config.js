import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-console',
      transform(code, id) {
        if (process.env.NODE_ENV === 'production') {
          // console.log hariç tüm console methodlarını kaldır
          return {
            code: code.replace(/console\.(info|debug|warn|trace|log)\((.*?)\);?/g, ''),
            map: null
          }
        }
      }
    }
  ],
  server: {
    port: 5173,
    open: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})