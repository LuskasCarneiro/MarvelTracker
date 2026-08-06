# Marvel Vault — project context

A personal archive of every Marvel movie and TV show, visualized as a force-directed
timeline graph per universe (MCU, X-Men/Fox, Sony/Spider-Man, Netflix Defenders, etc.),
styled as a TVA case-file terminal. Single owner, runs entirely client-side.

Read this file at the start of any session touching this project — it's written so a
fresh session has full context without re-deriving decisions already made.

## Stack

Zero build step. `index.html` is the whole app (markup + CSS + JS inline), plus one
external file it loads via `<script src="themes.js">`. No framework, no bundler, no
npm. `.venv` exists only to run a local dev server (stdlib `http.server`, no pip
packages needed yet) — activate it if you add any Python tooling later.

## Run it

```bash
cd marvel-vault
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly by double-click (file://) also works for everything
**except** the `.env` auto-load for the OMDb key (browsers block `fetch()` of local
files over file://) — in that case the user pastes the key into the sidebar box
instead, which persists in localStorage.

## File map

| File | Purpose |
|---|---|
| `index.html` | The entire app. Data (films/series arrays), graph physics, canvas rendering, UI, OMDb integration, rating/log system, theme engine — all in one inline `<script>`. |
| `themes.js` | Per-title visual theme registry, loaded separately so it can be extended without touching app logic. See the doc comment at its top for the entry format. |
| `THEMES_CHECKLIST.md` | All 152 titles, ticked as bespoke themes get added to `themes.js`. The source of truth for "what's done." |
| `.env` | `OMDB_API_KEY=...` — only read when served over http(s)://. Never commit this (see `.gitignore`). |
| `CHANGELOG.md` | Dated log of what changed each session and why. Update it before ending a session that changed the app. |
| `tools/check_intros.mjs` | Headless-browser check that every deep-pass opening sequence actually plays and tears itself down. Run it after touching `startMaskIntro`, `applyPanel`, or any `intro`/`panel` CSS. See its header for setup. |
| `tools/frames.mjs` | Dumps an opening sequence as still frames + a contact sheet, with animation time **frozen** rather than slept through. The only honest way to judge this kind of work — use it every iteration. |
| `tools/bake_hammer.mjs`, `tools/bake.html` | Render `mjolnir_thors_hammer.glb` into `tools/mjolnir_sheet.webp`, embedded in `index.html` as the Thor opening's sprite sheet. |
| `tools/gen_glass.mjs`, `tools/gen_portal.mjs` | Generate the Thor shatter and the Doctor Strange portal-rim geometry. The SVG in `MASK_HTML` is **generated output, not hand-typed** — edit the generator and re-splice, never the markup. |
| `mjolnir_thors_hammer.glb` | Source 3D model, 20 MB, CC-BY-4.0 by TheDevilsEye. **Build-time only — never embed it.** Kept so the bake can be re-run at a different angle. |
| `.venv` | Empty for now, reserved for future local tooling. |

**three.js and Playwright are BUILD-TIME tools and are never shipped.** `tools/` has its
own `package.json` and `node_modules`; `index.html` still loads nothing but `themes.js`
and stays double-click-portable. Seeing a dependency in `tools/` does not mean the
no-dependencies rule was abandoned — that rule is about what the *app* loads.

## Data model (localStorage, all client-side, no backend)

- `marvelVault.state.v1` — active tab, hidden clusters, sort mode, active track, per media (movies/series).
- `marvelVault.logs.v1` — `{ "movies|Iron Man": {watchedAt: ISOstring, rating: 1-10|null}, ... }`. This replaced an older boolean-only watched-set format (`marvelVault.watched.v1`); a one-time migration on load converts old data if `logs.v1` doesn't exist yet. Don't reintroduce the old format.
- `marvelVault.omdbKey.v1` — the user's OMDb API key (plain string), if they entered it via the sidebar instead of `.env`.
- `marvelVault.omdbCache.v1` — cached OMDb API responses keyed by `mediaKey|title`, so each title is only fetched once ever.

## Theming system — three layers, don't conflate them

1. **Color-only theme** (`themeFor(title, clusterKey, U)` in `themes.js`, returns
   `{bg, accent, accent2, ink, ref}`) — applied to **every** title. Titles not in the
   `THEMES` registry fall back to their cluster's color. This is the baseline; it's a
   valid, working, *intentionally unfinished* state for most of the 152 titles, not a bug.
   Applied via `applyTheme()` in `index.html`, which sets `--amber`/`--amber-dim`/
   `--live-bg` CSS custom properties. Default (nothing open) is Marvel-logo red.

2. **Deep-pass panel skin** (optional `panel:"someKey"` field on a theme entry, plus a
   matching `.panel-someKey` CSS block and a `PANEL_HTML.someKey` markup template in
   `index.html`) — bespoke decorative markup (patterns, sticker-style badges, textures)
   injected into `#panelDecor` inside the note panel. This is **not** meant to be done
   for all 152 titles — it's a small, deliberate set of flagship titles that get real
   extra craft. The bar is high: a skin is expected to change the panel's **shell**
   (width, background material, text colours, heading typography), carry a real
   inline-SVG illustration, and have a reveal animation — not just add a pattern to the
   standard manila card. The class goes on both `#note` (width) and `#noteInner`
   (interior); `applyPanel()` also re-adds `panel-enter` after a forced reflow to
   restart the reveal. Six exist:

   | key | title | width | material |
   |---|---|---|---|
   | `ironman2008` | Iron Man | 452px | Mark I drafting sheet from the cave — dark inverted panel, SVG arc-reactor technical drawing that draws itself in |
   | `homecoming` | Spider-Man: Homecoming | 372px | a page from Peter's Midtown notebook — ruled stock, binder holes, SVG ballpoint web + Vulture wings |
   | `avengers2012` | The Avengers | 428px | a slab of the post-battle Manhattan street, poster mounted as a surveillance plate |
   | `ragnarok` | Thor: Ragnarok | 408px | Sakaaran contender billing — pink/teal, poster treated as a fight poster |
   | `strange` | Doctor Strange | 388px | Kamar-Taj manuscript stock, warm ink |
   | `antman` | Ant-Man | 466px | Pym Technologies specimen sheet — blueprint grid, "espécime n.º 247" |

   Read the doc comments above those entries in
   `themes.js` for the verified reference sources each detail is drawn from — do not
   invent new "verified" details without actually checking; if uncertain, say so in the
   `ref` comment rather than presenting a guess as fact.

3. **Presentation mode** (optional `presentation:"centered"` + optional
   `intro:"someKey"` on a theme entry) — changes *how the panel opens*, not just how
   it looks. `centered` lifts `#note` out of the flex row into a centred overlay over
   a darkened `#noteStage`; `intro` plays a keyed opening sequence from `MASK_HTML`
   into `#maskLayer` first. Absent on a title = the right-docked sliding drawer,
   untouched. Six titles have it, each a mechanically different opening — an intro key
   needs an entry in `MASK_HTML`, a duration in `INTRO_DURATION`, and a CSS block
   keyed on `.note-stage.<key>-on` / `.note.<key>-arrive`; the shared JS
   (`startMaskIntro`/`clearMaskIntro`) is already generic and shouldn't need touching:

   | intro | title | ms | the beat |
   |---|---|---|---|
   | `ironmask` | Iron Man | 2400 | helmet appears, eye slits ignite, faceplate hinges open, camera pulled through |
   | `webpull` | Homecoming | 950 | web lines shoot in from both bottom corners, anchor, pull the dossier taut |
   | `assemble` | The Avengers | 1780 | six trails converge on one point from six directions, ring forms |
   | `mjolnir` | Thor: Ragnarok | 1800 | Mjolnir is thrown at the viewer and breaks the screen; 44 glass shards fall off the dossier behind it |
   | `slingring` | Doctor Strange | 2100 | a hot point traces a circle and a rim of fire ignites in its wake; the dossier rises through the hole, clipped by the rim |
   | `shrink` | Ant-Man | 1150 | bracket frames snap inward like a macro lens; the card itself arrives huge and shrinks (most of the motion is `amShrink` on `.shrink-arrive`, not the mask layer) |

   **Owner's verdict, 2026-08-06 — not all six are finished work.** Iron Man and
   Homecoming are liked as they are. Thor and Doctor Strange were rebuilt that day
   (see `CHANGELOG.md`). **`shrink` (Ant-Man) is disliked and `assemble` (The Avengers)
   was called "completely off"** — both are awaiting a redesign that has not been
   briefed yet. Leave them alone rather than polishing them, and don't present them as
   done.

   The standing lesson across all of these: **crude vector stand-ins are this project's
   recurring failure mode.** Iron Man's mask took eight passes before the fix turned out
   to be "use a real photograph"; Thor's hammer was a grey slab until it became a real
   3D model. When something has to look real, get a real asset — and *look at the
   result* with `tools/frames.mjs` instead of reasoning about the CSS.

   This is deliberately **incoherent by design** — the
   owner's brief is that a file should feel like a different kind of discovery per
   film, not that the site should be uniform. Cleanup for every close path runs
   through `applyPanel()`, which `resetTheme()` always calls.

   **The `ironmask` artwork is a real photograph, not a drawing.** After eight passes
   trying to hand-draw a realistic metal mask in SVG (none of which looked real —
   vector art simulating a photograph has a ceiling), the owner supplied the actual
   reference photo with its background removed and asked for it to be used directly.
   `MK_PHOTO` in `index.html` is that photo, base64-encoded in place. If a future
   session is tempted to "improve" this by drawing again: don't, unless explicitly
   asked — that road was walked eight times and the fix was to stop walking it.
   `tools/render_mask.sh` (an SVG-extraction-and-rasterize pipeline, built during the
   drawing attempts so changes could actually be looked at instead of reasoned about
   blindly) is now stale for this specific asset but left in place — the technique is
   real and would matter again if any *other* part of the app ever grows procedural
   SVG art that's hard to verify by reading code alone.

Extending any of these layers: work in **small, deliberate chunks**, not a mechanical pass
over everything. Tick `THEMES_CHECKLIST.md` in the same batch as the `themes.js` edit.

## Conventions worth preserving

- All user-facing copy is European Portuguese (pt-PT), in the TVA "case file" register
  (dossiê, ramo, percurso, carimbar, etc.) — keep new UI copy consistent with that voice.
- Data arrays (`films`, `seriesItems`) are hand-curated, not scraped — treat edits to
  them as content edits, not code edits; keep the tone/detail level consistent with
  existing entries when adding titles.
- No external JS dependencies, no bundler. Keep it that way — the whole point is
  double-click-and-it-works portability, minus the two things that genuinely need
  network (Google Fonts, OMDb).
