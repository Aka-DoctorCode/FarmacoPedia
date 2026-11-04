import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   base: '/',
// })

export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : (process.env.VITE_BASE_PATH || '/FarmacoPedia/'),
})
