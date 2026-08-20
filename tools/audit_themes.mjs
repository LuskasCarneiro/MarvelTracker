/* Auditoria de cobertura dos temas curados (src/data/themes.json) sobre o catálogo.
   Corrida: node tools/audit_themes.mjs  (report de build-time; exit 0 sempre). */
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const catalog = read('../src/data/catalog.json');
const themes = read('../src/data/themes.json');
const keys = new Set(Object.keys(themes));

const stripSeason = (title) => {
  const m = title.match(/^(.*) S\d+$/);
  return m ? m[1] : null;
};

const clusters = [];
const stats = new Map();
for (const it of catalog) {
  if (!stats.has(it.cluster)) {
    stats.set(it.cluster, { exact: 0, strip: 0, none: 0 });
    clusters.push(it.cluster);
  }
  const s = stats.get(it.cluster);
  if (keys.has(it.title)) s.exact++;
  else if (stripSeason(it.title) && keys.has(stripSeason(it.title))) s.strip++;
  else s.none++;
}

const drift = [...keys].filter(
  (k) => !catalog.some((it) => it.title === k || stripSeason(it.title) === k),
);

const line = (name, { exact, strip, none }) =>
  `  ${name.padEnd(12)}${exact + strip}/${exact + strip + none}  exact ${exact}, strip ${strip}, none ${none}`;

for (const c of clusters) console.log(line(c, stats.get(c)));
const total = [...stats.values()].reduce(
  (a, s) => ({ exact: a.exact + s.exact, strip: a.strip + s.strip, none: a.none + s.none }),
  { exact: 0, strip: 0, none: 0 },
);
console.log(line('TOTAL', total));
console.log(`  DRIFT: ${drift.length ? drift.join(', ') : 'none'}`);
