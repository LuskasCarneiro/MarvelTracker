import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // assets relativos — publicável em subpath (ex. GitHub Pages)
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      input: 'app.html',
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/gsap')) return 'vendor';
        },
      },
      treeshake: {
        moduleSideEffects: (id) => !/stats\.js/.test(id),
      },
    },
  },
});