/* Generates the shatter geometry for the Thor opening and prints the SVG markup
   to paste into MASK_HTML.mjolnir in index.html.  node tools/gen_glass.mjs

   Real glass breaks on two families of line at once: RADIAL cracks running out
   from the impact, and CONCENTRIC hoops linking them. Every shard is therefore a
   quad between two neighbouring radials and two neighbouring hoops — which also
   guarantees the pieces tile the pane exactly, with no gaps and no overlaps.

   The jitter is what stops it reading as a pinwheel (the previous version's
   failure): angles are unevenly spaced, ring radii wobble per spoke, and the
   inner ring is much tighter than the outer ones, so shard sizes vary wildly.
   Seeded PRNG so re-running gives the same pane. */

const SEED = 20260806;
let s = SEED;
const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const jit = m => (rnd() * 2 - 1) * m;

const CX = 500, CY = 500;      // impact point, viewBox units
/* ponytail: 11x4 = 44 shards. Each animates transform+opacity only (no blur, no
   backdrop-filter) so the whole pane stays compositable on the 2015 integrated
   GPU this is built on. If it ever needs to look genuinely refractive, that's a
   canvas/WebGL job — more shards won't get there. */
const SPOKES = 11;             // prime: no mirror symmetry, so it can't read as a pinwheel
const RINGS = [70, 220, 470, 820];

/* Unevenly spaced radial directions. */
const ang = [];
for (let i = 0; i < SPOKES; i++) ang.push((i / SPOKES) * 360 + jit(360 / SPOKES * 0.42));

/* Per-spoke, per-ring radius wobble: the hoops are not circles. */
const R = ang.map(() => RINGS.map(r => r * (1 + jit(0.17))));

const pt = (i, ring) => {
  const a = (ang[i] * Math.PI) / 180;
  const r = ring < 0 ? 0 : R[i][ring];
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
};
const f = n => Math.round(n * 10) / 10;

/* ---- shards: one quad per (spoke, ring) cell ---------------------------- */
const shards = [];
for (let i = 0; i < SPOKES; i++) {
  const j = (i + 1) % SPOKES;
  for (let ring = 0; ring < RINGS.length; ring++) {
    const inner = ring - 1;
    const pts = inner < 0
      ? [pt(i, 0), pt(j, 0), [CX, CY]]                       // centre triangles
      : [pt(i, inner), pt(j, inner), pt(j, ring), pt(i, ring)];

    // centroid decides which way this piece is thrown
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const dx = cx - CX, dy = cy - CY;
    const d = Math.hypot(dx, dy) || 1;

    // outward push falls off for the far pieces, plus gravity; inner shards go first
    const push = 90 + (1 - Math.min(d / 700, 1)) * 260;
    shards.push({
      pts: pts.map(p => `${f(p[0])},${f(p[1])}`).join(' '),
      tx: f((dx / d) * push),
      ty: f((dy / d) * push + 260 + rnd() * 220),        // gravity dominates late
      rz: f(jit(180)),
      rx: f(jit(70)),
      dl: f(0.02 + (d / 900) * 0.16 + rnd() * 0.05),     // ripples outward
    });
  }
}

/* ---- cracks: the radials, and the hoops that link them ------------------ */
const radials = ang.map((_, i) =>
  `M${f(CX)} ${f(CY)} ` + RINGS.map((_, r) => `L${pt(i, r).map(f).join(' ')}`).join(' '));

const hoops = RINGS.slice(0, 3).map((_, r) =>
  'M' + ang.map((_, i) => pt(i, r).map(f).join(' ')).join(' L') + ' Z');

/* ---- emit --------------------------------------------------------------- */
const out = [];
out.push(`<svg class="mj-pane" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`);
out.push(`<g class="mj-cracks">`);
for (const [i, d] of radials.entries())
  out.push(`<path class="mj-crack" d="${d}" pathLength="1" style="--d:${f(0.02 + i * 0.008)}s"/>`);
for (const [i, d] of hoops.entries())
  out.push(`<path class="mj-crack mj-hoop" d="${d}" pathLength="1" style="--d:${f(0.06 + i * 0.05)}s"/>`);
out.push(`</g>`);
out.push(`<g class="mj-shards">`);
for (const sh of shards)
  out.push(`<polygon class="mj-shard" points="${sh.pts}" style="--tx:${sh.tx}px;--ty:${sh.ty}px;--rz:${sh.rz}deg;--rx:${sh.rx}deg;--d:${sh.dl}s"/>`);
out.push(`</g></svg>`);

const svg = out.join('');
console.error(`${shards.length} shards, ${radials.length} radials, ${hoops.length} hoops, ${svg.length} chars`);
console.log(svg);
