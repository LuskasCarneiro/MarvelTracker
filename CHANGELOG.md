# Changelog

Dated log of what changed and why, so a new session can see the project's history at a
glance without re-deriving it from the diff. Newest first.

## 2026-08-12 (10ª sessão) — Filtros de percurso (VISTO / POR VER / TUDO)

- Hash 4.º segmento (`#/cluster/media/modo/filtro`, default `tudo`), grupo
  «Estado do percurso» no nav (reusa `.media`; 0 alterações de CSS).
- Filtro por subgrupo por **re-parenção** dos meshes da cache (sem duplicar
  geometrias; `restoreFilter` devolve ao cache); board mantém-se; `n` filtrado
  no span/percurso/scroll; vazio quando o filtro não tem resultados.
- Busca/percursos ligados fora do filtro ativo → recua para `tudo` antes de
  saltar. Verificado: 3/36/39, vazio X-MEN VISTO, dossiê por click no subgrupo,
  fim do scroll `PERCURSO 3/3`. Visual: filtro com 3 itens + board + hero OK.

## 2026-08-12 (9ª sessão) — Publish-ready + percursos ligados + commit Fase 3

- Commit `cbb0448` — Fase 3 completa na `feature/3d-shelf` (212 ficheiros).
- Publish-readiness: `vite.config.ts` `base: './'`; posters relativos
  (`covers/x.jpg` em vez de `/covers/x.jpg`) — deploy em subpath (GH Pages)
  passa a funcionar; meta description + og:title/description + favicon SVG
  data-URI. Verificado com `vite preview` (dist serve, covers carregam).
- PERCURSOS LIGADOS no dossiê (ver entrada do builder abaixo) — cross-links
  entre títulos via `references`; `jumpToItem` partilhado com a busca.

## 2026-08-12 (9ª sessão) — Percursos ligados (spec-links.md)

- `src/ui/detail.ts`: secção PERCURSOS LIGADOS. `relatedTo(current)` cruza o
  catálogo (`import catalog from '../data/catalog.json'`, mesmo import do
  wrapper) com `current.references`: match por palavra inteira
  (`\b…\b`, regex do título escapado), título normalizado minúsculas+sem
  acentos, séries com ` S\d+$` stripado, exclui o próprio, limita 4 na ordem
  de aparecimento no texto. Chips `.chip` `TÍTULO · CLUSTER` (CLUSTER_LABELS);
  secção escondida se 0 ligados; click → `onRelated(item)` (nova opção).
- `src/main.ts`: lógica do `onPick` da busca extraída para `jumpToItem(item)`
  (nav.setState + writeState + `setTimeout(80)` + scrollTo(slot)), que agora
  **fecha o dossiê** (`detail.close()`) — necessário no chip intra-cluster (o
  mount não corre). Busca (`initSearch(jumpToItem)`) e dossiê
  (`onRelated: jumpToItem`) partilham-na.
- `app.html`: `#detail-links-h` + `#detail-links` (CURIOSIDADES-style) e CSS
  `.chip` (borda `color-mix` do accent, hover borda sólida).
- `tools/check_links.mjs` (novo): Playwright one-off. Log abaixo. Build verde
  + `tsc --noEmit` limpo. Sem commits (regra da spec).

## 2026-08-12 (8ª sessão) — Busca no arquivo (spec-search.md, paridade legado)

- `src/ui/search.ts` (novo): `initSearch(onPick)`. Input `#search` topo-centro,
  estilo dossiê, normalização sem acentos (`\p{Diacritic}`), max 8 sugestões
  `TÍTULO — CLUSTER · FILMES/SÉRIES`, role=combobox/listbox/option,
  aria-activedescendant. Setas/Enter/Esc + click, fecha ao clicar fora. Termos
  pt-PT→EN (`doutor`→`doctor`, etc.) num mapa curado (ponytail: marca o teto).
- `src/main.ts`: `initNav` passa a devolver `setState` (nav.ts) — o pick da
  busca sincroniza botões do nav + hash e navega via o mesmo `onNav`. `onPick`
  salta para o slot: `scrollTo(p * (scrollHeight - innerHeight))` num
  `setTimeout(80)`; o snap do ScrollTrigger pose o hero + preview. Hide partilhado
  `#nav, #search` (scroll/mousemove/focusin).
- `app.html`: markup do input + `#search-results` + CSS (fixo topo-centro,
  `#search.nav-hidden { translate(-50%,-150%) }`, 70vw mobile, `:focus-visible`).
- `tools/check_search.mjs` (novo): Playwright one-off. Log:
  `[doutor]→'Doctor Strange — MCU · FILMES'`, Enter→`#/mcu/filmes/estreia`,
  preview `Doctor Strange`; `[loki]`→Loki S1/S2, Enter→`#/mcu/series/estreia`;
  `[venom]`→`Venom — SONY · FILMES`, Enter→`#/sony/filmes/estreia`; Esc fecha.
  `✓ check_search: PASS`. Build verde + `tsc --noEmit` limpo.
- Poster no dossiê (`#detail-poster`): gap mobile — o dossiê mobile é opaco e
  não mostrava imagem; agora a página tem a cover no topo (desktop também
  beneficia). Verificado: src `/covers/mcu-iron-man.jpg`, naturalWidth 342.


## 2026-08-10 (7ª sessão) — #11 a11y + fixes pós-review + spot-check D2

- #11 (flash-free): focus trap + aria-modal/labelledby no `#detail`, foco
  restaurado ao abridor, roving tabindex + setas/Home/End no nav, `visibility`
  no `#nav`/`#detail` fechados (sem focusables fora do ecrã), `:focus-visible`
  âmbar, `aria-hidden` sincronizado no `#preview`.
- frames3d: fix do hash duplicado com flags combinadas (`url.split('#')[0]`).
- Fix Kimi (bug pré-existente reportado pelo builder): `ScrollTrigger.refresh()`
  não dispara onUpdate com progresso igual → hero não voltava a palco nem o
  preview reaparecia após fechar o dossiê. Refactor: `applyHero(group, p)`
  partilhada por onUpdate/onClose/morph. Verificado com probe (preview volta ✓).
- `#preview-open` `tabIndex` -1 quando invisível.
- Spot-check D2 (6 clusters amostrados): factos corretos e verificáveis, voz
  dossiê, referências intra-Marvel. Qualidade aprovada.

## 2026-08-10 (6ª sessão) — #9 FPS dev-only + #10 covers 152/152 + #8 adiado

- `stats.js` dev-only (guard `import.meta.env.DEV` + `moduleSideEffects` no
  rolldown; 0 referências no bundle prod). `tools/fps.mjs` (medição Playwright).
  FPS headless (SwiftShader) ≈ 3–4 — software, não representativo; medição real
  pendente do owner no browser (stats visível só em dev).
- `tools/audit_covers.mjs` + 4 sheets em `tools/frames/covers/` — auditoria
  **152/152 corretas** (0 erros tipo Wonder Man).
- #8 (atlas + InstancedMesh + sharp) **adiado**: ≤62 draw calls por estante
  (uma de cada vez, ADR-0002) é trivial para iGPU real; o budget ≤20 era para
  renderização multi-estante que não existe. Revisitar se a estante >100 itens
  ou entrar multi-estante. Sem sharp instalado, sem shader, sem refactor.
- End-to-end final com todas as flags do frames3d: nav, vazio, morph ida/volta,
  hero+drag, dossiê completo com carimbo+rating (logs.v1 ✓). Tudo verde.

## 2026-08-10 (5ª sessão) — Hero levitante + preview + dossiê completo + D2

- Requisito owner: item focado **sai da prateleira e levita** no centro, com
  **drag-to-rotate** e card de preview (IMDb); nav auto-escondido; página completa
  com história/fun facts/referências; **`index.html` nunca é eliminado** (ADR/00).
- D1: `tools/imdb_fetch.mjs` — ratings IMDb reais via dataset oficial
  (151/152; Doomsday sem rating por estar por estrear). Campos no catálogo.
- A+B+C (Kimi build — flash-free falhou 2× e a escalação `general-luna` exige
  restart): nav auto-hide, `applyFocus`/`poseHero`/`unposeHero` (bob de
  levitação, snap por slot → hero centrado), drag-rotate com supressão de
  click-pós-drag, `#preview` card com nota IMDb, hooks `beforeOpen/onOpen/onClose`.
- E: `#detail` passa a **página full-screen** (gradiente sobre a cena, coluna
  direita): HISTÓRIA (longOverview), CURIOSIDADES (facts), REFERÊNCIAS, IMDb,
  carimbo+rating. PANEL_SHIFT 0.9.
- D2: conteúdo editorial gerado por flash-free (spec em /tmp/opencode/D2-SPEC.md)
  — **152/152** com longOverview/facts/references (enrich-*.json, merge no
  build_catalog). Voz dossiê TVA, regras anti-alucinação (sem box office/datas
  inventados; referências só intra-Marvel).
- Bug hard-won: `//` não é comentário CSS — 4 ocorrências partiam as declarações
  seguintes (z-index, pointer-events, transform) via error recovery do parser.
  Apanhado com probe `elementFromPoint` quando o `#detail` fechado interceptava
  cliques. Lição registada no 05.
- Frames3d: flag `--hero`. Tudo verificado visualmente (frames + probe).

## 2026-08-10 (4ª sessão) — #7 emergência por scroll + toggle cron/release + morph

- Build #6 (flash-free): `shelf.ts` — `geometryFor`, `buildShelf(items, mode)`
  (formato por ano efetivo), `applyOrder` (reordena + morph scale out/in com dispose
  correto: geometria + material da cover, nunca o `DARK` partilhado nem texturas),
  `applyEmergence` (z/tilt por distância ao foco), `SPACING` exportado.
  `nav.ts` — 3.º grupo ESTREIA/CRONOLÓGICA, hash `#/cluster/media/modo` (3.º
  segmento opcional). `main.ts` — morph in-place quando só muda o modo, reduced-motion
  desliga emergência/morph. `detail.ts` — z do item a 0 durante o quick path.
  `frames3d.mjs --ordem`.
- Revisão Kimi + 5 fixes próprios: emergência z 1.0→0.6/tilt 0.08 (item em foco
  enchia o ecrã); rolo r1.5→0.8 (Ø>SPACING intersectava rolos adjacentes);
  camZ 3.4 para rolo no detalhe; meta do dossiê mostra o formato do modo ativo
  (`2011 · 1942–1945 · ROLO DE CINEMA`); `#detail` z-index 4 (nav colidia com o
  painel); nav com wrap (3.º grupo de botões colidia com o logo).
- Verificação: contact sheet (emergência), `--ordem` (morph ida/volta, HUD/hash),
  detalhe de rolo em cron via Playwright one-off. Tudo verde.

## 2026-08-10 (3ª sessão) — storyYears, paleta por universo, nav multi-cluster

- `tools/apply_storyyear.mjs` — aplica os 22 storyYear do owner a `curated.json`
  (22/22, check runnable; 0 pendentes). Dados do era morph completos.
- Decisão: materialidade por universo (07 fechada; tokens na tarefa #6a).
- ADR-0002: uma estante visível de cada vez (lazy cache, hash deep-link).
- Build #5 (flash-free): `src/ui/nav.ts` (strip 12 clusters + toggle FILMES/SÉRIES,
  hash `#/cluster/media`), `main.ts` refatorado para `mount()` com cache de
  estantes, estado vazio; `detail.ts` com `close()` imediato + `getShelf()` getter.
  Bug apanhado em frames: estante abria a meio (scrub sem onUpdate inicial) →
  câmara posicionada explicitamente no 1.º item em cada mount.
- 1.º dispatch do build #5 devolveu vazio (falha silenciosa flash-free);
  redispatch idêntico funcionou. Registado no 08, sem escalação.

## 2026-08-10 (2ª sessão) — Plano de custos + quick path/detalhe/logs.v1

- `docs/08-model-plan.md` criado e aprovado pelo owner: builders/explorador em
  `deepseek-v4-flash-free` (grátis), Kimi K3 só para spec/revisão/visual, escalação
  para `gpt-5.6-luna` (decisão do owner) quando um builder falha 2×. Regra de ouro:
  só se delega quando brief << trabalho. Referenciado no CLAUDE.md.
- Build #2 (flash-free, spec completa): `src/data/logs.ts` (logs.v1 no formato
  legado exato + migração watched.v1), `src/ui/detail.ts` (quick path: raycast →
  tween GSAP, ScrollTriggers off durante o detalhe; overlay dossiê pt-PT com
  CARIMBAR PERCURSO + rating 1–10), painel em app.html, `userData.item` na shelf.
- `frames3d.mjs --detail`: click → overlay, carimbar+rating (logs.v1 verificado em
  localStorage), Esc → regresso ao PERCURSO certo. Fixes pós-review: clique-fora
  fecha; PANEL_SHIFT +0.35 para o item compor fora do painel lateral.

## 2026-08-10 — Fase 3 MVP: scaffold Vite + primeira estante 3D (MCU)

Pipeline de dados fechada e app viva pela primeira vez. Build delegado num agente
`general` (DeepSeek V4 Flash, binding confirmado em opencode.jsonc); Kimi ficou com
spec, revisão e verificação visual.

- `tools/build_catalog.mjs` — merge determinístico curated.json + tmdb-map.json →
  `src/data/catalog.json` (152 itens / 12 clusters; check runnable falha se faltar
  match, poster ou releaseYear). Nota: o progress dizia `catalog.js`; ficou JSON
  puro + wrapper tipado `src/data/catalog.ts` (`resolveJsonModule`) — artefato
  gerado sem lógica.
- Scaffold: `app.html` é a entrada Vite (o `index.html` da raiz continua a ser o
  legado — `vite.config.ts` aponta o build input). Stack exata do ADR-0001: three
  vanilla + gsap/ScrollTrigger, mais nada.
- `src/scene.ts` (1 key quente + 1 rim frio + ambiente, sem shadow maps, fog),
  `src/shelf.ts` (4 formatos era-aware procedurais com proporções reais do
  docs/02; cover com center-crop `fitCover`; 1 Mesh por item — marcado ponytail,
  atlas/InstancedMesh quando entrarem as 12 estantes), `src/main.ts` (scroll
  scrub da câmara ao longo de 57 itens MCU + HUD dossiê com contador PERCURSO n/57).
- `tools/frames3d.mjs` — sucessor do frames.mjs para a app nova (frames por %
  de scroll + contact sheet). playwright-core passou a devDep (chromium já estava
  em ~/.cache/ms-playwright).

Verificação visual (frames olhados, não inferidos): 2 defeitos apanhados e corrigidos
— prateleira azulada (rim frio a 0.5 na tábua horizontal → rim 0.25 + material
próprio rugoso/escuro) e poster errado do Wonder Man (variante «Magnum» no TMDb
para pt; substituído pelo teaser oficial top-voted, mesmo artwork com título certo).

`npx tsc --noEmit` limpo; build 696 kB (gzip 191 kB — three.js, sem code-splitting,
aceitável por agora). FPS por medir (stats.js dev-only fica para quando houver
emergência/InstancedMesh).

## 2026-08-09 (later) — tmdb_fetch: fix do matching por temporada

Full run anterior: 125 high / 23 low / 4 unmatched. Causa raiz única: temporadas S2+
eram pesquisadas com `first_air_date_year` = ano da TEMPORADA, mas o filtro do TMDb
casa com o ano de estreia da SÉRIE — o retry sem ano aterrava em podcasts, spinoffs
de webisodes e documentários, e a cache v1 ficou envenenada. Fix em
`tools/tmdb_fetch.mjs` (mesmo CLI, stdlib only):

- Temporadas agrupadas por `seasonOf`; cada série resolve UMA vez (ano = releaseYear
  mais antigo do grupo, retry sem ano se 0 resultados, pick por nome exacto
  `name`/`original_name` foldado com preferência ±1 ano) e as entradas mapeiam via
  `seasons[]`. Temporada ausente de `seasons[]` → só essa entrada vai a review.
- Query de filme faz strip de QUALQUER parentético final ("Hulk (Ang Lee)" → "Hulk").
- Especiais TV sem resultado em `search/tv` (Werewolf by Night, GOTG Holiday Special,
  Punisher: One Last Kill) caem para `search/movie`; match fica `tmdbType: "movie"`,
  forçado `low` para ir a review (self-check exige seasonAirYear ou review).
- Cache key bumpada para `sha1('v2|'+url)` — entradas v1 envenenadas ficam órfãs
  (a pasta NÃO foi apagada aqui; o orchestrator trata disso no full run).

Verificação: `node tools/tmdb_fetch.mjs --sample` em cache v2 fria →
`processed 8, high 8, low 0, unmatched 0, posters downloaded 8` e self-check verde.
Nota: o sample sobrescreve `tmdb-map.json`/`tmdb-review.md` (comportamento pré-
existente); o full run do orchestrator regenera-os.

## 2026-08-09 (late) — Phase 2 done: data pipeline live

Two builder agents + one fix pass produced the build-time data layer:

- `tools/extract_curated.mjs` — deterministically extracts `films`/`seriesItems`
  from legacy `index.html` (array-literal slice + eval, no LLM): 152 entries
  (82 movies, 70 seasons; 25 unsuffixed series normalized to implicit S1). IDs
  replicate the legacy `watchKey` scheme (`movies|Title` / `series|Title`) so
  `marvelVault.logs.v1` keeps matching. Surprise finding: a 12th cluster `f4`
  (Fantastic Four ×3) existed in the data but not in any docs — docs updated.
- `tools/tmdb_fetch.mjs` — TMDb matcher + poster downloader, sha1-url disk cache,
  50ms politeness, 429 backoff, stdlib only. First full run: 125 high / 23 low /
  4 unmatched. Root cause of nearly all failures: season entries searched with
  `first_air_date_year` set to the *season's* year, which can never match (the
  filter is on the show's FIRST air year) → retries landed on wrong shows and
  poisoned the cache. Fix: resolve each show once (grouped by `seasonOf`), map all
  seasons from one `/tv/{id}` call; strip any `(...)` from movie queries; TV→movie
  fallback for TV specials; cache bumped to v2.
- **Final run: 149/152 high confidence, 0 unmatched, 152 posters in
  `public/covers/`.** The 3 "low" are TV specials correctly matched as movies.
- `tools/data/`: `curated.json`, `tmdb-map.json`, `storyyear-review.md` (22 fuzzy
  story eras for owner curation — not blocking), `tmdb-review.md`.
- opencode config: `general`, `explore` and `small_model` bound to
  `deepseek-v4-flash-free` (pending opencode restart to take effect).

**State:** catalog data + covers ready. Next: Phase 3 — generate
`src/data/catalog.js`, Vite+TS scaffold, first instanced MCU shelf.

## 2026-08-09 — Pivot para 3D: fundações documentais

Owner dropped `improve.md`: replace the 2D TVA graph with an immersive 3D shelf
frontpage (press.stripe.com bar), era-aware physical formats (reel/VHS/DVD/Blu-ray),
TMDb as data source, multi-agent workflow, persistent docs structure. This session
executed the brief's "initial steps" only — **no app code yet**:

- Created branch `feature/3d-shelf`; `main` keeps the 2D app intact as rollback.
- Created `docs/00`–`07` + `adr/0001`: brief+decisions, architecture, design skeleton,
  TMDb pipeline (endpoints smoke-tested live — token valid, pt-PT works), auth
  placeholder, 3D contract (perf budget: 60fps, ≤20 draw calls, single 4096² WebP
  atlas, InstancedMesh per format), progress/resume file, open questions.
- Stack decided (ADR-0001): Vite + TS + **Three.js vanilla + GSAP**, no React/R3F —
  one immersive scene, text stays in DOM. The old zero-build rule is revoked.
- Data decisions: TMDb is **build-time only** (publishable, no shipped keys); curated
  pt-PT copy stays source of truth; series = one object per season (dataset already
  is); `storyYear` needs a numeric sibling — ~40 fuzzy labels queued for owner
  curation in Phase 2. Known key finding: `s` fields are fuzzy strings, not numbers.
- Logs/ratings: new app reads `marvelVault.logs.v1` as-is from day 1.
- CLAUDE.md rewritten for the 3D era (context kept, old constraints dropped).
- Obsidian findings note created at `Projects/Marvel Vault/` in the owner's vault.

**State:** docs foundation done. Next: Phase 2 — `tools/extract_curated.mjs` +
`tools/tmdb_fetch.mjs` producing `catalog.js`.

## 2026-08-06 (late) — Next-movie links on the two new panels

Owner's ask after seeing the two new panels: "missing: hyperlinks for the next movie."
The standard "Ver antes / Ver a seguir" lists already existed for both titles but sat
300–600 px below the visible note (the note is ~800 px tall, `#n-next` was at y≈1175–
1276), so the links were effectively invisible. The fix is a per-skin `data-nextlink`
slot filled from the same source as `#n-next` (`trackSeq[ti]` / `adjNext[n.id]`, via
`linkBtn(nodes[ni], 'próximo: ')`; `hidden` when the lane ends):

- **GOTG** — `.gx-next` top-right of the tracklist block (gold "próximo:" label,
  dim button, hover underline), panel-enter `gxInk`.
- **Hulk** — `.hb-next` inside the bottom foot strip (`.hb-foot`, margin-left auto),
  `hbCell` entry.

**Poster cover bug found and fixed.** The OMDb poster (natural 380×562) rendered
full-height inside the note and covered the dossier — hit-testing at the note centre
returned the `<img>`. Both skins now crop the poster to a plate
(`height:260px` GOTG / `290px` Hulk, `object-fit:cover`, top-aligned for Hulk), so the
sheet, the ficha and the foot stay visible. Both skins also hide the `.wl-b` brackets
on the standard lists and underline on hover, so those read as links too.

Verification: geometry, hit-testing (`elementFromPoint` → `#noteInner` at both slots)
and click-navigation (GOTG slot opened *Guardians of the Galaxy Vol. 2*) all pass;
`tools/check_intros.mjs` 8/8 OK. Caveat: headless Chromium screenshots do **not**
composite the transformed fixed note layer (opaque sheet backgrounds paint as
transparent, text does not) — the accepted Iron Man skin fails the same way, so this
is a capture artifact, not an app bug. Still worth a human look at the two panels.

## 2026-08-06 (night) — Guardians of the Galaxy and The Incredible Hulk join the deep pass

Two new centered-intro titles, each built from researched facts rather than memory:

**Guardians of the Galaxy — `mixtape` (2400 ms).** Quill's player is a **Sony TPS-L2**
(the first Walkman, 1979); the intro renders its real anatomy — transport keys along
the *top* edge, controls on the fixed body, and the cassette door as a **separate lower
panel** that hinges open (this anatomy took a redesign pass after the first version
swung the whole machine). The hero tape is a **TDK CDing 2** with a hand-lettered white
"AWESOME MIX VOL. 1" label; the dossier is clip-path-slot-clipped so it grows *out of*
the machine. The purple glow is the Power Stone, not the soundtrack insert art (that
art is only on the panel's J-card band, with the verified 12-song A/B tracklist — and
"Spirit in the Sky", which is trailer-only, is printed with a caveat rather than
invented).

**The Incredible Hulk — `heartbeat` (2000 ms).** Banner's heart-rate monitor (a
Polar-style wristwatch) is the whole concept: an ECG strip scrolls with its beats
growing closer, the readout climbs **072 → 096 → 124 → 163 → 200** (200 BPM is the
canonical threshold), then at 200 the watch flashes green, the camera kicks and the
dossier slams down out of the boom. The ECG strip is **generated** by
`tools/gen_ecg.mjs` (viewBox 802x120, beats accelerating to a final 200-spike at
x≈754–788, spliced into `MASK_HTML.heartbeat`) — never hand-typed. The panel is the
gamma-lab sheet: CONFIDENCIAL stamp, "sujeito Mr. Green — B. Banner", "limiar FC ≥
200 BPM", "local Roçinha · Rio", 158 days without incident (reviewer-observed figure,
printed with that caveat).

**Cascade bugs fixed along the way** (the classes the intros use must all sit inside
the shared `.mk-layer` wrapper, which already centres + gives perspective):

- Both intros originally defined their own `.mx-layer`/`.hb-layer` wrappers that never
  matched, so the mixtape's fade-out and the heartbeat's camera kick were dead CSS —
  the kick and fade now target `.note-stage.<key>-on .mk-layer`.
- The heartbeat readout's stagger was silently overridden twice by cascade
  specificity: the generic `animation` shorthand outbid the per-number
  `animation-delay` longhands (delays now ride inline `--d` vars, the house pattern),
  and the `:not(.hb-b1)` rule outbid the b5 alarm rule (b5's rule raised to
  `.hb-b1`-level specificity). The "200" alarm flicker now only starts at 1.32 s.
- `.hb-b1` (the resting "072") was being killed by the tick animation's `both` fill;
  it's now excluded from the tick.

Verification: `tools/check_intros.mjs` 8/8 OK, no console errors; frames + contact
sheets regenerated in `tools/frames/mixtape/` and `tools/frames/heartbeat/` (also
reduced-motion sets); pixel-verified states — door closed → label visible → machine
faded for mixtape, trace → flash → note for heartbeat. The one caveat: the session
model cannot view images, so the contact sheets still deserve a human look
(`tools/frames/{mixtape,heartbeat}/contact.png`).

## 2026-08-06 (evening) — The graph became a timeline

Owner's brief: full timeline rebuild, full creative liberty. See
`docs/superpowers/specs/2026-08-06-shell-and-graph-design.md`.

**The problem:** the graph numbered every node 1..39 and then placed those numbers at
random. It called itself a timeline and its own labels proved it wasn't one.

- **Lanes peeling off a spine.** Each universe is a lane that diverges from a spine
  (LINHA SAGRADA) at the year it begins. The force simulation is deleted; nodes ease
  toward targets derived from the data. Node dragging is deleted with it — positions
  mean something now, so dragging one would be a lie.
- **The axis follows the mode.** My first design had x always be the release year,
  on the grounds that the in-world chronology field is prose. **The owner overruled
  that and was right.** `parseChrono()` now reads it: plain years, ranges, `c. 2003`,
  `Natal de 2013`, `anos 80`, and `5000 a.C. – 2024`. Titles naming no year are
  **interpolated between their dated neighbours in the authored chrono sequence** —
  that order is itself the owner's chronology, so nothing is invented and nothing
  falls back to the release year.
- Two marks fall out of the parse: a **span bar** for titles covering a range
  (`1942–1945`), and a **dashed ring** where the year is approximate or inferred.
- `CHRONO_FLOOR` pins the one pre-1930 outlier to the left edge instead of letting it
  stretch the axis across a century of nothing.
- **The reveal.** A playhead sweeps left to right through the years on load and on every
  media switch: the spine grows, branches peel off as their first year arrives, nodes
  land as they are passed. The archive writes itself in chronological order.
- **Watched is now the node fill** (hollow = unseen), so progress across 152 titles
  reads at a glance; the VISTO stamp survives only above 1.15x where it is legible.
  **Rating is drawn for the first time**, as an arc of the node's circumference.
- Per-node ordinals cut — the axis encodes order now. Legend rewritten: it described
  the old visual language and had become wrong rather than merely redundant.
- **Shell**, by subagent: contrast lift across the palette (the sidebar was near
  illegible), display face Space Grotesk -> Archivo expanded, sidebar split into three
  tiers. The subagent rejected two of my prescribed token values that failed WCAG at
  2.7:1 and lifted them rather than shipping my numbers.

The six opening sequences are untouched and still pass 6/6.

## 2026-08-06 (later still) — Thor's hammer: the approach is baked, not scaled

**Why:** owner's note — "why is the hammer so flat, why didn't you animate it". It *was*
animated (30 baked frames, sprite advancing), but it read as flat, and three things
were wrong, all of them mine:

- **I baked the wrong thing.** The first bake rendered only the rotation and left the
  approach to CSS `scale()` — and the comment defended that as a virtue ("the sheet
  carries only what CSS cannot do"). Scaling a fixed-distance render is a flat zoom:
  no foreshortening, no parallax, so it read as a decal getting bigger. **The dolly is
  now baked** — the model travels toward a 46-degree lens, so the growth comes from the
  projection. The handle foreshortens and the head looms.
- **Apparent size under perspective goes as `1/(camZ - z)`,** so a linear dolly spent 24
  of 30 frames as a distant speck and did all its growing at the end. `zAt()` now solves
  z from a *linear apparent size*, and the hammer grows evenly across the approach.
- **Resolution.** Cells were 360x400 but the sprite was displayed at 1078x1197 by impact
  — 3x upscaled and visibly soft. Cells are now 720x800, rendered at 1080x1200 and
  downsampled for AA, and displayed 1:1. Sheet 180 KB -> 650 KB, which is the honest
  price of it being sharp.
- **The flash was erasing the hero frame.** `mix-blend-mode:screen` at full opacity over
  the hammer's biggest moment bleached the metal to a grey silhouette. Now peaks at .72
  and 60ms later.
- CSS keeps only the drift onto the impact point; the scale ramp is gone.

## 2026-08-06 (later) — Thor and Doctor Strange openings rebuilt with real assets

**Why:** reviewing the six openings, the owner's verdict was that Iron Man and
Homecoming are good, Ant-Man is disliked, The Avengers is "completely off", and Thor
and Doctor Strange have the right *ideas* but assets too crude to sell them — with the
explicit brief to **spend much more time on the assets**. Looking at both mid-intro
confirmed it: the portal was three stroked circles and read as a loading spinner; the
hammer was a flat grey rounded rectangle with three stripes.

**Scope:** Thor and Doctor Strange only. `shrink` and `assemble` were deliberately left
untouched pending a redesign brief, and `CLAUDE.md` now records that they are known-bad
rather than finished.

- **`tools/frames.mjs` was built first, before any art.** It dumps a sequence as still
  frames plus a contact sheet, with time **frozen** — every animation is paused and its
  `currentTime` set explicitly, rather than sleeping, so two attempts are actually
  comparable. This is the direct lesson of the eight-pass Iron Man mask: the failure
  there was reasoning about art instead of looking at it. It immediately earned its
  keep by exposing two bugs that reading the CSS had not.
- **Thor, new concept: Mjolnir is thrown at the viewer and breaks the screen.** The
  dossier turns out to be behind the glass and the shards fall off it. Replaces the old
  beat (the hammer shattering itself into ten wedges), which read as a grey pinwheel.
  This staging is **original to this UI, not a shot from the film** — noted as such in
  `themes.js` so a later pass doesn't relabel it "verified".
- **The hammer is now a real 3D model.** The owner supplied a Sketchfab GLB (1,550
  triangles, full PBR set including a normal map — CC-BY-4.0 by TheDevilsEye).
  `tools/bake_hammer.mjs` renders it offline through three.js + Playwright into one
  180 KB WebP sprite sheet, embedded in `index.html` and played back with `steps()`.
  **three.js runs at build time and is never shipped**; the app still loads nothing but
  `themes.js`. Blender was rejected for this machine — no discrete GPU means Cycles CPU
  only, ~20–50 min per bake attempt, versus seconds in the browser.
  - The sheet carries **only** the 3D turn; approach, scale and drift stay CSS
    transforms, which is why 30 frames covers the whole beat.
  - Each frame is recentred on its own alpha bounding box during compositing. Without
    that the sprite wandered around its cell, and since playback scales the cell ~2.4x,
    the hammer visibly missed its own impact point.
- **Doctor Strange: the rim stopped being a stroked circle.** It is now 170 individual
  filaments of uneven length, width, opacity and flicker period, each igniting at a
  delay set by its own angle — so the fire *chases a visible hot point* round the rim
  instead of animating itself. Plus a counter-rotating Kamar-Taj mandala, and the change
  that does the most work: the card is **clipped by `circle()`** as it rises, so it is
  genuinely cut off by the portal edge rather than glowing near it.
- **Two real bugs caught by the frame dumps, both the same root cause:** `animation-fill-mode:both`
  applies a keyframe's *from*-state during its delay, so the Thor shard web was fully
  drawn from 0 ms — the pane appeared already shattered before the hammer arrived. Fixed
  by keeping the base styles as the reduced-motion end state (cracks drawn, filaments
  lit) and giving the animated path an explicit hidden state plus `forwards`. The same
  pattern was applied to the portal filaments.
- Geometry for both is **generated, not hand-typed** (`tools/gen_glass.mjs`,
  `tools/gen_portal.mjs`, both seeded). The shatter is a radial + concentric
  tessellation, which is how glass actually breaks and also guarantees the 44 shards
  tile the pane exactly; 11 spokes because a prime count cannot read as a pinwheel.
- Durations: `mjolnir` 1640 → 2500, `slingring` 1900 → 2100. Thor was retimed after
  the owner noted the card opened too fast to let the shatter play: the approach went
  520 → 900ms and the card now arrives at 1.16s, after the cracks have spread and the
  shards have begun to fall, rather than on the impact frame.
- Repaired a self-inflicted file corruption along the way: the script splicing generated
  SVG into `MASK_HTML` used `/* ---- Ant-Man` as its end marker, and that comment exists
  **twice** (once in `PANEL_HTML`, once in `MASK_HTML`), so it matched the earlier one
  and duplicated ~180 lines including a second `const MK_PHOTO`. Caught by the page
  erroring on load in the harness.

**State at end of session:** 42/152 colour themes; 6 deep-pass, of which 4 are
considered good (Iron Man, Homecoming, Thor, Doctor Strange) and 2 await redesign
(Ant-Man, The Avengers). `check_intros.mjs` 6/6, no console errors. Both rebuilt
sequences verified under `prefers-reduced-motion: reduce`.

## 2026-08-06 — Verified the four unlogged treatments; fixed the stale-poster bug

**Why:** the 2026-08-05 session ended by launching a subagent to build four centred
film treatments and then **hit the session limit mid-run** (00:23). The agent's writes
landed at 01:13/01:22, after `CHANGELOG.md` was last written at 00:12 — so four
finished treatments existed in the code with nothing documenting them, and both
`CLAUDE.md` and `THEMES_CHECKLIST.md` still described the world as of two titles.

- **The four are complete and were verified running**, not just read: drove the app in
  headless Chromium (`playwright-core`; the bundled MCP server is pinned to a `chrome`
  channel that isn't installed on this machine, so the check is a ~40-line script
  instead). For each of the six deep-pass titles it opens the node, asserts mid-intro
  that `#noteStage` has `<key>-on`, `#note` has `<key>-arrive` + `note-centered`,
  `#maskLayer` is populated, `#panelDecor` is populated and `panel-<key>` is on both
  `#note` and `#noteInner` — then waits `INTRO_DURATION[key]` and asserts the stage
  class is gone and the mask layer is empty again. All six pass, no console errors:
  `ironmask` 2400ms, `webpull` 950ms, `assemble` 1780ms (The Avengers), `mjolnir`
  1640ms (Thor: Ragnarok), `slingring` 1900ms (Doctor Strange), `shrink` 1150ms
  (Ant-Man).
- **Fixed a real bug the screenshots caught:** opening a new title left the *previous*
  title's poster on screen until the new fetch landed — and permanently, if the new
  title had no poster. `renderOmdbCard()` does set `posterImg.hidden = true`, but
  `.posterwrap img{…display:block}` (and each panel skin's own poster override)
  outranks the UA's `[hidden]{display:none}`, so the attribute did nothing. Fixed once
  at the shared level with `[hidden]{display:none !important}` rather than per rule —
  every panel skin overrides that selector, so a per-rule fix would need repeating for
  each new skin. Confirmed in-browser: `display` now goes `block` → `none` on switch.
- `THEMES_CHECKLIST.md` was further out of sync than it looked: the header claimed
  41/152 but only **2** lines were actually ticked — the whole lote-1 colour pass was
  never carimbado. Cross-checked every registry key in `themes.js` against every
  checklist line and ticked the 40 that were missing (42/152 now, matching the 42
  entries in the file), plus a separate deep-pass count so the two ideas stop being
  conflated in one number.
- `CLAUDE.md`: the panel-skin and presentation-mode sections said "two exist" and
  "exactly one title has it". Both now carry a table of all six, with widths, intro
  durations and one line each on the actual beat, plus a note that adding a seventh
  needs only `MASK_HTML` + `INTRO_DURATION` + a CSS block.

**State at end of session:** 42/152 have a colour theme; 6 of those have the full deep
pass (panel skin + centred presentation + opening sequence). No known bugs outstanding.

## 2026-08-05 — Spider-Man: Homecoming gets its own opening sequence

**Why:** Iron Man had a `presentation:"centered"` + `intro` sequence; Homecoming didn't.
Asked for something for Homecoming too, explicitly **different** in kind, not a reskin
of Iron Man's mechanism — a web shot across the screen pulling the dossier to centre.

- Generalised the intro-management JS (`startMaskIntro`/`clearMaskIntro` in
  `index.html`), which previously hardcoded the `mk-on` trigger class, the
  `mask-arrive` class, and a flat 2400ms/620ms timer — all Iron-Man-specific. Now
  keyed per intro: `stage.classList.add(key + '-on')`,
  `note.classList.add(key + '-arrive')`, and an `INTRO_DURATION` map
  (`{ironmask:2400, webpull:950}`). Iron Man's own CSS selectors were renamed from
  `.note-stage.mk-on` to `.note-stage.ironmask-on` and `.mask-arrive` to
  `.ironmask-arrive` to match — verified its sequence still fires identically after
  the rename (same keyframes, same timing, just a different trigger class name).
- Added `webpull`: two SVG lines shoot in from opposite bottom corners of the screen
  and converge on the centre (~200ms), a small radial flash marks the "grab", three
  short strands fan out from the same point as if the web is anchoring (a further
  ~400ms), then the dossier itself arrives with a `translate`+`rotate` keyframe that
  overshoots slightly before settling — reads as pulled taut rather than just faded
  in. Total ~950ms, deliberately fast/kinetic against Iron Man's slow 2.4s cinematic.
  Every line uses `pathLength="1"` so a single `stroke-dasharray`/`dashoffset`
  keyframe (`wsShoot/wsStrand`, 0→1) works regardless of that line's actual angle or
  length — no per-line length math needed.
- Caught and fixed a real bug before shipping it: the stagger delays for the three
  `.ws-strand` lines were written as `:nth-child(2)`/`:nth-child(3)`, but those lines
  are DOM children 3–5 of their `<svg>` (after `.ws-shot`/`.ws-shot2`), so neither
  selector matched anything. Fixed to `:nth-of-type(4)`/`:nth-of-type(5)`.
- Confirmed the existing `.note.note-centered` positioning CSS and the mobile
  full-width override were already written generically (keyed on `note-centered`/
  `panel-x`, not on Iron Man's name specifically), so Homecoming picked up correct
  centred positioning and mobile behaviour with zero additional CSS.
- `themes.js`: added `presentation:"centered", intro:"webpull"` to the Homecoming
  entry, with a doc-comment addendum noting this is an original transition designed
  for this UI (web-shooting is obviously core to the character, but the specific
  staging — converging lines, anchor strands, pulled-taut arrival — isn't from a
  specific scene, and is labelled as such rather than implied to be verified).

**State at end of session:** two titles now have full deep-pass treatment (palette +
panel skin + presentation mode + opening sequence): Iron Man and Spider-Man:
Homecoming, each with a mechanically distinct opening. `INTRO_DURATION` and the
`key + '-on'`/`key + '-arrive'` pattern make adding a third straightforward — new
sequences don't need to touch the shared JS again, just add a key to `MASK_HTML`, a
duration to `INTRO_DURATION`, and the matching CSS block.

## 2026-08-04 (latest) — Stopped drawing the mask; used the real photo instead

**Why:** eight passes total on the Iron Man mask (six text-only, one built against a
render pipeline this session, seven overall counting this one) never converged on
"looks real" — because it was vector art trying to simulate a photograph. Every pass
that got closer was still fundamentally the wrong strategy. The owner cut through it
directly: supplied the actual reference photo with its background removed
(`Screenshot_From_2026-08-04_18-03-15-removebg-preview.png`, saved into the project
folder) and asked for it to be used instead of redrawn.

- `MK_PHOTO` in `index.html` is now that exact photo, base64-encoded in place (PNG,
  RGBA/transparent, optimised with Pillow, 380×526, ~180KB → ~240KB as base64). The
  file stays self-contained and offline-capable, same as every other embedded asset —
  this is a `PLACEHOLDER`-free real payload, not a reference to an external file.
- The animation mechanism is otherwise **unchanged**: still one asset (now an `<img>`
  instead of an inline SVG string) used twice, once per `.mk-plate` half via CSS
  `clip-path`; still hinged open by the existing `mkOpenL`/`mkOpenR` keyframes; still
  backed by the `.mk-cavity` reactor glow; still arrives centred via `mkArrive`. A new
  `.mk-glow`/`.mk-glow-l`/`.mk-glow-r` pair (positioned by estimated percentage over
  where the eyes sit in the photo) replaces the old SVG-fill `.mk-eye` element for the
  "eyes ignite" beat, since a flat photo has no fill to animate the way drawn shapes did.
- All pass-7 SVG-drawing code and CSS (`MK_DOME`, `mkDimple`/`mkStitch`, `MK_SHELL`,
  `MK_FACEPLATE`, `.mk-dome`/`.mk-seam`/`.mk-eyerec`/etc.) was deleted rather than kept
  alongside — one asset, one code path, nothing dead left to confuse a future session.
- `tools/render_mask.sh` (built this session for pass 7's SVG art) is now stale for
  this specific asset — there's nothing left to extract-and-rasterize, it's just an
  `<img>` tag. Left in place, not deleted: the extraction technique is real and would
  still be the right move if the mask (or anything else) ever goes back to procedural
  SVG art. Its usage comment should be read as historical for this element.

**State at end of session:** the mask is a photograph. "Does it look realistic" is no
longer a question this project can get wrong by drawing — realism regressed only if a
future pass reintroduces hand-drawn art here without being asked to.

## 2026-08-04 (earlier) — The Mark I helmet, fixed with a render in front of us

**Why:** the sixth pass on this element and the first one not done blind. Three
previous passes reasoned about the SVG source and shipped increasingly
sophisticated technique — userSpaceOnUse gradients, feDiffuseLighting plus
feSpecularLighting, an embedded CC0 photo texture — and the owner's verdict on
all of them was the same: it "looks bad, like a drawing made by a kid instead of
a mask done by Tony Stark". `tools/render_mask.sh` now rasterizes the real
SVG+CSS straight out of `index.html` to `/tmp/mask_static.png`, so this pass was
iterated against actual renders. **Rule going forward: run it and look at the
PNG before and after any change to this artwork.**

### The seven defects, each confirmed by looking

1. **Looked mirrored.** The standing diagnosis — that "one plate string clipped
   twice" structurally forces a mirror — is **wrong**, and worth recording so it
   is not acted on later: the two clips reassemble the *same single drawing*, so
   asymmetric geometry survives intact. It looked mirrored because it was drawn
   nearly symmetric. **No architectural change was made** (the split-open
   animation depends on that structure). Instead the silhouette became one point
   list, `MK_PTS`, from which the outline, the inset copy and the shell are all
   derived — no vertex matches its opposite (left cheek corner 16px higher, chin
   off-centre) — plus one-sided damage that cannot mirror: a riveted scrap patch
   on the right cheek, a raked gouge on the left, a bullet crater on the right
   temple, and different rivet counts per band.
2. **Eyes read as black-framed goggle lenses.** Now narrow wedges tapering to a
   point at the nose with the inner end lower; the recess is ~1.3px larger than
   the light so the black reads as cut thickness, not a border; the light is a
   gradient inset *inside* the hole.
3. **Mouth was a flat black rectangle.** Now a real grille: recess, darker box
   behind, seven hand-cut bars of differing widths each with a lit left and
   shadowed right edge, in a torched aperture with dark upper / lit lower lip.
4. **Silhouette was an egg.** Redrawn: wide flat chamfered crown, straight
   temples, hard cheek corners, trapezoid jaw to an almost flat chin. The shell
   behind was pulled in (1.075 → 1.05) and darkened — its pale rounded halo was
   putting the egg back outside the faceplate.
5. **Photo texture was a faint grey haze.** The missing variable was contrast,
   not amount: new `#mkTexC` / `#mkTexC2` filters apply a linear ramp *pivoted on
   128* (the neutral point of `overlay`), so pits go darker and striations
   brighter with zero tint. **And the real flatness bug:** `.mk-grain` and
   `.mk-warp` were painted at normal blend — a filter outputs an *opaque* lit
   relief, so at plain alpha they averaged every pixel toward one grey and
   erased the form shading, which is what made the face read as pale stucco.
   Both are now `mix-blend-mode:overlay`.
6. **The stray amber blob is gone.** `#mkRust` and its two blooms deleted. What
   replaced them have causes: a carbon scorch fanning off an actual bullet
   crater, and a rust weep running downhill from a named chin rivet.
7. **Welds read as sewing-pattern cut lines.** Added `.mk-weld-halo` (the
   brown-black oxidation a hand-run bead burns around itself) and
   `.mk-weld-rip` (ripple highlight on a different dash period and offset so
   the two never align); the bead itself is heavier and on an irregular
   six-value dash array instead of one repeated pair.

Also: the nose ridge stopped getting the full weld bead down both sides — it is
a fold, not a join, and with the bead it rendered as two black bars. It gets a
thin scored edge now.

### Not touched

The six `@keyframes`, the 3D hinge, the dolly-through, `mask-arrive`, the
620ms/2400ms one-shot timer, `clearMaskIntro()`/`startMaskIntro()`, the three
close paths and the reduced-motion static frame are unmodified.
`presentation:"centered"` is still on exactly one theme entry (Iron Man);
Homecoming and the other 150 titles are unchanged. Both files pass the
`new Function(...)` parse check.

`tools/render_mask.sh` had two hardcoded CSS anchor strings (`.mk-grain{opacity:.3;}`
and `.mk-shellbody{fill:#2c3135;}`) that broke when those values changed; they
now match on the selector prefix instead of the whole declaration.

## 2026-08-04 (earlier) — The Mark I helmet gets a real material and real form

**Why:** third round on this same element. Twice the owner said the helmet
"doesn't look real enough"; asked to pin it down, they selected *both* offered
causes — the shapes read flat/cartoonish, **and** the material read as a vector
drawing rather than as steel. On technique the instruction was "do what produces
the best result", explicitly including permission to break the project's
"no external assets" convention if an embedded photographic texture would land it.
It would, so it was broken — once, deliberately, and documented.

**Scope: material and geometry only.** The six `@keyframes`, the `.mk-on` rules,
`mask-arrive`, `clearMaskIntro()`/`startMaskIntro()`, the one-shot timer and its
620ms/2400ms constants, the three close paths, and the reduced-motion static
frame were not touched. `presentation:"centered"` is still on exactly one theme
entry (Iron Man); Homecoming and the other 150 titles are unchanged.

### The material — one embedded photograph, licence checked before use

- **Source:** ambientCG **"Metal052C"** colour map, via Wikimedia Commons
  (`File:Metal052C 8K-PNG Color.png`). **Author:** ambientCG / Lennart Demes,
  <https://ambientcg.com/view?id=Metal052C>. **Licence: CC0 1.0 Universal
  (Public Domain Dedication)** — verified by reading the Commons file's own
  licence metadata (`LicenseShortName: CC0`, `UsageTerms: Creative Commons Zero,
  Public Domain Dedication`), not assumed from the site's reputation. CC0 imposes
  no attribution requirement; the credit is recorded in `themes.js`, in a comment
  beside the payload in `index.html`, and here, so provenance is traceable in-tree.
- Chosen over the other CC0 candidates (Metal051A/052A were near-clean sheet,
  MetalPlates006 was a stamped pattern, Rust004/MetalWalkway014 were too rusted)
  because 052C is pitted, scratched, grimy bare steel — the scavenged look.
- **Processed to stay small and to blend correctly:** greyscale, 320×320,
  auto-contrasted and unsharp-masked, then shifted so the **mean is exactly 128**
  and contrast damped to 86%. Mean-128 is the point of it — 128 is the neutral
  value of the `overlay` blend, so the photo *modulates* the steel gradients
  underneath instead of tinting or covering them. ~25 KB, ~33 KB as base64;
  `index.html` went 153 KB → 209 KB, of which the payload is 16%.
- **Baked in as a data URI**, so this is a one-time authoring fetch: there is
  still no runtime network dependency and the app still works from `file://`.
- **Declared once, used four times.** The faceplate SVG is emitted twice, so an
  inline `<image href="data:...">` would have put five copies of the payload in
  the DOM on every open. It is instead one `<image id="mkTexImg">` in the shell's
  `<defs>` (emitted once) pulled in by `<use>` — verified: the DOM holds exactly
  one copy. Each `<use>` is wrapped in a `<g clip-path>` rather than carrying
  `clip-path` itself, because clip-path directly on `<use>` did not clip reliably.
- Two overlay passes at very different scales, one rotated a half turn, so they
  cannot correlate into a visible repeat.
- **Real specular response.** `mkRough` was diffuse-only, which gives a rough
  *surface* but not *metal*. The same noise field is now lit twice —
  `feDiffuseLighting` for the body of the relief plus `feSpecularLighting`
  (exponent 24) for hard glints — and the two summed. Frequency made anisotropic
  so the tooth runs with the brush direction. New `mkWarp` filter: very
  low-frequency lit noise for the broad dishing of hand-beaten sheet.
- **Fake environment reflection** (`mkEnv`) with a hard horizon — cool sky, a hot
  glint, dark ground. Standard real-time-graphics cheat; metal is defined by what
  it mirrors, not by its colour.

### The form — it was a lighting-model bug more than a shape bug

- **The single biggest fix:** the steel gradients were on the `objectBoundingBox`
  default, so **every plate normalised its own light→dark ramp to its own box** —
  the face was six independent little drawings, which is exactly what "looks like
  vector art" means. Now `userSpaceOnUse`, pinned to face space: one light
  direction, ramp continuous across the seams.
- **The four plate seams were straight polylines.** A band wrapping a convex head
  does not project as a straight line, and four horizontal rules across a face is
  the signature of a flat plane that no amount of grain can undo. They are now
  quadratic arcs (`MK_S1`…`MK_S4`), defined once and shared by the plate fills,
  the weld beads and the contact shadows so they cannot drift apart. Control
  points chosen so each curve still passes through the old centre vertex —
  plating, rivets, eye slots and mouth all stayed where they were.
- **Form shading painted OVER the material,** not under it: material laid over
  form flattens the form, which is what went wrong before. A cross-face curvature
  ramp (`mkForm`, 11 stops), a vertical ramp (`mkFormV`), and two cheekbone
  volumes — with **one narrow highlight band and a long falloff**, replacing the
  broad bright middle that was making the whole centre of the face one value.
- **Plate tone is now assigned by form rather than by alternation:** crown mid
  (rolling back over the skull), brow proud, eye band recessed under the brow,
  lit-side cheek proud, shadow-side cheek mid, jaw falling away.
- **Thickness.** New bevel ring — the evenodd area between the silhouette and
  `MK_INSET` (an inset copy scaled 0.935 about the face centre) — lit where the
  cut edge faces the light and black where it turns away. The single uniform rim
  stroke it replaces is what made the mask read as a cutout. The silhouette also
  split into a **near** edge (upper left, specular) and a **far** edge (right and
  lower, receding into black).
- **Hard contact shadows** under every plate overlap: three stepped strokes with
  falling opacity, not a blurred drop shadow, because real metal on metal casts a
  shadow that starts tight against the edge and the crisp inner edge is the part
  the eye reads. A separate `mkContactV` steps sideways for vertical edges —
  stepping the nose ridge downward had been smearing its shadow *along* the edge
  and making the proud ridge read as a groove.
- **Nose ridge** became two facets meeting on a crest, and its specular crest line
  moved just off centre — the split line had been painted over it, so the
  brightest line on the face was rendering as the darkest.
- **Eye slots** narrowed from tall rectangles (which read as goggles) to genuine
  slits, and both they and the mouth gained a lit lower lip — the one edge of a
  cut that light can actually reach.
- The shell behind the faceplate gets the same photo and the same curvature ramp,
  since the moment the plates hinge open the sequence would otherwise expose a
  flat untextured silhouette at exactly the wrong beat.
- Steel ramps darkened overall and `mk-sheen` cut .45 → .2: it was a third broad
  diagonal wash competing with `mkForm`/`mkFormV`/`mkEnv` and cancelling into mush.

**Verified without a browser** (none available): both files parse (`new Function`);
the generated mask markup has balanced containers; all 18 ids are unique — the
constraint that matters, since the faceplate SVG is emitted twice; every
`url(#…)` and `href="#…"` reference resolves; every class used has a CSS rule;
no warm hex crept back into the Mark I palette. The artwork was additionally
**rendered to PNG with `rsvg-convert`** as a standalone SVG and inspected, plus
pixel-sampled across the face to confirm the form ramps were actually producing
falloff rather than just being declared — which is how the flat-slab centre and
the inverted ridge were caught. `<use>` also carries `xlink:href` alongside
`href` as compatibility insurance.

## 2026-08-04 — The helmet is now the MARK I, not a generic Iron Man helmet

**Why:** owner feedback on the previous entry's sequence — the mechanics were right,
the artwork wasn't. The helmet that shipped was a gold-gradient faceplate on a dark
red shell with smooth curves and a machined jaw grille: that is the Mark III's
show-car look, on the one film whose entire premise is that the suit is scrap welded
together in a cave. Asked for specifically: "the mask to be based on iron mans first
suit being that this is the first iron man."

**Scope: artwork only.** Timing, the 3D hinge, the dolly-through, the arrival, the
one-shot timer and its teardown, the three close paths, `opts.intro` replay gating,
and the reduced-motion path were not touched. `presentation:"centered"` is still on
exactly one title (Iron Man); Homecoming and the other 150 are byte-identical.
Verified after the edit: both files parse (`new Function`), the generated mask markup
has balanced containers, every class it uses has a CSS rule, and every gradient /
filter / clipPath id appears exactly **once** in the output — the constraint that
matters, since the faceplate SVG is emitted twice and any id inside it would collide.

- **Researched first, not remembered** (WebSearch, sources cited in the doc comment
  above `MK_FACEPLATE`): the Mark I is documented as deliberately designed to look
  built from spare parts — scrap metal, missile casings, machine components — crude
  because of the tools available in the cave; iron/copper/magnesium alloy; practical
  suit by Stan Winston Studios; replicas of the helmet finished in **plain silver
  steel**. And the asymmetry turns out to be a design fact, not a stylistic tic: the
  suit is armoured more heavily at the front than the back because Stark spent his
  scrap where he expected to be shot at.
- **Said plainly rather than fudged:** the centre-split faceplate is a *later-suit*
  mechanism. Replicas built from the actual prop describe the Mark I helmet as hinged
  at the **top** for removal and fastened at the sides. The split is kept anyway — the
  transition needs an aperture for the camera to travel through — but it is now
  labelled a **dramatisation** in both doc comments instead of being presented as
  verified. The shell gained the side fastening tabs as the nod to how it really shut.
- **What actually changed in the drawing:**
  - **Palette.** `mkGold` deleted. Three steel gradients (`mkSteel` / `mkSteelDk` /
    `mkSteelLt`) so a panel's value depends on whether it sits proud of, flush with,
    or behind its neighbour — which is what makes overlapping plate read as plate
    rather than as lines drawn on a shell. Shell went dark red → bare `#23262a`.
  - **Construction.** One smooth bezier shell became **six hand-cut plates** welded
    over a base plate, plus a blunt raised centre nose ridge. Straight cuts and
    chamfers, no curves. Left and right differ by a few px at **every** vertex; since
    the drawing is used once and clipped per half rather than mirrored, the asymmetry
    survives the split — the left half genuinely is a different piece of steel.
  - **Surface.** An `feTurbulence` + `feDiffuseLighting` relief clipped to the
    silhouette for a hammered, pitted finish; a raked specular band; two hammer dents
    (dark on the lit side, bright on the far lip); two oxide blooms.
  - **Welds and rivets.** Panel joins are dashed heavy dark beads with a broken light
    bead riding on top — the ripple of a hand-run weld, not a machined panel gap. 24
    rivets (20 on the face, 4 on the shell tabs) at irregular spacing and radii
    2.5–3.6, each with its own shadow and an offset highlight consistent with the
    surface's assumed light. None sit in x 143..157: a rivet bisected by the split
    would read as a rendering fault.
  - **Eyes and mouth.** The swept lens became two short, plain, **mismatched** slots
    cut *through* the plate onto a dark recess. The machined jaw grille became one
    crude cut slot in a bolted lower plate.
- **prefers-reduced-motion still correct:** with no `mk-on` class nothing animates, so
  the static frame is the plate untransformed (closed), `.mk-cavity` at its default
  `opacity:0` (dark behind), `.mk-eye` at its default `.92` (lit) — the improved
  helmet, closed and lit, torn down after ~620ms exactly as before.

## 2026-08-04 — Per-film presentation mode + the Iron Man helmet sequence

**Why:** the rebuilt panel skins landed. The brief for this pass was explicitly
*not* "make the site coherent" — the owner wants the opposite: "I want it to be
movie dependant… I want it to have a feeling like I am always discovering
something." So the way a dossier *opens* becomes part of a film's identity, opt-in,
one title at a time. Plus two scoped polish items on the two films that already
have skins.

- **Presentation mode — a third optional field, `presentation:"centered"`.** When a
  theme entry carries it, `applyPanel()` puts `note-centered` on `#note` and turns on
  a new `#noteStage` behind it: the dossier lifts out of the flex row
  (`position:fixed`, centred) and the room goes dark around it. When the field is
  **absent** — every title except Iron Man, Spider-Man: Homecoming very much
  included — not one of the new selectors matches, `#noteStage` stays
  `display:none`, and the panel is the same right-docked sliding drawer it has
  always been. Centring uses the `translate` property rather than `transform`, so
  `transform` stays free for the arrival animation. The backdrop starts below the
  52px titlebar on purpose, so the Filmes/Séries/Registo tabs stay clickable — tab
  switching is one of the three close paths and must not be sealed off by an overlay.
- **Iron Man's opening — `intro:"ironmask"`.** Clicking the node no longer just
  slides a panel: the Iron Man helmet resolves out of the dark, the eye slits ignite,
  the faceplate splits down its centre line and the two halves hinge outward, the
  cavity behind them floods with reactor light, and the camera is pulled *through*
  the opening (the rig runs away on Z inside a `perspective`d layer while it scales
  past the frame), resolving into the dossier arriving centred. All inline SVG: one
  faceplate drawing (angular plate, two slits, brow ridge, jaw vent, chin seam,
  centre split) used **twice**, each copy clipped to its own half so the split
  registers exactly; the hinge is a real 3D transform on the wrapping `<div>`s,
  because 3D support on SVG groups is uneven. The fade sits on the perspective layer,
  not the rig — an element with `transform-style:preserve-3d` and `opacity < 1` is
  forced flat, which would have collapsed the open plates mid-shot.
- **Interruption and cleanup.** The intro is a one-shot with a single timer. Every
  route out — ×, Escape, clicking the backdrop, jumping to another title via
  "ver a seguir", switching media tab, opening Registo — goes through `applyPanel()`,
  which unconditionally calls `clearMaskIntro()` (cancel timer, empty the mask layer,
  drop `mask-arrive`) and then rewrites the stage's `on` class, exactly like the
  existing className rewrites. So a half-played sequence can never leave an overlay
  on screen. The three close paths were also collapsed into one `closeNote()` —
  they were duplicating the same four lines, and Escape had already drifted out of
  sync with the × button once before (see the earliest entry below).
  `opts.intro` gates replay: `openNote()` re-runs on the *same* node when you mark it
  seen or change sort mode, and a 2.4s cinematic on those would be obnoxious.
- **prefers-reduced-motion:** the helmet is still shown — closed and lit, which is the
  recognisable image — and is torn down after ~620ms instead of ~2.4s. The beat is
  kept, only the motion is dropped. Same principle as the panel reveals.
- **Two polish items, SCOPED to Iron Man + Homecoming only** (the shared rules other
  titles depend on are untouched):
  - **Poster shown whole.** The shared `.posterwrap` is `aspect-ratio:2/3` +
    `max-height:220px` + `object-fit:cover`, i.e. a cropped thumbnail. Under
    `.panel-ironman2008` the box takes the image's own shape and the poster is
    mounted like a photographic plate pinned to the drawing (cyan rule, registration
    ticks at the corners); under `.panel-homecoming` it's taped into the notebook —
    white photo border, a degree off square, two strips of tape.
  - **"Ver antes / Ver a seguir / Desvios" redesigned.** `fill()` and the crossover
    loop now build their links through a shared `linkBtn()` that emits the `[[ ]]`
    brackets and the "liga a / entra de" prefix as their own spans, and tags each
    `<li>` with `data-dir`. Default output is character-for-character what it was and
    no default CSS targets the new classes — it exists so a skin can hide the
    brackets and lay the reference out as real UI. Iron Man's are instrument readouts
    (bordered rows, cyan leading tab, directional glyph, slide on hover); Homecoming's
    are small yellow notes stuck in the margin, tilted, with a hand-drawn arrow.

**Verified by reading the code paths** (no headless browser here): a title with no
`panel` and no `presentation` gets `cls=''`, `centered=false`, an empty `#panelDecor`,
no `panel-enter`, and a `#noteStage` that is switched off — byte-identical behaviour
to before. Homecoming keeps its drawer: it has `panel` but deliberately no
`presentation`, so it was given no centred mode in this pass.

**State at end of session:** 41/152 titles have a color-only theme, 2 of those have a
panel skin, 1 of those 2 additionally has a centred presentation with a bespoke
opening sequence. Next step, if this lands: decide which *other* film earns its own
way of opening — the mechanism is now generic (`presentation` + `intro` keys), the
cost is designing the sequence.

## 2026-08-04 (later) — Panel skins rebuilt from scratch: the panel itself changes, not its wallpaper

**Why:** the first deep pass was rejected twice for "not nearly enough wow factor."
Diagnosis: it was decoration bolted onto an unchanged shell. Both films got small
accents (a faint grid, a 54px pulsing dot, two rotated sticker divs) drawn *inside* the
same 392px manila card everyone else gets. No amount of extra pattern fixes that — the
shell had to change. So the previous concepts were discarded and rebuilt, not tuned.

- **Iron Man (2008) — the drafting sheet from the cave.** The panel stops being a
  manila case file for this title: dark scored steel with an ember glow from the forge
  in the bottom corner, the entire interior inverted to light-on-dark (heading, tags,
  meta table, body, OMDb card, rating widget, watch toggle — all overridden under the
  `.panel-ironman2008` prefix), the panel widened 392px → 452px, and film-specific
  heading typography (wide-tracked stencil caps on a drawn rule with dimension ticks).
  The art is a real inline-SVG technical drawing of the miniaturised arc reactor —
  concentric rings, ten coil segments, crosshair axes, dimension leaders with tick ends,
  callouts — which **draws itself in stroke by stroke** on open (per-path
  `--dash`/`stroke-dasharray`), then the core ignites and one HUD sweep runs down the
  sheet. Title block at the foot, stencilled like a Stark weapons crate.
- **Spider-Man: Homecoming — a page from Peter's Midtown notebook.** The sticker-sheet
  metaphor was **dropped entirely**: it described how the Blu-ray was packaged, not the
  film. Now: cheap bright notebook stock instead of manila, feint blue rule, red margin
  rule, three punched binder holes down the left edge (panel narrows to 372px, left
  padding shifts to clear them), Midtown letterhead across the head of the page, the
  title swiped through with a yellow study-guide highlighter, a ballpoint web doodled
  out of the top-right corner as **real SVG geometry** (radials + sagging quadratic
  spirals, replacing the conic/radial-gradient fake), the mask Peter drew in his own
  margin, and the Vulture's salvaged wings rising across the bottom of the page over the
  homework. On open a web line snaps taut and the page swings in under it and settles.
- Both reveals are written as animations layered over rules that already hold the final
  state, so `prefers-reduced-motion` loses the movement and keeps every bit of the
  artwork — nothing is hidden behind an animation.
- **Shared changes (three, all verified inert for the other 150 titles):**
  - `.panel-decor` moved from `z-index:-1` to `z-index:0`, with
    `.note-inner > *:not(.panel-decor){position:relative;z-index:1}`. The old value put
    the decor layer in the *root* stacking context's negative layer — i.e. behind the
    opaque `--paper` background — which is part of why the first pass read as faint.
    For a title with no `panel:` field `#panelDecor` is empty and backgroundless, so
    nothing renders either way.
  - `applyPanel()` now puts the panel class on `#note` as well as `#noteInner` (so a
    skin can set its own open width) and re-adds a `panel-enter` class after a forced
    reflow, so the reveal restarts when jumping film-to-film via the "ver antes / a
    seguir" links without closing the panel. Both class assignments are full rewrites,
    so a previous skin can never leak onto the next title, and `resetTheme()` (which
    every close path already calls) clears them.
  - The crossover-rationale `<p>` under "Desvios" moved from an inline `style` attribute
    to a `.xwhy` class with identical declarations — inline styles beat stylesheets, so
    a dark skin could not otherwise recolour it.
- Verified references refreshed via web search and written up in the doc comments above
  both entries in `themes.js`, with an explicit split between what's checkable about the
  film (arc reactor built in the cave from Ten Rings/Stark-missile salvage, its 3 GJ/s
  output, the Mark I blueprints drawn in the cave; Midtown's Academic Decathlon winning
  nationals in D.C. and the Washington Monument rescue, Toomes' Chitauri-salvage
  exo-suit built by the Tinkerer after Damage Control pushes his crew out) and what is
  our own invention (the drawing's exact geometry, the notebook prop, all pt-PT copy).

**State at end of session:** unchanged counts — 41/152 titles have a color-only theme,
2 of those additionally have a panel skin. What changed is the ambition of those 2.
Next step, if these land: decide whether a third title earns this treatment, knowing the
cost is now "design a bespoke shell", not "pick two colors".

## 2026-08-04 (earliest) — Deep-pass theming for 2 flagship titles + env/project infra

**Why:** the first theming pass (41 titles, color-only) was judged too conservative —
"nobody is going to be wowed." Asked to go much further on a small number of titles
first, prove the approach, before considering scaling it.

- Added a second theming layer: bespoke **panel skins** (`panel:` field in `themes.js`
  entries + `.panel-*` CSS + `PANEL_HTML` markup), distinct from the existing
  color-only theme that already applies to all 152 titles. Built two:
  - **Iron Man (2008)** — cave-workshop blueprint grid overlay, a pulsing arc-reactor
    glow (respects `prefers-reduced-motion`), a Stark Industries/Jericho weapons-crate
    placard quoting the actual presentation line. Details verified via web search
    against the film's cave-workshop and Jericho-missile-demo scenes (Wikipedia, IMDb,
    GameSpot Easter-eggs writeup) — see the doc comment above the "Iron Man" entry in
    `themes.js`.
  - **Spider-Man: Homecoming** — a spiderweb corner pattern (pure CSS, layered
    `repeating-conic-gradient` + `repeating-radial-gradient`, no image asset), two
    rotated sticker-style badges (a MARVEL STUDIOS ribbon — the one verified constant
    across MCU physical media — and an in-fiction "HOMEMADE SUIT ERA" badge, explicitly
    *our* annotation, not a claim to reproduce an unverified real sticker), and a
    Stark-internship ID badge referencing the "Training Wheels Protocol." Verified via
    web search against the homemade-suit-from-Civil-War detail, the teaser posters'
    deliberately mundane/teenage tone, and a retail listing confirming physical combo
    packs shipped with a sticker sheet — see doc comment above that entry.
- Fixed a real bug found in review of the previous session's work: pressing **Escape**
  to close the note panel didn't call `resetTheme()`, so the live theme (colors) stuck
  to whatever film was last opened instead of reverting to the Marvel-red default. The
  `#nclose` click handler did call it; the keyboard path didn't. Now both do.
- Tightened the OMDb stale-fetch guard to also check `mediaKey`, not just title text —
  closes a latent (currently unreachable, since no title collides across
  movies/series) race where a slow response for one tab could land in the other.
- Added `.env` support: `OMDB_API_KEY=` in a real `.env` file, loaded via `fetch()` at
  startup — only works when served over http(s)://, so it silently no-ops and falls
  back to the existing sidebar key box when opened via file://. Documented the
  distinction clearly in-app (sidebar hint text) and in `README.md`.
- Set up project infrastructure for session continuity: this file, `CLAUDE.md`,
  `.gitignore` (excludes `.env` and `.venv`), and an empty `.venv` (stdlib-only for now
  — just for running `python3 -m http.server`, no packages needed yet).

**State at end of session:** 41/152 titles have a color-only theme; 2 of those 41
(Iron Man, Spider-Man: Homecoming) additionally have a deep-pass panel skin. Everything
else is on the cluster-color fallback, which is intentional, not unfinished-and-broken.
Next likely step, if the two-title approach lands well: decide which titles earn a
panel skin next, and whether the "sticker badge" language should stay Spider-Man-only
or become a recurring device for other physical-media-era titles.

## 2026-08-04 (earlier) — TVA redesign + OMDb/logs/rating feature set

- Reskinned the whole app from a generic dark-mode UI into a TVA (Time Variance
  Authority) case-file terminal: amber/brass palette, folder-tab navigation, a
  manila-paper note panel, a red-string crossover motif, a rubber-stamp "watched"
  interaction, and a branching-timeline entrance animation.
- Merged what had been two separate single-file apps (a movies graph and a series
  graph, both living in the user's Google Drive) into one app with a Filmes/Séries
  tab switcher, carrying over the more advanced of the two feature sets (chrono/release
  mode toggle, "Percursos" curated watch-order tracks) to both.
- Restructured from a single HTML file into this directory (`marvel-vault/`) and added:
  OMDb integration (poster, IMDb rating, Rotten Tomatoes score, cast, plot — via a
  user-supplied free API key, cached in localStorage), a 1-10 user rating widget shown
  once a title is marked watched, a watch-date-stamped log, and a "Registo" tab showing
  all logged titles (movies + series combined) as a sortable card grid.
- Split per-title visual theming into its own file (`themes.js`) with a
  `THEMES_CHECKLIST.md` tracking which of the 152 titles have a bespoke entry, so the
  work can proceed in chunks across sessions instead of one unsustainable pass.
- Default (nothing open) theme changed to Marvel-logo red, per explicit request;
  opening a themed title's card shifts the whole UI's accent/wash to that title's
  palette, then eases back to red on close.
