import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const sourcemapStripper = () => ({
  name: 'strip-sourcemap-links',
  transform(code, id) {
    if (id.includes('node_modules')) {
      return {
        code: code.replace(/\/\/# sourceMappingURL=.*/g, ''),
        map: null
      }
    }
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sourcemapStripper()],
  optimizeDeps: {
    exclude: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ],
    esbuildOptions: {
      sourcemap: false
    }
  },
  server: {
    sourcemapIgnoreList: (path) => path.includes('node_modules')
  },
  build: {
    sourcemap: false
  }
})
