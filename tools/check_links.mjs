/* Verificação dos PERCURSOS LIGADOS (spec-links.md): dossiê de «X-Men» (xmen)
   mostra chips de ligados; clicar no 1.º chip fecha o dossiê e salta para o
   alvo (hash + preview). One-off; corre contra o vite dev.
     npm run dev &  →  node tools/check_links.mjs                             */
import { chromium } from 'playwright-core';

const url = process.argv[2] || 'http://localhost:5173/app.html';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.error('PAGEERROR', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });

await p.goto(url);
await p.waitForSelector('#search');
await p.waitForTimeout(2500); // texturas das covers

const chipLabels = () => p.evaluate(() =>
  [...document.querySelectorAll('#detail-links .chip')].map((b) => b.textContent));
const open = () => p.evaluate(() => document.getElementById('detail').classList.contains('open'));
const hash = () => p.evaluate(() => location.hash);
const preview = () => p.evaluate(() => document.getElementById('preview-title')?.textContent);

const fail = (msg) => { console.error('FAIL:', msg); process.exitCode = 1; };

// 1 — busca X-Men → salta para o slot → abre o dossiê
await p.mouse.move(5, 5); // rato ao topo → #nav/#search reaparecem
await p.waitForTimeout(150);
await p.fill('#search', 'x-men');
await p.waitForTimeout(200);
console.log('[busca] sugestões:', await p.evaluate(() =>
  [...document.querySelectorAll('#search-results button')].map((b) => b.textContent)));
await p.keyboard.press('Enter');
await p.waitForTimeout(1000);
console.log('[pick] hash:', await hash(), '| preview:', await preview());
if ((await preview()) !== 'X-Men') fail(`preview ${await preview()} ≠ X-Men`);

await p.click('#preview-open');
await p.waitForTimeout(900); // tween 0.6s + margem
console.log('[dossiê] aberto:', await open());

// 2 — chips de ligados presentes (refs do X-Men mencionam DOFP/First Class/Logan)
const chips = await chipLabels();
console.log('[ligados] chips:', chips);
if (chips.length < 1) fail('nenhum chip em #detail-links');
const target = chips[0];

// 3 — click no 1.º chip → dossiê fecha + hash do alvo + preview clicado
await p.click('#detail-links .chip:first-child');
await p.waitForTimeout(1200); // close + scroll + snap
console.log('[chip→] alvo:', target);
console.log('  dossiê fechado:', !(await open()));
console.log('  hash:', await hash());
console.log('  preview:', await preview());
if (await open()) fail('dossiê não fechou');
if ((await hash()) !== '#/xmen/filmes/estreia') fail(`hash ${await hash()} ≠ #/xmen/filmes/estreia`);
if ((await preview()) !== target.split(' · ')[0]) fail(`preview ${await preview()} ≠ alvo ${target}`);

console.log(process.exitCode ? '✗ check_links: FALHOU' : '✓ check_links: PASS');
await b.close();
