import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['rabbitx'],
  },
  server: {
    port: 12001,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
