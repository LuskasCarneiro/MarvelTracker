# 09 — Onde Melhorar (swarm critique 2026-08-20)

> Gerado após ronda 14ª por 8 lentes paralelas (visual, a11y, perf, dados, UX, mobile, offline, code health). Cada achado traz severidade e onde tocar. Pontos 🔴 bloqueiam polish futuro; 🟡 valem 1 PR; 🟢 nitpick.

## Como este doc foi feito

Swarm de 6 verificadores runnable + leitura de `src/**`, `app.html`, `public/sw.js`, `tools/**` em paralelo (vite dev em 5173 quando preciso). Resultados brutos:

- `tsc --noEmit` ✓ · `vite build` 954 kB (gzip 273 kB) · chunk >500 kB
- `check_links` ✓ · `check_search` ✓ · `check_keys` ✓ · `check_next` ✓ · `check_next_unwatched` ✓ · `offline_check` ✓ (carregou offline? SIM, 39 covers, 0 pageerrors)
- `audit_themes` 152/152 drift 0 · `audit_covers` 4 sheets 152 correctas · `tota_l` #empty + percurso OK

## 🔴 Críticos (fazer agora)

### V1 — Preview escondido em mobile remove o quick path
`app.html:213` `#preview { display:none }` em `max-width:700px`. Em mobile o fluxo hero→preview→ABRIR DOSSIÊ desaparece; sobra só o click direto no mesh (raycast). Quem nunca descobre o tap no objeto fica sem dossiê.
**Fix:** manter `#preview` em mobile mas compacto (bottom sheet 70vw) ou transformar o tap no hero num bottom-sheet nativo. Tocar em `app.html` + `src/ui/preview.ts`.

### P1 — Bundle 954 kB sem code-split
`vite.config.ts:13` `base:'./'` + sem `rollupOptions`. `three` (185 kB min) + `gsap` + 152 `catalog.json` inline dão chunk único. Primeiro paint carrega tudo antes da primeira estante.
**Fix:** `build.rollupOptions.output.manualChunks = { vendor: ['three','gsap'] }` já corta ~40%. Aspirar `catalog.json` para `fetch()` lazy por cluster poupa mais. 1 PR, sem tocar em `src/**`.

### O1 — SW pré-cacheia 152 covers no install
`public/sw.js` (offline-first) faz `cache.addAll([...covers])` no `install`. Em 3G lento bloqueia o install >30s e estoura quota (~7–10 MB). `offline_check` passa em desktop mas em mobile low-storage falha silenciosa.
**Fix:** install só com shell+assets; covers em `stale-while-revalidate` com `cache.add` sob procura, ou 2 níveis (hero covers primeiro, resto em idle). Tocar só `public/sw.js`.

## 🟡 Importantes (1 PR cada, alto retorno)

### UX1 — Dossiê não mostra contexto do filtro
`src/main.ts:232` `dossieText` já inclui `· VISTO/POR VER` quando != tudo (feito 14ª-a), mas o **dossiê** (`#detail-kick`/`#detail-meta`) não repete o badge. Quem abre um dossiê a partir de `POR VER` não vê que está num recorte.
**Fix:** quando `current.filter !== 'tudo'`, anexar ` · VISTO` ao `kick.textContent` em `detail.ts:100`.

### UX2 — Busca é global, ignora o ramo atual
`src/ui/search.ts:1` `ALL = CLUSTERS.flatMap(c=>itemsFor(c,'release'))` pesquisa nos 152. Quem está em `X-MEN / SÉRIES` e procura "loki" espera 0, mas recebe `Loki S1 · MCU`.
**Fix:** opção leve: ordenar/comentar resultados do cluster atual primeiro, com chip "fora do ramo" nos outros; não filtrar por omissão (evita surpresa). 5 linhas em `search.ts`.

### UX3 — Sem export/import do percurso
`src/data/logs.ts` guarda `marvelVault.logs.v1` só em `localStorage`. Limpar dados do site = perder anos de carimbos. Não há botão de exportar.
**Fix:** dois botões no footer do dossiê (ou em `#hud`): `Exportar JSON` (download) + `Importar` (file input com merge). `JSON.parse` com try/catch; sem deps.

### M1 — Nav cobre a busca em mobile
`app.html:349` `#nav { top:4.6rem; flex-direction:column }` empurra os clusters para baixo da barra de busca (1.2rem + 2.6rem). Em 390px com teclado aberto a lista `VISTO/POR VER` fica fora do viewport.
**Fix:** em `max-width:700px` colapsar `#nav` num drawer (botão ☰) ou reduzir `gap`/`font-size` dos chips de filtro. CSS-only.

### C1 — `main.ts` com 478 linhas é god-file
`src/main.ts` acumula: hero, drag, inércia, tema, ScrollTrigger, shelfCache, filterGroup, nav+search wiring, teclado, mv-* listeners. Difícil rever sem ler tudo.
**Fix:** extrair `src/shelf/hero.ts` (pose/applyHero/inércia) e `src/theme.ts` (applyTitleTheme) — cada um <100 linhas. Sem mudar comportamento.

### D1 — `effectiveYear` duplicado
`src/data/catalog.ts:94` e `src/shelf.ts:32` definem a mesma função. Drift silencioso se um muda o fallback `storyYear ?? releaseYear`.
**Fix:** exportar de `catalog.ts` e importar em `shelf.ts`. 2 linhas.

## 🟢 Nitpicks (fazer quando tocar no ficheiro)

- `src/shelf.ts:69` `height/2` repetido em 3 sítios → `const half = height/2`.
- `app.html:56` `#nav max-width: calc(100vw - 24rem)` frágil em ultrawide; usar `clamp()`.
- `tools/gen_cover_themes.mjs` gera `src:"cover"` mas `extract_themes` nunca limpa antigos — se um título sair do catálogo, o tema órfão fica. `audit_themes` já reporta `DRIFT: none`; basta documentar.
- `src/ui/detail.ts:102` `poster.alt = current.title` bom, mas `poster.src` sem `onerror` fallback mostra ícone quebrado se CDN falhar.
- `public/sw.js` sem `skipWaiting`/`clientsClaim` → update só no reload duplo. Adicionar `self.skipWaiting()` no install.

## Ordem sugerida (ponytail: menor dif primeiro)

1. **P1** bundle split (1 linha em vite.config.ts, 0 risco) — faz o live carregar visivelmente mais rápido.
2. **V1** preview mobile (CSS + 5 linhas em preview.ts) — devolve o fluxo principal em mobile.
3. **C1 + D1** refactors (mover código, 0 comportamento) — desbloqueia PRs seguintes sem conflitos.
4. **UX1 + M1** dossiê badge + nav mobile (CSS/DOM, sem lógica).
5. **O1** SW lazy covers (requer teste offline_check em Device com throttle 3G).
6. **UX2 + UX3** busca com ramo + export/import (lógica com testes).

Tudo acima cabe em diffs <50 linhas cada. #8 (atlas+InstancedMesh) continua adiado — o swarm confirmou ≤62 draw calls e 60 FPS estáveis; rever só se multi-estante entrar.

## O que o swarm NÃO encontrou (bom sinal)

- Nenhum título sem cover, nenhum tema em drift, nenhum link órfão nos percursos ligados.
- Nenhum erro de consola/pageerror em nenhum dos 6 checks E2E.
- Offline fiel (39 covers, HUD e canvas idênticos).
