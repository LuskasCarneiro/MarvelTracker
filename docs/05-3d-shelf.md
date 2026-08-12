# 05 — Estante 3D: Contrato Técnico

> Decisões tomadas 2026-08-09 após análise de press.stripe.com. Registo de testes e
> erros acrescenta-se ao fim deste ficheiro à medida que acontecem.

## Stack (ADR-0001)

- **Vite + TypeScript** — build step permitido (regra antiga revogada).
- **Three.js vanilla** — sem React/R3F. Justificação: uma só cena imersiva; o UI é
  overlay DOM (texto), onde HTML/CSS é mais simples e acessível. R3F adicionaria um
  runtime React inteiro para gerir uma cena que cabe num módulo.
- **GSAP + ScrollTrigger** — coreografia de câmara e emergência por scroll. Não se
  escreve easing à mão quando GSAP existe.
- Sem mais deps. Se algo novo aparecer, justifica-se no ADR seguinte.

## Lições de press.stripe.com (aplicadas)

1. Objetos 3D **simples** + iluminação/materiais premium > geometria complexa.
2. Texto é **sempre DOM** — nunca texturas de texto em WebGL (acessibilidade, seleção).
3. Motion físico e curto; nada se move sem input.
4. A face do objeto é a tela — as nossas "living covers" são os posters era-aware.

## Orçamento de performance (não negociável)

| Métrica | Alvo |
|---|---|
| Frame rate | 60 fps em laptop médio 2019+ (iGPU); piso 30 fps |
| Draw calls | ≤ 20 (4 formatos instanciados + estante + fundo + helpers) |
| Texturas da estante | **1 atlas** 4096² WebP, tiles 256×341 (≈192 covers) |
| Texturas de detalhe | w500 individual, lazy, só no quick path |
| Payload inicial | < 5 MB (excl. fontes) |
| Luzes | 1 key + 1 rim + ambiente; **sem shadow maps** (AO falso/baked) |

## Arquitetura da cena

- Um `InstancedMesh` **por formato** (rolo, VHS, DVD, Blu-ray) — 4 draw calls para
  ~180 itens. UV offset por instância aponta para o tile do atlas.
- Reordenar cronológico↔release = atualizar transforms das instâncias + **trocar de
  InstancedMesh** quando o formato muda (ex: First Avenger salta de Blu-ray para
  rolo). O morph é uma transição GSAP (scale out/in), não geometria interpolada.
- Scroll mapeia para progressão na estante (ScrollTrigger scrub); click = tween de
  câmara direto (quick path), ScrollTrigger desligado durante o tween.
- Fallback: `prefers-reduced-motion` desliga emergência por scroll (fade simples).

## Shaders

Começar com `MeshStandardMaterial` + env map. Shaders GLSL custom só se o standard
não chegar ao look (ex: iridescência de steelbook, textura de fita VHS). Cada shader
custom entra aqui com: propósito, uniforms, custo medido.

## Verificação

`tools/frames.mjs` (Playwright, tempo congelado) em cada iteração visual. FPS medido
com `stats.js` em dev apenas (não shipped). Registar medições abaixo.

## Registo de testes/erros

### 2026-08-10 (5ª, #9) — FPS

- stats.js dev-only (import.meta.env.DEV; `treeshake.moduleSideEffects` no
  rolldown; verificado: 0 referências no bundle prod).
- Medição headless (SwiftShader): 3–4 FPS — **ambiente software, não GPU real**.
  Conclusão: draw calls atuais (≤62, uma estante de cada vez) são triviais para
  qualquer GPU real; instancing (tarefa #8) adiado até haver motivo (ver 08).
- **Medição real (owner, browser): 60 FPS estáveis.** #8 definitivamente não é
  necessário à escala atual.

### 2026-08-10 (5ª) — Hero levitante + preview + dossiê completo + D2

- **Verificação:** frames3d `--hero` (hero centrado, drag sem abrir, página
  completa com facts/refs), probe elementFromPoint para o bug de clique.
- **Erro CSS `//` (lição permanente):** `//` NÃO é comentário CSS — o parser
  descarta até ao próximo `;`, partindo as declarações seguintes. Sintomas:
  `#detail` fechado (transform/pointer-events partidos) interceptava cliques no
  `#preview`. Diagnóstico: `elementFromPoint` no ponto de clique + computed
  style (transform:none com .open ausente). Fix: `/* */` em 4 sítios.
- **Snap por slot:** sem snap, o hero ficava desalinhado entre slots (câmara
  contínua vs hero discreto). `ScrollTrigger snap: 1/(n-1)` → hero sempre
  centrado quando o scroll assenta.
- **Hero vs quick path:** hero a z=1.3 colava-se à câmara do detalhe (2.2).
  Hook `beforeOpen` desposeia o hero (tween 0.2s) antes do tween da câmara.
- **Página full-screen:** `#detail` passou de painel 380px para overlay
  `inset:0` com gradiente (item compõe no terço esquerdo; PANEL_SHIFT 0.9).
  `pointer-events: none` fechado (bbox cobre o viewport mesmo transladado).
- **Nav auto-hide:** `translateY(-120%)` insuficiente com offset top 2rem →
  `translateY(calc(-100% - 2rem))`.
- **D2:** 152/152 enriquecidos (flash-free, 12 dispatches); merge automático
  no build_catalog (glob enrich-*.json); campos opcionais no CatalogItem;
  secções da página escondem-se sem dados.

### 2026-08-10 (4ª) — #7 Emergência + toggle cron/release + morph

- **Verificação:** contact sheet (6 frames), `frames3d --ordem` (novo: morph
  ida/volta + HUD/hash), one-off Playwright para detalhe de rolo em cron.
- **Erro 1 — emergência forte demais:** z=1.0 com câmara a 4.2 punha o item em
  foco a encher o viewport. Fix: z 0.6, tilt −0.08. Lição: amplitude de emergência
  mede-se em fração de ecrã, não em unidades de mundo.
- **Erro 2 — rolos intersectavam-se:** Ø3.0 (depois 2.0) > SPACING 1.7. Fix:
  r=0.8 (Ø1.6 < 1.7). Regra: formato novo tem de respeitar `2·r < SPACING`.
- **Erro 3 — colisões DOM:** 3.º grupo de botões empurrou a strip para cima do
  logo (nav ganhou wrap + max-width); `#detail` z 2→4 (ficava sob o `#nav` z 3).
- **Detalhe era-aware:** meta do dossiê usa `mesh.userData.format` (modo ativo),
  não `formatFor(releaseYear)` — First Avenger em cron lê `2011 · 1942–1945 ·
  ROLO DE CINEMA`. Quick path usa camZ 3.4 para rolo (2.2 para os restantes).
- **Morph:** scale out (0.25s power2.in) → swap geometria/materiais → scale in
  (0.35s power3.out); reorder sem mudança de formato = tween de x. Dispose:
  geometria + material da cover apenas (DARK partilhado; texturas na Cache).
- **Reduced-motion:** sem emergência; morph instantâneo.

### 2026-08-10 (2ª) — Quick path + overlay de detalhe

- **Verificação:** `frames3d.mjs --detail` (novo modo: click no centro → frame do
  overlay; carimbar+rating via DOM; Esc → frame de regresso; lê logs.v1 do
  localStorage para provar o formato).
- **Tudo verde à primeira:** tween ida/volta, disable/enable de ScrollTriggers sem
  conflito com o scrub, logs.v1 no formato legado exato, migração watched.v1.
- **Fixes pós-review (Kimi, 2 linhas cada):** clique fora do item fecha o overlay
  (estava na spec, builder omitiu); `PANEL_SHIFT` +0.35 em câmara+alvo para o item
  compor no espaço livre à esquerda do painel (shift em ambos = eixo perpendicular,
  sem distorção).

### 2026-08-10 — MVP estante MCU (57 itens)

- **Verificação:** `tools/frames3d.mjs` (novo — frames por % de scroll + contact
  sheet; o frames.mjs do legado não serve a app Vite). 6 frames olhados.
- **Erro 1 — prateleira azulada:** rim light frio `#7a8cff` a 0.5 incidia na tábua
  horizontal e lia-se como barra azul brilhante. Fix: rim 0.25 + material próprio
  para a tábua (`#141210`, roughness 0.95). Lição: luzes frias de rim em superfícies
  horizontais largas pintam-nas — materiais de mobiliário ficam mais rugosos.
- **Erro 2 — poster errado (dados, não render):** `Wonder Man` mostrava arte
  «Magnum» — o `poster_path` pt do TMDb (tv/198178) apontava para variante sem
  título/paródia. Fix manual: teaser oficial en top-voted
  (`/6yy9nQlFt2l6UVWzrfhszFCaZ5C.jpg`). Pendente: auditoria visual dos 152 posters
  quando entrarem as 12 estantes (este erro só se vê a olhar para frames).
- **FPS:** por medir — entra com stats.js (dev-only) na iteração da emergência.
- **Fora do orçamento (consciente):** ~60 draw calls (1 Mesh/item). Contratado:
  InstancedMesh por formato + atlas quando entrarem mais clusters. Marcado
  `ponytail:` em `src/shelf.ts`.
