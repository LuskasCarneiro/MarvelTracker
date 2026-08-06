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

## The axis (decided, and it supersedes the first proposal)

**x is always the release year.** `rel` is a clean number on all 152 titles. `s`, the
in-world chronology, is free text (`"1943 e 1990"`, `"anos 80"`, `"c. 2003"`) and is not
parseable — so it can never drive an axis.

The chrono/release toggle therefore changes **only the connecting path**, not the
positions. In chronological mode the spine visibly runs *backwards* through the years:
Captain America: The First Avenger sits at 2011 on the axis but is first in the
sequence. That jump is the most interesting fact the data contains, and the old layout
hid it completely.

## Geometry contract

World units. Nodes ease toward targets; there is no force simulation.

| | |
|---|---|
| `X_SPAN` | 2600, left edge = earliest release year in the media, right = latest |
| `x` | `(rel - minYear) / (maxYear - minYear) * X_SPAN` |
| lane order | universes sorted ascending by their earliest release year |
| `LANE_H` | 150 vertical pitch between lane baselines |
| `y` | lane baseline, plus a vertical fan when titles share a year |
| `NODE_FAN` | 34; `k` titles in one year offset by `(i - (k-1)/2) * NODE_FAN` |
| spine | horizontal rule at `y = -110`, spanning the full axis |
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
- The bottom-right legend. Lanes and a year ruler explain themselves.

## What gets added

- **Rating on the canvas.** It exists in `logs` and has never been drawn. Watched is
  already drawn (rotated red "VISTO" stamp) and stays.
- A year ruler along the bottom — real information, not decoration.

## Motion

Killing the force simulation removes the drifting quality that is currently the graph's
main charm. It is bought back with one orchestrated moment: nodes ease into position on
load and on every chrono↔release switch, so re-ordering visibly re-times the archive.
Respects `prefers-reduced-motion` by snapping to target.

## Verification

`node tools/check_intros.mjs` must stay 6/6 — the six opening sequences are out of scope
and must not regress. Screenshot matrix at both tabs, both modes, zoomed out and in.
