# 08 — Plano de Modelos & Custos

> Regra de routing tarefa→modelo + backlog mapeado. **Mudanças de rumo registam-se
> aqui primeiro** (owner revê antes de cada fase). Contexto: a fatura é o Kimi K3;
> o tier `opencode/*-free` é grátis. Objetivo: Kimi só toca no que exige raciocínio
> ou olhos — tudo o resto é delegado ou scripted.

## Modelos disponíveis (verificado 2026-08-10, `opencode models`)

| Uso | Modelo | Custo |
|---|---|---|
| Orquestrador (esta sessão): specs, revisão, decisões, visual | `opencode-go/kimi-k3` | pago |
| Builders + explorador: agentes `general`/`explore`, `small_model` | `opencode/deepseek-v4-flash-free` | **grátis** |
| Escalação (builder falha 2× na mesma spec) | `opencode-go/gpt-5.6-luna` **(decisão do owner 2026-08-10)** | pago, << k3 |

Ativação da escalação (só quando necessária): adicionar a
`~/.config/opencode/opencode.jsonc` um agente com override, ex.
`"agent": { "general-luna": { "model": "opencode-go/gpt-5.6-luna" } }`, e despachar
para esse tipo.

Visão: só `kimi-k3` está confirmado a ler imagens neste setup. Se aparecer um free
com visão fiável, os vereditos de frames/covers migram (registar aqui).

## Regras de routing (permanentes)

1. **Regra de ouro:** delegar só quando `brief << trabalho`. Tarefa menor que o seu
   brief executa-se direto — despachar custa o contexto todo da brief.
2. **Kimi nunca lê ficheiros grandes** (`index.html`, `themes.js`, `catalog.json`,
   covers soltas). Pesquisa/exploração → agente `explore`; dados → `node -e`/grep.
3. **Um dispatch por feature**, com brief completo (o agente não herda contexto).
   Sem conversas multi-round com subagentes; falhou → corrijo a spec e redespacho.
4. **Revisão de diffs:** `git diff --stat` + leitura cirúrgica; nunca releitura
   integral de ficheiros que o Kimi já conhece.
5. **Visual:** 1 contact sheet por iteração; frames individuais só quando a sheet
   levanta dúvida concreta.
6. **Dados transformam-se com scripts Node**, nunca LLM (já era regra; mantém-se).
7. **Docs de retoma ficam curtos** — o custo de arranque de cada sessão é o tamanho
   de 00+06+07. Entradas novas ≤ 30 linhas.
8. `code-reviewer` só em diffs não-triviais de lógica (regra ponytail já existente).

## Divisão de trabalho (confirmada pelo owner 2026-08-10)

**Kimi K3 (orquestrador, pago) — SÓ:**
- specs/briefs de builder, decisões de arquitetura (ADRs), revisão de diffs;
- vereditos visuais (frames3d, covers) — único com visão confirmada;
- docs de retoma (00/05/06/07/08 + CHANGELOG) — entradas curtas, regra 1;
- fixes pós-review de 1–5 linhas (menores que o brief de redispatch).

**DeepSeek V4 Flash free (`general`/`explore`, grátis) — todo o resto:**
- implementação contra spec (features, fixes com causa conhecida, refactors);
- exploração de codebase, pesquisas, leitura de ficheiros grandes;
- instrumentação (stats.js), scripts utilitários com lógica.

**GPT 5.6 Luna (`opencode-go/gpt-5.6-luna`) — SÓ escalação:**
- builder falha 2× na mesma spec → redispatch para agente com override luna
  (ativação: ver tabela de modelos acima). Nunca para trabalho planeado.

**Scripts Node — dados:** transformações de dados correm em Node determinístico,
sem LLM nenhum (ex.: `apply_storyyear.mjs`).

## Backlog mapeado (Fase 3 restante → paridade)

| # | Tarefa | Modelo | Estado |
|---|---|---|---|
| 1–3 | Quick path + detalhe + logs.v1 | flash-free + kimi (review) | ✅ 2026-08-10 |
| 4–6 | ADR-0002 + navegação clusters + alternador + revisão | kimi (ADR) + flash-free + kimi (frames) | ✅ 2026-08-10 |
| 6a | Acentos por universo (decisão owner: materialidade por universo) — tokens em 02, aplicação CSS/rim/prateleira | flash-free | ✅ 2026-08-10 (CLUSTER_ACCENT + themes) |
| 7 | Emergência por scroll + toggle cron/release + morph de formato (2–3 iterações visuais) | flash-free + kimi (visual) | ✅ 2026-08-10 (4ª sessão) |
| 8 | ~~Atlas covers + InstancedMesh~~ **ADIADO 2026-08-10 (ponytail/YAGNI)** — ≤62 draw calls numa estante de cada vez (ADR-0002) passam a 60fps em iGPU real; o budget ≤20 é para renderização multi-estante, que não existe. Rever quando: estante >100 itens, ou multi-estante entrar. Sem sharp, sem shader, sem refactor. | — | adiado |
| 9 | Medição FPS (stats.js dev-only) + registo no 05 | flash-free + kimi (veredito) | ✅ 2026-08-10 (headless=SwiftShader, inútil p/ GPU real — ver 05) |
| 10 | Auditoria visual dos 152 covers (4 sheets de ~40) | kimi-k3 | ✅ 2026-08-10 (152/152 corretas — 0 erros tipo Wonder Man; sheets em tools/frames/covers/) |
| 11 | reduced-motion + a11y do overlay | flash-free | ✅ 2026-08-10 (focus trap, roving tabindex+setas, foco restaurado, visibility, :focus-visible; reduced-motion já no #7) |
| 12 | 22 overrides `storyYear` | script Node (`apply_storyyear.mjs`) | ✅ 2026-08-10 (22/22) |
| 13 | ~~Paridade: remover legado, `app.html` → `index.html`~~ **REVOGADO pelo owner 2026-08-10** — legado fica no repo para sempre; app nova mantém `app.html` como entrada | — | congelado |
| 14 | ADRs/docs por fase (entradas curtas) | kimi-k3 direto | contínuo |
| 15 | Temas do legado → cores por título (decisão owner 12ª): `extract_themes.mjs` + `themeFor` + `applyTitleTheme` (accent/ink/accent2/fundo) + `audit_themes.mjs` (42/152, drift 0) | 2× general (paralelo) + orquestrador (probes/pixel) | ✅ 2026-08-20 |
| 16 | Cobertura de temas 152/152: `gen_cover_themes.mjs` (paleta das covers reais via ImageMagick → accent/accent2/bg/ink + `src`) | general | ✅ 2026-08-20 |
| 17 | Deploy GH Pages (decisão owner 13ª): push branch + `gh-pages` com o build + canary | general (git/gh) + orquestrador | ✅ 2026-08-20 |
| 18 | Teclado na estante (a11y): ←/→ wrap, Home/End, Enter abre dossiê, Esc fecha; `check_keys.mjs` | general | ✅ 2026-08-20 |
| 19 | Botão PRÓXIMO NO PERCURSO no dossiê (`mv-next-in-path`, fechar dossiê + saltar) | general + orquestrador (fix 1 linha) | ✅ 2026-08-20 |
| 20 | QA tools: hashes `/tudo` (4.º segmento), contact sheet frames3d não-fatal, foco no check Esc | general | ✅ 2026-08-20 |
| 21 | PRÓXIMO POR VER no dossiê (`mv-next-unwatched`, salto ao próximo não visto) + `check_next_unwatched.mjs` | orquestrador direto | ✅ 2026-08-20 |
| 22 | `tools/deploy.mjs` + `npm run deploy` (build → gh-pages → push, `--dry-run`) | orquestrador direto | ✅ 2026-08-20 |
| 23 | README.md reescrito para a app 3D | orquestrador direto | ✅ 2026-08-20 |
| 24 | Híbrido 3D do dossiê (fase 1): hero fica em palco | orquestrador direto | ✅ 2026-08-21 |
| 25 | P1 bundle split vendor (three+gsap) | orquestrador direto | ✅ 2026-08-21 |
| 26 | V1 preview mobile bottom sheet | orquestrador direto | ✅ 2026-08-21 |
| 27 | D1 dedup effectiveYear + export | orquestrador direto | ✅ 2026-08-21 |
| 28 | UX1 badge VISTO/POR VER no dossiê + UX2 busca prioriza cluster + UX3 export/import + M1 nav mobile | orquestrador direto | ✅ 2026-08-21 |
| 29 | Swarm critique 8 lentes + docs/09-improvements.md | orquestrador (probes paralelos) | ✅ 2026-08-21 |

## Registo de desvios

- 2026-08-10 (5ª) — build A+B+C: flash-free devolveu vazio 2× (falha 2 de 2) →
  escalação para `general-luna` adicionada à config mas **exige restart do
  opencode**; sem restart, o Kimi construiu diretamente (A+B+C+E). D2
  (12 dispatches de escrita) voltou a correr em flash-free sem falhas.
- 2026-08-10 — build #5 (nav clusters): 1.º dispatch flash-free devolveu vazio sem
  escrever nada; redispatch idêntico (falha 1 de 2 antes de escalar) → sucesso.
  Escalação para luna NÃO usada.
- 2026-08-20 (12ª) — **sem modelo com visão disponível na sessão**: verificação
  visual dos temas feita por probes computados (computed styles + amostra de
  pixel do frame) em vez de veredito Kimi sobre a contact sheet. Frames ficam
  em `tools/frames/shelf3d/` para revisão humana/visual futura.
- 2026-08-20 (14ª) — **subagents devolveram vazios 3× consecutivas** (mesma spec,
  `general`): 0 ficheiros escritos, 0 output. Nenhuma falha de infra observada;
  trabalho feito pelo orquestrador diretamente. Se repetir, rever binding do
  `general` antes de confiar em despachos paralelos.
