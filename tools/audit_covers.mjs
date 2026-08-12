// Auditoria visual das 152 covers — 4 sheets de ~40 posters.
// Uso: node tools/audit_covers.mjs   (dev server não é preciso — lê do disco)
import { chromium } from 'playwright-core';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const catalog = JSON.parse(await readFile('src/data/catalog.json', 'utf8'));
const dir = new URL('frames/covers/', import.meta.url);
await mkdir(dir, { recursive: true });

const SHEETS = 4;
const PER = Math.ceil(catalog.length / SHEETS);
const html = (slice) => `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#111;font:10px ui-monospace,monospace;color:#bbb;}
  .g{display:grid;grid-template-columns:repeat(8,1fr);gap:10px;padding:10px;}
  figure{margin:0;text-align:center;}
  img{width:100%;aspect-ratio:2/3;object-fit:cover;background:#222;border:1px solid #333;}
  figcaption{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}
</style>
<div class="g">${slice.map((c) => `<figure><img src="${path.join('../../public', c.poster)}"><figcaption>${c.id}</figcaption></figure>`).join('')}</div>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1700, height: 1100 } });
const out = [];
for (let s = 0; s < SHEETS; s++) {
  const slice = catalog.slice(s * PER, (s + 1) * PER);
  if (!slice.length) continue;
  await p.setContent(html(slice));
  await p.waitForTimeout(1200);
  const name = `covers-${s + 1}.png`;
  await p.screenshot({ path: new URL(name, dir).pathname });
  out.push(name);
}
await b.close();
console.log('sheets:', out.join(' '), `(${catalog.length} covers)`);
await writeFile(new URL('index.html', dir), html(catalog));
