# Marvel Vault

A personal Marvel movies + TV timeline archive, styled as a TVA case-file terminal, with
per-title visual themes, IMDb/Rotten Tomatoes data via OMDb, and a watch log with your own ratings.

## Open it

Two ways:

- **Double-click `index.html`.** Fully self-contained, works offline except Google
  Fonts and OMDb. The one thing that *doesn't* work this way: `.env` auto-loading the
  OMDb key (see below) — use the sidebar key box instead.
- **Serve it locally**, e.g. `python3 -m http.server` from inside this folder (there's
  an empty `.venv` here if you want to keep that isolated — nothing to install, the
  server is Python stdlib). This way `.env` loads automatically.

## Files

- `index.html` — the whole app: markup, styles, and logic in one file.
- `themes.js` — per-title visual theme registry. Loaded as a separate `<script src>` so it
  can be extended independently of the app logic. Titles not listed here fall back to their
  universe's cluster color — a valid, working state, not a bug.
- `THEMES_CHECKLIST.md` — tracks which of the 152 titles have a bespoke theme in `themes.js`
  vs. which are still on the cluster-color fallback. Tick a box there whenever you add an
  entry to `themes.js` for that title, in the same pass.
- `.env` — put `OMDB_API_KEY=your-key` here if you're serving locally (see above).
- `CLAUDE.md` — project context for AI-assisted sessions (stack, conventions, data model).
- `CHANGELOG.md` — dated log of what changed each session and why.

## OMDb (posters, IMDb rating, Rotten Tomatoes, cast)

1. Get a free key at **omdbapi.com/apikey.aspx** (instant, no card, 1000 requests/day).
2. Either paste it into `.env` (if serving locally) or into the "Ficha externa" box in
   the sidebar and click Guardar (works either way you open the app).
3. Open any card — its poster, IMDb score, Rotten Tomatoes score, cast, and plot load from
   OMDb and get cached in your browser's localStorage, so each title is only fetched once.

Without a key the app still works fully — cards just show the hand-written synopsis without
the poster/ratings block. Letterboxd has no public API, so it isn't included.

## Extending the per-title themes

Two separate things can exist per title, both optional:

1. **Color-only theme** — palette tokens in `themes.js` (`bg`, `accent`, `accent2`,
   `ink`). Applies UI-wide when that title's card is open. See the format note at the
   top of `themes.js`.
2. **Deep-pass panel skin** — bespoke decorative markup for the note panel itself
   (patterns, sticker-style badges, textures), for a small, deliberately chosen set of
   flagship titles — not meant to scale to all 152. Add a `panel:"someKey"` field to a
   theme entry, then a matching `.panel-someKey` CSS block and `PANEL_HTML.someKey`
   markup template in `index.html`. Two exist so far (Iron Man, Spider-Man: Homecoming)
   — read their entries in `themes.js` for the pattern and for what "verified reference"
   means here (checked via web search, not invented).

Workflow for a new batch of either kind:

1. Pick a chunk (a universe, an arc, a handful of titles you care about).
2. Write real entries — each needs a *specific* in-world visual reference, not just
   "this character's costume is red". If you're not sure a detail is accurate, say so
   in the `ref` comment rather than presenting a guess as fact.
3. Tick the matching boxes in `THEMES_CHECKLIST.md` and bump the progress count at the top.

## Your data

Everything you enter — watched status, ratings, dates, OMDb key, OMDb cache, filters — lives
in your browser's localStorage for this file, nowhere else. Clearing browser data for local
files (or switching browsers/machines) will reset it.

## Credits

- **Mjolnir 3D model** — ["Mjolnir (Thor's hammer)"](https://sketchfab.com/3d-models/mjolnir-thors-hammer-ecca1232710f4721b14d64a90bba6557)
  by [TheDevilsEye](https://sketchfab.com/TheDevilsEye), licensed
  [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/). Used in the Thor: Ragnarok
  opening sequence, rendered offline to a sprite sheet by `tools/bake_hammer.mjs`.
- Film and series metadata, posters and ratings come from [OMDb](https://www.omdbapi.com/),
  fetched at runtime with your own API key. Posters remain the property of their
  respective studios and are not redistributed by this project.
- Build-time tooling only: [three.js](https://threejs.org/) and
  [Playwright](https://playwright.dev/). Neither is shipped — the app itself loads no
  external JavaScript.
