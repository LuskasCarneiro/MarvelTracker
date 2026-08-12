# 02 — Design System

> Esqueleto — tokens 3D concretos definem-se na Fase 3 com verificação visual
> (`tools/frames.mjs`). Aqui fica o que já está decidido.

## Herança

A app 2D era um terminal TVA (âmbar/latão, papel manila, carimbos). A app 3D herda a
**voz** (dossiê, ramo, percurso, carimbar) e a ideia de **arquivo físico** — a estante
é literalmente um arquivo. **Decidido 2026-08-10 (owner): materialidade POR
UNIVERSO** — cada estante tem acentos próprios (acento UI + tint de rim light +
material da prateleira). Tokens por cluster: tarefa #6a do docs/08, registam-se aqui.

## Tokens por universo (tarefa #6a — decidido 2026-08-10, build flash-free)

Acento = cor de realce global da estante: UI (nav ativo, HUD, preview, dossiê),
rim light da cena e material da prateleira. Base escura quente mantém-se em toda
a app (`#0e0c0a`); o acento vive em `--accent` no CSS (body[data-cluster]) e em
`CLUSTER_ACCENT` (catalog.ts) para a cena 3D.

| Cluster | Acento | Nota |
|---|---|---|
| mcu | `#d8a24a` | âmbar TVA — a casa |
| xmen | `#4a7fd8` | azul cerebro |
| sony | `#d84a3a` | vermelho aranha |
| netflix | `#a8324a` | vinho de Hell's Kitchen |
| vintage | `#c9a86a` | sépia papel manila |
| classica | `#7d9b76` | patina |
| fox | `#8a93a3` | aço |
| hulu | `#4aa96c` | verde hulu |
| abc | `#5f8f9f` | azul-petróleo SHIELD |
| anim | `#d87f4a` | laranja animação |
| verse | `#c34a9e` | magenta glitch |
| f4 | `#56a8d8` | azul fantástico |

## Referência: press.stripe.com

- WebGL para o espetáculo, **DOM para todo o texto**.
- Objetos 3D simples (livros) elevados por **iluminação e materiais** premium, não por
  geometria complexa.
- Motion curto e físico; nada se move sem input do utilizador.
- "Living covers": a superfície do objeto é a tela da animação.

## Formatos era-aware (contrato de forma)

| Formato | Proporções reais de referência |
|---|---|
| Rolo de cinema | Canister cilíndrico metálico Ø~30cm × ~4cm |
| VHS | 18,7 × 10,2 × 2,5 cm, plástico negro texturado |
| DVD | 19 × 13,5 × 1,4 cm, caixa plástica com capa |
| Blu-ray/Steelbook | 17,2 × 13,5 × 1,2 cm; steelbook = metal escovado |

Cover art na face frontal (atlas); lombada com título. Geometrias procedurais —
sem modelos externos.

## Tipografia

A definir na Fase 3. Candidata: manter a mono do terminal TVA para UI + uma display
para títulos de universo.
