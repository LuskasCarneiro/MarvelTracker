/* Extrai os temas curados do legado (themes.js) para src/data/themes.json.
   Corrida: node tools/extract_themes.mjs  (regenera o JSON; build-time). */
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(new URL('../themes.js', import.meta.url), 'utf8');
const m = src.match(/const THEMES = (\{[\s\S]*?\n\});/);
if (!m) {
  console.error('themes.js: THEMES não encontrado');
  process.exit(1);
}
const themes = Function(`return ${m[1]}`)();

const out = {};
for (const [title, t] of Object.entries(themes)) {
  out[title] = { accent: t.accent, accent2: t.accent2, bg: t.bg, ink: t.ink };
}

writeFileSync(new URL('../src/data/themes.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`themes.json: ${Object.keys(out).length} temas extraídos`);
