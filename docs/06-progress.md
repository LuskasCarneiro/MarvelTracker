# 06 — Progresso & Retoma

> Ficheiro de retoma. Lê-se no início de cada sessão depois do CLAUDE.md.

## 2026-08-20 (13ª sessão) — Deploy live + teclado + próximo no percurso + temas 152/152

**Feito (4 frentes paralelas + orquestrador):**
- **Deploy (agente):** branch pushed; `gh-pages` com o build; live em
  https://luskascarneiro.github.io/MarvelTracker/app.html. Canary: canvas, HUD,
  cover e sw 200, 0 erros.
- **Temas completos (agente):** `tools/gen_cover_themes.mjs` — 110 temas derivados
  das covers reais (paleta ImageMagick, guardas de luminância, `src` curado/cover).
  152/152 cobertos, drift 0.
- **Teclado (agente):** ←/→ (wrap), Home/End, Enter abre o dossiê, Esc fecha;
  `tools/check_keys.mjs` verde.
- **Próximo no percurso (agente):** botão no dossiê → `mv-next-in-path` → fecha o
  dossiê e salta ao item seguinte (fix de 1 linha do orquestrador: fechar o dossiê).
- **QA tools curados (agente):** hashes `/tudo` (4.º segmento), contact sheet do
  frames3d não-fatal, foco no check do Esc.
- Verificação combinada final (orquestrador): tsc, build, 5 checks, frames3d
  combinado, offline, audits — tudo verde.

**Você está aqui:** ▶ App publicada e com paridade a11y+. Próximos possíveis:
micro-polimento (filtros no dossiê, #8 perf quando a estante crescer), mais
curadoria de temas, decisões de domínio (guardar domínio próprio vs. subpath GH).

**Pendente do owner:** nada.

## 2026-08-20 (12ª sessão) — Temas do legado no 3D (cores por título)

**Feito:**
- Decisão owner (07): temas do legado entram como **cores por título** — o
  item em palco (hero/dossiê) traz o acento, o fundo e os metadados do tema
  curado; sem tema → acento do cluster. Animações/panels pesados do themes.js
  ficam no legado.
- `tools/extract_themes.mjs` → `src/data/themes.json` (42 temas, build-time);
  `themeFor()` em catalog.ts; `applyTitleTheme()` em main.ts (--accent/--ink/
  --accent2 no body + tween rim/fundo); CSS: `--ink` e `--accent2` no UI.
- `tools/audit_themes.mjs`: cobertura 42/152 (110 sem tema), drift 0.
- Verificação mecânica (esta sessão corre sem modelo com visão — frames
  capturados mas veredito por probes computados + amostra de pixel): CSS
  batem com o tema, fundo 3D = `#0e0a12` exato no frame do Age of Ultron.

**Você está aqui:** ▶ Temas do legado encerrados. Próximos possíveis: push/deploy
(owner), mais temas para os 110 títulos sem curadoria, micro-polimento.

**Pendente do owner:** nada.

## 2026-08-12 (11ª sessão) — Offline-first (SW) + fecho da ronda

**Feito:**
- `public/sw.js`: offline-first (pre-cache shell+assets+152 covers no install,
  stale-while-revalidate, caches versionadas, fallback de navegação).
  Verificado: reload offline renderiza a app com todos os covers, 0 erros.
- E2E final com todas as flags verde (hash 4 segmentos integrado: `cron/tudo`).
- Commits da branch: `cbb0448` Fase 3 · `f79bc06` publish-ready+links ·
  `7d23d13` filtros · `f729d8a` living cover · `e53c774` inércia+busca+carimbo ·
  `016147a` service worker.
- Remote GitHub `origin` (MarvelTracker) existe — **push/deploy = decisão do
  owner** (não feito).

**Você está aqui:** ▶ App completa, publicável e offline-first. Próximos
possíveis: `git push` + GH Pages (owner), temas do legado (decisão tua),
micro-polimento contínuo.

**Pendente do owner:** decidir push/deploy.

## 2026-08-12 (11ª sessão) — Polimento: inércia, busca vazia, carimbo da estante

**Feito:**
- Inércia no drag do hero (decay manual no ticker, dt real, cancelamento
  robusto), "SEM RESULTADOS NO ARQUIVO" na busca, entrada de estante com
  drop+stagger (carimbo; exclui hero/board; reduced-motion = nada).
- Commits: `cbb0448` Fase 3, `f79bc06` publish-ready+links, `7d23d13` filtros,
  `f729d8a` living cover, +11ª sessão.

**Você está aqui:** ▶ App publicável, paridade+, polida (60 FPS). Próximos
possíveis: deploy real, temas do legado (decisão tua), mais micro-polimento.

**Pendente do owner:** nada.

## 2026-08-12 (10ª sessão) — Filtros VISTO/POR VER/TUDO

**Feito:**
- Filtro por estado do percurso (logs.v1): hash 4.º segmento, grupo no nav,
  subgrupo por re-parenção (sem duplicar geometrias), vazio sem resultados,
  busca fora do filtro recua para TUDO. Verificado: 3/36/39, vazio X-MEN
  VISTO, visual OK (3 itens + board + hero).
- Commits: `cbb0448` (Fase 3), `f79bc06` (publish-ready + percursos ligados).

**Você está aqui:** ▶ App publicável e com paridade+ (busca, filtros, cross-
links, a11y, era-aware, 60 FPS). Próximos possíveis: deploy real, mais
polimento, temas do legado (decisão tua).

**Pendente do owner:** nada.

## 2026-08-12 (9ª sessão) — Commit Fase 3 + publish-ready + percursos ligados

**Feito:**
- Commit `cbb0448` (Fase 3 completa, 212 ficheiros) — pedido do owner.
- Publish-ready: `base: './'` + posters relativos (subpath-safe), meta/OG +
  favicon SVG. Verificado em `vite preview` (dist serve, covers OK).
- PERCURSOS LIGADOS: cross-links no dossiê derivados das `references`
  (match por palavra inteira, strip S\d+, max 4); `jumpToItem` partilhado
  entre busca e dossiê. Verificado: X-Men → Days of Future Past/First
  Class/Logan, salto fecha o dossiê.
- Owner: commit aprovado + "continua como achares melhor".

**Você está aqui:** ▶ App publicável (offline, sem keys). Próximos possíveis:
deploy real (GH Pages etc.), refactor #8 se a estante crescer, temas do
legado (decisão tua), mais polimento (ex. filtros VISTO/POR VER no dossiê).

**Pendente do owner:** nada.

## 2026-08-12 (8ª sessão) — Busca no arquivo + poster no dossiê + fixes mobile

**Feito:**
- **Busca** (paridade com o searchbox do legado): input topo-centro, sugestões
  por título (normalização sem acentos + mapa curado pt-PT→EN ponytail-marked),
  teclado ↑↓/Enter/Esc, listbox/option; ao escolher → navega para o
  cluster/media via o mesmo caminho do nav e salta para o slot (hero + preview).
  Verificado: doutor→Doctor Strange (14/39), loki→séries, venom→sony.
- **Poster no dossiê** (`#detail-poster`): o dossiê mobile (opaco) não mostrava
  imagem; agora a página tem a cover no topo (desktop também).
- Fix mobile (bug pré-existente): `max-width: calc(100vw - 24rem)` do desktop
  vazava para o `#nav` mobile (comprimia para ~32px); e o input de busca
  sobrepunha-se à strip — nav mobile agora `top: 4.6rem`, `max-width: 100%`.
- E2E completo (flags combinadas) verde após as mudanças.
- FPS real do owner: **60 FPS** (fechado; #8 definitivamente adiado).

**Você está aqui:** ▶ App 3D com paridade funcional do legado (quick path,
carimbo/rating, busca, dossiê completo, era-aware, acentos, a11y, nav
auto-hide). Próximos opcionais: temas animados do legado (decisão tua — o
tracker THEMES_CHECKLIST está congelado), publicação (app.html é a entrada),
refactor do #8 se a estante crescer.

**Pendente do owner:** nada.

## 2026-08-10 (7ª sessão) — #11 a11y + fixes + verificação final

**Feito:**
- #11 (flash-free): focus trap no dossiê, foco restaurado ao fechar, roving
  tabindex + setas/Home/End no nav, `visibility` em nav/detail fechados,
  `:focus-visible` âmbar, aria-hidden no preview.
- Fixes Kimi: preview não reaparecia ao fechar o dossiê (refresh() não dispara
  onUpdate com progresso igual) → `applyHero(group, p)` partilhada
  (onUpdate/onClose/morph). `tabIndex -1` no preview-open invisível.
- frames3d: fix hash duplo com flags combinadas (estado vazio HULU volta a
  provar-se).
- Spot-check D2 (6 clusters): factos verificáveis ✓, voz dossiê ✓.
- E2E final: todas as flags juntas verdes; mobile (390px) e reduced-motion
  verificados sem erros.

**Você está aqui:** ▶ Fase 3 completa (quick path, hero levitante + drag,
preview IMDb, dossiê completo com conteúdo editorial, acentos por universo,
nav auto-hide, a11y). Backlog esgotado (#8 adiado por YAGNI, #13 revogado).
Próximos (quando quiseres): #8 (perf multi-estante), publicação, paridade de
features do legado (ver 00), FPS real do owner.

**Pendente do owner:** nada — FPS real: **60 FPS estáveis** (owner, 2026-08-12).

## 2026-08-10 (6ª sessão, continuação) — #9 stats.js + #10 covers 152/152 + #8 adiado

- #9: stats.js dev-only (0 bytes no bundle prod); FPS headless = SwiftShader
  (inútil) — medição real é do owner no browser (stats visível só em dev).
- #10: auditoria das 152 covers, 4 sheets — **152/152 corretas**, 0 erros.
  Ferramenta `tools/audit_covers.mjs` + `tools/frames/covers/`.
- #8 (atlas+InstancedMesh): **adiado** — ≤62 draw calls numa estante de cada vez
  (ADR-0002) é trivial para GPU real; rever quando >100 itens ou multi-estante.

**Você está aqui:** ▶ Fase 3 essencialmente completa. Restantes: #11 (a11y do
overlay + reduced-motion já em parte), #14 (docs contínuo), medição FPS real do
owner, e — quando quiseres — #8 (perf futura) e decisões de publicação
(paridade: legado fica; `app.html` é a entrada).

**Pendente do owner:** medir FPS no browser real (stats visível em dev).

## 2026-08-10 (5ª sessão) — Hero levitante + preview IMDb + dossiê completo + D2 (152/152)

**Feito:**
- Novo conceito (owner): item focado sai da prateleira e **levita** centrado,
  drag-to-rotate, card de preview com **nota IMDb**, página completa (HISTÓRIA,
  CURIOSIDADES, REFERÊNCIAS). Nav auto-escondido. `index.html` fica para sempre.
- D1: ratings IMDb reais (dataset oficial; 151/152 — Doomsday sem rating).
- A+B+C+E construídos (Kimi — flash-free falhou 2× e escalação exige restart;
  registado no 08). D2 delegado a flash-free: **152/152 enriquecidos**
  (longOverview/facts/references, voz dossiê, anti-alucinação).
- Bug CSS `//` registado no 05 — lição permanente.
- Verificado: frames `--hero` (hero centrado por snap, drag sem abrir, página
  completa com facts/refs), probe elementFromPoint.

**Você está aqui:** ▶ #6a acentos por universo (tokens em 02 + build flash-free).
Depois #8 (atlas+InstancedMesh), #9 (FPS), #10 (auditoria covers).

**Pendente do owner:** nada.

## 2026-08-10 (4ª sessão) — #7 emergência + toggle cron/release + morph era-aware

**Feito:**
- Build #6 (flash-free): `applyOrder` (morph scale out/in + dispose correto),
  `applyEmergence` (z/tilt por foco), hash `#/cluster/media/modo`, toggle
  ESTREIA/CRONOLÓGICA, reduced-motion honrado, `--ordem` no frames3d.
- Revisão Kimi com 5 fixes: emergência 0.6/−0.08; rolo r=0.8 (`2r < SPACING`);
  detalhe com camZ 3.4 p/ rolo + meta era-aware (`mesh.userData.format`);
  `#detail` z 4; nav com wrap. Verificado: contact sheet, morph ida/volta
  (First Avenger reel↔blu-ray), detalhe de rolo em cron.
- Owner: piloto automático entre fases — não pedir permissão, parar só em
  bloqueio crítico.

**Você está aqui:** ▶ #6a acentos por universo (spec Kimi: tokens por cluster
em 02-design-system.md; build flash-free: CSS/rim/prateleira por estante).
Depois #8 (atlas + InstancedMesh), #9 (FPS), #10 (auditoria covers).

**Pendente do owner:** nada bloqueante.

## 2026-08-10 — Fase 3 MVP vivo: estante MCU renderiza com dados reais

**Feito:**
- `tools/build_catalog.mjs` → `src/data/catalog.json` (152/152, 12 clusters;
  check runnable integrado). Wrapper tipado `src/data/catalog.ts`
  (`formatFor`, `itemsFor`).
- Scaffold Vite+TS: `app.html` entrada (legado `index.html` intacto), deps exatas
  do ADR-0001. `tsc --noEmit` limpo, build verde (696 kB / 191 kB gzip).
- Cena 3D: scene/shelf/main — 57 itens MCU em formatos era-aware, covers reais,
  scroll scrub GSAP, HUD dossiê pt-PT com contador PERCURSO.
- `tools/frames3d.mjs` criado (frames por % de scroll + contact sheet).
- Verificação visual com 2 correções: prateleira azulada (rim/material) e poster
  errado do Wonder Man (variante «Magnum» no TMDb → teaser oficial). Detalhes no
  CHANGELOG e no registo do docs/05.
- Workflow multi-agente validado: builder `general` correu em DeepSeek V4 Flash
  (binding na config); Kimi fez spec/revisão/visual.

**Custos:** routing tarefa→modelo fixado em `docs/08-model-plan.md` (owner revê).
Builders = flash-free; Kimi = spec/revisão/visual apenas.

**Você está aqui:** ▶ Fase 3 continuação — escolher o próximo incremento:
1. **Quick path** (click → tween de câmara para o item + overlay DOM de detalhe
   com rating/logs.v1) — devolve a funcionalidade central da app 2D;
2. **Estantes por cluster** (navegação entre universos + restantes 11 clusters);
3. **Emergência por scroll** (itens saem da estante) + toggle cronológico/release
   (formato segue o ano efetivo — exercita o morph reel↔blu-ray).

**Sugestão:** quick path + detalhe primeiro (fecha o loop utilidade: ver → clicar →
carimbar), depois clusters, depois polimento de motion.

## 2026-08-10 (3ª sessão) — storyYears completos + paleta decidida + nav multi-cluster

**Feito:**
- 22 `suggestedYear` do owner aplicados por `tools/apply_storyyear.mjs` a
  `curated.json` (22/22, 0 pendentes); `catalog.json` regenerado. Era morph
  verificado nos dados (First Avenger 1942→reel / 2011→blu-ray; F4 1963→reel).
- Decisão owner: **materialidade por universo** — registada em 07/02; tokens na
  tarefa #6a do docs/08.
- ADR-0002 (uma estante de cada vez) + build #5 (flash-free): nav 12 clusters,
  alternador FILMES/SÉRIES, hash `#/cluster/media`, estado vazio, cache lazy.
  Verificado com frames3d `--nav`. Fix pós-review: câmara inicial no 1.º item
  (scrub não corria sem scroll — a estante abria a meio).
- Divisão Kimi/DeepSeek/Luna afiada no docs/08 e confirmada pelo owner.

**Você está aqui:** ▶ #7 emergência por scroll + toggle cron/release + morph de
formato (dados prontos). #6a (acentos por universo) entra logo a seguir — spec
minha, build flash-free.

**Pendente do owner:** nada bloqueante.

## 2026-08-10 (2ª sessão) — Quick path + detalhe + logs.v1 (plano de custos ativo)

**Feito:**
- `docs/08-model-plan.md` — routing tarefa→modelo aprovado pelo owner (escalação:
  `gpt-5.6-luna`). Builders = flash-free; Kimi = spec/revisão/visual.
- Build #2 (flash-free): `src/data/logs.ts` (lê/escreve `marvelVault.logs.v1` no
  formato exato do legado, com migração de `watched.v1`), `src/ui/detail.ts`
  (raycast click → tween quick path; overlay dossiê com carimbo + rating 1–10;
  Esc/×/clique-fora fecha), markup/CSS em app.html, `userData.item` na shelf.
- Verificação visual (frames3d --detail): click → overlay abre com câmara no item;
  carimbar+rating gravam logs.v1 (`{"series|The Falcon..."}:{watchedAt,rating:8}` ✓);
  Esc regressa ao PERCURSO certo. Fix pós-review: clique-fora fecha; shift de câmara
  +0.35 para o item compor fora do painel.

**Você está aqui:** ▶ próximo do backlog do 08: #4 decisão multi-cluster
(ADR-0002) + #5 navegação clusters/alternador. Depois #7 emergência/morph.

**Pendente do owner (não bloqueia):** `suggestedYear` em
`tools/data/storyyear-review.md` (22 entradas); decisão paleta TVA no 3D
(07-open-questions #2 — MVP usa base escura quente + HUD âmbar).

## 2026-08-09 (fim do dia) — Fase 2 concluída: pipeline de dados viva

**Feito (Fase 2):**
- `tools/extract_curated.mjs` — 152 entradas extraídas do legado (82 filmes + 70
  temporadas; 25 séries sem sufixo normalizadas para S1 implícito). IDs =
  `movies|Title` / `series|Title`, compatíveis com `logs.v1` (verificado no código
  legado: `watchKey` em index.html:3127). Cluster `f4` (3 filmes) descoberto —
  docs atualizados para 12 clusters.
- `tools/tmdb_fetch.mjs` — match + posters com cache sha1 em disco. Primeiro run:
  125/152 alta confiança; causa raiz dos falhanços = S2+ pesquisadas com
  `first_air_date_year` da própria temporada. Fix: séries resolvidas UMA vez (grupo
  por `seasonOf`), strip genérico de `(...)`, fallback TV→filme para especiais,
  cache v2 (v1 envenenada descartada).
- **Resultado final: 149/152 alta confiança, 0 sem match, 152 posters em
  `public/covers/`.** Os 3 "low" são os especiais TV (Werewolf by Night, GotG
  Holiday Special, Punisher: One Last Kill) — matches corretos via fallback filme.
- Config opencode: `general`/`explore`/`small_model` → `deepseek-v4-flash-free`
  (requer restart do opencode para ativar).

**Você está aqui:** ▶ **Fase 3 — scaffold Vite + estante 3D MVP** (contrato em
`docs/05-3d-shelf.md`). 

**Pendente do owner (não bloqueia):** preencher `suggestedYear` em
`tools/data/storyyear-review.md` (22 entradas) para o modo cronológico.

**Próxima ação concreta:** gerar `src/data/catalog.js` (merge curated.json +
tmdb-map.json) e fazer scaffold Vite+TS com a primeira estante instanciada (MCU).

## 2026-08-09 — Fundações da era 3D

**Feito:**
- Lido e executado `improve.md`; decisões fixadas com o owner (ver `00-brief.md`).
- Branch `feature/3d-shelf` criado; `main` preservado para rollback.
- Estrutura `docs/` criada (00–07 + adr/0001).
- TMDb smoke-tested ao vivo: token válido, pt-PT funciona, endpoints mapeados em `03`.
- press.stripe.com analisado; contrato 3D escrito em `05`.
- Pasta Obsidian criada: `Projects/Marvel Vault/` + nota de findings.
- CLAUDE.md reescrito para a nova era.

**Estado ao fechar esta entrada:** fundações prontas; Fase 2 arranca de seguida
(concluída mais tarde no mesmo dia — ver entrada acima).
