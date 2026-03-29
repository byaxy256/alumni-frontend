import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    chunkSizeWarningLimit: 2200,
    rollupOptions: {
      external: ['@vercel/analytics/react'],
    },
  },
  server: {
    port: 3000,
    middlewareMode: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 3000,
  },
});
