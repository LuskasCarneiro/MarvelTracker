/*
 * THEMES.JS — per-title visual identity registry
 * ------------------------------------------------
 * Each entry maps an exact title string (must match the `t:` field in the
 * films/series data in index.html) to a theme object:
 *
 *   {
 *     bg:     base page wash behind the graph, a very dark tint of the film's world
 *     accent: the film's signature color — drives buttons, active states, glow
 *     accent2:a secondary color for contrast details (rims, dividers, tags)
 *     ink:    body text tint (usually a warm/cool near-white matching the mood)
 *     ref:    ONE line — the specific in-world detail this palette is drawn from.
 *             Not "red because Iron Man is red" — the actual object/moment/material.
 *   }
 *
 * Three OPTIONAL fields, each opt-in, each for a small hand-picked set of
 * flagship titles — never add them mechanically:
 *
 *   panel:        "<key>"      bespoke note-panel skin; needs a matching
 *                              .panel-<key> CSS block and PANEL_HTML.<key>
 *                              markup in index.html
 *   presentation: "centered"   the dossier opens as a centred overlay in a
 *                              darkened room instead of the right-docked
 *                              drawer. Absent = the drawer, unchanged.
 *   intro:        "<key>"      opening sequence played from MASK_HTML.<key>
 *                              in index.html. Only meaningful together with
 *                              presentation:"centered".
 *
 * Titles NOT listed here fall back to their cluster's color (see getTheme() in
 * index.html) — that is a valid, unfinished-but-working state, not a bug.
 * Track completion in THEMES_CHECKLIST.md — tick a box there when you add an
 * entry here for that title, in the same batch/commit.
 *
 * Work in chunks: pick one universe or one arc, do 10-20 titles with real
 * thought, tick the checklist, stop. Bespoke care beats a rushed pass over all 152.
 */
const THEMES = {

  /* ============ MCU — Infinity Saga spine ============ */
  /* DEEP PASS (panel:"ironman2008") — REBUILT 2026-08-04 (second pass).
     See .panel-ironman2008 in index.html and PANEL_HTML.ironman2008 there.

     What it is now: the note panel stops being a manila case file for this
     title and becomes the drafting sheet from the cave — dark scored steel,
     ember glow from the forge in one corner, the whole interior inverted to
     light-on-dark, the panel widened 392px -> 452px, stencilled crate
     lettering in the title block, and a full inline-SVG technical drawing of
     the miniaturised arc reactor (concentric rings, ten coil segments,
     crosshair axes, dimension leaders with tick ends, callouts) that draws
     itself in stroke by stroke on open before the core ignites.
     (The first pass — a faint grid, a small pulsing dot, a text placard on
     the unchanged paper card — was replaced wholesale, not extended.)

     ADDED 2026-08-04 (third pass) — presentation mode + opening sequence.
     Two extra optional fields, both read by applyPanel() in index.html:

       presentation:"centered"
         The dossier stops being the right-docked sliding drawer and opens as
         a lit object in the middle of a darkened room (#noteStage goes on,
         #note gets `note-centered` and is lifted out of the flex row with
         position:fixed). This is deliberately NOT global: it is per film, so
         that opening a file can feel like a different kind of discovery.
         Every title WITHOUT this field keeps the drawer exactly as it was.

       intro:"ironmask"
         The keyed opening sequence played into #maskLayer from MASK_HTML.
         The Mark I helmet resolves out of the dark, the eye slits ignite,
         the faceplate splits down its centre line and the two halves hinge
         outward, the cavity behind them floods with reactor light, and the
         camera is pulled through the opening — resolving into this dossier
         arriving centred on screen. Built as inline SVG: one faceplate
         drawing used twice, each copy clipped to its own half so the split
         registers exactly; the hinge is a 3D transform on the wrapping divs.
         Under prefers-reduced-motion the helmet is still shown — closed and
         lit, the recognisable image — and simply removed after ~600ms; only
         the motion is dropped, never the beat.

     THE HELMET ARTWORK — REDRAWN 2026-08-04 (fourth pass) AS THE MARK I.
     The first version of this drawing was a generic Iron Man faceplate: gold
     gradient, dark red shell, smooth curves, machined jaw grille — i.e. the
     Mark III's show-car look, on the film where the whole point is that the
     suit is scrap. It was rebuilt from research rather than memory. Only the
     ARTWORK changed; the sequence's timing, hinge mechanic, dolly, arrival,
     teardown and reduced-motion path were not touched.

     VERIFIED for the helmet (WebSearch, 2026-08-04):
       - the Mark I was deliberately designed to look assembled from spare
         parts — scrap metal, missile casings, machine components — and is
         described as crude because of the limited tools available in the
         cave; alloy iron/copper/magnesium; practical suit built by Stan
         Winston Studios (Wikipedia, "Iron Man's armor (MCU)"; Iron Man Wiki,
         "Iron Man Mark I"). Hence: bare gunmetal and dull steel, NO red, NO
         gold, no polish — prop replicas of the helmet are finished in plain
         silver steel (Museum Replicas / Marvel Official Mark I listings).
       - the suit is documented as more heavily armoured at the FRONT than the
         back, because Stark spent his scrap where he expected to be shot at.
         The asymmetry in the drawing is therefore a design fact about the
         object, not decoration: no vertex on the left half matches its
         opposite number, and the plates are off-register at every join.
       - the practical helmet is essentially one crude piece; replicas built
         from the actual prop describe it as HINGED AT THE TOP for removal and
         fastened at the sides.

     STYLISED, AND SAID SO PLAINLY: the centre-split faceplate this sequence
     animates is a LATER-suit mechanism, not how the Mark I opens. It is kept
     on purpose — the transition needs an aperture for the camera to travel
     through, and "the faceplate opens" is the franchise's own visual grammar
     — but it is a dramatisation and is not to be described as accurate. The
     side fastening tabs on the shell are the nod to how it really closed.

     What the drawing carries from that pass, all still present and unchanged in
     intent: six overlapping hand-cut plates rather than one shell; dashed weld
     beads with a broken light bead riding on them; twenty-four rivets at
     irregular spacing and radii; a hammered, pitted surface relief; two hammer
     dents; two oxide blooms; and two short, plain, mismatched eye slots cut
     through the plate onto a dark recess — cruder than a later helmet's swept
     lens. None of it was thrown away below; it was re-lit and re-founded.

     MATERIAL AND FORM — REWORKED 2026-08-04 (fifth pass). Two rounds of notes
     said the helmet "doesn't look real enough", and pressed for specifics the
     owner picked BOTH available complaints: the shapes read flat/cartoonish,
     AND the material read as a vector drawing rather than as steel. So this
     pass changed only those two things. The sequence — six keyframes, the 3D
     hinge, the dolly-through, `mask-arrive`, the one-shot timer and teardown,
     the three close paths, and the reduced-motion static frame — was not
     touched, and `presentation:"centered"` is still on this one title alone.

     THE MATERIAL is now a real photograph, which is the project's one and only
     embedded raster asset, taken with the owner's explicit sign-off after two
     rounds of pure-vector work failed to get past looking drawn.
       SOURCE  ambientCG "Metal052C" colour map, via Wikimedia Commons
               (File:Metal052C 8K-PNG Color.png)
       AUTHOR  ambientCG / Lennart Demes — https://ambientcg.com/view?id=Metal052C
       LICENCE CC0 1.0 Universal (Public Domain Dedication). Checked against the
               Commons file's own licence metadata before embedding rather than
               assumed. CC0 requires no attribution; the credit is kept anyway.
     It is baked into index.html as a ~33 KB base64 data URI (greyscale, 320px,
     mean shifted to exactly 128 so it is neutral under the `overlay` blend), so
     the app still has NO runtime network dependency and still works from
     file://. It is declared once as an <image> in the shell's defs and pulled in
     by <use> — the faceplate SVG is emitted twice, so inlining it there would
     have put five copies of the payload in the DOM on every open.
     On top of it: feDiffuseLighting AND feSpecularLighting over the same noise
     field, summed — specular response is what separates metal from grey paint —
     plus a second very-low-frequency lit noise pass for the broad warp of
     hand-beaten sheet, and a fake environment reflection with a hard horizon
     (cool sky, a hot glint, dark ground), which is the standard real-time cheat
     for making flat art mirror its surroundings.

     THE FORM was the bigger fix, and it was mostly a lighting-model problem:
       - the steel gradients were on the objectBoundingBox default, so every
         plate normalised its own light->dark ramp and the face was six separate
         drawings. They are now userSpaceOnUse, pinned to face space, so all six
         share one light direction and the ramp runs continuously across seams.
       - the four plate seams were straight polylines. A band wrapping a convex
         head does not project straight, and four horizontal rules across a face
         is the signature of a flat plane that no amount of grain can undo. They
         are now quadratic arcs, shared by the fills, the beads and the shadows.
       - added a cross-face curvature ramp and a vertical ramp, painted OVER the
         material (material over form flattens form — that was the earlier bug),
         with ONE narrow highlight band and a long falloff rather than a broad
         bright middle. Plate tone is now assigned by form, not by alternation:
         brow proud, eye band recessed under it, jaw falling away.
       - added the plate's THICKNESS: the ring between the silhouette and an
         inset copy of it, lit where it faces the light and black where it turns
         away. Plus a near edge and a far edge instead of one uniform rim.
       - overlapping plates now cast hard, close contact shadows onto the plate
         beneath (three stepped strokes, not a blur — the crisp inner edge is
         what reads), with a separate sideways variant for vertical edges.
       - the nose ridge became two facets meeting on a crest, with the specular
         crest line moved off the split line that had been painting over it.

     SIXTH PASS — 2026-08-04, THE FIRST ONE DONE WITH EYES OPEN.
     Passes three to five were all argued from the source code, because there
     was no way to look at the rendered result. The owner's verdict on all of
     them was that it looked "like a drawing made by a kid instead of a mask
     done by Tony Stark". A render pipeline now exists (`tools/render_mask.sh`
     rasterizes the real SVG+CSS out of index.html to /tmp/mask_static.png), and
     every change below was made against an actual render, not against a theory.
     RULE FOR ANY FUTURE SESSION TOUCHING THIS ARTWORK: run that script and look
     at the PNG before and after. Do not tune this file blind again.

     Seven named defects, each confirmed by looking, then fixed and re-checked:

     1. IT LOOKED MIRRORED. Corrected diagnosis first, because the obvious one
        is wrong: the "one faceplate string used twice, each copy clipped to its
        own half" architecture does NOT force a mirror. The two clips reassemble
        the SAME single drawing, so asymmetric geometry passes through intact.
        The old artwork looked mirrored because it WAS drawn nearly symmetric.
        So nothing structural was changed (the split-open animation depends on
        that structure); the drawing was simply made properly uneven. The
        silhouette is now one POINT LIST (MK_PTS) from which the outline, its
        inset copy and the shell are all derived, and no vertex matches its
        opposite number — the left cheek corner sits 16px higher than the right,
        the chin is off-centre, the temples differ in length. On top of that,
        one-sided battle damage that could not possibly mirror: a riveted scrap
        patch welded over the RIGHT cheek, a raked gouge across the LEFT one, a
        bullet crater on the RIGHT temple, and rivet counts that differ per band
        (five on the left brow, three on the right).
     2. THE EYES READ AS GOGGLE LENSES. They were wide near-rectangles with a
        heavy uniform dark frame and a full-bleed pale fill — a UI element. Now
        they are narrow WEDGES, tall at the outer end and tapering to a point at
        the nose, angled so the inner end sits lower (the brow-down geometry the
        eye reads as hostile). The recess is only ~1.3px larger than the light
        inside it, so the black reads as the thickness of the cut instead of a
        border, and the light is a vertical gradient inset within the hole, so
        it reads as a lit cavity rather than a pale sticker. The two do not
        match in length or height.
     3. THE MOUTH WAS ONE FLAT BLACK RECTANGLE — a missing-texture hole. It is
        now a real grille (MK_GRILLE): a dark recess, a darker box behind it,
        and seven separate hand-cut bars in front, each a slightly different
        width and length, each with its own lit left edge and shadowed right
        edge, tapering with the jaw's perspective, inside a torched aperture
        with a dark upper lip and a lit lower one.
     4. THE SILHOUETTE WAS AN EGG. Redrawn, not decorated: a wide FLAT crown
        with chamfered corners, straight vertical temples, hard cheek corners,
        and a real trapezoid jaw running in on straight diagonals to an almost
        flat chin. The shell behind it was also pulled in (1.075 -> 1.05 scale)
        and darkened, because its pale rounded halo was reinstating the egg
        outside the faceplate's new angularity.
     5. THE PHOTOGRAPHIC TEXTURE WAS A FAINT GREY HAZE. The missing variable was
        contrast, not amount: the plate is mean-128 greyscale, and 128 is the
        neutral point of `overlay`, so a linear ramp PIVOTED ON 128 (new filters
        #mkTexC / #mkTexC2, slope 2.1 and 1.9) drives the pits darker and the
        brush striations brighter without tinting the steel at all.
        AND THE ACTUAL FLATNESS BUG, which no amount of texture tuning would
        have fixed: .mk-grain and .mk-warp were painted at NORMAL blend. A
        filter's output is an OPAQUE lit relief, so laying it over the plates at
        plain alpha averaged every pixel toward one flat grey and erased the
        form shading underneath — that is what made the face read as pale
        stucco with no light on it. Both are now `mix-blend-mode:overlay`.
     6. THE UNEXPLAINED AMBER BLOB IS GONE. The old #mkRust radial gradient and
        its two blooms are deleted outright. What replaced them all have stated
        physical causes: a carbon scorch fanning back from an actual bullet
        crater (with its own lit lip), and a rust weep running downhill from a
        specific chin rivet — rust runs from where water sits, i.e. a fastener.
     7. THE WELDS READ AS SEWING-PATTERN CUT LINES. A weld is three things and
        only the middle one was drawn. Added .mk-weld-halo (the oxidation: a
        hand-run bead burns the steel brown-black around it, and that
        discolouration is most of what tells you a line is a weld) and
        .mk-weld-rip (the ripple highlight, on a different dash period and
        offset so the two patterns never line up). The bead itself is heavier
        (5px) and on an irregular six-value dash array rather than one repeated
        pair, which is what stops it reading as machine stitching.

     Also this pass: the nose ridge no longer gets the full weld bead down both
     sides — it is a FOLD in the plate, not a welded join, and with the bead on
     it, it rendered as two black bars. It gets a thin scored edge instead.

     Sequence untouched again: the six keyframes, the 3D hinge, the dolly, the
     `mask-arrive` landing, the 620ms/2400ms one-shot timer, clearMaskIntro()/
     startMaskIntro(), the three close paths and the reduced-motion static frame
     were not modified. `presentation:"centered"` remains on this title alone;
     Homecoming and the other 150 titles are untouched.

     STILL STYLISED, said plainly: the silhouette is a frontal faceplate, not a
     helmet drawn in perspective. That is deliberate and not an oversight — the
     sequence hinges the plate open on a centre split viewed dead-on, and a
     perspective silhouette would break the symmetry the split depends on. The
     depth comes from the bevel, the curved seams and the lighting, not from a
     turned view.

     VERIFIED (WebSearch, 2026-08-04):
       - Tony + Yinsen build a miniaturised, palladium-cored arc reactor in the
         Ten Rings cave, from Ten Rings spare parts and Stark missile salvage,
         to power the electromagnet keeping shrapnel out of Tony's heart
         (Iron Man Wiki / MCU Wiki, "Arc Reactor" & "Iron Man Mark I")
       - its stated output is three gigajoules per second — hence the "3 GJ/S"
         callout on the drawing; Tony's own framing is "fifty lifetimes" of
         heart, or "something big for fifteen minutes"
       - Stark and Yinsen drew up the Mark I's blueprints in the cave; the suit
         is explicitly crude, built with the limited tools and materials to hand
       - the "Jericho"/Freedom Line weapons-expo presentation and Tony's "the
         best weapon is one you only need to fire once" line (checked in the
         first pass, still the basis for the Stark Industries stencil)

     OUR ANNOTATION, not a claim about the film: the specific drawing geometry
     (ten coil segments, the Ø 62 MM dimension, the sheet layout and its title
     block) is invented to read as a plausible engineering sheet. The film never
     shows this drawing. The Portuguese title-block copy ("oficina da gruta ·
     sem aprovação") is ours too. */
  "Iron Man": {
    bg:"#170f08", accent:"#c98a2c", accent2:"#7a1414", ink:"#f2e3c8",
    panel:"ironman2008",
    presentation:"centered",
    intro:"ironmask",
    ref:"the gold-titanium alloy Tony mixes in the cave, not the show-car red/gold of the suit's paint job"
  },
  "The Incredible Hulk": {
    bg:"#0c130d", accent:"#5fae52", accent2:"#1f2e17", ink:"#dff0d8",
    ref:"the sickly fluorescent green of the Culver University lab gamma readouts"
  },
  "Iron Man 2": {
    bg:"#0a1218", accent:"#3fc6e0", accent2:"#8a8f94", ink:"#dff6fb",
    ref:"the palladium-poisoned arc reactor's core, blue-white and failing"
  },
  "Thor": {
    bg:"#0a0e1c", accent:"#8fa8ff", accent2:"#c9a24a", ink:"#e6ecff",
    ref:"the Bifrost's rainbow-conduit blue against Asgard's gold filigree"
  },
  "Captain America: The First Avenger": {
    bg:"#0e1210", accent:"#3f6b4a", accent2:"#8a1f2b", ink:"#e4ede5",
    ref:"the drab olive of a 1943 SSR field jacket, not the star-spangled suit"
  },
  /* DEEP PASS (panel:"avengers2012") — ADDED 2026-08-05.
     See .panel-avengers2012 / .av-* in index.html, PANEL_HTML.avengers2012
     and MASK_HTML.assemble there.

     THE PALETTE was already right and is KEPT, not replaced: portal blue
     over a dark street, with the gold as the warm counterweight. Only
     `accent2` moved a shade warmer (#c9a832 -> unchanged) — in practice
     nothing was discarded; the panel simply builds on it.

     THE CARD: not the team poster. The dossier becomes a slab of the
     street the fight happened on — the panel widens 392px -> 428px, the
     interior inverts to light-on-dark, the Chitauri portal bleeds cold
     blue down from the top edge and TEARS the sheet open along an
     irregular rip, tilted concrete slabs / bent rebar / glass slivers
     pile across the foot, dust hangs in the light, and the Stark Tower
     sign — reduced to its one surviving letter — is the outline
     watermark behind the title block. Under the title, the six member
     colours run as a single struck rule; the "ver antes / a seguir /
     desvios" links are restyled as ROLL-CALL ROWS, each with a colour
     tab down its leading edge cycling through those same six.

     THE OPENING (presentation:"centered", intro:"assemble") — the circle
     shot, as a diagram. Six light-trails sweep in from the edges of the
     screen, one per member in that member's colour, land together on a
     ring built from six 60-degree arcs in the same six colours, the ring
     turns and blows open, and the dossier rises up THROUGH its centre.
     1780ms total — slower than Homecoming's 950ms snap, faster than Iron
     Man's 2400ms cinematic, because it is a convergence: it needs time
     for six things to arrive one after another, but it is not a reveal.

     VERIFIED (WebSearch, 2026-08-05):
       - during the Battle of New York the S, T, R and K fall off the
         STARK sign on the tower, leaving the "A" that becomes the
         Avengers Tower logo (ScreenRant / Inside the Magic, both citing
         the film; also raised as a continuity point against Hawkeye's
         flashback). This is the watermark.
       - the 360-degree circling shot of the assembled team is a real,
         deliberately-engineered shot: ILM built it from four virtual New
         York locations tied together, shooting full 360 panoramics from
         the top of the MetLife building, which is where Stark Tower sits
         geographically (fxguide, "VFX roll call for The Avengers");
         Scarlett Johansson has described it as the moment the cast felt
         the film was going to work. This is what the ring is.
       - the team eating shawarma in silence is the film's post-credits
         scene, and Endgame calls back to it (ScreenRant). This is the
         receipt.

     OUR INVENTION, not a claim about the film: the receipt itself — the
     name "Shawarma Palace", the prices, and the Portuguese line "mesa 1 ·
     sem conversa" are ours; the restaurant's on-screen name is not
     something we verified. The six specific hex values assigned per
     member, the roll-call row treatment, the street-slab card and the
     ring-as-diagram staging are all designed for this UI. No such prop or
     shot exists. */
  "The Avengers": {
    bg:"#0a1420", accent:"#2f8fce", accent2:"#c9a832", ink:"#e2f0fb",
    panel:"avengers2012", presentation:"centered", intro:"assemble",
    ref:"the Chitauri portal's cold blue tear over Stark Tower"
  },
  "Thor: The Dark World": {
    bg:"#0c0a16", accent:"#6f3fa0", accent2:"#c94a8a", ink:"#ece0f7",
    ref:"the Aether's living-smoke violet-red as it moves under Jane's skin"
  },
  "Iron Man 3": {
    bg:"#170a08", accent:"#e0521f", accent2:"#2a2620", ink:"#f7e3d8",
    ref:"Extremis overheating a body from the inside, molten orange through skin"
  },
  "Captain America: The Winter Soldier": {
    bg:"#0d0f11", accent:"#6f7680", accent2:"#8a1414", ink:"#dde1e5",
    ref:"the grey concrete and red star of a Cold War-era HYDRA cell, not the flag"
  },
  "Guardians of the Galaxy": {
    bg:"#160a1c", accent:"#e0507a", accent2:"#3fa8a0", ink:"#f6e3ef",
    ref:"the Walkman's mixtape-orange glow against Xandar's teal skyline"
  },
  "Avengers: Age of Ultron": {
    bg:"#0e0a12", accent:"#c94a4a", accent2:"#7a7a84", ink:"#f0e3e3",
    ref:"Ultron's exposed red optical sensor in cold, unfinished chrome"
  },
  /* DEEP PASS (panel:"antman") — NEW ENTRY, ADDED 2026-08-05.
     This title had NO theme at all before today — it was falling back to
     its cluster colour. So the palette below is new, not a refinement:
     the Pym Particle vial's oxblood red against the cold cyan of a
     Pym Technologies clean room, on the near-black of a night burglary.
     See .panel-antman / .am-* in index.html, PANEL_HTML.antman and
     MASK_HTML.shrink there.

     THE CARD: the whole film is an argument about scale, so the dossier
     becomes a scientific SPECIMEN CARD and plays it straight. Cool
     grey-green card stock (deliberately not the warm parchment of Doctor
     Strange, the other light panel in this batch) over a fine engraved
     measurement grid, a Pym Technologies letterhead, macro crop marks at
     the corners of the field, two entomological pins holding it down,
     and one carpenter ant drawn right across it at a size no ant has
     ever been. Under the ant, a 10 mm scale bar — and at that same
     magnification, a 1.8 m man, a few pixels tall. In the corner, a toy
     tank engine at 1:87. The reference links are the little strung paper
     FIELD TAGS tied to a pinned specimen: punched hole, thread, clipped
     corner, catalogue-plate typography.
     466px — the WIDEST panel in the archive, on the film about being
     small. That is the joke as well.

     THE OPENING (presentation:"centered", intro:"shrink") — the premise
     as the transition. The card does not fade or slide: it arrives
     THIRTEEN TIMES its size and shoved off to one side, so barely a
     corner of it is on screen, then shrink-snaps down with a whip of
     motion blur, dipping under 1:1 before it settles. Three nested
     bracket frames snap inward around it like a macro lens racking
     focus. 1150ms — the fastest opening in the archive, because the gag
     only works if it is a snap.

     VERIFIED (WebSearch, 2026-08-05):
       - the film's four ant species are named on screen and are real
         taxa: crazy ant (Paratrechina longicornis), bullet ant
         (Paraponera clavata), CARPENTER ANT (Camponotus pennsylvanicus)
         and fire ant (Solenopsis geminata) — catalogued in "Ants in the
         Ant-Man movie, with biological notes" (Journal of Geek Studies,
         2017). The card's specimen is the carpenter ant, which is the
         winged one Scott rides.
       - that ant is designated #247 by Pym and named "Ant-thony" by
         Scott; 247 is a nod to Tales to Astonish #27 and Marvel Premiere
         #47, the first appearances of Hank Pym and Scott Lang (Marvel
         Database / MCU Wiki, "Ant-thony"). Hence "espécime n.º 247".
       - the climax is fought on Cassie's THOMAS THE TANK ENGINE train
         set, and the toy is hit by a deflected Pym disc and grows huge,
         going through the roof and landing on a police car (multiple
         plot sources incl. TV Tropes / CBR). Hence the toy in the corner
         at 1:87 — and, of course, the label understates it.

     OUR INVENTION, not a claim about the film: the specimen card itself.
     Pym Technologies has no such archive on screen; the letterhead, the
     Portuguese copy ("arquivo de espécimes · acesso restrito", "massa
     constante"), the 1:87 label and the scale bar are ours, as is the
     ant drawing — it is a plausible entomological plate of the right
     species, not a trace of the film's CG model. The BRIEFCASE that was
     originally sketched for this card was DROPPED rather than guessed
     at: the shrinking-building briefcase is from the sequel, and we
     could not verify a briefcase prop in this film, so it is not here. */
  "Ant-Man": {
    bg:"#0d1114", accent:"#c9403a", accent2:"#3fa8c6", ink:"#e8eef0",
    panel:"antman", presentation:"centered", intro:"shrink",
    ref:"the Pym Particle vial's oxblood red against the cold cyan of a Pym Technologies clean room"
  },
  "Captain America: Civil War": {
    bg:"#0d1012", accent:"#8a1f2b", accent2:"#2f4f8a", ink:"#e0e5e8",
    ref:"the airport tarmac split down the middle — Cap's red vs. Stark's blue"
  },
  /* DEEP PASS (panel:"strange") — ADDED 2026-08-05.
     See .panel-strange / .ds-* in index.html, PANEL_HTML.strange and
     MASK_HTML.slingring there.

     THE PALETTE is kept: arcane violet as the accent, Agamotto gold as
     accent2. Note the deliberate tension it now sits in — the palette
     drives the graph and the app chrome around the card, while the card
     ITSELF is warm parchment. That is on purpose: the mirror dimension is
     the world outside the book; the book is a physical, yellowed object.

     THE CARD is the only one of these four with a LIGHT interior, which
     is most of why it earns its place next to them. The panel narrows to
     388px (a codex leaf is tall and narrow), goes to aged parchment with
     foxing blooms and a laid-paper grain, and is written in iron-gall
     brown with rubricated red initials and a red incipit rule threaded
     with gold. Compassed mandala geometry is drawn twice at different
     scales behind the text and the two turn slowly against each other —
     one turning drawing reads as a spinner, two counter-turning read as
     geometry. The Eye of Agamotto sits at the centre of the leaf as its
     watermark, inside the scorch ring the portal burned into the page.
     "Ver antes / a seguir" become marginalia — a rubricated pilcrow
     hanging in the margin, the reference in the scribe's italic, a
     hairline rule under each. The crossovers are drawn as THE LOOP: a
     closed circular arrow instead of a pilcrow, a dashed ring of violet
     ink around the row, and a slow pulse, because that argument never
     resolves.

     THE OPENING (presentation:"centered", intro:"slingring") — REBUILT
     2026-08-06. A hot point travels a circle in mid-air and a rim of fire
     ignites in its wake, filament by filament; a Kamar-Taj mandala inks
     in behind it and counter-rotates; then the dossier comes UP THROUGH
     the hole, clipped by the rim as it rises. 2100ms — the slowest in
     this batch apart from Iron Man, on purpose: this is a spell being
     cast and the beat IS the drawing of it.

     WHY IT WAS REBUILT: the first version was three smooth stroked
     circles plus 16 tick marks, and it read as a LOADING SPINNER. A
     stroked circle cannot read as fire no matter what colour it is. The
     rim is now 170 individual filaments of uneven length, width, opacity
     and flicker period (generated by tools/gen_portal.mjs), each igniting
     at a delay set by its own angle so the fire chases the hand round.
     The other half of the fix is the clip: the card is masked by
     circle() as it scales up, so it is genuinely cut off by the portal
     edge. That clip does more to sell "came through a portal" than any
     amount of glow, which is what the first version tried instead.

     The staging is original to this UI; the sling-ring portal itself is
     of course the film's, but this particular opening is not a shot.

     VERIFIED (WebSearch, 2026-08-05):
       - the Book of Cagliostro is a real object in the film: a forbidden
         tome kept in the Kamar-Taj library, which Strange repairs and
         reads using the Eye of Agamotto, learning about Dormammu and the
         Dark Dimension from its stolen pages (Wikipedia, "Doctor Strange
         (2016 film)"; MCU Wiki, "Eye of Agamotto").
       - the Wi-Fi gag is real and the password is SHAMBALLA — Mordo's
         line is "The Wi-Fi password. We're not savages", and the word is
         a nod to the comics arc "Into Shamballa". The marginal note on
         the card is a Portuguese rendering of that exchange.
       - the Dormammu bargain: Strange uses the Eye's Time Stone to trap
         them both in a loop, is killed over and over, and each time
         returns with "Dormammu, I've come to bargain", until Dormammu
         agrees to leave Earth. This is what the crossover-link loop
         treatment refers to.
       - the SLING RING was invented for the film — it is not from the
         comics (per the film's annotation sources). Worth stating,
         because it would be easy to present it as long-standing canon.

     OUR INVENTION, not a claim about the film: the leaf itself. The
     Book of Cagliostro is never shown as this page, the mandala geometry
     here is compassed by us rather than traced from a prop, the scorch
     ring, the folio number ("fólio ccxvii · verso"), and the marginal
     line «o tempo insultar-te-á» are all ours. The three-ring, twenty-
     spark staging of the portal is designed for this UI; the film's
     portals are a spinning circle of sparks, but not this diagram. */
  "Doctor Strange": {
    bg:"#0a0818", accent:"#5f3fa0", accent2:"#e0a832", ink:"#ece3f7",
    panel:"strange", presentation:"centered", intro:"slingring",
    ref:"the Eye of Agamotto's green-gold glow inside the Sanctum's mirror dimension"
  },
  "Black Panther": {
    bg:"#0a0d10", accent:"#8a1f2b", accent2:"#c9a832", ink:"#e4e8ea",
    ref:"vibranium ore's faint purple hum under Wakandan royal purple and gold"
  },
  /* DEEP PASS (panel:"homecoming") — REBUILT 2026-08-04 (second pass).
     See .panel-homecoming in index.html and PANEL_HTML.homecoming there.

     The "Blu-ray sticker sheet" metaphor of the first pass was DISCARDED.
     It was packaging, not the film: it said something about how the disc was
     sold, not about Peter. What replaced it: the note panel becomes a page
     torn out of Peter's Midtown notebook — cheap bright notebook stock rather
     than manila, feint blue rule, a red margin rule, three punched binder
     holes down the left edge (the panel narrows 392px -> 372px and its left
     padding shifts to clear them), the Midtown letterhead across the head of
     the page, the title swiped through with a yellow study-guide highlighter,
     a ballpoint spider-web doodled out of the top-right corner (real SVG
     geometry: radials plus sagging quadratic spirals, not a gradient), the
     mask Peter drew in his own margin, and — over the top of the homework —
     the Vulture's salvaged wings rising across the bottom of the page. On
     open, a web line snaps taut and the page swings in under it and settles.

     VERIFIED (WebSearch, 2026-08-04):
       - Peter attends the Midtown School of Science and Technology and is on
         its Academic Decathlon team; the team wins the national tournament in
         Washington D.C. and the trip is where the Washington Monument
         incident happens — the elevator is trapped after a Chitauri-derived
         power core detonates, and Spider-Man gets them out (MCU Wiki,
         "Midtown School of Science and Technology" / "Rescue at the
         Washington Monument") — this is what the pencil scrawl refers to
       - Adrian Toomes runs a salvage crew clearing Chitauri debris after the
         Battle of New York, is pushed out by Damage Control, keeps some of
         the alien tech, and has the Tinkerer build him a Chitauri-powered
         flying exo-suit with wings and talons (MCU / Villains Wiki, "Vulture")
         — hence the cold alien-blue rim light and turbine glow on an
         otherwise scrap-dark, blue-collar silhouette
       - (first pass, still standing) the DIY suit from Civil War: hoodie-grade
         red fabric, hand-cut eye holes, no Stark tech; and the teaser posters'
         deliberately mundane, teenage tone rather than beam-in-the-sky
         superhero marketing — both feed the "this is a kid's school notebook"
         framing

     OUR ANNOTATION, not a claim about the film: the notebook page itself, the
     doodled mask, the letterhead wording, and the Portuguese scrawl
     ("apanhados no monumento… outra vez") are ours. No such prop appears on
     screen.

     ADDED 2026-08-05 — presentation mode + opening sequence, to match Iron
     Man having one, but deliberately a different KIND of thing, not a copy:
     `presentation:"centered"` + `intro:"webpull"`. Where Iron Man is a slow
     (2.4s), cinematic reveal, this is fast (~950ms) and kinetic — two web
     lines shoot in from opposite bottom corners and converge on the centre,
     a flash marks the "grab", three short strands fan out as the web
     anchors, then the dossier arrives pulled taut with a slight overshoot
     swing. See .ws-* in index.html (structural CSS + keyframes) and
     MASK_HTML.webpull (the markup — SVG lines with `pathLength="1"` so one
     keyframe fits every line regardless of its angle/length). This is our
     own invented transition, not depicting a specific shot from the film —
     web-shooting itself is obviously core to the character, but the exact
     staging here (converging lines, anchor strands, the pulled-taut arrival)
     is designed for this UI, not reproduced from a scene. */
  "Spider-Man: Homecoming": {
    bg:"#120a0a", accent:"#c92f3a", accent2:"#1f4fa0", ink:"#f7e3e3",
    panel:"homecoming", presentation:"centered", intro:"webpull",
    ref:"the homemade suit's stitched-together red, Ben Franklin blue, and duct tape — not the polished Stark-issued suit"
  },
  /* DEEP PASS (panel:"ragnarok") — ADDED 2026-08-05.
     See .panel-ragnarok / .rg-* / .mj-* in index.html, PANEL_HTML.ragnarok
     and MASK_HTML.mjolnir there.

     THE PALETTE is kept exactly as it was — hot pink, acid teal, two suns.
     It was already the right reading of the film; the panel builds on it
     rather than replacing it, adding only a gold (#e8c34a) for the
     Asgardian art-deco metal, which the colour-only layer had no slot for.

     THE CARD: the one file in the archive that is DRAWN rather than
     photographed. The panel goes to 408px and becomes a fight bill —
     KIRBY KRACKLE bands top and bottom (clustered solid-black dots eating
     into the inner edge of a hard colour band, irregular sizes/spacing
     with stray satellites; generated geometry, because a repeating
     gradient reads as a machine pattern and Krackle is hand-inked), an
     Asgardian art-deco rule with chevron corner blocks, the title set as
     the Contest of Champions BANNER with notched ends and a hard drop
     shadow instead of as a heading, Korg doodled in the margin, and the
     Grandmaster's melt stick propped in the corner. The reference links
     become arena roster plates — chunky angular tiles with hard offset
     shadows, teal for what came before, pink for what comes next, orange
     for crossovers, which get the Devil's Anus as their glyph instead of
     an arrow.

     THE OPENING (presentation:"centered", intro:"mjolnir") — REBUILT
     2026-08-06, new concept. Mjolnir is thrown AT the viewer, tumbling
     out of the dark and growing as it comes, and shatters the SCREEN;
     the dossier turns out to have been behind the glass, and the shards
     fall off it. 2500ms — the approach, the break and the
     uncovering each get their own beat; an earlier cut had the card land on
     the impact frame and it stepped on its own shatter.

     THIS STAGING IS ORIGINAL TO THIS UI, NOT A SHOT FROM THE FILM. Hela
     catching and crushing Mjolnir is the film's beat; a hammer breaking
     the fourth wall is ours, invented so the dossier could be revealed
     rather than delivered. Do not let a later pass describe it as
     "verified" — there is nothing to verify. The previous version (the
     hammer shattering itself into ten wedges) was replaced because the
     owner judged the hand-drawn SVG hammer too crude to sell it.

     THE HAMMER IS A REAL 3D MODEL, NOT A DRAWING — the owner's Sketchfab
     GLB (CC-BY-4.0, TheDevilsEye; credited in README.md), rendered
     offline by tools/bake_hammer.mjs into a sprite sheet that index.html
     plays back with steps(). three.js runs at BUILD TIME only and is
     never shipped. Same lesson as the Iron Man mask: when a thing has to
     look real, use a real asset instead of drawing it again.

     VERIFIED (WebSearch, 2026-08-05):
       - KIRBY KRACKLE (a.k.a. Kirby dots): a field of solid black used
         for the negative space around unspecified energy, drawn as
         clusters of overlapping round dots along the edge of the effect;
         Kirby began using it in the 1960s and by Thor #169-170 (1969) it
         had become environmental (Wikipedia, "Kirby Krackle"; Kirby
         Museum). Using it as a BORDER is our own extension of the device.
       - the film's design is deliberately Kirby: Kevin Feige called it
         "an unabashed love letter to Jack Kirby" and production designer
         Dan Hennah has said "1960s Jack Kirby was our inspiration", with
         a wall of Kirby art in the production office (CBR; Marvel.com;
         ComicBook.com).
       - the Contest of Champions is the Grandmaster's gladiator tournament
         on Sakaar, and Korg is a Kronan imprisoned to fight in it (MCU
         Wiki, "Contest of Champions" / "Korg").
       - Korg's revolution line: he tried to start one "but I didn't print
         enough pamphlets so no one turned up". The Portuguese scrawl on
         the card is a translation of that line, not an invention.
       - the MELT STICK is real and is Topaz's: she offers the Grandmaster
         the melting stick when Loki interrupts him.
       - the DEVIL'S ANUS is the name of the large Magnestar wormhole in
         Sakaar's atmosphere ("Anus? Whose anus?" — "For the record, I
         didn't know it was called that when I picked it"). Hence its use
         as the crossover-link glyph: it is literally the film's own
         shortcut between places.

     OUR INVENTION, not a claim about the film: the runes engraved across
     the hammer head are decorative marks, not real Younger Futhark and
     not copied from the prop. Mjolnir is drawn in PROFILE rather than the
     head-on framing first sketched for this sequence — the profile is the
     silhouette people actually recognise, and a head-on striking face is
     an ambiguous metal square. The ten-way radial break, the roster
     plates, the chevron corners and all Portuguese copy are ours. */
  "Thor: Ragnarok": {
    bg:"#160a1c", accent:"#e05fa0", accent2:"#2fc6c0", ink:"#f7e3f0",
    panel:"ragnarok", presentation:"centered", intro:"mjolnir",
    ref:"Sakaar's junk-planet neon — hot pink and acid teal under two suns"
  },
  "Avengers: Infinity War": {
    bg:"#0a0810", accent:"#7a3f9a", accent2:"#c9a832", ink:"#ece3f2",
    ref:"the Infinity Gauntlet's six stones burning through Thanos's fist"
  },
  "Avengers: Endgame": {
    bg:"#0a0c14", accent:"#3f5fa0", accent2:"#c9a832", ink:"#e2e6f0",
    ref:"the quantum-realm time-heist suits' cold steel-blue against 2012's gold portal"
  },
  "Captain Marvel": {
    bg:"#0a0e1c", accent:"#e0a832", accent2:"#2f5fa0", ink:"#f2ecdc",
    ref:"a Kree photon blast's gold core inside a cold Starforce blue"
  },

  /* ============ Spider-Verse (Sony animated) ============ */
  "Into the Spider-Verse": {
    bg:"#0a0818", accent:"#e0507a", accent2:"#3fc6e0", ink:"#f2e3ec",
    ref:"the Ben-Day dot halftone and chromatic-aberration glitch of a misprinted comic panel"
  },
  "Across the Spider-Verse": {
    bg:"#1c0a12", accent:"#c92f6a", accent2:"#5f3fa0", ink:"#f7e3ec",
    ref:"Spot's white-void portals tearing hand-painted watercolor edges"
  },

  /* ============ Sony live-action / Venom ============ */
  "Spider-Man (2002)": {
    bg:"#100a0a", accent:"#a01f1f", accent2:"#1f3f8a", ink:"#f0dede",
    ref:"the hand-stitched practical webbing suit under Raimi's Dutch-angle streetlight"
  },
  "Spider-Man 2": {
    bg:"#0e0a10", accent:"#8a1f5a", accent2:"#c9a832", ink:"#f0e3ec",
    ref:"Doc Ock's four mechanical arms glowing amber against subway-tunnel dark"
  },
  "Venom": {
    bg:"#0a0808", accent:"#0f0f0f", accent2:"#c9302a", ink:"#e0d8d8",
    ref:"the symbiote's oil-black surface catching a single vein of red"
  },

  /* ============ X-Men (Fox) ============ */
  "X-Men": {
    bg:"#0a0e10", accent:"#3f6fa0", accent2:"#c9a832", ink:"#e0e8ec",
    ref:"the black leather uniform's steel-blue X buckle, first appearance"
  },
  "X2: X-Men United": {
    bg:"#0a0c10", accent:"#5f7f9a", accent2:"#8a1f2b", ink:"#e0e6ea",
    ref:"Nightcrawler's indigo smoke-teleport trail through the White House halls"
  },
  "X-Men: Days of Future Past": {
    bg:"#0c0a10", accent:"#6f5fa0", accent2:"#a03f3f", ink:"#e6e2ec",
    ref:"a Sentinel's adaptive-armor plating shifting color mid-battle, dystopian dusk"
  },
  "Deadpool": {
    bg:"#100808", accent:"#c9302a", accent2:"#1f1f1f", ink:"#f2dede",
    ref:"the mask's stitched red-and-black, Bea Arthur poster included"
  },
  "Logan": {
    bg:"#0e0c08", accent:"#8a7040", accent2:"#3a2e20", ink:"#e6e0d0",
    ref:"the sun-bleached, dust-caked limo crossing a 2029 Texas nowhere"
  },

  /* ============ vintage (pre-MCU oddities) ============ */
  "Blade": {
    bg:"#0a0810", accent:"#5f1fa0", accent2:"#8a1f2b", ink:"#e6dcf0",
    ref:"the strobe-lit blood-rave in the film's cold open, UV purple and arterial red"
  },
  "Howard the Duck": {
    bg:"#120e08", accent:"#c98a2c", accent2:"#3a6b3a", ink:"#f0e6cc",
    ref:"the 1986 poster's mustard-yellow cigar smoke and swamp green"
  },

  /* ============ Series — MCU Disney+ ============ */
  "WandaVision": {
    bg:"#0f0c08", accent:"#c9a832", accent2:"#e05070", ink:"#f2ecd8",
    ref:"a decade-shifting sitcom title card, warm 1950s TV-tube amber"
  },
  "Loki S1": {
    bg:"#0e0a06", accent:"#e0a832", accent2:"#4a3f2a", ink:"#f2e6cc",
    ref:"the TVA's fluorescent-lit orange filing cabinets and analog case clocks"
  },
  "Loki S2": {
    bg:"#0a0e10", accent:"#3fa8c6", accent2:"#e0a832", ink:"#e2eef2",
    ref:"the temporal loom's unraveling threads, cold blue against TVA amber"
  },
  "Hawkeye": {
    bg:"#0e0a08", accent:"#8a1f2b", accent2:"#c9a832", ink:"#f0e0d8",
    ref:"a NYC Christmas-market string of lights over the Tracksuit Mafia's purple"
  },
  "Moon Knight": {
    bg:"#0a0806", accent:"#c9a832", accent2:"#3a2e14", ink:"#f0e6cc",
    ref:"moonlit sandstone and Egyptian gold leaf inside a museum diorama"
  },

  /* ============ Series — Netflix Defenders ============ */
  "Daredevil S1": {
    bg:"#0a0808", accent:"#8a1414", accent2:"#1a1a1a", ink:"#e6dcdc",
    ref:"the hallway-fight's single bare bulb swinging over black leather"
  },
  "Daredevil S3": {
    bg:"#0a0808", accent:"#a01f1f", accent2:"#2a2420", ink:"#e8dcdc",
    ref:"Fisk's white suit stained the one color he can't wash out"
  },
  "Jessica Jones S1": {
    bg:"#0a0c14", accent:"#3f5f9a", accent2:"#8a1f8a", ink:"#dce2ec",
    ref:"a rain-streaked Alias Investigations window lit by a single neon sign"
  },

  /* ============ Series — Marvel Animation ============ */
  "X-Men '97 S1": {
    bg:"#0a0e14", accent:"#e0a832", accent2:"#3f6fa0", ink:"#eceef2",
    ref:"the '90s cel-animation palette, saturated primaries on a flat cerulean sky"
  },
  "What If...? S1": {
    bg:"#08060e", accent:"#e0a832", accent2:"#3f2f6f", ink:"#ece6f2",
    ref:"the Watcher's cosmic void, watercolor stars on deep Uatu-purple"
  },

};

/* Cluster-color fallback for any title not listed above. */
function themeFor(title, clusterKey, U){
  const t = THEMES[title];
  if(t) return t;
  const base = (U[clusterKey] && U[clusterKey].color) || "#ff7d1f";
  return { bg:"#14110c", accent:base, accent2:"#a9906a", ink:"#d8d0bf", ref:null };
}
