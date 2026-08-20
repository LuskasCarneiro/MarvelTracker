/* Verificação do PRÓXIMO NO PERCURSO (detail-next): abre o dossiê de um hero,
   carrega em next, e espera que o hero mude para o item SEGUINTE EXATO do
   percurso (release order do cluster). One-off; corre contra o vite dev.    */
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
  .sort((a, b) => a.releaseYear - b.releaseYear)
  .map((i) => i.title);

await p.goto(url);
await p.waitForSelector('#search');
await p.waitForTimeout(2500); // texturas das covers

await p.evaluate(() => {
  const h = document.getElementById('scroll-space');
  window.scrollTo(0, (h.scrollHeight - window.innerHeight) * 0.3);
});
await p.waitForTimeout(900); // hero pousa

const previewTitle = () => p.evaluate(() => document.getElementById('preview-title')?.textContent);
const detailOpen = () => p.evaluate(() => document.getElementById('detail')?.classList.contains('open'));

await p.click('#preview-open');
await p.waitForTimeout(900); // quick path assenta a estante no slot do item

console.log('[dossiê] open:', await detailOpen());
if (!(await detailOpen())) { console.error('FAIL: #detail não abriu'); process.exit(1); }

// o quick path re-assenta a estante — o "atual" é o hero já assente (baseline)
const titleBase = await previewTitle();
console.log('[atual (assente)] preview-title:', titleBase);
if (!titleBase) { console.error('FAIL: sem hero (preview-title vazio)'); process.exit(1); }

const idx = order.indexOf(titleBase);
const titleExpected = order[(idx + 1) % order.length];
console.log('[esperado] próximo no percurso:', titleExpected);

await p.click('#detail-next');
await p.waitForTimeout(900);
const titleAfter = await previewTitle();
console.log('[next] preview-title:', titleAfter);
if (titleAfter !== titleExpected) {
  console.error(`FAIL: esperado «${titleExpected}», obtido «${titleAfter}»`);
  process.exit(1);
}
if (await detailOpen()) { console.error('FAIL: o dossiê devia ter fechado ao saltar'); process.exit(1); }

console.log('✓ check_next: PASS');
await b.close();