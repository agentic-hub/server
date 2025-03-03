import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: './',
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://uvlkspixjskmgcnkxpjq.supabase.co/functions/v1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/auth': {
        target: process.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://uvlkspixjskmgcnkxpjq.supabase.co/functions/v1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/auth/, '/oauth')
      },
      '/functions': {
        target: process.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://uvlkspixjskmgcnkxpjq.supabase.co/functions/v1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/functions/, '')
      }
    }
  }
});
