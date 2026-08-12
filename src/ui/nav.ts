import { CLUSTERS, CLUSTER_LABELS } from '../data/catalog';

export type Media = 'filmes' | 'series';
export type Mode = 'estreia' | 'cron';

export interface NavState {
  cluster: string;
  media: Media;
  mode: Mode;
}

const DEFAULT: NavState = { cluster: 'mcu', media: 'filmes', mode: 'estreia' };

export function readState(): NavState {
  const m = /^#\/([^/]+)\/(filmes|series)(?:\/(estreia|cron))?$/.exec(location.hash);
  if (!m) return DEFAULT;
  if (!CLUSTERS.includes(m[1])) return DEFAULT;
  return { cluster: m[1], media: m[2] as Media, mode: (m[3] as Mode | undefined) ?? 'estreia' };
}

export function writeState(state: NavState): void {
  history.replaceState(null, '', `#/${state.cluster}/${state.media}/${state.mode}`);
}

export function initNav(
  onChange: (cluster: string, media: Media, mode: Mode) => void
): { setState: (s: NavState) => void } {
  const nav = document.getElementById('nav')!;

  const strip = document.createElement('div');
  strip.className = 'clusters';
  strip.setAttribute('role', 'tablist');
  strip.setAttribute('aria-label', 'Universos');
  for (const id of CLUSTERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.dataset.cluster = id;
    b.textContent = CLUSTER_LABELS[id];
    strip.appendChild(b);
  }

  const toggle = document.createElement('div');
  toggle.className = 'media';
  toggle.setAttribute('role', 'tablist');
  toggle.setAttribute('aria-label', 'Tipo de percurso');
  const mediaBtns = {} as Record<Media, HTMLButtonElement>;
  for (const m of ['filmes', 'series'] as const) {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.dataset.media = m;
    b.textContent = m === 'filmes' ? 'FILMES' : 'SÉRIES';
    mediaBtns[m] = b;
    toggle.appendChild(b);
  }

  const order = document.createElement('div');
  order.className = 'media';
  order.setAttribute('role', 'tablist');
  order.setAttribute('aria-label', 'Ordenação');
  const modeBtns = {} as Record<Mode, HTMLButtonElement>;
  for (const m of ['estreia', 'cron'] as const) {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.dataset.mode = m;
    b.textContent = m === 'estreia' ? 'ESTREIA' : 'CRONOLÓGICA';
    modeBtns[m] = b;
    order.appendChild(b);
  }

  nav.replaceChildren(strip, toggle, order);

  const clusterBtns = new Map(
    [...strip.querySelectorAll<HTMLButtonElement>('button')].map((b) => [b.dataset.cluster!, b])
  );

  let state = readState();

  function sync(s: NavState): void {
    for (const [id, b] of clusterBtns) {
      const on = id === s.cluster;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1; // roving: só o ativo entra no tab
    }
    for (const m of ['filmes', 'series'] as const) {
      const on = m === s.media;
      mediaBtns[m].classList.toggle('active', on);
      mediaBtns[m].setAttribute('aria-selected', String(on));
      mediaBtns[m].tabIndex = on ? 0 : -1;
    }
    for (const m of ['estreia', 'cron'] as const) {
      const on = m === s.mode;
      modeBtns[m].classList.toggle('active', on);
      modeBtns[m].setAttribute('aria-selected', String(on));
      modeBtns[m].tabIndex = on ? 0 : -1;
    }
  }

  function setState(s: NavState): void {
    if (s.cluster === state.cluster && s.media === state.media && s.mode === state.mode) return;
    state = s;
    sync(state);
    writeState(state);
    onChange(state.cluster, state.media, state.mode);
  }

  for (const [id, b] of clusterBtns) {
    b.addEventListener('click', () => setState({ cluster: id, media: state.media, mode: state.mode }));
  }
  for (const m of ['filmes', 'series'] as const) {
    mediaBtns[m].addEventListener('click', () => setState({ cluster: state.cluster, media: m, mode: state.mode }));
  }
  for (const m of ['estreia', 'cron'] as const) {
    modeBtns[m].addEventListener('click', () => setState({ cluster: state.cluster, media: state.media, mode: m }));
  }

  // roving keyboard: setas movem + ativam (wrapping), Home/End extremos
  const ROVE_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  function rove(tablist: HTMLElement, ev: KeyboardEvent): void {
    if (!ROVE_KEYS.includes(ev.key)) return;
    const tabs = [...tablist.querySelectorAll<HTMLButtonElement>('button')];
    const idx = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    let next = idx;
    switch (ev.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = (idx + 1) % tabs.length; break;
      case 'ArrowLeft':
      case 'ArrowUp': next = (idx - 1 + tabs.length) % tabs.length; break;
      case 'Home': next = 0; break;
      case 'End': next = tabs.length - 1; break;
    }
    ev.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  }
  strip.addEventListener('keydown', (ev) => rove(strip, ev));
  toggle.addEventListener('keydown', (ev) => rove(toggle, ev));
  order.addEventListener('keydown', (ev) => rove(order, ev));

  window.addEventListener('hashchange', () => {
    const next = readState();
    if (next.cluster === state.cluster && next.media === state.media && next.mode === state.mode) return;
    state = next;
    sync(state);
    onChange(state.cluster, state.media, state.mode);
  });

  sync(state);
  onChange(state.cluster, state.media, state.mode);

  return { setState };
}