/* Verificação da busca (spec-search.md): doutor→MCU filme, loki→MCU série,
   venom→sony filme, Esc fecha. One-off; corre contra o vite dev.          */
import { chromium } from 'playwright-core';

const url = process.argv[2] || 'http://localhost:5173/app.html';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.error('PAGEERROR', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });

await p.goto(url);
await p.waitForSelector('#search');
await p.waitForTimeout(2500); // texturas das covers

const labels = () => p.evaluate(() =>
  [...document.querySelectorAll('#search-results button')].map((b) => b.textContent));
const hash = () => p.evaluate(() => location.hash);
const preview = () => p.evaluate(() => document.getElementById('preview-title')?.textContent);
const hidden = () => p.evaluate(() => document.getElementById('search-results').hidden);

const fail = (msg) => { console.error('FAIL:', msg); process.exitCode = 1; };

async function search(q) {
  await p.mouse.move(5, 5); // rato ao topo → #nav/#search reaparecem (nav-hidden sai)
  await p.waitForTimeout(150);
  await p.fill('#search', q);
  await p.waitForTimeout(200);
  return labels();
}

// 1 — doutor → Doctor Strange (mcu, filme); Enter → hash + preview
let l = await search('doutor');
console.log('[doutor] sugestões:', l);
if (!l.some((t) => t.includes('Doctor Strange'))) fail('doutor não devolve Doctor Strange');
await p.keyboard.press('Enter');
await p.waitForTimeout(1000);
console.log('[doutor→Enter] hash:', await hash(), '| preview:', await preview());
if ((await hash()) !== '#/mcu/filmes/estreia/tudo') fail(`hash ${await hash()} ≠ #/mcu/filmes/estreia/tudo`);
if ((await preview()) !== 'Doctor Strange') fail(`preview ${await preview()} ≠ Doctor Strange`);

// 2 — loki → série (mcu/series)
l = await search('loki');
console.log('[loki] sugestões:', l);
await p.keyboard.press('Enter');
await p.waitForTimeout(1000);
console.log('[loki→Enter] hash:', await hash());
if ((await hash()) !== '#/mcu/series/estreia/tudo') fail(`hash ${await hash()} ≠ #/mcu/series/estreia/tudo`);

// 3 — venom → Venom (sony, filme)
l = await search('venom');
console.log('[venom] sugestões:', l);
if (!l[0]?.includes('SONY') || !l[0]?.includes('FILMES')) fail(`venom não abre por SONY/FILMES: ${l[0]}`);
await p.keyboard.press('Enter');
await p.waitForTimeout(1000);
console.log('[venom→Enter] hash:', await hash());
if ((await hash()) !== '#/sony/filmes/estreia/tudo') fail(`hash ${await hash()} ≠ #/sony/filmes/estreia/tudo`);

// 4 — Esc fecha as sugestões
await search('doutor');
await p.focus('#search');
const open = !(await hidden());
console.log('[Esc] abertas:', open);
await p.keyboard.press('Escape');
await p.waitForTimeout(400);
const closed = await p.evaluate(() =>
  document.getElementById('search-results').hidden ||
  document.getElementById('search-results').querySelector('button') === null);
console.log('[Esc] fechadas:', closed);
if (open && !closed) fail('Esc não fechou as sugestões');

console.log(process.exitCode ? '✗ check_search: FALHOU' : '✓ check_search: PASS');
await b.close();
