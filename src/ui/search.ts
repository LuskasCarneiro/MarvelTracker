import { CLUSTERS, CLUSTER_LABELS, itemsFor } from '../data/catalog';
import type { CatalogItem } from '../data/catalog';

const ALL = CLUSTERS.flatMap((c) => itemsFor(c, 'release'));
const MAX = 8;

// ponytail: termos pt-PT → EN dos títulos Marvel que diferem na tradução. Mapa
//   pequeno e curado; se um termo falhar, acrescenta-se à lista. Específicos primeiro.
const PT_EN: [string, string][] = [
  ['guardiões da galáxia', 'guardians of the galaxy'],
  ['homem de ferro', 'iron man'],
  ['homem-ferro', 'iron man'],
  ['homem-aranha', 'spider-man'],
  ['capitão américa', 'captain america'],
  ['viúva negra', 'black widow'],
  ['pantera negra', 'black panther'],
  ['doutor', 'doctor'],
  ['estranho', 'strange'],
  ['vingadores', 'avengers'],
  ['guardiões', 'guardians'],
  ['galáxia', 'galaxy'],
  ['capitão', 'captain'],
  ['aranha', 'spider'],
  ['ferro', 'iron'],
  ['viúva', 'widow'],
  ['pantera', 'panther'],
  ['américa', 'america'],
];

function ptToEn(s: string): string {
  let out = s;
  for (const [pt, en] of PT_EN) out = out.replaceAll(pt, en);
  return out;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

export function initSearch(onPick: (item: CatalogItem) => void): void {
  const input = document.getElementById('search') as HTMLInputElement;
  const box = document.getElementById('search-results')!;
  let options: CatalogItem[] = [];
  let active = -1;

  function setActive(i: number): void {
    active = i;
    box.querySelectorAll('button').forEach((b, j) => b.classList.toggle('active', j === i));
    input.setAttribute('aria-activedescendant', `sr-${i}`);
  }

  function render(): void {
    if (options.length === 0) {
      const empty = input.value.trim()
        ? Object.assign(document.createElement('div'), {
            className: 'empty',
            textContent: 'SEM RESULTADOS NO ARQUIVO',
          })
        : null;
      if (empty) box.replaceChildren(empty);
      else box.replaceChildren();
      box.hidden = empty === null;
      input.setAttribute('aria-expanded', String(empty !== null));
    } else {
      box.replaceChildren(
        ...options.map((item, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.id = `sr-${i}`;
          b.setAttribute('role', 'option');
          b.setAttribute('aria-selected', String(i === active));
          b.className = i === active ? 'active' : '';
          b.textContent = `${item.title} — ${CLUSTER_LABELS[item.cluster]} · ${item.type === 'movie' ? 'FILMES' : 'SÉRIES'}`;
          b.addEventListener('click', () => pick(item));
          b.addEventListener('mousemove', () => setActive(i));
          return b;
        })
      );
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    if (active >= 0) input.setAttribute('aria-activedescendant', `sr-${active}`);
    else input.removeAttribute('aria-activedescendant');
  }

  function close(): void {
    options = [];
    active = -1;
    render();
  }

  function pick(item: CatalogItem): void {
    close();
    input.value = '';
    input.blur();
    onPick(item);
  }

  input.addEventListener('input', () => {
    const raw = input.value.trim();
    if (!raw) {
      close();
      return;
    }
    const t1 = norm(raw);
    const t2 = norm(ptToEn(raw.toLowerCase()));
    const cur = document.body.dataset.cluster ?? '';
    const hits = ALL.filter((item) => {
      const t = norm(item.title);
      return t.includes(t1) || (t2 !== t1 && t.includes(t2));
    });
    hits.sort((a, b) => (a.cluster === cur ? -1 : 0) - (b.cluster === cur ? -1 : 0));
    options = hits.slice(0, MAX);
    active = options.length ? 0 : -1;
    render();
  });

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      close();
      input.blur();
      return;
    }
    if (options.length === 0) return;
    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        setActive((active + 1) % options.length);
        box.querySelector<HTMLElement>(`#sr-${active}`)?.scrollIntoView({ block: 'nearest' });
        break;
      case 'ArrowUp':
        ev.preventDefault();
        setActive((active - 1 + options.length) % options.length);
        box.querySelector<HTMLElement>(`#sr-${active}`)?.scrollIntoView({ block: 'nearest' });
        break;
      case 'Enter':
        ev.preventDefault();
        if (active >= 0) pick(options[active]);
        break;
    }
  });

  document.addEventListener('pointerdown', (ev) => {
    if (box.hidden) return;
    if (ev.target === input || box.contains(ev.target as Node)) return;
    close();
  });
}
