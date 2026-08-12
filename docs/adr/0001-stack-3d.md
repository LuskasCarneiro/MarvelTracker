# ADR-0001: Stack 3D — Vite + TS + Three.js vanilla + GSAP

**Data:** 2026-08-09 · **Estado:** aceite

## Contexto

O brief (improve.md) pede uma frontpage 3D de alta performance e manda pesquisar a
stack (Three.js, R3F, WebGPU, shaders, GSAP). A regra zero-build do projeto foi
revogada pelo owner na mesma sessão.

## Decisão

Vite + TypeScript + **Three.js vanilla** + GSAP/ScrollTrigger. Sem React, sem R3F,
sem WebGPU, sem shaders custom no arranque.

## Alternativas consideradas

- **React + R3F + drei**: ergonomia declarativa, mas paga um runtime React inteiro
  para gerir **uma** cena; o UI (detalhe, alternadores) é DOM de texto e não precisa
  de React para isso. Custo sem benefício aqui.
- **WebGPU**: imaturo em Safari; WebGL2 cobre o alvo de perf com compatibilidade total.
- **Shaders GLSL custom desde o início**: premature; `MeshStandardMaterial` + env map
  chega ao look pretendido na maioria dos materiais. Custom só quando medido
  (contrato em `05-3d-shelf.md`).

## Consequências

(+) Payload mínimo, menos deps, build simples. (−) Se o UI overlay crescer muito em
complexidade de estado, reavaliar React — a fronteira cena/DOM está desenhada para
isso não acontecer.
