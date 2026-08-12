// Fase 2 — extrai films/seriesItems do index.html legado → tools/data/curated.json
// Chave estável replica o legado: watchKey(mediaKey, t) = mediaKey + '|' + t
// (index.html:3127), mediaKey = 'movies' (films) | 'series' (seriesItems) (index.html:3098-3115).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'index.html');
const OUT_DIR = join(ROOT, 'tools', 'data');

const html = readFileSync(SRC, 'utf8');

// Slice do literal entre '[' e o ']' de fecho, ignorando brackets dentro de strings.
function extractArray(name) {
  const decl = `const ${name} = [`;
  const start = html.indexOf(decl);
  assert.notStrictEqual(start, -1, `${name}: declaração não encontrada`);
  const open = start + decl.length - 1; // posição do '['
  let depth = 0, quote = null, esc = false;
  for (let i = open; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '[') depth++;
    else if (c === ']' && --depth === 0) {
      const literal = html.slice(open, i + 1);
      const rawCount = (literal.match(/\{u:/g) || []).length;
      const items = new Function('return ' + literal)();
      return { items, rawCount };
    }
  }
  throw new Error(`${name}: fecho não encontrado`);
}

const films = extractArray('films');
const series = extractArray('seriesItems');

const YEAR_RE = /(19\d{2}|20[0-2]\d|2030)/;
const SEASON_RE = /^(.*?)\s+S(\d+)$/;

function storyYearOf(s) {
  const m = String(s).match(YEAR_RE);
  return m ? Number(m[1]) : null;
}

let implicitS1 = 0;
function toEntry(item, mediaKey, type) {
  const isSeason = type === 'season';
  const sm = isSeason ? String(item.t).match(SEASON_RE) : null;
  // Séries de entrada única vêm sem sufixo " S<n>" no legado (ex.: WandaVision,
  // The Defenders) — normalizam-se como S1 implícito. O id mantém o título
  // tal como está, por isso as chaves dos logs não mudam.
  if (isSeason && !sm) implicitS1++;
  return {
    id: `${mediaKey}|${item.t}`,
    cluster: item.u,
    type,
    title: item.t,
    releaseYear: item.r,
    storyLabel: item.s,
    storyYear: storyYearOf(item.s),
    overview: item.d,
    seasonOf: isSeason ? (sm ? sm[1] : item.t) : null,
    seasonNumber: isSeason ? (sm ? Number(sm[2]) : 1) : null,
  };
}

const catalog = [
  ...films.items.map(i => toEntry(i, 'movies', 'movie')),
  ...series.items.map(i => toEntry(i, 'series', 'season')),
];

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'curated.json'), JSON.stringify(catalog, null, 2) + '\n');

const nulls = catalog.filter(e => e.storyYear === null)
  .sort((a, b) => a.cluster.localeCompare(b.cluster) || a.id.localeCompare(b.id));
const md = ['| id | storyLabel | suggestedYear |', '|---|---|---|',
  ...nulls.map(e => `| ${e.id} | ${e.storyLabel} |  |`)].join('\n') + '\n';
writeFileSync(join(OUT_DIR, 'storyyear-review.md'), md);

// ---- self-check ----
assert.strictEqual(films.items.length, films.rawCount, `films: ${films.items.length} avaliados vs ${films.rawCount} {u:`);
assert.strictEqual(series.items.length, series.rawCount, `seriesItems: ${series.items.length} avaliados vs ${series.rawCount} {u:`);
assert.strictEqual(catalog.length, films.items.length + series.items.length);

const seen = new Map();
const dups = [];
for (const e of catalog) {
  assert.ok(e.id && typeof e.id === 'string', `id vazio: ${JSON.stringify(e)}`);
  assert.ok(e.title && e.title.trim(), `título vazio: ${e.id}`);
  assert.ok(e.overview && e.overview.trim(), `overview vazio: ${e.id}`);
  assert.ok(e.releaseYear >= 1900 && e.releaseYear <= 2030, `releaseYear fora de gama: ${e.id} (${e.releaseYear})`);
  assert.ok(e.storyYear === null || (e.storyYear >= 1900 && e.storyYear <= 2030), `storyYear fora de gama: ${e.id}`);
  if (e.type === 'season') {
    assert.ok(e.seasonOf && e.seasonNumber !== null, `season sem seasonOf/seasonNumber: ${e.id}`);
  } else {
    assert.ok(e.seasonOf === null && e.seasonNumber === null, `movie com seasonOf/seasonNumber: ${e.id}`);
  }
  if (seen.has(e.id)) dups.push(e.id);
  seen.set(e.id, (seen.get(e.id) || 0) + 1);
}
assert.deepStrictEqual(dups, [], `ids duplicados: ${dups.join(', ')}`);

const perCluster = {};
for (const e of catalog) perCluster[e.cluster] = (perCluster[e.cluster] || 0) + 1;
const clusterStr = Object.entries(perCluster).sort((a, b) => a[0].localeCompare(b[0]))
  .map(([k, v]) => `${k}:${v}`).join(' ');

console.log(`OK — ${films.items.length} filmes + ${series.items.length} temporadas = ${catalog.length} entradas ` +
  `(${implicitS1} séries sem sufixo → S1 implícito); ${nulls.length} storyYear por curar ` +
  `(tools/data/storyyear-review.md); clusters: ${clusterStr}`);
