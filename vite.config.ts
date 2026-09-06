import {defineConfig} from 'vite';

export default defineConfig(({mode})=>({
  base:mode==='github-pages'?'/CryptwardAsh/':'/',
  build:{rollupOptions:{output:{manualChunks:{three:['three']}}},chunkSizeWarningLimit:1500},
  server:{host:'127.0.0.1'},
}));
