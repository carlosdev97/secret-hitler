// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Esto permite importar con @/ruta/a/archivo
      '@': path.resolve(__dirname, 'src')
    }
  }
})
