/* Verificação offline-first (spec-sw): build + SW + reload sem rede.
   Uso: node tools/offline_check.mjs   (assume `npm run build` já feito)     */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const PORT = 4173;
const BASE = `http://localhost:${PORT}/app.html`;
const BIN = new URL('../node_modules/.bin/vite', import.meta.url).pathname;

const distSw = new URL('../dist/sw.js', import.meta.url).pathname;
if (!existsSync(distSw)) {
  console.error('FALHA: dist/sw.js não existe — corre `npm run build` primeiro.');
  process.exit(1);
}

const preview = spawn(BIN, ['preview', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
let previewLog = '';
preview.stdout.on('data', (d) => (previewLog += d));
preview.stderr.on('data', (d) => (previewLog += d));

function waitForServer(retries = 60) {
  return new Promise((resolve, reject) => {
    (function tryOnce() {
      fetch(BASE)
        .then((r) => (r.ok ? resolve() : setTimeout(tryOnce, 200)))
        .catch(() => (retries-- > 0 ? setTimeout(tryOnce, 200) : reject(new Error('vite preview não arrancou'))));
    })();
  });
}

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

const state = () =>
  page.evaluate(() => ({
    title: document.title,
    canvas: !!document.querySelector('canvas'),
    hud: document.getElementById('dossie')?.textContent || '',
    covers: performance.getEntriesByType('resource').filter((e) => e.name.includes('/covers/')).length,
    swControlled: !!navigator.serviceWorker.controller,
  }));

try {
  await waitForServer();

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('canvas');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(2500);
  const online = await state();

  await context.setOffline(true);
  await page.reload({ waitUntil: 'load' }).catch(() => {});
  await page.waitForTimeout(3000);
  const offline = await state();

  const loaded = offline.title === online.title && offline.canvas && offline.hud === online.hud;
  console.log('=== offline_check ===');
  console.log('carregou offline?', loaded ? 'SIM' : 'NAO');
  console.log('title            online:', JSON.stringify(online.title), ' offline:', JSON.stringify(offline.title));
  console.log('canvas           online:', online.canvas, ' offline:', offline.canvas);
  console.log('hud dossie       online:', JSON.stringify(online.hud), ' offline:', JSON.stringify(offline.hud));
  console.log('covers visiveis  online:', online.covers, ' offline:', offline.covers);
  console.log('sw controlla     online:', online.swControlled, ' offline:', offline.swControlled);
  console.log('pageerrors       online+offline:', pageErrors.length);
  pageErrors.forEach((e) => console.log('  PAGEERROR:', e));
} finally {
  await browser.close();
  preview.kill();
  process.exit(0);
}
