/* Gera temas determinísticos a partir das capas reais (public/covers) para
   todos os títulos do catálogo sem tema curado em src/data/themes.json.
   Corrida: node tools/gen_cover_themes.mjs  (build-time; requer ImageMagick). */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const catalog = read('../src/data/catalog.json');
const themes = read('../src/data/themes.json');
const themeKeys = new Set(Object.keys(themes));

const stripSeason = (title) => title.replace(/ S\d+$/, '');
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => {
  const [ar, ag, ab] = hex2rgb(a);
  const [br, bg, bb] = hex2rgb(b);
  return rgb2hex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
};
// guarda de luminância: clareia rumo a branco se muito escuro, escurece se quase branco
const guard = (color) => {
  const L = lum(hex2rgb(color));
  if (L < 0.3) return lerp(color, '#ffffff', clamp((0.5 - L) / 0.7, 0, 0.6));
  if (L > 0.85) return lerp(color, '#000000', (L - 0.85) * 0.8);
  return color;
};
const palette = (posterPath) => {
  const out = execFileSync(
    'magick',
    [posterPath, '-resize', '96x96!', '-colors', '6', '-format', '%c', 'histogram:info:-'],
    { encoding: 'utf8' },
  );
  return out
    .split('\n')
    .map((l) => l.match(/(\d+):\s*\(.*?\)\s*#([0-9A-Fa-f]{6})/))
    .filter(Boolean)
    .sort((a, b) => +b[1] - +a[1])
    .map((r) => '#' + r[2].toLowerCase());
};

let generated = 0;
let skipped = 0;
for (const it of catalog) {
  if (themeKeys.has(it.title) || themeKeys.has(stripSeason(it.title))) continue;
  const coverPath = fileURLToPath(new URL('../public/' + it.poster, import.meta.url));
  if (!existsSync(coverPath)) {
    console.warn(`skip: capa em falta — ${it.title} (${it.poster})`);
    skipped++;
    continue;
  }
  let colors;
  try {
    colors = palette(coverPath);
  } catch {
    console.warn(`skip: imagemagick falhou — ${it.title} (${it.poster})`);
    skipped++;
    continue;
  }
  if (!colors.length) {
    console.warn(`skip: paleta vazia — ${it.title} (${it.poster})`);
    skipped++;
    continue;
  }
  const distinct = [];
  for (const c of colors) {
    const rgb = hex2rgb(c);
    if (distinct.every((d) => dist(rgb, hex2rgb(d)) >= 40)) distinct.push(c);
  }
  const dominant = distinct[0];
  const secondary =
    distinct.find((d) => dist(hex2rgb(d), hex2rgb(dominant)) > 80) || distinct[1] || dominant;
  themes[it.title] = {
    accent: guard(dominant),
    accent2: guard(secondary),
    bg: lerp(dominant, '#0a0806', 0.8),
    ink: lerp('#f0ede6', dominant, 0.1),
    src: 'cover',
  };
  generated++;
}

for (const [k, t] of Object.entries(themes)) {
  if (!('src' in t)) t.src = 'curado';
}
const sorted = Object.fromEntries(Object.entries(themes).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(new URL('../src/data/themes.json', import.meta.url), JSON.stringify(sorted, null, 2) + '\n');
console.log(`gen_cover_themes: ${generated} gerados, ${skipped} saltados, ${Object.keys(sorted).length} temas no total`);