/* Opens every deep-pass title and asserts its opening sequence actually runs and
   then cleans itself up. Catches the classes of bug that reading the CSS can't:
   a selector that matches nothing, a timer that never fires, a class left behind.
   Adding a 7th treatment = one line in TITLES.

     python3 -m http.server 8000 &          # from the project root
     npm i playwright-core && npx playwright install chromium
     node tools/check_intros.mjs

   Not using the playwright MCP server: it's pinned to a `chrome` channel that
   isn't installed here. */
import { chromium } from 'playwright-core';

const TITLES = {
  'Iron Man': 'ironmask',
  'Spider-Man: Homecoming': 'webpull',
  'The Avengers': 'assemble',
  'Thor: Ragnarok': 'mjolnir',
  'Doctor Strange': 'slingring',
  'Ant-Man': 'shrink',
};

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', m => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:8000/');
await p.waitForTimeout(2500);

// what titles actually exist
const all = await p.evaluate(() => (typeof nodes !== 'undefined' ? nodes.map(n => n.t) : ['NO nodes GLOBAL']));
console.log('nodes:', all.length);

for (const [title, key] of Object.entries(TITLES)) {
  const found = all.find(t => t === title) || all.find(t => t.toLowerCase().includes(title.split(':')[0].toLowerCase()));
  if (!found) { console.log(`MISS  ${key.padEnd(10)} no node matching "${title}"`); continue; }

  await p.evaluate(t => { document.getElementById('nclose')?.click(); }, found);
  await p.waitForTimeout(300);
  await p.evaluate(t => openNote(nodes.find(n => n.t === t)), found);
  await p.waitForTimeout(180);

  const mid = await p.evaluate(k => {
    const stage = document.getElementById('noteStage'), note = document.getElementById('note');
    const ml = document.getElementById('maskLayer');
    return {
      stageOn: stage.classList.contains(k + '-on'),
      arrive: note.classList.contains(k + '-arrive'),
      centered: note.classList.contains('note-centered'),
      maskKids: ml.children.length,
      maskVisible: ml.getBoundingClientRect().width > 0,
      panelOnNote: [...note.classList].filter(c => c.startsWith('panel-')),
      panelOnInner: [...document.getElementById('noteInner').classList].filter(c => c.startsWith('panel-')),
      decor: document.getElementById('panelDecor').children.length,
      noteBox: (({ width, height, x }) => ({ w: Math.round(width), h: Math.round(height), x: Math.round(x) }))(note.getBoundingClientRect()),
      accent: getComputedStyle(document.documentElement).getPropertyValue('--amber').trim(),
    };
  }, key);
  await p.screenshot({ path: `shot-${key}-intro.png` });

  const dur = await p.evaluate(k => INTRO_DURATION[k], key);
  await p.waitForTimeout(dur + 400);
  const after = await p.evaluate(k => ({
    stageOn: document.getElementById('noteStage').classList.contains(k + '-on'),
    maskKids: document.getElementById('maskLayer').children.length,
  }), key);
  await p.screenshot({ path: `shot-${key}-panel.png` });

  const ok = mid.stageOn && mid.arrive && mid.centered && mid.maskKids > 0 && mid.decor > 0
    && mid.panelOnNote.length && mid.panelOnInner.length && !after.stageOn && after.maskKids === 0;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${key.padEnd(10)} ${found.padEnd(24)} dur=${dur} ${JSON.stringify(mid)} after=${JSON.stringify(after)}`);
}

console.log('console errors:', errs.length ? errs : 'none');
await b.close();
