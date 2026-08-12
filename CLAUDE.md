# Marvel Vault — contexto do projeto

Arquivo pessoal de todos os filmes e séries Marvel (MCU, X-Men/Fox, Sony, Netflix, etc.),
em migração de um terminal TVA 2D para uma **frontpage 3D imersiva** (estante 3D
era-aware, estética press.stripe.com). Single owner, 100% client-side, sem backend.

**Leitura obrigatória no início de cada sessão, por esta ordem:**
1. `docs/00-brief.md` — intent do owner + regras permanentes + decisões fixadas.
2. `docs/06-progress.md` — "você está aqui" e próxima ação concreta.
3. `docs/07-open-questions.md` — o que está por decidir.
Os restantes (`01` arquitetura, `02` design, `03` dados, `04` auth, `05` contrato 3D,
`adr/`) leem-se quando o trabalho tocar nessa área. `docs/08-model-plan.md` lê-se
**sempre que houver trabalho para delegar** — define que modelo corre cada tarefa
(custos).

## Estado da migração (2026-08-09)

- Branch de trabalho: **`feature/3d-shelf`**. `main` = app 2D intacta = rollback.
- `index.html` (1,4 MB) e `themes.js` são **legado**: ainda são a fonte dos dados
  curados (`films`, `seriesItems`) até à extração da Fase 2. **Nunca carregar
  `index.html` inteiro em contexto** — extrai-se por script.
- App nova: Vite + TypeScript + Three.js vanilla + GSAP (ADR-0001). Ainda não existe
  scaffold — começa na Fase 3, depois da pipeline de dados.

## Regras permanentes (resumo — fonte de verdade: `docs/00-brief.md`)

- Copy pt-PT europeu, voz dossiê TVA (dossiê, ramo, percurso, carimbar).
- **Ponytail full**: YAGNI, reuso primeiro, stdlib antes de deps, diff mínimo, um
  check runnable por lógica não-trivial.
- TMDb é **build-time only** (scripts em `tools/`, cache em disco). Nenhuma key é
  shipped; `.env` está gitignored (`TMDB_API_KEY`, `TMDB_READ_TOKEN`).
- Verificação visual com `tools/frames.mjs` (frames congelados) — nunca raciocinar
  sobre animação sem olhar para o resultado.
- Asset real > stand-in vetorial, sempre (lição dos 8 passes da máscara do Iron Man).
- Modelos: Kimi K3 orquestra/revê; DeepSeek V4 Flash constrói contra spec; dados
  transformam-se com scripts Node, não com LLM.

## Dados do utilizador (não quebrar)

`marvelVault.logs.v1` em localStorage — `{ "movies|Iron Man": {watchedAt, rating} }`.
A app nova lê esta chave tal como está (decisão fixada). IDs do catálogo novo têm de
ser compatíveis com estas chaves.

## Ficheiros

| Ficheiro | Papel |
|---|---|
| `docs/` | memória do projeto (ver hierarquia acima) |
| `index.html`, `themes.js` | app 2D legada + fonte de dados curados (transição) |
| `THEMES_CHECKLIST.md` | tracker da app 2D — congelado, sem trabalho novo |
| `tools/` | pipeline build-time (node); `frames.mjs` continua válido para a app nova |
| `CHANGELOG.md` | log datado por sessão — atualizar antes de fechar a sessão |
