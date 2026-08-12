# 01 — Arquitetura

## Vista geral

```
┌─ build-time (tools/, node) ────────────────┐
│ tmdb_fetch.mjs  →  cache TMDb (disco)      │
│                 →  public/covers/*.webp    │
│                 →  src/data/catalog.js     │
│ extract_curated.mjs (lê films/seriesItems  │
│   do index.html legado, uma vez)           │
└────────────────────────────────────────────┘
┌─ runtime (vite + ts, client-side) ─────────┐
│ Cena 3D (three.js)   — estantes, itens     │
│   instanciados, câmara, scroll             │
│ Overlay DOM (HTML/CSS) — detalhe, rating,  │
│   alternadores, navegação de universos     │
│ localStorage — logs.v1 (compatível)        │
└────────────────────────────────────────────┘
```

Sem backend, sem API calls em runtime. Tudo o que precisa de rede acontece em
build-time. `index.html` legado mantém-se no branch até a extração de dados estar
feita — é a fonte dos dados curados.

## Componentes

| Componente | Responsabilidade |
|---|---|
| `src/scene/` | renderer, câmara, luzes, loop |
| `src/shelf/` | geometria da estante + 4 formatos era-aware (procedural) |
| `src/items/` | InstancedMesh por formato, atlas de posters |
| `src/motion/` | coreografia scroll/click (GSAP) |
| `src/ui/` | overlay DOM: detalhe, alternadores, rating |
| `src/data/` | catalog.js gerado + store localStorage |

## Multi-agente & custos

- **Orquestrador (Kimi K3)**: contratos, planeamento, revisão de diffs, este ficheiro.
- **Builders (DeepSeek V4 Flash)**: implementação contra spec, scripts utilitários.
- **Regras de custo**:
  1. Transformação de dados = script Node determinístico, nunca LLM.
  2. Ficheiros grandes nunca entram em contexto de agentes (`index.html` = 1,4 MB —
     extrai-se por script; pesquisas vão ao subagente `explore`).
  3. Dispatches em batch com brief completo; subagentes não têm contexto herdado.
  4. `code-reviewer` só em diffs não-triviais; lógica trivial cobre-se com o check
     runnable (regra ponytail).
  5. Cache TMDb em disco (`tools/.cache/tmdb/`) — fetch corre uma vez.
- **Binding ativo** (2026-08-10): `general`/`explore`/`small_model` →
  `opencode/deepseek-v4-flash-free` (grátis). Routing completo tarefa→modelo,
  regras de contexto e backlog mapeado: **`docs/08-model-plan.md`** (ler antes de
  delegar).

## Estado de transição

- Branch de trabalho: `feature/3d-shelf`. `main` = rollback (app 2D intacta).
- App nova vive em paralelo (Vite) até atingir paridade de dados; só então o
  `index.html` legado sai da raiz.
