import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import ReactInspector from 'vite-plugin-react-inspector'

export default defineConfig({
  css: {
    devSourcemap: true
  },
  plugins: [
    react(),
    ReactInspector({
      toggleButtonVisibility: 'never'
    })
  ],
  server: {
    port: 3000
  }
})