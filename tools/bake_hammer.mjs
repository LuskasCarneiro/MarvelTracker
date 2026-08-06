/* BUILD-TIME ONLY. Renders mjolnir_thors_hammer.glb (CC-BY-4.0, TheDevilsEye —
   see the credits in README.md) into one sprite sheet that index.html plays back
   with steps(). three.js runs here and is never shipped: the app stays
   dependency-free and double-click-portable, same principle as MK_PHOTO.

     python3 -m http.server 8000 &     # from the project root
     node tools/bake_hammer.mjs

   Writes tools/mjolnir_sheet.webp + a contact sheet to eyeball.

   THE APPROACH IS BAKED, NOT SCALED. The first version rendered only the
   rotation and let CSS scale() do the approach. That was wrong: scaling a
   fixed-distance render is a flat zoom — the hammer never foreshortens, so it
   reads as a decal getting bigger, and by impact it was displayed at 3x its
   cell and visibly soft. Now the model dollies toward a 46-degree lens, so the
   growth comes from the projection, and the cell is rendered at the size it is
   actually displayed. CSS does translation and nothing else. */
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';

const FRAMES = 30;
const COLS = 6;
/* Cell = the on-screen size at impact, so the sprite is never upscaled. Early
   frames leave most of the cell empty, which costs nothing: WebP encodes flat
   alpha to almost zero. */
const CW = 720, CH = 800;
const QUALITY = 0.84;

const out = new URL('.', import.meta.url);
const dir = new URL('frames/bake/', import.meta.url);
await mkdir(dir, { recursive: true });

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 760, height: 840 } });
p.on('pageerror', e => console.error('PAGEERROR', e.message));
p.on('console', m => m.type() === 'error' && console.error('CONSOLE', m.text()));
await p.goto('http://localhost:8000/tools/bake.html');
await p.waitForFunction('window.BAKE_READY === true', null, { timeout: 60000 });

/* Thrown, not presented: it spins 1.25 turns and lands square on the striking
   face (rx45 ry90 — the pose the probe showed as head-on) while dollying from
   far to almost touching the lens. easeIn on both, so it winds up slowly and
   arrives fast, which is what sells the impact that follows. */
const easeIn = t => t * t;

/* Apparent size under perspective goes as 1/(camZ - z), so a linear dolly spends
   most of its frames as a distant speck and does all its growing in the last
   few. Solve for z from a LINEAR apparent size instead, and the hammer grows
   evenly across the whole approach. */
const CAM_Z = 6;
const S_FAR = 1 / 20, S_NEAR = 1 / 1.7;
const zAt = t => CAM_Z - 1 / (S_FAR + (S_NEAR - S_FAR) * t);

const frames = [];
for (let i = 0; i < FRAMES; i++) {
  const u = i / (FRAMES - 1);
  const t = easeIn(u);            // rotation still winds up slowly and arrives fast
  const rx = 45 * t;
  const ry = 450 * t;
  const z = zAt(u);               // ...but the dolly is even, so it reads as travel
  frames.push(await p.evaluate(([a, c, d]) => { BAKE.render(a, c, 0, d); return BAKE.frame(); }, [rx, ry, z]));
  process.stdout.write(`\r  rendering ${i + 1}/${FRAMES}`);
}
console.log('');

const sheetUrl = await p.evaluate(
  ([f, cols, cw, ch, q]) => BAKE.sheet(f, cols, cw, ch, q),
  [frames, COLS, CW, CH, QUALITY],
);
const bytes = Buffer.from(sheetUrl.split(',')[1], 'base64');
await writeFile(new URL('mjolnir_sheet.webp', out), bytes);

const rows = Math.ceil(FRAMES / COLS);
console.log(`sheet: ${COLS}x${rows} cells of ${CW}x${CH} -> ${(bytes.length / 1024).toFixed(0)} KB webp`);
console.log(`  tools/mjolnir_sheet.webp`);

/* Eyeball check: the sheet on a dark ground, at playback size. */
await writeFile(new URL('contact.html', dir), `<meta charset="utf-8"><style>
 body{margin:0;background:#0b0b0d;padding:8px;}
 .s{width:${COLS * CW}px;height:${rows * CH}px;background:url(../../mjolnir_sheet.webp) 0 0/100% 100%;}
</style><div class="s"></div>`);
const s = await b.newPage({ viewport: { width: COLS * CW + 16, height: 100 } });
await s.goto(new URL('contact.html', dir).href);
await s.screenshot({ path: new URL('contact.png', dir).pathname, fullPage: true });
console.log(`  tools/frames/bake/contact.png`);

await b.close();
