/* Mede FPS durante o scroll da estante 3D (dev-only, overlay stats.js).

     npm run dev &                          # vite → http://localhost:5173/app.html
     node tools/fps.mjs                     # 3 momentos de amostragem ao longo do scroll
     node tools/fps.mjs http://localhost:5173/app.html

   Scroll contínuo 0→100% em ~10s; em cada momento mede frames/s numa janela de
   ~0.6s (várias amostras → média). NÃO analisa frames — só lê a cadência.

   Nota: o painel FPS do stats.js é desenhado num canvas — não existe texto
   "60 FPS" no DOM. Conta-se rAF ticks/seg, que é exatamente a métrica que o
   painel FPS do stats.js calcula (frames no último segundo).                */
import { chromium } from 'playwright-core';

const url = process.argv[2] || 'http://localhost:5173/app.html';
const DUR = 10000; // duração do scroll (ms)
const MOMENTS = [0.3, 0.6, 0.9]; // fracções do tempo de scroll
const WINDOW = 600; // janela de contagem de frames (ms)
const SAMPLES = 3; // leituras por momento

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.error('PAGEERROR', e.message));
p.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await p.goto(url);
await p.waitForSelector('#stats'); // overlay stats.js só existe em DEV
await p.waitForTimeout(3000); // texturas das covers

const res = await p.evaluate(async ({ DUR, MOMENTS, WINDOW, SAMPLES }) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const max = document.documentElement.scrollHeight - innerHeight;
  const t0 = performance.now();
  const fpsOf = () => new Promise(resolve => {
    const s = performance.now();
    let n = 0;
    const tick = now => {
      n++;
      if (now - s >= WINDOW) resolve(Math.round((n * 1000) / (now - s)));
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const iv = setInterval(() => {
    const f = Math.min(1, (performance.now() - t0) / DUR);
    scrollTo(0, max * f);
    if (f >= 1) clearInterval(iv);
  }, 16);
  const out = [];
  for (const frac of MOMENTS) {
    const dt = DUR * frac - (performance.now() - t0);
    if (dt > 0) await sleep(dt);
    const reads = [];
    for (let i = 0; i < SAMPLES; i++) {
      reads.push(await fpsOf());
      await sleep(100);
    }
    out.push({ frac, reads, avg: reads.reduce((a, b) => a + b, 0) / reads.length });
  }
  clearInterval(iv);
  scrollTo(0, max);
  return out;
}, { DUR, MOMENTS, WINDOW, SAMPLES });

for (const m of res) {
  console.log(`scroll ${Math.round(m.frac * 100)}%: ${m.avg.toFixed(1)} FPS  (amostras: ${m.reads.join(', ')})`);
}
await b.close();
