import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/green-api-max-chat/', // GitHub Pages serves the app from /<repo>/
  plugins: [react()],
})
