import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/feishu': {
        target: 'https://open.feishu.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/feishu/, '/open-apis'),
      }
    }
  },
  define: {
    'process.env': {},
    'process.platform': JSON.stringify(''),
    'process.version': JSON.stringify(''),
  },
  optimizeDeps: {
    include: ['@excalidraw/excalidraw']
  },
  build: {
    commonjsOptions: {
      include: [/@excalidraw/, /node_modules/]
    }
  }
})

