# ADR-0002: Navegação multi-cluster — uma estante de cada vez

**Data:** 2026-08-10 · **Estado:** aceite

## Contexto

O catálogo tem 12 clusters (estantes por universo) e o brief pede um alternador
Filmes/Séries sem fricção. Com a estante MCU sozinha a ocupar ~96 unidades de mundo
(57 itens), punha-se a questão: como organizar 12 estantes no espaço 3D.

## Decisão

**Uma estante visível de cada vez**, trocada no mesmo "quarto" 3D. Estado de
navegação = `{ cluster, media }` com `media: 'filmes' | 'series'` (filtra `type`
dentro do cluster). Deep-link por hash: `#/mcu/filmes`. Grupos Three construídos
**lazy** (na primeira visita) e cacheados em memória; scroll faz reset a 0 em cada
troca; cluster sem itens do media ativo mostra estado vazio ("SEM PERCURSOS NESTE
RAMO").

## Alternativas consideradas

- **12 estantes num único espaço** (câmara viaja entre universos): 152 itens
  simultâneos → obrigava já a InstancedMesh + atlas (tarefa #8 do plano de custos)
  e estoura o orçamento de draw calls sem ganho de UX claro. Trocar de universo é
  navegação, não cenário.
- **Sala/grelha de estantes dispostas no espaço**: mover a câmara entre universos é
  mais lento que um clique; o quick path do brief privilegia fricção zero.

## Consequências

(+) Draw calls limitados ao cluster ativo; memória de texturas cresce só por visita
(browser cache); o alternador Filmes/Séries é refiltrar + remontar, barato.
(−) A transição entre clusters é um corte simples (sem viagem 3D entre universos);
se um dia se quiser essa viagem, revisita-se com o atlas já feito.
