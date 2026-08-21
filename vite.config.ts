import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // assets relativos — publicável em subpath (ex. GitHub Pages)
  server: { open: '/app.html' },
  plugins: [
    {
      name: 'root-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            res.writeHead(302, { Location: '/app.html' });
            res.end(); return;
          }
          next();
        });
      },
    },
  ],
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