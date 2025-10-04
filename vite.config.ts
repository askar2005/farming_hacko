import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/farming_hacko/',  // <--- ADD THIS LINE
  plugins: [react()],
})
