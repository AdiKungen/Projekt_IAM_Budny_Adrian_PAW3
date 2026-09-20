import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Projekt_IAM_Budny_Adrian_PAW3/',
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});