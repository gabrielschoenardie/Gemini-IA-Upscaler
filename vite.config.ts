import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE (AI-Studio-only):
// This app is intended to run exclusively inside the Google AI Studio preview,
// which injects GEMINI_API_KEY into the build environment. The define below
// replaces `process.env.API_KEY` at build time — DO NOT run `vite build` and
// publish the bundle publicly, as it would inline the key in the shipped JS.
// The runtime guard in App.tsx (window.aistudio check) blocks use outside AI Studio.

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});