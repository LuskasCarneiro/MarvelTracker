import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CLUSTER_LABELS, type CatalogItem } from '../data/catalog';
import catalog from '../data/catalog.json';
import { exportLog, getEntry, importLog, isWatched, setRating, setWatched } from '../data/logs';

gsap.registerPlugin(ScrollTrigger);

const ALL = catalog as unknown as CatalogItem[];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// percursos ligados: candidatos do catálogo cujo título (minúsculas, sem
// acentos, série sem «S\d») aparece como palavra inteira nalguma referência.
function relatedTo(item: CatalogItem, limit = 4): CatalogItem[] {
  const refs = item.references ?? [];
  const firstIn = (cand: CatalogItem): number => {
    const t = escapeRe(norm(cand.title.replace(/ S\d+$/, '')));
    if (!t) return -1;
    const re = new RegExp(`\\b${t}\\b`, 'i');
    for (let i = 0; i < refs.length; i++) if (re.test(refs[i])) return i;
    return -1;
  };
  return ALL
    .filter((c) => c.id !== item.id)
    .map((c) => ({ c, i: firstIn(c) }))
    .filter((o) => o.i >= 0)
    .sort((a, b) => a.i - b.i)
    .slice(0, limit)
    .map((o) => o.c);
}

const ERA_LABEL: Record<string, string> = {
  reel: 'ROLO DE CINEMA',
  vhs: 'VHS',
  dvd: 'DVD',
  bluray: 'BLU-RAY',
};
export { ERA_LABEL };

export function votesLabel(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace('.', ',')} M`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} mil`;
  return String(v);
}

const CAM_Z = 2.2;
const CAM_Z_HOME = 4.2;
const LOOK_Y_HOME = 1.0;
const TWEEN_MS = 0.6;
// a página cobre o ecrã; desloca câmara+alvo para o item compor no terço esquerdo
const PANEL_SHIFT = () => (window.matchMedia('(max-width: 700px)').matches ? 0 : 0.9);

export interface DetailOptions {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  getShelf: () => THREE.Group | null;
  beforeOpen?: (mesh: THREE.Mesh) => void; // tira o hero de palco antes do tween
  onOpen?: () => void;
  onClose?: () => void;
  onRelated?: (item: CatalogItem) => void; // chip de percurso ligado → salta para o item
}

export function initDetail({ canvas, camera, getShelf, beforeOpen, onOpen, onClose, onRelated }: DetailOptions): {
  close(): void;
  open(mesh: THREE.Mesh): void;
} {
  const overlay = document.getElementById('detail') as HTMLElement;
  const closeBtn = document.getElementById('detail-close') as HTMLButtonElement;
  const kick = document.getElementById('detail-kick')!;
  const poster = document.getElementById('detail-poster') as HTMLImageElement;
  const title = document.getElementById('detail-title')!;
  const meta = document.getElementById('detail-meta')!;
  const overview = document.getElementById('detail-overview')!;
  const imdbP = document.getElementById('detail-imdb')!;
  const factsH = document.getElementById('detail-facts-h')!;
  const factsUl = document.getElementById('detail-facts')!;
  const refsH = document.getElementById('detail-refs-h')!;
  const refsUl = document.getElementById('detail-refs')!;
  const linksH = document.getElementById('detail-links-h')!;
  const linksBox = document.getElementById('detail-links')!;
  const toggle = document.getElementById('detail-toggle') as HTMLButtonElement;
  const watchedBox = document.getElementById('detail-watched') as HTMLElement;
  const dateP = document.getElementById('detail-date')!;
  const ratingBox = document.getElementById('detail-rating') as HTMLElement;
  const exportBtn = document.getElementById('detail-export') as HTMLButtonElement | null;
  const importInput = document.getElementById('detail-import') as HTMLInputElement | null;

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  let current: CatalogItem | null = null;
  let currentFormat = 'bluray'; // formato físico do item aberto (segue o modo ativo, não o releaseYear)
  let open = false;
  let restoreFocus: HTMLElement | null = null; // quem abriu o dossiê — para devolver o foco no fecho
  let home = { x: 0, y: 1, z: CAM_Z_HOME };

  function render() {
    if (!current) return;
    const seg = location.hash.split('/')[4];
    const filterBadge = seg === 'visto' ? ' · VISTO' : seg === 'porver' ? ' · POR VER' : '';
    kick.textContent =
      (current.type === 'movie' ? 'DOSSIÊ COMPLETO · FILME' : `DOSSIÊ COMPLETO · TEMPORADA ${current.seasonNumber}`) + filterBadge;
    poster.onerror = () => { poster.style.opacity = '0.3'; };
    poster.onload = () => { poster.style.opacity = '1'; };
    poster.src = current.poster;
    poster.alt = current.title;
    title.textContent = current.title;
    meta.textContent = `${current.releaseYear} · ${current.storyLabel} · ${ERA_LABEL[currentFormat]}`;
    if (current.imdbRating != null) {
      imdbP.hidden = false;
      imdbP.textContent = `★ ${current.imdbRating.toFixed(1).replace('.', ',')} · ${votesLabel(current.imdbVotes ?? 0)} VOTOS · IMDb`;
    } else {
      imdbP.hidden = true;
    }
    overview.textContent = current.longOverview ?? current.overview;
    const fill = (ul: HTMLElement, h: HTMLElement, list?: string[]) => {
      const on = !!list?.length;
      h.hidden = !on;
      ul.replaceChildren(...(list ?? []).map((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        return li;
      }));
    };
    fill(factsUl, factsH, current.facts);
    fill(refsUl, refsH, current.references);
    const related = relatedTo(current);
    linksH.hidden = related.length === 0;
    linksBox.replaceChildren(...related.map((item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = `${item.title} · ${CLUSTER_LABELS[item.cluster]}`;
      b.addEventListener('click', () => onRelated?.(item));
      return b;
    }));
    const watched = isWatched(current.id);
    toggle.textContent = watched ? 'PERCURSO CARIMBADO ✓' : 'CARIMBAR PERCURSO';
    watchedBox.hidden = !watched;
    if (!watched) return;
    const entry = getEntry(current.id);
    dateP.textContent = entry?.watchedAt
      ? `VISTO A ${new Date(entry.watchedAt).toLocaleDateString('pt-PT')}`
      : '';
    const rating = entry?.rating;
    const buttons: HTMLButtonElement[] = [];
    for (let v = 1; v <= 10; v++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = String(v);
      b.className = 'rate' + (rating === v ? ' active' : '');
      buttons.push(b);
    }
    ratingBox.replaceChildren(...buttons);
  }

  let tween: gsap.core.Tween | null = null;

  function flyTo(
    pos: { x: number; y: number; z: number },
    look: { x: number; y: number; z: number },
    onStart?: () => void,
    onEnd?: () => void
  ) {
    tween?.kill();
    const p = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    tween = gsap.to(p, {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      duration: TWEEN_MS,
      ease: 'power3.out',
      onStart,
      onUpdate: () => {
        camera.position.set(p.x, p.y, p.z);
        camera.lookAt(look.x, look.y, look.z);
      },
      onComplete: () => {
        tween = null;
        onEnd?.();
      },
    });
  }

  function openDetail(item: CatalogItem, mesh: THREE.Mesh) {
    restoreFocus = document.activeElement as HTMLElement;
    beforeOpen?.(mesh);
    current = item;
    currentFormat = (mesh.userData.format as string | undefined) ?? 'bluray';
    render();
    onOpen?.();
    const itemY = mesh.position.y;
    const fx = mesh.position.x + PANEL_SHIFT();
    const camZ = mesh.userData.format === 'reel' ? 3.4 : CAM_Z;
    if (!open) {
      open = true;
      home = { x: camera.position.x, y: camera.position.y, z: CAM_Z_HOME };
      ScrollTrigger.getAll().forEach((t) => t.disable(false));
      gsap.to(mesh.position, { z: 0, duration: TWEEN_MS, ease: 'power3.out' });
      flyTo(
        { x: fx, y: itemY, z: camZ },
        { x: fx, y: itemY, z: 0 },
        () => {
          overlay.classList.add('open');
          overlay.setAttribute('aria-hidden', 'false');
          overlay.setAttribute('aria-modal', 'true');
          closeBtn.focus();
        }
      );
    } else {
      flyTo({ x: fx, y: itemY, z: camZ }, { x: fx, y: itemY, z: 0 });
    }
  }

  function restoreFocusToOpener(): void {
    if (!restoreFocus) return;
    const focusDentro = overlay.contains(document.activeElement) || document.activeElement === document.body;
    if (focusDentro) restoreFocus.focus(); // não rouba o foco se já estiver fora (ex.: hashchange)
  }

  function closeDetail() {
    if (!open) return;
    open = false;
    flyTo(
      { x: home.x, y: home.y, z: home.z },
      { x: home.x, y: LOOK_Y_HOME, z: 0 },
      undefined,
      () => {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-modal', 'false');
        ScrollTrigger.getAll().forEach((t) => t.enable());
        onClose?.(); // antes do refresh: o onUpdate re-põe o hero e mostra o preview
        ScrollTrigger.refresh();
        restoreFocusToOpener();
      }
    );
  }

  // fecho imediato para troca de estante: sem tween, sem refresh (o mount trata)
  function close() {
    if (!open) return;
    open = false;
    tween?.kill();
    tween = null;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-modal', 'false');
    ScrollTrigger.getAll().forEach((t) => t.enable());
    onClose?.();
    restoreFocusToOpener();
  }

  function pick(ev: MouseEvent): THREE.Mesh | null {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const children = getShelf()?.children ?? [];
    for (const hit of raycaster.intersectObjects(children, false)) {
      const mesh = hit.object as THREE.Mesh;
      if (mesh.userData.item) return mesh;
    }
    return null;
  }

  // drag-to-rotate do hero termina num click DOM — suprime clicks com arrasto ≥5px
  let downX = 0;
  let downY = 0;
  canvas.addEventListener('pointerdown', (ev) => {
    downX = ev.clientX;
    downY = ev.clientY;
  });

  canvas.addEventListener('click', (ev) => {
    if (Math.abs(ev.clientX - downX) + Math.abs(ev.clientY - downY) >= 5) return;
    const mesh = pick(ev);
    if (!mesh) { closeDetail(); return; } // clique fora fecha o dossiê
    const item = mesh.userData.item as CatalogItem;
    if (open && current?.id === item.id) return;
    openDetail(item, mesh);
  });

  closeBtn.addEventListener('click', closeDetail);

  const nextBtn = document.getElementById('detail-next');
  nextBtn?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('mv-next-in-path'));
  });

  const nextUnwatchedBtn = document.getElementById('detail-next-unwatched');
  nextUnwatchedBtn?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('mv-next-unwatched'));
  });

  toggle.addEventListener('click', () => {
    if (!current) return;
    setWatched(current.id, !isWatched(current.id));
    render();
  });

  exportBtn?.addEventListener('click', () => {
    const json = exportLog();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'marvel-vault-percurso.json'; a.click();
    URL.revokeObjectURL(url);
  });

  importInput?.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = importLog(text, true);
    importInput.value = '';
    if (ok) {
      render();
      const n = Object.keys(JSON.parse(text) as Record<string, unknown>).length;
      // feedback breve no botão de export
      if (exportBtn) {
        const prev = exportBtn.textContent;
        exportBtn.textContent = `${n} IMPORTADOS ✓`;
        setTimeout(() => { exportBtn.textContent = prev; }, 1800);
      }
    } else alert('Ficheiro inválido — esperava um export do Marvel Vault.');
  });

  ratingBox.addEventListener('click', (ev) => {
    if (!current) return;
    const btn = (ev.target as HTMLElement).closest('button');
    if (!btn) return;
    const v = Number(btn.textContent);
    const rating = getEntry(current.id)?.rating;
    setRating(current.id, rating === v ? null : v);
    render();
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { closeDetail(); return; }
    if (ev.key !== 'Tab' || !open) return;
    const focusables = overlay.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const a = document.activeElement;
    if (ev.shiftKey && (a === first || a === overlay)) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && (a === last || a === overlay)) {
      ev.preventDefault();
      first.focus();
    }
  });

  return {
    close,
    open: (mesh: THREE.Mesh) => openDetail(mesh.userData.item as CatalogItem, mesh),
  };
}