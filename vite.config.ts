import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      input: 'app.html',
      treeshake: {
        moduleSideEffects: (id) => !/stats\.js/.test(id),
      },
    },
  },
});