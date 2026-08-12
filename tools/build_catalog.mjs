#!/usr/bin/env node
/* Fase 3 — merge tools/data/curated.json + tools/data/tmdb-map.json
   → src/data/catalog.json (artefato consumido pela app Vite).
   Re-correr sempre que os dados curados ou o mapa TMDb mudarem:
     node tools/build_catalog.mjs                                        */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';

const curated = JSON.parse(await readFile('tools/data/curated.json', 'utf8'));
const tmdb = JSON.parse(await readFile('tools/data/tmdb-map.json', 'utf8'));
let imdbRatings = {};
try { imdbRatings = JSON.parse(await readFile('tools/data/imdb-ratings.json', 'utf8')); }
catch { console.warn('aviso: tools/data/imdb-ratings.json em falta — sem ratings IMDb (corre node tools/imdb_fetch.mjs)'); }

// enriquecimento editorial (D2): junta todos os tools/data/enrich-*.json
import { readdir } from 'node:fs/promises';
const enrich = {};
for (const f of await readdir('tools/data').catch(() => [])) {
  if (!f.startsWith('enrich-') || !f.endsWith('.json')) continue;
  Object.assign(enrich, JSON.parse(await readFile(`tools/data/${f}`, 'utf8')));
}

const catalog = [];
const errors = [];
for (const c of curated) {
  const m = tmdb[c.id];
  if (!m) { errors.push(`sem match TMDb: ${c.id}`); continue; }
  if (!Number.isFinite(c.releaseYear)) { errors.push(`releaseYear inválido: ${c.id}`); continue; }
  try { await access(`public/${m.poster}`); }
  catch { errors.push(`poster em falta: public/${m.poster} (${c.id})`); continue; }
  const imdb = imdbRatings[c.id] || {};
  const en = enrich[c.id] || {};
  catalog.push({
    id: c.id,
    cluster: c.cluster,
    type: c.type,
    title: c.title,
    releaseYear: c.releaseYear,
    storyYear: c.storyYear,
    storyLabel: c.storyLabel,
    overview: c.overview,
    seasonOf: c.seasonOf,
    seasonNumber: c.seasonNumber,
    poster: `/${m.poster}`,
    imdbRating: typeof imdb.rating === 'number' ? imdb.rating : null,
    imdbVotes: typeof imdb.votes === 'number' ? imdb.votes : null,
    ...(typeof en.longOverview === 'string' ? { longOverview: en.longOverview } : {}),
    ...(Array.isArray(en.facts) ? { facts: en.facts } : {}),
    ...(Array.isArray(en.references) ? { references: en.references } : {}),
  });
}

if (errors.length) { console.error(`ERRO (${errors.length}):\n` + errors.join('\n')); process.exit(1); }

/* Ordem determinística (diffs estáveis); a ordenação de apresentação é do runtime. */
catalog.sort((a, b) => a.cluster.localeCompare(b.cluster) || a.releaseYear - b.releaseYear || a.id.localeCompare(b.id));

await mkdir('src/data', { recursive: true });
await writeFile('src/data/catalog.json', JSON.stringify(catalog) + '\n');

/* --- check runnable ------------------------------------------------------ */
const byCluster = Object.groupBy(catalog, c => c.cluster);
const counts = Object.entries(byCluster).map(([k, v]) => `${k}:${v.length}`).join(' ');
console.log(`ok — ${catalog.length} itens, ${Object.keys(byCluster).length} clusters`);
console.log(counts);
if (catalog.length !== 152) { console.error(`ERRO: esperados 152, obtidos ${catalog.length}`); process.exit(1); }
