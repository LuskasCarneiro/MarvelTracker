/* Verificação do PRÓXIMO POR VER (detail-next-unwatched): com os 3 primeiros
   filmes MCU carimbados, abre um dossiê, carrega em next-unwatched e espera
   que o hero salte para o primeiro item NÃO VISTO a seguir ao atual (wrap).
   One-off; corre contra o vite dev.                                        */
import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:5173/app.html';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.error('PAGEERROR', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });

const catalog = JSON.parse(await readFile('src/data/catalog.json', 'utf8'));
const order = catalog
  .filter((i) => i.cluster === 'mcu' && i.type === 'movie')
  .sort((a, b) => a.releaseYear - b.releaseYear);

const WATCHED = new Set(order.slice(0, 3).map((i) => i.id)); // Iron Man, Hulk, IM2 vistos

await p.addInitScript((ids) => {
  const log = {};
  for (const id of ids) log[id] = { watchedAt: new Date().toISOString(), rating: 5 };
  localStorage.setItem('marvelVault.logs.v1', JSON.stringify(log));
}, [...WATCHED]);

await p.goto(url);
await p.waitForSelector('#search');
await p.waitForTimeout(2500);

await p.evaluate(() => {
  const h = document.getElementById('scroll-space');
  window.scrollTo(0, (h.scrollHeight - window.innerHeight) * 0.3);
});
await p.waitForTimeout(900);

const previewTitle = () => p.evaluate(() => document.getElementById('preview-title')?.textContent);
const detailOpen = () => p.evaluate(() => document.getElementById('detail')?.classList.contains('open'));

await p.click('#preview-open');
await p.waitForTimeout(900); // quick path assenta a estante

console.log('[dossiê] open:', await detailOpen());
if (!(await detailOpen())) { console.error('FAIL: #detail não abriu'); process.exit(1); }

const titleBase = await previewTitle();
console.log('[atual (assente)] preview-title:', titleBase);
if (!titleBase) { console.error('FAIL: sem hero (preview-title vazio)'); process.exit(1); }

const idx = order.findIndex((i) => i.title === titleBase);
const expectedIdx = ((idx + 1) % order.length + order.length) % order.length;
const expectedTitle = (() => {
  for (let step = 1; step <= order.length; step++) {
    const j = (idx + step) % order.length;
    if (!WATCHED.has(order[j].id)) return order[j].title;
  }
  return titleBase; // tudo visto → não salta
})();
console.log('[esperado] próximo por ver:', expectedTitle);

await p.click('#detail-next-unwatched');
await p.waitForTimeout(900);
const titleAfter = await previewTitle();
console.log('[next-unwatched] preview-title:', titleAfter);

if (expectedTitle === titleBase) {
  if (titleAfter !== titleBase || !(await detailOpen())) {
    console.error(`FAIL: tudo visto devia manter o dossiê («${titleAfter}»)`);
    process.exit(1);
  }
} else {
  if (titleAfter !== expectedTitle) {
    console.error(`FAIL: esperado «${expectedTitle}», obtido «${titleAfter}»`);
    process.exit(1);
  }
  if (await detailOpen()) { console.error('FAIL: o dossiê devia ter fechado ao saltar'); process.exit(1); }
}

console.log('✓ check_next_unwatched: PASS');
await b.close();