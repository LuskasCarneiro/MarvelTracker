/* Dumps an opening sequence as still frames so it can be LOOKED AT.
   Reading animation CSS tells you nothing about whether it reads as metal,
   glass or fire; this is the only honest feedback loop for that work.

     python3 -m http.server 8000 &          # from the project root
     node tools/frames.mjs mjolnir          # 12 frames + a contact sheet
     node tools/frames.mjs slingring 20     # more frames
     node tools/frames.mjs mjolnir 12 reduced   # prefers-reduced-motion path

   Output: tools/frames/<key>/f##.png and tools/frames/<key>/contact.png

   Time is FROZEN, not slept through: every running animation is paused and its
   currentTime set to the exact instant wanted. Sleeping races the compositor
   and gives a different frame every run, which makes comparing two attempts
   meaningless. A paused animation's currentTime includes its own delay, so a
   single number per frame is correct even though every element starts late. */
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { TITLES } from './titles.mjs';

const key = process.argv[2];
const count = Number(process.argv[3]) || 12;
const reduced = process.argv[4] === 'reduced';
if (!TITLES[key]) {
  console.error(`usage: node tools/frames.mjs <${Object.keys(TITLES).join('|')}> [count] [reduced]`);
  process.exit(1);
}

const dir = new URL(`frames/${key}/`, import.meta.url);
await mkdir(dir, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: reduced ? 'reduce' : 'no-preference',
});
p.on('pageerror', e => console.error('PAGEERROR', e.message));
await p.goto('http://localhost:8000/');
await p.waitForTimeout(2500);

await p.evaluate(t => openNote(nodes.find(n => n.t === t)), TITLES[key]);

/* The intro tears itself down on a timer. That teardown is correct in the app
   and wrong here — it would wipe the mask layer halfway through the capture. */
await p.evaluate(() => { try { clearTimeout(maskTimer); } catch {} });

const dur = await p.evaluate(k => INTRO_DURATION[k] || 2400, key);
const times = Array.from({ length: count }, (_, i) => Math.round((dur * i) / (count - 1)));

const shots = [];
for (const [i, t] of times.entries()) {
  const n = await p.evaluate(ms => {
    const anims = document.getAnimations();
    for (const a of anims) { a.pause(); a.currentTime = ms; }
    return anims.length;
  }, t);
  const name = `f${String(i).padStart(2, '0')}.png`;
  await p.screenshot({ path: new URL(name, dir).pathname });
  shots.push({ name, t, n });
}
console.log(`${key}: ${count} frames over ${dur}ms  (${shots[0].n} animations)`);

/* Contact sheet built by the browser we already have open — an HTML grid of the
   frames, screenshotted. Cheaper than pulling in an image library to composite. */
const cells = shots.map(s =>
  `<figure><img src="${s.name}"><figcaption>${s.t}ms</figcaption></figure>`).join('');
await writeFile(new URL('contact.html', dir), `<meta charset="utf-8">
<style>
  body{margin:0;background:#111;color:#bbb;font:11px ui-monospace,monospace;
       display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px;}
  figure{margin:0;} img{width:100%;display:block;border:1px solid #333;}
  figcaption{padding:2px 1px;}
</style>${cells}`);

const sheet = await b.newPage({ viewport: { width: 1600, height: 100 } });
await sheet.goto(new URL('contact.html', dir).href);
await sheet.screenshot({ path: new URL('contact.png', dir).pathname, fullPage: true });
console.log(`  tools/frames/${key}/contact.png`);

await b.close();
