import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: process.env.NODE_ENV === 'production' ? '/copilot-rpg/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});