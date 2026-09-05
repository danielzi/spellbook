import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      // 本地若同时运行 `npm run pages:dev`，vite 开发服务器会把 API 请求转发过去
      '/api': 'http://127.0.0.1:8788',
      '/spellbook.sh': 'http://127.0.0.1:8788',
    },
  },
})
