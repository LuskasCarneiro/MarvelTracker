import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // assets relativos — publicável em subpath (ex. GitHub Pages)
  build: {
    rolldownOptions: {
      input: 'app.html',
      treeshake: {
        moduleSideEffects: (id) => !/stats\.js/.test(id),
      },
    },
  },
});