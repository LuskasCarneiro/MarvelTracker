# 00 — Brief & Regras Permanentes

> Fonte: `improve.md` (2026-08-09) + decisões fixadas com o owner na mesma sessão.
> Este ficheiro é a referência de intent; mudanças de rumo registam-se aqui primeiro.

## Visão

Substituir a experiência 2D atual (grafo timeline + painéis TVA) por uma **frontpage 3D
imersiva de alta performance**, com o rigor estético de `press.stripe.com`:

- **Estante 3D interativa** — ao carregar, o utilizador vê uma estante tridimensional.
- **Scroll-driven** — scroll faz os itens emergirem da estante em animação 3D fluida.
- **Quick path** — clicar num título traz o item imediatamente para primeiro plano.
- **Estantes por universo** — uma estante temática por cluster existente
  (`mcu`, `xmen`, `sony`, `netflix`, `vintage`, `classica`, `fox`, `hulu`, `abc`,
  `anim`, `verse`, `f4`). Catálogo mantém-se **Marvel-only**.
- **Alternador Filmes/Séries** sem fricção.

## Regra era-aware (formato físico do item)

Cada estante tem um **interruptor** que alterna a ordenação entre
**cronológica (ano da história)** e **release (ano de estreia)**. O formato físico do
item segue o ano do modo ativo:

| Ano efetivo | Formato 3D |
|---|---|
| pré-1978 | Rolo de cinema (bobine/canister) |
| 1978–1999 | Cassete VHS |
| 2000–2009 | Caixa de DVD |
| 2010+ | Blu-ray / Steelbook |

Exemplo fixado pelo owner: *Captain America: The First Avenger* → rolo de cinema em
modo cronológico (história em 1943–45), Blu-ray em modo release (2011).

## Decisões fixadas (2026-08-09)

1. **Substituição total** da app atual. Rollback = branch `main` intacto; trabalho no
   branch `feature/3d-shelf`. **Aditamento 2026-08-10 (owner):** o legado
   (`index.html`, `themes.js`) **nunca é eliminado** — fica no repo mesmo depois da
   paridade; remoção só por decisão explícita do owner.
2. **Regra zero-build/zero-deps revogada.** Stack nova livre (ver `adr/0001`).
3. **TMDb é pipeline build-time, não runtime** — scripts em `tools/` buscam posters e
   metadados e cozem-nos em assets locais. A app publicada não leva API key nenhuma e
   funciona offline. OMDb descontinuado na app nova. Dados curados pt-PT continuam
   fonte de verdade para texto. (Pensado para publicação futura.)
4. **Vista de detalhe = overlay DOM** sobre a cena 3D (modelo press.stripe.com);
   evolui mais tarde para híbrido com objeto 3D interativo.
5. **Logs/ratings migram**: app nova lê `marvelVault.logs.v1` desde o dia 1; widget de
   rating regressa com a vista de detalhe.
6. **Séries = um objeto por temporada** (o dataset curado já está por temporada).
   `storyYear` por temporada = `airYear` por defeito, com overrides curados à mão para
   exceções (WandaVision, Loki).
7. **Findings → Obsidian**: `/home/luskas_carneiro/Desktop/LuskasSecondBrain/Projects/Marvel Vault/`.

## Regras permanentes

- Copy user-facing em **pt-PT europeu**, registo dossiê TVA (dossiê, ramo, percurso,
  carimbar).
- **Ponytail ativo (nível full)**: YAGNI, reuso antes de criar, stdlib antes de deps,
  diff mínimo, um check runnable por lógica não-trivial.
- **Modelos**: Kimi K3 orquestra (planeamento, contratos, revisão); DeepSeek V4 Flash
  executa (builders contra spec). Scripts determinísticos em vez de LLM para qualquer
  transformação de dados. Ver plano de custos em `01-architecture.md`.
- **Verificação visual é mecânica**: `tools/frames.mjs` (frames congelados) — nunca
  raciocinar sobre CSS/animação sem olhar para o resultado.
- Lição histórica do projeto: *crude vector stand-ins falham sempre* — quando algo tem
  de parecer real, usa-se um asset real.
