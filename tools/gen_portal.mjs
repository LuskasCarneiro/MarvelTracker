/* Generates the sling-ring portal for the Doctor Strange opening and prints the
   SVG markup to paste into MASK_HTML.slingring in index.html.
   node tools/gen_portal.mjs

   WHY THIS EXISTS: the previous portal was three <circle> strokes and 16 tick
   marks, and it read as a loading spinner. A smooth stroked circle can never
   read as fire — what the eye recognises is a RIM MADE OF INDIVIDUAL SPARKS,
   uneven in length and brightness, igniting in sequence around the circle
   behind a travelling hot point that is visibly doing the drawing.

   So: ~150 short radial filaments at jittered angles, each with its own length,
   width, opacity, ignition delay and flicker period, plus a finer inner rank.
   Every filament ignites at a delay proportional to its own angle, which is
   what makes the fire chase the hand around the rim. Seeded PRNG so re-running
   gives the same portal. */

const SEED = 6180339;
let s = SEED;
const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;

const CX = 500, CY = 500;
const R = 300;                 // rim radius, viewBox units
const SWEEP = 0.62;            // seconds for the hand to travel all the way round
/* ponytail: 170 filaments, two CSS animations each (ignite + flicker). That is
   the honest ceiling on a 2015 integrated GPU — dense enough that the rim reads
   as continuous fire at 300 units of radius, cheap enough to stay smooth. More
   filaments would not read differently; a genuinely volumetric portal would be
   a canvas/WebGL job, not more SVG. */
const OUTER = 110, INNER = 60;

const f = n => Math.round(n * 10) / 10;
const filaments = [];

const rank = (count, radius, lenMin, lenMax, cls) => {
  for (let i = 0; i < count; i++) {
    const a = ((i / count) * 360 + (rnd() * 2 - 1) * (360 / count) * 0.7) % 360;
    const rad = (a * Math.PI) / 180;
    const r0 = radius * (1 + (rnd() * 2 - 1) * 0.022);
    const len = lenMin + rnd() * (lenMax - lenMin);
    // filaments lean along the rim as well as out from it, like a licking flame
    const lean = (rnd() * 2 - 1) * 0.42;
    const x1 = CX + Math.cos(rad) * r0;
    const y1 = CY + Math.sin(rad) * r0;
    const x2 = CX + Math.cos(rad + lean) * (r0 + len);
    const y2 = CY + Math.sin(rad + lean) * (r0 + len);
    filaments.push({
      cls,
      d: `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`,
      // ignition chases the hand: delay is the filament's own angle
      dl: f((a / 360) * SWEEP + rnd() * 0.05),
      w: f(1.1 + rnd() * 2.6),
      o: f(0.45 + rnd() * 0.55),
      fk: f(0.5 + rnd() * 0.7),          // flicker period, all different
    });
  }
};

rank(OUTER, R, 14, 74, 'sr-fil');
rank(INNER, R * 0.9, 8, 34, 'sr-fil sr-fil-in');

/* Kamar-Taj mandala: 12-fold interlocking arcs, drawn as overlapping circles
   whose centres sit on a ring — the classic construction, not a guess at a
   glyph. Two ranks counter-rotate. */
const mandala = (n, ringR, cr) => Array.from({ length: n }, (_, i) => {
  const a = ((i / n) * 360 * Math.PI) / 180;
  return `<circle cx="${f(CX + Math.cos(a) * ringR)}" cy="${f(CY + Math.sin(a) * ringR)}" r="${f(cr)}"/>`;
}).join('');

const out = [];
out.push(`<div class="sr-portal">`);
out.push(`<svg class="sr-svg" viewBox="0 0 1000 1000" aria-hidden="true">`);
// the hole itself, and the faint binder circle under the fire
out.push(`<circle class="sr-hole" cx="${CX}" cy="${CY}" r="${f(R * 0.96)}"/>`);
out.push(`<circle class="sr-binder" cx="${CX}" cy="${CY}" r="${R}" pathLength="1"/>`);
out.push(`<g class="sr-mandala sr-m1">${mandala(12, R * 0.52, R * 0.3)}</g>`);
out.push(`<g class="sr-mandala sr-m2">${mandala(8, R * 0.34, R * 0.22)}</g>`);
out.push(`<g class="sr-fire">`);
for (const fl of filaments)
  out.push(`<path class="${fl.cls}" d="${fl.d}" style="--d:${fl.dl}s;--w:${fl.w};--o:${fl.o};--fk:${fl.fk}s"/>`);
out.push(`</g>`);
// the hand: a hot point travelling the rim, ahead of the ignition front
out.push(`<g class="sr-hand"><circle class="sr-hand-core" cx="${f(CX + R)}" cy="${CY}" r="9"/>`);
out.push(`<circle class="sr-hand-halo" cx="${f(CX + R)}" cy="${CY}" r="26"/></g>`);
out.push(`</svg></div>`);

const svg = out.join('');
console.error(`${filaments.length} filaments, sweep ${SWEEP}s, ${svg.length} chars`);
console.log(svg);
