import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import adminPlugin from './vite-plugin-admin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), adminPlugin()],
})
