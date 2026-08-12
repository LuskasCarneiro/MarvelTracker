#!/usr/bin/env node
/* Aplica os storyYear decididos pelo owner (2026-08-10) ao curated.json.
   Uma vez; se extract_curated.mjs voltar a correr, corre este depois.
   Uso: node tools/apply_storyyear.mjs && node tools/build_catalog.mjs */
import { readFile, writeFile } from 'node:fs/promises';

const OVERRIDES = `
series|Agents of S.H.I.E.L.D. S7|2019
series|Eyes of Wakanda|2024
series|Marvel Zombies|2018
series|What If...? S1|2018
series|What If...? S2|2018
series|What If...? S3|2018
series|Your Friendly Neighborhood Spider-Man S1|2016
series|Legion S1|1973
series|Legion S2|1974
series|Legion S3|1975
movies|Ant-Man and the Wasp|2018
movies|Black Widow|2016
movies|The Fantastic Four: First Steps|1963
series|Loki S1|2012
series|Loki S2|2012
movies|Across the Spider-Verse|2019
movies|Into the Spider-Verse|2018
movies|Elektra|2005
movies|Ghost Rider: Spirit of Vengeance|2012
movies|The Punisher (1989)|1989
movies|The Wolverine|2013
movies|X-Men Origins: Wolverine|1979
`.trim().split('\n').map((l) => {
  const i = l.lastIndexOf('|');
  return [l.slice(0, i), Number(l.slice(i + 1))];
});

const curated = JSON.parse(await readFile('tools/data/curated.json', 'utf8'));
const byId = new Map(curated.map((c) => [c.id, c]));

let applied = 0;
const errors = [];
for (const [id, year] of OVERRIDES) {
  const entry = byId.get(id);
  if (!entry) { errors.push(`id inexistente: ${id}`); continue; }
  if (!Number.isInteger(year) || year < 1800 || year > 2100) { errors.push(`ano inválido: ${id} -> ${year}`); continue; }
  entry.storyYear = year;
  applied++;
}
if (errors.length) { console.error('ERRO:\n' + errors.join('\n')); process.exit(1); }

await writeFile('tools/data/curated.json', JSON.stringify(curated, null, 2) + '\n');

/* --- check runnable --- */
const remaining = curated.filter((c) => !Number.isFinite(c.storyYear));
console.log(`ok — ${applied}/${OVERRIDES.length} storyYears aplicados; restam ${remaining.length} por curar`);
for (const c of remaining) console.log(`  PENDENTE: ${c.id} (${c.storyLabel})`);
if (applied !== OVERRIDES.length) process.exit(1);
