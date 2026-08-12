#!/usr/bin/env node
// imdb_fetch.mjs — resolve imdb_id por item via TMDb external_ids e casa com o
// dataset oficial da IMDb (title.ratings.tsv.gz). Output: tools/data/imdb-ratings.json.
// Uso: node tools/imdb_fetch.mjs
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'tools', 'data');
const CACHE = path.join(ROOT, 'tools', '.cache', 'imdb');
const DATASET = path.join(DATA, 'title.ratings.tsv.gz');
const API = 'https://api.themoviedb.org';
for (const d of [CACHE]) fs.mkdirSync(d, { recursive: true });

const env = {};
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2];
}
const TOKEN = env.TMDB_READ_TOKEN;
assert(TOKEN, 'TMDB_READ_TOKEN em falta no .env');

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let cacheHits = 0;

async function apiJson(url) {
  const f = path.join(CACHE, sha1('v1|' + url) + '.json');
  if (fs.existsSync(f)) { cacheHits++; return JSON.parse(fs.readFileSync(f, 'utf8')); }
  for (let attempt = 0; ; attempt++) {
    await sleep(250); // politeness
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (res.status === 429 && attempt < 4) {
      await sleep((Number(res.headers.get('retry-after')) || 1) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url.split('?')[0]}`);
    const json = await res.json();
    fs.writeFileSync(f, JSON.stringify(json));
    return json;
  }
}

function datasetFresh() {
  if (!fs.existsSync(DATASET)) return false;
  const ageMs = Date.now() - fs.statSync(DATASET).mtimeMs;
  return ageMs < 7 * 24 * 3600 * 1000;
}

async function downloadDataset() {
  if (datasetFresh()) { console.log('dataset IMDb fresco (mtime < 7 dias)'); return; }
  console.log('a descarregar title.ratings.tsv.gz (~última semana)...');
  const res = await fetch('https://datasets.imdbws.com/title.ratings.tsv.gz');
  assert(res.ok, `HTTP ${res.status} ao descarregar dataset`);
  fs.writeFileSync(DATASET, Buffer.from(await res.arrayBuffer()));
  console.log('dataset gravado.');
}

// ---- main ----
const map = JSON.parse(fs.readFileSync(path.join(DATA, 'tmdb-map.json'), 'utf8'));
const entryKeys = Object.keys(map);

// 1) imdb_id por item
const imdbIds = {}; // key -> tconst
for (const key of entryKeys) {
  const { tmdbId, tmdbType } = map[key];
  assert(tmdbId != null, `tmdbIds nulos no tmdb-map: ${key}`);
  try {
    const ext = await apiJson(`${API}/3/${tmdbType}/${tmdbId}/external_ids`);
    if (ext.imdb_id) imdbIds[key] = ext.imdb_id;
  } catch (err) {
    imdbIds[key + '\0err'] = err.message;
  }
}
await downloadDataset();

// 2) dataset: guardar só os tconst necessários
const needed = new Set(Object.values(imdbIds).filter(Boolean));
const ratings = new Map(); // tconst -> {averageRating, numVotes}
const gz = fs.createReadStream(DATASET).pipe(zlib.createGunzip());
const rl = readline.createInterface({ input: gz, crlfDelay: Infinity });
let isHeader = true;
for await (const line of rl) {
  if (isHeader) { isHeader = false; continue; }
  const [tconst, averageRating, numVotes] = line.split('\t');
  if (needed.has(tconst)) ratings.set(tconst, { rating: Number(averageRating), votes: Number(numVotes) });
}

// 3) output
const out = {};
const failures = []; // { id, reason }
for (const key of entryKeys) {
  const extra = imdbIds[key + '\0err'];
  if (extra) { failures.push({ id: key, reason: extra }); continue; }
  const tconst = imdbIds[key];
  if (!tconst) { failures.push({ id: key, reason: 'sem imdb_id no external_ids TMDb' }); continue; }
  const r = ratings.get(tconst);
  if (!r) { failures.push({ id: key, reason: `sem entrada IMDb (${tconst})` }); continue; }
  out[key] = r;
}

fs.writeFileSync(path.join(DATA, 'imdb-ratings.json'), JSON.stringify(out, null, 2) + '\n');

// ---- self-check + report (corre sempre; exit 0 mesmo com falhanços parciais) ----
for (const r of Object.values(out)) {
  assert(r.rating >= 0 && r.rating <= 10, `rating fora de 0-10: ${r.rating}`);
  assert(r.votes >= 0, `votes negativo: ${r.votes}`);
}
const sample = Object.entries(out).slice(0, 3);
console.log(`total ${entryKeys.length}, com-rating ${Object.keys(out).length}, sem-rating ${failures.length}, cache hits ${cacheHits}`);
if (failures.length) {
  console.log('sem-rating:');
  for (const f of failures) console.log(`  ${f.id}: ${f.reason}`);
}
if (sample.length) {
  console.log('amostras:');
  for (const [id, r] of sample) console.log(`  ${id}: ${r.rating} (${r.votes} votos)`);
}