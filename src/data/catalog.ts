import catalog from './catalog.json';
import themes from './themes.json';

export interface TitleTheme {
  accent: string;
  accent2: string;
  bg: string;
  ink: string;
}

export interface CatalogItem {
  id: string;
  cluster: string;
  type: 'movie' | 'season';
  title: string;
  releaseYear: number;
  storyYear: number | null;
  storyLabel: string;
  overview: string;
  seasonOf: string | null;
  seasonNumber: number | null;
  poster: string;
  imdbRating: number | null;
  imdbVotes: number | null;
  // enriquecimento editorial (D2 — tools/data/enrich-*.json, via apply_enrich)
  longOverview?: string;
  facts?: string[];
  references?: string[];
}

const items = catalog as unknown as CatalogItem[];

const titleThemes = themes as unknown as Record<string, TitleTheme>;

// tema curado do legado por título (match exato ou série sem sufixo S\d+)
export function themeFor(item: CatalogItem): TitleTheme | null {
  return titleThemes[item.title] ?? titleThemes[item.title.replace(/ S\d+$/, '')] ?? null;
}

export const CLUSTERS: string[] = [
  'mcu', 'xmen', 'sony', 'netflix', 'vintage', 'classica',
  'fox', 'hulu', 'abc', 'anim', 'verse', 'f4',
];

export const CLUSTER_LABELS: Record<string, string> = {
  mcu: 'MCU',
  xmen: 'X-MEN',
  sony: 'SONY',
  netflix: 'NETFLIX',
  vintage: 'VINTAGE',
  classica: 'CLÁSSICA',
  fox: 'FOX',
  hulu: 'HULU',
  abc: 'ABC',
  anim: 'ANIMAÇÃO',
  verse: 'SPIDER-VERSE',
  f4: 'F4',
};

export const CLUSTER_ACCENT: Record<string, string> = {
  mcu: '#d8a24a',
  xmen: '#4a7fd8',
  sony: '#d84a3a',
  netflix: '#a8324a',
  vintage: '#c9a86a',
  classica: '#7d9b76',
  fox: '#8a93a3',
  hulu: '#4aa96c',
  abc: '#5f8f9f',
  anim: '#d87f4a',
  verse: '#c34a9e',
  f4: '#56a8d8',
};

export type EraFormat = 'reel' | 'vhs' | 'dvd' | 'bluray';

export function formatFor(year: number): EraFormat {
  if (year < 1978) return 'reel';
  if (year < 2000) return 'vhs';
  if (year < 2010) return 'dvd';
  return 'bluray';
}

function effectiveYear(item: CatalogItem, mode: 'release' | 'story'): number {
  return mode === 'story' ? (item.storyYear ?? item.releaseYear) : item.releaseYear;
}

export function itemsFor(
  cluster: string,
  mode: 'release' | 'story' = 'release',
  media?: 'filmes' | 'series'
): CatalogItem[] {
  return items
    .filter((item) => item.cluster === cluster)
    .filter((item) =>
      media === 'filmes' ? item.type === 'movie' : media === 'series' ? item.type === 'season' : true
    )
    .sort((a, b) => effectiveYear(a, mode) - effectiveYear(b, mode));
}