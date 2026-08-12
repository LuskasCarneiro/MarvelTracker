import { CLUSTERS, CLUSTER_LABELS } from '../data/catalog';

export type Media = 'filmes' | 'series';
export type Mode = 'estreia' | 'cron';
export type Filter = 'tudo' | 'visto' | 'porver';

export interface NavState {
  cluster: string;
  media: Media;
  mode: Mode;
  filter: Filter;
}

const DEFAULT: NavState = { cluster: 'mcu', media: 'filmes', mode: 'estreia', filter: 'tudo' };

export function readState(): NavState {
  const m = /^#\/([^/]+)\/(filmes|series)(?:\/(estreia|cron))?(?:\/(tudo|visto|porver))?$/.exec(location.hash);
  if (!m) return DEFAULT;
  if (!CLUSTERS.includes(m[1])) return DEFAULT;
  return {
    cluster: m[1],
    media: m[2] as Media,
    mode: (m[3] as Mode | undefined) ?? 'estreia',
    filter: (m[4] as Filter | undefined) ?? 'tudo',
  };
}

export function writeState(state: NavState): void {
  history.replaceState(null, '', `#/${state.cluster}/${state.media}/${state.mode}/${state.filter}`);
}

export function initNav(
  onChange: (cluster: string, media: Media, mode: Mode, filter: Filter) => void
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

  const status = document.createElement('div');
  status.className = 'media';
  status.setAttribute('role', 'tablist');
  status.setAttribute('aria-label', 'Estado do percurso');
  const filterBtns = {} as Record<Filter, HTMLButtonElement>;
  for (const f of ['tudo', 'visto', 'porver'] as const) {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.dataset.filter = f;
    b.textContent = f === 'tudo' ? 'TUDO' : f === 'visto' ? 'VISTO' : 'POR VER';
    filterBtns[f] = b;
    status.appendChild(b);
  }

  nav.replaceChildren(strip, toggle, order, status);

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
    for (const f of ['tudo', 'visto', 'porver'] as const) {
      const on = f === s.filter;
      filterBtns[f].classList.toggle('active', on);
      filterBtns[f].setAttribute('aria-selected', String(on));
      filterBtns[f].tabIndex = on ? 0 : -1;
    }
  }

  function setState(s: NavState): void {
    if (s.cluster === state.cluster && s.media === state.media && s.mode === state.mode && s.filter === state.filter) return;
    state = s;
    sync(state);
    writeState(state);
    onChange(state.cluster, state.media, state.mode, state.filter);
  }

  for (const [id, b] of clusterBtns) {
    b.addEventListener('click', () => setState({ cluster: id, media: state.media, mode: state.mode, filter: state.filter }));
  }
  for (const m of ['filmes', 'series'] as const) {
    mediaBtns[m].addEventListener('click', () => setState({ cluster: state.cluster, media: m, mode: state.mode, filter: state.filter }));
  }
  for (const m of ['estreia', 'cron'] as const) {
    modeBtns[m].addEventListener('click', () => setState({ cluster: state.cluster, media: state.media, mode: m, filter: state.filter }));
  }
  for (const f of ['tudo', 'visto', 'porver'] as const) {
    filterBtns[f].addEventListener('click', () => setState({ cluster: state.cluster, media: state.media, mode: state.mode, filter: f }));
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
  status.addEventListener('keydown', (ev) => rove(status, ev));

  window.addEventListener('hashchange', () => {
    const next = readState();
    if (next.cluster === state.cluster && next.media === state.media && next.mode === state.mode && next.filter === state.filter) return;
    state = next;
    sync(state);
    onChange(state.cluster, state.media, state.mode, state.filter);
  });

  sync(state);
  onChange(state.cluster, state.media, state.mode, state.filter);

  return { setState };
}