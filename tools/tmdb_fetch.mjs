#!/usr/bin/env node
// tmdb_fetch.mjs — resolve curated.json contra TMDb e descarrega posters (build-time only).
// Uso: node tools/tmdb_fetch.mjs [--sample]
// Cache: tools/.cache/tmdb/<sha1('v2|'+url)>.json (+ img/). Cache ganha sempre à rede.
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'tools', 'data');
const CACHE = path.join(ROOT, 'tools', '.cache', 'tmdb');
const IMG_CACHE = path.join(CACHE, 'img');
const COVERS = path.join(ROOT, 'public', 'covers');
const API = 'https://api.themoviedb.org';
for (const d of [CACHE, IMG_CACHE, COVERS]) fs.mkdirSync(d, { recursive: true });

const SAMPLE = process.argv.includes('--sample');
const INPUT = path.join(DATA, SAMPLE ? 'curated.sample.json' : 'curated.json');

// .env manual (sem dotenv): linhas KEY=value. Nunca logar valores.
const env = {};
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2];
}
const TOKEN = env.TMDB_READ_TOKEN;
assert(TOKEN, 'TMDB_READ_TOKEN em falta no .env');

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, ''); // combining diacritics U+0300..U+036F
const stripParen = (s) => s.replace(/\s*\([^)]*\)\s*$/, ''); // qualquer parentético final (ano, realizador, ...)
const slug = (cluster, title) =>
  (cluster + '-' + fold(title).toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

let cacheHits = 0;

async function apiJson(url) {
  const f = path.join(CACHE, sha1('v2|' + url) + '.json'); // v2: cache v1 estava envenenada com matches errados
  if (fs.existsSync(f)) { cacheHits++; return JSON.parse(fs.readFileSync(f, 'utf8')); }
  for (let attempt = 0; ; attempt++) {
    await sleep(50); // politeness
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

async function imgBytes(url) {
  const f = path.join(IMG_CACHE, sha1(url) + '.jpg');
  if (fs.existsSync(f)) { cacheHits++; return fs.readFileSync(f); }
  await sleep(50);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ao descarregar poster`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(f, buf);
  return buf;
}

async function matchMovie(e) {
  const q = stripParen(e.title);
  const data = await apiJson(
    `${API}/3/search/movie?query=${encodeURIComponent(q)}&year=${e.releaseYear}&language=pt-PT`);
  const results = data.results || [];
  let hit = results.find((r) => (r.release_date || '').slice(0, 4) === String(e.releaseYear));
  let confidence = 'high';
  const notes = [];
  if (!hit && results.length) {
    hit = results[0];
    confidence = 'low';
    notes.push(`sem ano exacto; 1º resultado: ${hit.title} (${hit.release_date || 's/d'})`);
  }
  if (!hit) return { query: q, notes, unmatched: `0 resultados para "${q}" ano=${e.releaseYear}` };
  const detail = await apiJson(`${API}/3/movie/${hit.id}?language=pt-PT`);
  return {
    query: q, notes, tmdbId: hit.id, tmdbType: 'movie',
    posterPath: detail.poster_path || hit.poster_path,
    confidence, matchedTitle: hit.title,
  };
}

// Temporadas: resolver a SÉRIE uma vez por grupo. O filtro first_air_date_year do TMDb
// casa com o ano de estreia da SÉRIE — usar o releaseYear mais antigo do grupo.
const sameName = (a, b) => fold(a).toLowerCase() === fold(b).toLowerCase();
const exactName = (rs, name) => {
  const want = stripParen(name);
  return rs.filter((r) => sameName(r.name || '', want) || sameName(r.original_name || '', want));
};
const nearYear = (rs, y) => rs.filter((r) => {
  const ry = Number((r.first_air_date || '').slice(0, 4));
  return ry && Math.abs(ry - y) <= 1;
});
const pickShow = (rs, name, y) => {
  const pool = exactName(rs, name);
  const use = pool.length ? pool : rs;
  return { show: nearYear(use, y)[0] || use[0], exact: pool.length > 0 };
};

async function resolveShow(key, group) {
  const targetYear = Math.min(...group.map((e) => e.releaseYear));
  const q = stripParen(key);
  const searchBase = `${API}/3/search/tv?query=${encodeURIComponent(q)}&language=pt-PT`;
  let results = (await apiJson(`${searchBase}&first_air_date_year=${targetYear}`)).results || [];
  const notes = [];
  let confidence = 'high';
  if (results.length) {
    results = [pickShow(results, key, targetYear).show];
  } else {
    const all = (await apiJson(searchBase)).results || [];
    if (all.length) {
      const { show, exact } = pickShow(all, key, targetYear);
      results = [show];
      if (exact) notes.push('retry sem ano; match exacto por nome');
      else {
        confidence = 'low';
        notes.push(`retry sem ano; escolhido: ${show.name} (${show.first_air_date || 's/d'})`);
      }
    }
  }
  if (!results.length) return { query: q, notes, unmatched: `0 resultados TV para "${q}"` };
  const show = results[0];
  const detail = await apiJson(`${API}/3/tv/${show.id}?language=pt-PT`);
  return { query: q, notes, show, detail, confidence };
}

async function matchSeason(e, res) {
  if (res.error) throw new Error(res.error);
  if (res.unmatched) { // especial TV catalogado como série: tentar como filme
    const m = await matchMovie(e);
    m.notes.unshift(`0 resultados TV para "${res.query}"; fallback search/movie`);
    if (!m.unmatched) m.confidence = 'low'; // season sem seasonAirYear: self-check exige review
    return m;
  }
  const { show, detail } = res;
  const notes = [...res.notes];
  let confidence = res.confidence;
  let posterPath = detail.poster_path || show.poster_path;
  let seasonAirYear = null;
  if (e.seasonNumber == null) {
    seasonAirYear = detail.first_air_date ? Number(detail.first_air_date.slice(0, 4)) : null;
  } else {
    const s = (detail.seasons || []).find((x) => x.season_number === e.seasonNumber);
    if (s) {
      seasonAirYear = s.air_date ? Number(s.air_date.slice(0, 4)) : null;
      posterPath = s.poster_path || posterPath;
    } else {
      confidence = 'low';
      notes.push(`season ${e.seasonNumber} não existe em "${detail.name}" no TMDb`);
    }
  }
  return {
    query: res.query, notes, tmdbId: show.id, tmdbType: 'tv', posterPath,
    confidence, matchedTitle: show.name, seasonAirYear,
  };
}

// ---- main ----
const entries = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
const config = await apiJson(`${API}/3/configuration`);
const imgBase = config.images.secure_base_url;

const map = {};
const review = []; // { id, query, came }
let posters = 0;

// agrupar temporadas por série; cada série resolve-se UMA vez (1–2 searches + 1 detail)
const groups = new Map();
for (const e of entries) {
  if (e.type !== 'season') continue;
  const k = e.seasonOf || e.title;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(e);
}
const shows = new Map();
for (const [k, g] of groups) {
  try {
    shows.set(k, await resolveShow(k, g));
  } catch (err) {
    shows.set(k, { query: stripParen(k), error: err.message }); // erro da série propaga-se por entrada no loop
  }
}

for (const e of entries) {
  const notes = [];
  let rec;
  try {
    const m = e.type === 'movie' ? await matchMovie(e) : await matchSeason(e, shows.get(e.seasonOf || e.title));
    notes.push(...m.notes);
    if (m.unmatched) {
      rec = { tmdbId: null, tmdbType: e.type === 'movie' ? 'movie' : 'tv', poster: null,
              seasonAirYear: null, confidence: 'low', matchedTitle: null };
      notes.push(m.unmatched);
    } else {
      let poster = null;
      if (m.posterPath) {
        const s = slug(e.cluster, e.title);
        fs.writeFileSync(path.join(COVERS, s + '.jpg'), await imgBytes(`${imgBase}w342${m.posterPath}`));
        poster = `covers/${s}.jpg`;
        posters++;
      } else {
        notes.push('sem poster_path no TMDb');
      }
      rec = { tmdbId: m.tmdbId, tmdbType: m.tmdbType, poster,
              seasonAirYear: m.seasonAirYear ?? null, confidence: m.confidence,
              matchedTitle: m.matchedTitle };
    }
  } catch (err) {
    rec = { tmdbId: null, tmdbType: e.type === 'movie' ? 'movie' : 'tv', poster: null,
            seasonAirYear: null, confidence: 'low', matchedTitle: null };
    notes.push(`erro: ${err.message}`);
  }
  if (e.type === 'season' && rec.seasonAirYear == null && rec.tmdbId != null) {
    rec.confidence = 'low';
    notes.push('seasonAirYear nulo (air_date em falta)');
  }
  map[e.id] = rec;
  if (rec.confidence === 'low') {
    review.push({ id: e.id, query: stripParen(e.seasonOf || e.title), came: notes.join('; ') || 'low confidence' });
  }
}

fs.writeFileSync(path.join(DATA, 'tmdb-map.json'), JSON.stringify(map, null, 2) + '\n');
fs.writeFileSync(
  path.join(DATA, 'tmdb-review.md'),
  ['# TMDb review — lowConfidence + unmatched', '',
   '| id | query usada | o que veio |', '|---|---|---|',
   ...review.map((r) => `| ${r.id} | ${r.query} | ${r.came} |`), ''].join('\n'));

// ---- self-check (corre sempre) ----
for (const e of entries) assert(map[e.id], `sem registo tmdb-map: ${e.id}`);
for (const r of Object.values(map)) {
  if (r.poster) assert(fs.existsSync(path.join(ROOT, 'public', r.poster)), `poster em falta: ${r.poster}`);
}
const reviewIds = new Set(review.map((r) => r.id));
for (const e of entries) {
  if (e.type === 'season') {
    assert(map[e.id].seasonAirYear != null || reviewIds.has(e.id),
      `season sem airYear nem review: ${e.id}`);
  }
}

const vals = Object.values(map);
const high = vals.filter((r) => r.confidence === 'high').length;
const unmatched = vals.filter((r) => r.tmdbId == null).length;
const low = vals.filter((r) => r.confidence === 'low' && r.tmdbId != null).length;
console.log(`processed ${entries.length}, high ${high}, low ${low}, unmatched ${unmatched}, posters downloaded ${posters}, cache hits ${cacheHits}`);
