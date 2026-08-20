/* Navegação por teclado da estante (spec a11y): setas, Home/End, Enter/Esc,
   mv-next-in-path. One-off; corre contra o vite dev.                       */
import { chromium } from 'playwright-core';

const url = process.argv[2] || 'http://localhost:5173/app.html';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.error('PAGEERROR', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });

await p.goto(url);
await p.waitForSelector('#search');
await p.waitForTimeout(2500); // texturas das covers

const preview = () => p.evaluate(() => document.getElementById('preview-title')?.textContent);
const detailOpen = () => p.evaluate(() => document.getElementById('detail')?.classList.contains('open'));
const fail = (msg) => { console.error('FAIL:', msg); process.exitCode = 1; };

// 1 — ArrowRight ×5 → hero avança sempre e assenta no 6.º filme MCU (ordem de estreia)
let prev = await preview();
console.log('[→×0] preview:', prev);
if (prev !== 'Iron Man') fail(`preview inicial ${prev} ≠ Iron Man`);
for (let i = 1; i <= 5; i++) {
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(600); // snap assenta no slot e pose o hero
  const t = await preview();
  console.log(`[→×${i}] preview:`, t);
  if (!t || t === prev) fail(`ArrowRight ×${i} não avançou (${prev} → ${t})`);
  prev = t;
}
if (prev !== 'The Avengers') fail(`6.º filme ${prev} ≠ The Avengers`);

// 2 — Home → 1.º; End → último
await p.keyboard.press('Home');
await p.waitForTimeout(600);
const home = await preview();
console.log('[Home] preview:', home);
if (home !== 'Iron Man') fail(`Home ${home} ≠ Iron Man`);
await p.keyboard.press('End');
await p.waitForTimeout(600);
const end = await preview();
console.log('[End] preview:', end);
if (end !== 'Spider-Man: Brand New Day') fail(`End ${end} ≠ Spider-Man: Brand New Day`);

// 3 — Enter abre o dossiê; Esc fecha
await p.keyboard.press('Enter');
await p.waitForTimeout(600);
const open = await detailOpen();
console.log('[Enter] detail open:', open);
if (!open) fail('Enter não abriu o dossiê');
await p.keyboard.press('Escape');
await p.waitForTimeout(600);
const closed = !(await detailOpen());
console.log('[Esc] detail fechado:', closed);
if (!closed) fail('Esc não fechou o dossiê');

// 4 — mv-next-in-path avança um slot a partir do hero (último → wraps para o 1.º)
prev = await preview();
await p.evaluate(() => window.dispatchEvent(new CustomEvent('mv-next-in-path')));
await p.waitForTimeout(600);
const next = await preview();
console.log('[mv-next-in-path] preview:', prev, '→', next);
if (!next || next === prev) fail(`mv-next-in-path não avançou (${prev} → ${next})`);
if (next !== 'Iron Man') fail(`mv-next-in-path ${next} ≠ Iron Man (wrap do último slot)`);

console.log(process.exitCode ? '✗ check_keys: FALHOU' : '✓ check_keys: PASS');
await b.close();