# 03 — Data Pipeline (TMDb, build-time)

> Endpoints verificados ao vivo em 2026-08-09 com `TMDB_READ_TOKEN` do `.env`.
> Auth: header `Authorization: Bearer <token>` (v3 key em `?api_key=` também funciona).

## Princípio

TMDb corre **só em build-time** via `tools/tmdb_fetch.mjs`. Output: posters locais +
`catalog.js`. A app publicada não faz chamadas de rede nem expõe keys.

## Endpoints usados

| Uso | Endpoint | Notas |
|---|---|---|
| Config imagens | `GET /3/configuration` | 1×, cache permanente. Dá `images.secure_base_url` + tamanhos. |
| Match filme | `GET /3/search/movie?query={t}&year={r}&language=pt-PT` | verificado ✓ |
| Match série | `GET /3/search/tv?query={t}&first_air_date_year={r}&language=pt-PT` | |
| Detalhe filme | `GET /3/movie/{id}?language=pt-PT` | `belongs_to_collection` valida cluster MCU |
| Detalhe série | `GET /3/tv/{id}?language=pt-PT` | `seasons[]` com `air_date` → **um objeto por temporada** |
| Coleção | `GET /3/collection/{id}?language=pt-PT` | validação de universo, opcional |
| Poster atlas | `GET {base}w342{poster_path}` | tile do atlas da estante |
| Poster detalhe | `GET {base}w500{poster_path}` | carregado on-demand na vista de detalhe |

Rate limit ~50 req/s. Volume total ≈ 150 títulos × 2 calls + imagens — corre uma vez,
cache em `tools/.cache/tmdb/` (respostas JSON por id).

**Obrigação de publicação**: TMDb exige atribuição (logo + texto) no produto final.
Registar no footer da app quando publicar. Não usamos os dados deles para treino nem
os relicenciamos — só display.

## Schema `catalog.js` (gerado)

```js
{
  id: "movies|Iron Man",        // chave estável = mesma do logs.v1
  cluster: "mcu",               // u: mcu|xmen|sony|netflix|vintage|classica|fox|hulu|abc|anim|verse
  type: "movie" | "season",     // season → parent + seasonNumber
  title: "Iron Man",
  releaseYear: 2008,            // r
  storyYear: 2008,              // sy — NUMÉRICO, ver abaixo
  storyLabel: "2008",           // s original curado (display)
  overview: "...",              // d curado pt-PT (fonte de verdade)
  tmdbId: 1726,
  poster: "covers/mcu-iron-man.webp",
  seasonOf: null | "movies|Loki",
  seasonNumber: null | 1
}
```

## Dívida de dados conhecida: `storyYear` numérico

O `s` curado é uma **string fuzzy** ("anos 80", "c. 2000", "ambíguo", "1845 a anos
80", "depois de Daredevil"). A regra era-aware precisa de número. Plano:

1. `tools/extract_curated.mjs` extrai os arrays do `index.html` legado (regex/AST —
     script, não LLM).
2. Parser propõe `sy` para os casos limpos; gera lista dos fuzzy para curadoria manual
   do owner (22 entradas, ver `tools/data/storyyear-review.md`). Exceções de séries (WandaVision, Loki) já estão mandatadas
     como overrides em `00-brief.md` decisão 6.

## Logs do utilizador (inalterado)

`marvelVault.logs.v1` continua a ser lido/escrito tal como está —
`{ "movies|Iron Man": {watchedAt, rating} }`. Chaves estáveis do catálogo garantem
compatibilidade retroativa.
