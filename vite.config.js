import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import ReactInspector from 'vite-plugin-react-inspector'
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
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