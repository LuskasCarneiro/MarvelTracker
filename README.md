# Marvel Vault

Arquivo pessoal de todos os filmes e séries Marvel (MCU, X-Men/Fox, Sony, Netflix,
Vintage, Clássica, Fox, Hulu, ABC, Animação, Spider-Verse, F4), em formato dossiê
TVA, agora numa **estante 3D imersiva era-aware** (Vite + TypeScript + Three.js +
GSAP). 100% client-side, sem backend e sem API keys em runtime.

**Live:** https://luskascarneiro.github.io/MarvelTracker/app.html

## Arranque

```sh
npm install
npm run dev      # Vite → http://localhost:5173/app.html
npm run build    # dist/ estático (offline-first, com service worker)
npm run deploy   # build + publica em gh-pages (tools/deploy.mjs)
```

## A estante

- **Formatos era-aware** — o objeto físico segue o ano efetivo (cronológico ou de
  estreia): pré-1978 rolo de cinema, 1978–1999 VHS, 2000–2009 DVD, 2010+ Blu-ray.
  Alternador ESTREIA/CRONOLÓGICA por estante.
- **12 estantes por universo** com acento próprio; cada título carrega um tema de
  cores próprio (152/152: 42 curados do legado + 110 derivados das covers reais).
- **Quick path** — clicar num item traz-no para primeiro plano; o dossiê abre em
  overlay (HISTÓRIA, CURIOSIDADES, REFERÊNCIAS, nota IMDb, carimbar VISTO + rating
  1–10). Os logs vivem em `marvelVault.logs.v1` no localStorage.
- **PRÓXIMO NO PERCURSO / PRÓXIMO POR VER** — saltos do dossiê para o item seguinte
  (ou o seguinte não visto) da ordem atual.
- **Busca** (títulos pt-PT→EN), **filtros** VISTO/POR VER/TUDO (4.º segmento do
  hash), **navegação por teclado** (←/→, Home/End, Enter, Esc) e offline-first.

## Branches

- `main` — app 2D legada (grafo + painéis TVA); fica no repo como rollback e fonte
  histórica, nunca é eliminada.
- `feature/3d-shelf` — a app 3D (trabalho corrente). `gh-pages` — build publicado.

## Verificação

Checks contra `npm run dev` (porta 5173):

```sh
node tools/check_links.mjs            # percursos ligados no dossiê
node tools/check_search.mjs           # busca doutor/loki/venom + Esc
node tools/check_keys.mjs             # navegação por teclado
node tools/check_next.mjs             # PRÓXIMO NO PERCURSO
node tools/check_next_unwatched.mjs   # PRÓXIMO POR VER
node tools/frames3d.mjs ... --nav --ordem --hero --detail   # frames congelados
node tools/offline_check.mjs          # reload sem rede (usa `npm run build`)
node tools/audit_covers.mjs           # contact sheets das 152 covers
node tools/audit_themes.mjs           # cobertura de temas por cluster
```

Pipeline de dados build-time em `tools/` (Node determinístico, TMDb apenas em
build; nunca em runtime): `extract_curated`, `tmdb_fetch`, `build_catalog`,
`extract_themes`, `gen_cover_themes`, `apply_storyyear`.

## Créditos

- Metadados, posters e ratings: TMDb (build-time) + IMDb (dataset de ratings).
  Posters pertencem aos respetivos estúdios; não são redistribuídos por este
  projeto. A app publicada não carrega JavaScript externo.
- Stack: three.js, GSAP, Vite, Playwright (verificação).