const KEY = 'marvelVault.logs.v1';
const LEGACY_KEY = 'marvelVault.watched.v1';

export interface LogEntry {
  watchedAt: string | null;
  rating: number | null;
}

type Log = Record<string, LogEntry>;

function has(log: Log, id: string): boolean {
  return Object.prototype.hasOwnProperty.call(log, id);
}

function migrate(): Log {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === null) return {};
    const ids: unknown = JSON.parse(legacy);
    if (!Array.isArray(ids)) return {};
    const log: Log = {};
    for (const id of ids) log[String(id)] = { watchedAt: null, rating: null };
    localStorage.setItem(KEY, JSON.stringify(log));
    return log;
  } catch {
    return {};
  }
}

function load(): Log {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return {};
  }
  if (raw === null) return migrate();
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Log) : {};
  } catch {
    return {};
  }
}

function save(log: Log): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    // localStorage indisponível/cheio: a mutação fica só em memória
  }
}

let log: Log = load();

export function getEntry(id: string): LogEntry | null {
  return has(log, id) ? log[id] : null;
}

export function isWatched(id: string): boolean {
  return getEntry(id) !== null;
}

export function setWatched(id: string, on: boolean): void {
  if (on) {
    if (!has(log, id)) log[id] = { watchedAt: new Date().toISOString(), rating: null };
  } else {
    delete log[id];
  }
  save(log);
}

export function setRating(id: string, rating: number | null): void {
  const entry = (has(log, id) ? log[id] : null) ?? { watchedAt: null, rating: null };
  entry.rating = rating === null ? null : Math.min(10, Math.max(1, Math.round(rating)));
  log[id] = entry;
  save(log);
}