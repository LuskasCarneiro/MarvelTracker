import { CLUSTER_ACCENT, themeFor, type CatalogItem, type TitleTheme } from './data/catalog';

export function themeColors(item: CatalogItem | null, cluster: string): TitleTheme & { accent: string } {
  const t = item ? themeFor(item) : null;
  return {
    accent: t?.accent ?? CLUSTER_ACCENT[cluster],
    accent2: t?.accent2 ?? '#a9782f',
    bg: t?.bg ?? '#0e0c0a',
    ink: t?.ink ?? '#efe7da',
    src: t?.src,
  };
}
