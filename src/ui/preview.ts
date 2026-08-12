import type { CatalogItem } from '../data/catalog';
import { ERA_LABEL, votesLabel } from './detail';

export function initPreview(onOpen: () => void): {
  show(item: CatalogItem, format: string): void;
  hide(): void;
} {
  const el = document.getElementById('preview')!;
  const kick = document.getElementById('preview-kick')!;
  const title = document.getElementById('preview-title')!;
  const meta = document.getElementById('preview-meta')!;
  const rating = document.getElementById('preview-rating')!;
  const overview = document.getElementById('preview-overview')!;
  const openBtn = document.getElementById('preview-open') as HTMLButtonElement;
  openBtn.addEventListener('click', onOpen);

  function show(item: CatalogItem, format: string): void {
    kick.textContent =
      item.type === 'movie' ? 'DOSSIÊ · FILME' : `DOSSIÊ · TEMPORADA ${item.seasonNumber}`;
    title.textContent = item.title;
    meta.textContent = `${item.releaseYear} · ${item.storyLabel} · ${ERA_LABEL[format]}`;
    if (item.imdbRating != null) {
      rating.hidden = false;
      rating.textContent = `★ ${item.imdbRating.toFixed(1).replace('.', ',')} · ${votesLabel(item.imdbVotes ?? 0)} VOTOS`;
    } else {
      rating.hidden = true;
    }
    overview.textContent = item.overview;
    el.classList.add('visible');
    el.setAttribute('aria-hidden', 'false');
    openBtn.tabIndex = 0;
  }

  function hide(): void {
    el.classList.remove('visible');
    el.setAttribute('aria-hidden', 'true');
    openBtn.tabIndex = -1; // invisível não é focusable
  }

  return { show, hide };
}
