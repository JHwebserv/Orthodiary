import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,        // 포트 고정
    strictPort: true,  // 포트가 사용 중이면 에러 발생
    host: '0.0.0.0',   // 모든 네트워크 인터페이스에서 접근 가능
    open: true,        // 브라우저 자동 열기
    // 사파리를 위한 추가 설정
    cors: true,        // CORS 허용
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control'
    }
  },
  preview: {
    port: 5173,
    strictPort: true,
  }
})