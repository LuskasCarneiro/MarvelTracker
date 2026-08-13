const VERSION = 'mv1';
const CACHE = `marvel-vault-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      for (const url of ['./', './app.html']) {
        try {
          await cache.add(url);
        } catch {
          /* pré-cache opcional: uma falha (ex. `./` sem index) não mata o install */
        }
      }
      const shell = await cache.match('./app.html');
      if (!shell) return;
      const refs = [...(await shell.text()).matchAll(/(?:src|href)="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((u) => u.startsWith('./'));
      const bundle = refs.find((u) => u.endsWith('.js'));
      if (bundle) {
        try {
          await cache.add(bundle);
        } catch {}
        // o registo acontece no load da 1.ª visita → os covers nunca seriam
        // intercetados a tempo; pré-cacheia-os a partir do bundle (catálogo embutido).
        const text = await (await cache.match(bundle))?.text();
        if (text) {
          for (const m of text.matchAll(/covers\/[\w.\-]+\.jpg/g)) {
            try {
              await cache.add(m[0]);
            } catch {}
          }
        }
      }
      for (const ref of refs) {
        try {
          await cache.add(ref);
        } catch {}
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('marvel-vault-') && k !== CACHE)
            .map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol === 'chrome-extension:') return;
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./app.html', copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match('./app.html')
            .then((hit) => hit || caches.match('./'))
            .then((hit) => hit || new Response('', { status: 503 }))
        )
    );
    return;
  }

  if (/^\/(assets|covers)\//.test(url.pathname)) {
    event.respondWith(
      caches.match(req, { ignoreVary: true }).then((hit) => {
        const fetchThenCache = () =>
          fetch(req)
            .then((res) => {
              if (res.ok) {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(req, copy));
              }
              return res;
            })
            .catch(() => hit || new Response('', { status: 504 }));
        if (hit) {
          fetchThenCache();
          return hit;
        }
        return fetchThenCache();
      })
    );
  }
});
