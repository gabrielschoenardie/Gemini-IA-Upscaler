import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:3001';

  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      // ============================================================
      // PROXY CORRIGIDO
      // ANTES: proxy de /api → localhost:3001 (sem rewrite)
      //   frontend chamava /api/upscale → proxy enviava /api/upscale
      //   server tinha /api/upscale → ok via proxy, quebrava direto
      //
      // AGORA: proxy de /upscale → localhost:3001/upscale
      //   frontend chama VITE_BACKEND_URL/upscale diretamente
      //   sem depender do proxy para funcionar em produção
      // ============================================================
      proxy: {
        '/upscale': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    define: {
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(backendUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});