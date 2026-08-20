/* Frames congelados da app 3D (Fase 3+). Sucessor do frames.mjs (que servia o
   legado 2D). Mesma filosofia: nunca raciocinar sobre a cena sem a OLHAR.

     npm run dev &                              # vite → http://localhost:5173/app.html
     node tools/frames3d.mjs                    # 6 frames ao longo do scroll
     node tools/frames3d.mjs http://localhost:5173/app.html 12

   Output: tools/frames/shelf3d/f##.png + contact.png                      */
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

const argv = process.argv.slice(2).filter(a => a !== '--');
let url = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'http://localhost:5173/app.html';
url = url.split('#')[0]; // os blocos --nav/--ordem anexam o hash pretendido — strip de qualquer hash vindo do argv
const count = Number(argv[1]) || 6;
const detail = argv.includes('--detail'); // + frames do quick path (click → overlay)
const nav = argv.includes('--nav'); // + troca de cluster/media via DOM + hash
const ordem = argv.includes('--ordem'); // + toggle estreia↔cron (morph de formato)
const hero = argv.includes('--hero'); // + hero fora da prateleira, drag-rotate, abrir dossiê

const dir = new URL('frames/shelf3d/', import.meta.url);
await mkdir(dir, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.error('PAGEERROR', e.message));
p.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await p.goto(url);
await p.waitForSelector('canvas');
await p.waitForTimeout(3500); // texturas das covers

const shots = [];
for (let i = 0; i < count; i++) {
  const f = count === 1 ? 0 : i / (count - 1);
  await p.evaluate(frac => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo(0, max * frac);
  }, f);
  await p.waitForTimeout(500); // deixa o scrub assentar
  const name = `f${String(i).padStart(2, '0')}.png`;
  await p.screenshot({ path: new URL(name, dir).pathname });
  shots.push({ name, f });
}
console.log(`shelf3d: ${count} frames (${url})`);

if (detail) {
  // quick path: scroll para o meio, click no item centrado, overlay abre; Esc fecha
  await p.evaluate(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo(0, max * 0.5);
  });
  await p.waitForTimeout(500);
  await p.mouse.click(720, 450);
  await p.waitForTimeout(900); // tween 0.6s + margem
  await p.screenshot({ path: new URL('detail-open.png', dir).pathname });
  // carimbar + rating para exercitar logs.v1
  await p.click('#detail-toggle');
  await p.waitForTimeout(200);
  await p.click('#detail-rating button:nth-child(8)');
  await p.waitForTimeout(200);
  await p.screenshot({ path: new URL('detail-stamped.png', dir).pathname });
  const saved = await p.evaluate(() => localStorage.getItem('marvelVault.logs.v1'));
  console.log('  logs.v1:', saved);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(900);
  await p.screenshot({ path: new URL('detail-closed.png', dir).pathname });
  console.log('  detail-open/stamped/closed.png');
}

if (nav) {
  // frames base scroollam ao fundo → nav auto-esconde (nav-hidden); volta ao topo
  await p.evaluate(() => {
    scrollTo(0, 0);
    document.getElementById('nav').classList.remove('nav-hidden');
  });
  await p.waitForTimeout(400);
  const hud = () => p.evaluate(() => document.getElementById('dossie').textContent);
  const shot = async (name) => {
    await p.waitForTimeout(1200); // texturas novas + refresh
    await p.screenshot({ path: new URL(name, dir).pathname });
    console.log(`  ${name}  ←  ${await hud()}`);
  };
  console.log(`  arranque: ${await hud()} | hash: ${await p.evaluate(() => location.hash)}`);
  await p.click('#nav .clusters button[data-cluster="xmen"]');
  await shot('nav-xmen-filmes.png');
  await p.click('#nav .media button[data-media="series"]');
  await shot('nav-xmen-series.png');
  await p.goto(url + '#/hulu/filmes'); // cluster sem filmes → estado vazio
  await p.waitForTimeout(400);
  console.log(`  vazio: ${await hud()} | #empty visível: ${await p.evaluate(() => !document.getElementById('empty').hidden)}`);
  await p.goto(url + '#/vintage/filmes'); // formatos era-aware mistos (VHS/DVD)
  await shot('nav-vintage-filmes.png');
}

if (ordem) {
  const hud = () => p.evaluate(() => document.getElementById('dossie').textContent);
  const shot = async (name, wait) => {
    await p.waitForTimeout(wait);
    await p.screenshot({ path: new URL(name, dir).pathname });
    console.log(`  ${name}  ←  ${await hud()} | hash: ${await p.evaluate(() => location.hash)}`);
  };
  await p.goto(url + '#/mcu/filmes/estreia');
  await p.waitForTimeout(1500);
  await p.evaluate(() => scrollTo(0, 0)); // goto com hash não faz reload — o scroll fica de trás
  await p.waitForTimeout(400);
  await p.click('#nav [data-mode="cron"]');
  await shot('ordem-cron.png', 1200);
  await p.evaluate(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo(0, max * 0.5);
  });
  await p.waitForTimeout(500);
  await p.screenshot({ path: new URL('ordem-cron-mid.png', dir).pathname });
  console.log('  ordem-cron-mid.png');
  await p.evaluate(() => scrollTo(0, 0));
  await p.click('#nav [data-mode="estreia"]');
  await shot('ordem-estreia.png', 1200);
}

if (hero) {
  // hero: scroll a 30% → item fora da prateleira + card; drag → rotação; ABRIR → detalhe
  await p.evaluate(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo(0, max * 0.3);
  });
  await p.waitForTimeout(900);
  await p.screenshot({ path: new URL('hero.png', dir).pathname });
  console.log('  hero.png  ←  preview:', await p.evaluate(() => document.getElementById('preview-title')?.textContent));
  await p.mouse.move(720, 400);
  await p.mouse.down();
  for (let i = 1; i <= 5; i++) await p.mouse.move(720 + i * 40, 400, { steps: 3 });
  await p.mouse.up();
  await p.waitForTimeout(400);
  await p.screenshot({ path: new URL('hero-rotate.png', dir).pathname });
  console.log('  hero-rotate.png  ←  detalhe abriu?', await p.evaluate(() => document.getElementById('detail').classList.contains('open')));
  await p.click('#preview-open');
  await p.waitForTimeout(900);
  await p.screenshot({ path: new URL('hero-detail.png', dir).pathname });
  console.log('  hero-detail.png  ←  detalhe abriu?', await p.evaluate(() => document.getElementById('detail').classList.contains('open')));
}

const cells = shots.map(s =>
  `<figure><img src="${s.name}"><figcaption>scroll ${(s.f * 100).toFixed(0)}%</figcaption></figure>`).join('');
await writeFile(new URL('contact.html', dir), `<meta charset="utf-8">
<style>
  body{margin:0;background:#111;color:#bbb;font:11px ui-monospace,monospace;
       display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px;}
  figure{margin:0;} img{width:100%;display:block;border:1px solid #333;}
  figcaption{padding:2px 1px;}
</style>${cells}`);

try {
  const sheet = await b.newPage({ viewport: { width: 1600, height: 100 } });
  await sheet.goto(new URL('contact.html', dir).href);
  await sheet.screenshot({ path: new URL('contact.png', dir).pathname, fullPage: true });
  console.log('  tools/frames/shelf3d/contact.png');
} catch {
  console.log('  WARN: contact.png não capturado (flaky)');
}

await b.close();
