import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @/ maps to src/ — mirrors the TypeScript path alias in tsconfig.app.json
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
