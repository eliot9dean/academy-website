import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    viteSingleFile(),   // JS + CSS 전부 index.html 한 파일로 인라인
  ],
  base: './',
  build: {
    // 단일 파일 빌드 시 권장 설정
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
})
