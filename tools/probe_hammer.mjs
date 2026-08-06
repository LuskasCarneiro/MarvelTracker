/* Throwaway: renders the GLB from a spread of angles so the model's own
   orientation can be seen before choosing the tumble. node tools/probe_hammer.mjs */
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';

const dir = new URL('frames/probe/', import.meta.url);
await mkdir(dir, { recursive: true });

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 760, height: 840 } });
p.on('pageerror', e => console.error('PAGEERROR', e.message));
p.on('console', m => m.type() === 'error' && console.error('CONSOLE', m.text()));
await p.goto('http://localhost:8000/tools/bake.html');
await p.waitForFunction('window.BAKE_READY === true', null, { timeout: 60000 });
console.log(JSON.stringify(await p.evaluate(() => BAKE.info()), null, 1));

const angles = [
  [0, 0, 0], [0, 45, 0], [0, 90, 0], [90, 0, 0],
  [0, 0, 90], [30, 30, 0], [0, 180, 0], [45, 90, 0],
];
const cells = [];
for (const [i, a] of angles.entries()) {
  const url = await p.evaluate(([rx, ry, rz]) => { BAKE.render(rx, ry, rz); return BAKE.frame(); }, a);
  const name = `p${i}.png`;
  await writeFile(new URL(name, dir), Buffer.from(url.split(',')[1], 'base64'));
  cells.push(`<figure><img src="${name}"><figcaption>rx${a[0]} ry${a[1]} rz${a[2]}</figcaption></figure>`);
}
await writeFile(new URL('contact.html', dir), `<meta charset="utf-8"><style>
 body{margin:0;background:#222;color:#ccc;font:11px monospace;display:grid;
      grid-template-columns:repeat(4,1fr);gap:4px;padding:4px;}
 figure{margin:0}img{width:100%;display:block;background:#3a3a3a;}</style>${cells.join('')}`);
const s = await b.newPage({ viewport: { width: 1500, height: 100 } });
await s.goto(new URL('contact.html', dir).href);
await s.screenshot({ path: new URL('contact.png', dir).pathname, fullPage: true });
console.log('tools/frames/probe/contact.png');
await b.close();
