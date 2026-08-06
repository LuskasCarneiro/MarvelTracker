# Marvel Vault — shell + graph redesign

Approved 2026-08-06. Owner's brief: full timeline rebuild, full creative liberty,
"make sure I am left amazed".

## The problem

The graph numbers every node 1→39 and then places those numbers at random. It calls
itself a timeline and its own labels prove it isn't one. Separately the shell is
mud-on-mud: the sidebar's filter, branch list and API-key box all carry identical
visual weight, and body text sits at ~3:1 contrast on the background.

## Signature: branches peel off a spine

The TVA's own instrument is the Sacred Timeline — a glowing horizontal spine with
branches diverging from it. Each universe becomes a lane that peels away from the spine
at the year it begins. True to the data and unmistakably this subject, rather than a
Gantt chart in Marvel colours.

## The axis — REVISED 2026-08-06 after owner review

My first call was that x is always the release year, because `s` (the in-world
chronology) is prose rather than data. The owner overruled it, correctly: in
chronological mode a film has to sit at the year its **story** happens, or the mode
means nothing.

**The axis field follows the mode.** `release` uses `rel`; `chrono` uses a parsed story
year. Switching modes re-scales the axis and slides every title, and the existing ease
animates it.

`s` turned out to be far more parseable than I assumed — of 82 distinct strings, the
great majority contain a real year:

| shape | example | resolves to |
|---|---|---|
| plain | `2012` | 2012 |
| range | `1942–1945` | 1942, span bar to 1945 |
| two eras | `2018 e 2023` | 2018, span to 2023 |
| qualified | `c. 2003`, `Natal de 2013`, `2026 (multiverso)` | 2003 (approx), 2013, 2026 |
| decade word | `anos 80`, `anos 60 retro` | 1985, 1965 (approx) |
| deep past | `5000 a.C. – 2024` | 2024 — the four-digit filter drops the BC part |
| relative | `logo após Civil War`, `pouco depois de X3` | interpolated (below) |
| untimed | `fora do tempo`, `multiverso`, `—` | interpolated |

**Titles naming no year are interpolated between their dated neighbours in the
cluster's authored chronological sequence.** That array order *is* the owner's
chronology, so an undated title still lands exactly between the two it belongs between.
Falling back to the release year would have been the precise lie this change fixes.

`CHRONO_FLOOR = 1930` pins the one outlier (`1845 a anos 80` — Wolverine's origin) to
the left edge rather than letting it stretch the axis across a century of empty space.

Two new marks earn their place from the parse: a **span bar** for titles covering a
range, and a **dashed ring** where the year is approximate or inferred.

## Geometry contract

World units. Nodes ease toward targets; there is no force simulation.

| | |
|---|---|
| `X_SPAN` | 2600, left edge = earliest year **in the active mode**, right = latest |
| `x` | `(yearOf(n) - yearMin) / (yearMax - yearMin) * X_SPAN`, where `yearOf` is `cy` in chrono mode and `rel` in release mode |
| lane order | universes sorted ascending by their earliest year **in the active mode**, so the order itself changes with the toggle |
| `LANE_H` | 178 vertical pitch between lane baselines |
| `y` | lane baseline, plus a vertical fan when titles share a year |
| `NODE_FAN` | 30; `k` titles in one year offset by `(i - (k-1)/2) * NODE_FAN` |
| spine | horizontal rule above the top lane, spanning the full axis |
| peel | curve from `(laneStartX, spineY)` to `(laneStartX, laneY)` |
| node `r` | 13, unchanged |
| ease | `n.x += (n.tx - n.x) * 0.12` per frame — 2 lines, replaces all physics |

Node dragging is **deleted**. Dragging a node in a dated timeline is meaningless. Pan,
zoom, hover, click all stay.

## Tokens

Variable **names stay** (`--amber`, `--redstring` etc.) — `themes.js` and `applyTheme()`
write to them and renaming would break the live-theme engine for no gain. Values change.

```
--void      #0E0C09   deeper, so the accent actually glows
--void-2    #141109
--void-3    #191510
--border    #2E2719
--brass     #B9A176   was #a9906a — the sidebar was illegible
--brass-dim #6E5F45
--paper     #E9E0C9
--ink       #E4DCC8   was #d8d0bf
--ink-dim   #9A9078   was #8c8371
--ink-faint #635B47
--amber     #E0212B   live theme accent, unchanged default
--redstring #C23B32   crossovers + VISTO stamp, fixed meaning
```

## Type

One swap. `Space Grotesk` goes — it is the current default-issue geometric grotesque.

- **Display: Archivo**, width axis 110–125, weight 600–800. All caps, wide tracking, used
  only for branch names and the few big moments. Expanded reads institutional, like
  signage in a government building.
- **Mono: IBM Plex Mono** stays. Already the terminal voice, correct for readouts.
- **Body: IBM Plex Sans** stays, for dossier prose.

## What gets cut

- The per-node ordinal number. The axis now encodes order; at any zoom where the number
  is legible, the position already told you.
- The bottom-right legend as written — it described the old visual language, so it was
  wrong rather than merely redundant. Rewritten for the new marks instead of deleted.

## What gets added

- **Rating on the canvas.** It exists in `logs` and has never been drawn; now an arc of
  the node's circumference. Watched moves from the stamp to the node **fill** (hollow =
  unseen) so progress reads across all 152 at once; the stamp survives above 1.15x.
- A year ruler along the bottom — real information, not decoration.

## Motion

Killing the force simulation removes the drifting quality that is currently the graph's
main charm. It is bought back with one orchestrated moment: a playhead sweeps left to
right through the years on load and on every media switch — the spine grows, branches
peel off as their first year arrives, nodes land as they are passed. Mode switches ease
between the two axes. Respects `prefers-reduced-motion` by snapping to target.

## Verification

`node tools/check_intros.mjs` must stay 6/6 — the six opening sequences are out of scope
and must not regress. Screenshot matrix at both tabs, both modes, zoomed out and in.
