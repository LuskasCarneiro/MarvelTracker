# 07 — Questões em Aberto

## Para o owner decidir

_(vazio — tudo decidido 2026-08-10)_

## Fechadas (2026-08-20)

- ~~**Temas do legado (decisão tua, 11ª)**~~ → Entram como **cores por título**:
  o item em palco (hero/dossiê) leva acento+fundo+metadados do tema curado
  (themes.json, 42 títulos); sem tema → acento do cluster. As animações/panels
  pesados do themes.js ficam no legado (YAGNI — o dossiê 3D já é um overlay
  próprio). Implementado e commitado na 12ª sessão.

## Fechadas (2026-08-10)

- ~~**`storyYear` fuzzy (22 entradas)**~~ → Owner preencheu; aplicados por
  `tools/apply_storyyear.mjs` (22/22, 0 pendentes). F4 First Steps 1963 e Legion
  1973–75 viram ROLO em modo cronológico; First Avenger 1942→reel / 2011→blu-ray
  (o exemplo do brief) verificado nos dados.
- ~~**Paleta TVA no mundo 3D**~~ → **Materialidade por universo** (decisão owner).
  Cada estante tem acentos próprios; tokens por cluster definem-se na tarefa de
  acentos (backlog 08 #6a) e vivem em `02-design-system.md`.
- ~~**Binding de modelos**~~ → Config tem `general`/`explore`/`small_model` →
  `opencode/deepseek-v4-flash-free`; validado em builds reais. Escalação:
  `gpt-5.6-luna` (ativação documentada no 08).

## Fechadas (2026-08-09)

- ~~Substituir ou coexistir?~~ → Substituição total, `main` = rollback.
- ~~Zero-build?~~ → Revogada. Vite + TS.
- ~~TMDb runtime?~~ → Não, build-time. Publicável sem keys.
- ~~Vista de detalhe?~~ → Overlay DOM (a), híbrido depois.
- ~~Logs/ratings?~~ → Migram; leitura de `logs.v1` desde o dia 1.
- ~~Séries?~~ → Um objeto por temporada (dataset já está assim).
- ~~Catálogo?~~ → Marvel-only; 12 clusters = 12 estantes (`f4` descoberto na extração).
