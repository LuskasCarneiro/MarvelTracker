import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { itemsFor, themeFor, CLUSTER_ACCENT, CLUSTER_LABELS, type CatalogItem, type TitleTheme } from './data/catalog';
import { isWatched } from './data/logs';
import { setupScene } from './scene';
import { applyFocus, applyOrder, buildShelf, poseHero, SPACING, unposeHero } from './shelf';
import { initDetail } from './ui/detail';
import { initNav, writeState, type Filter, type Media, type Mode, type NavState } from './ui/nav';
import { initPreview } from './ui/preview';
import { initSearch } from './ui/search';
import Stats from 'stats.js';

gsap.registerPlugin(ScrollTrigger);

THREE.Cache.enabled = true;

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MODE_CAT: Record<Mode, 'release' | 'story'> = { estreia: 'release', cron: 'story' };
const MODE_LABEL: Record<Mode, string> = { estreia: 'ESTREIA', cron: 'CRONOLÓGICA' };
const MEDIA_LABEL: Record<Media, string> = { filmes: 'FILMES', series: 'SÉRIES' };

const { scene, camera, renderer, rim } = setupScene(CLUSTER_ACCENT['mcu']);

const scrollSpace = document.getElementById('scroll-space')!;
const dossie = document.getElementById('dossie')!;
const percurso = document.getElementById('percurso')!;
const empty = document.getElementById('empty')!;

const shelfCache = new Map<string, THREE.Group>();
let currentGroup: THREE.Group | null = null;
let st: ScrollTrigger | null = null;

// filtro de percurso: o subgrupo pede meshes emprestados ao grupo cacheado
// (não duplica geometrias); restoreFilter devolve-os antes de qualquer reuso.
let filterGroup: THREE.Group | null = null;
let filterSourceKey = '';

function passesFilter(item: CatalogItem, filter: Filter): boolean {
  if (filter === 'visto') return isWatched(item.id);
  if (filter === 'porver') return !isWatched(item.id);
  return true;
}

function restoreFilter(): void {
  if (!filterGroup) return;
  const src = shelfCache.get(filterSourceKey);
  if (src) {
    src.add(...filterGroup.children);
    const mode = filterGroup.userData.mode as 'release' | 'story' | undefined;
    if (mode) {
      const [c, m] = filterSourceKey.split('|');
      applyOrder(src, itemsFor(c, mode, m as Media), mode, false); // repõe as posições de slot do grupo completo
    }
  }
  filterGroup = null;
  filterSourceKey = '';
}

// --- hero (item em palco) ---
let heroIdx = -1;
let heroMesh: THREE.Mesh | null = null;

const preview = initPreview(() => {
  if (heroMesh) detail.open(heroMesh);
});

const detail = initDetail({
  canvas: renderer.domElement,
  camera,
  getShelf: () => currentGroup,
  onRelated: jumpToItem,
  beforeOpen: (mesh) => {
    applyTitleTheme(mesh.userData.item as CatalogItem); // o dossiê traz o tema do título aberto
    // híbrido: o hero fica em palco ao lado do dossiê (não volta ao slot)
    // — o panel shift da câmara (0.9) já o compõe no terço esquerdo
    if (mesh === heroMesh) heroIdx = -2; // -2 = em dossiê; onClose repõe
  },
  onOpen: () => preview.hide(),
  onClose: () => {
    heroIdx = -1; // força re-pose: o refresh() não dispara onUpdate com progresso igual
    if (currentGroup && st) applyHero(currentGroup, st.progress);
    // híbrido: o hero já está em palco; onClose repõe o estado normal
  },
});

// drag-to-rotate do hero (o click-pós-drag é suprimido no detail.ts)
const dragRay = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let dragging = false;
let lastPX = 0;
let lastPY = 0;
let lastT = 0;

// inércia no largar: GSAP free não tem InertiaPlugin → decay manual no gsap.ticker
const INERTIA_KICK = 0.0005; // rad/ms mínimo para arrancar o decay
const INERTIA_FLOOR = 0.0001; // rad/ms abaixo do qual a inércia para
const INERTIA_FRICTION = 0.94; // fator por frame (a 60fps)
let velY = 0;
let velX = 0;
let inertiaMesh: THREE.Mesh | null = null;

function killInertia(): void {
  gsap.ticker.remove(tickInertia);
  inertiaMesh = null;
  velY = 0;
  velX = 0;
}

function tickInertia(_t: number, dt: number): void {
  const m = inertiaMesh;
  if (!m || m !== heroMesh) {
    killInertia(); // hero mudou (unpose/mount) → mata o decay
    renderer.domElement.style.cursor = '';
    return;
  }
  const decay = Math.pow(INERTIA_FRICTION, dt / 16.7); // dt real normalizado a 60fps
  velY *= decay;
  velX *= decay;
  m.rotation.y += velY * dt;
  m.rotation.x = THREE.MathUtils.clamp(m.rotation.x + velX * dt, -0.5, 0.5);
  if (Math.abs(velY) + Math.abs(velX) < INERTIA_FLOOR) {
    killInertia();
    renderer.domElement.style.cursor = '';
  }
}

renderer.domElement.addEventListener('pointerdown', (ev) => {
  if (!heroMesh) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  dragRay.setFromCamera(ndc, camera);
  if (!dragRay.intersectObject(heroMesh, false).length) return;
  killInertia(); // agarrar de novo cancela o decay
  dragging = true;
  lastPX = ev.clientX;
  lastPY = ev.clientY;
  lastT = performance.now();
  renderer.domElement.setPointerCapture(ev.pointerId);
  (heroMesh.userData.bob as gsap.core.Tween | undefined)?.pause();
  renderer.domElement.style.cursor = 'grabbing';
});
window.addEventListener('pointermove', (ev) => {
  if (dragging && heroMesh) {
    const dx = ev.clientX - lastPX;
    const dy = ev.clientY - lastPY;
    const now = performance.now();
    const dt = Math.max(now - lastT, 1); // evita /0 em movimentos do mesmo frame
    lastPX = ev.clientX;
    lastPY = ev.clientY;
    lastT = now;
    heroMesh.rotation.y += dx * 0.01;
    heroMesh.rotation.x = THREE.MathUtils.clamp(heroMesh.rotation.x + dy * 0.005, -0.5, 0.5);
    velY = (dx * 0.01) / dt;
    velX = (dy * 0.005) / dt;
    return;
  }
  // hover: cursor grab sobre o hero (descobribilidade do drag)
  if (!heroMesh) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  dragRay.setFromCamera(ndc, camera);
  renderer.domElement.style.cursor = dragRay.intersectObject(heroMesh, false).length ? 'grab' : '';
});
window.addEventListener('pointerup', () => {
  if (!dragging) return;
  dragging = false;
  (heroMesh?.userData.bob as gsap.core.Tween | undefined)?.resume();
  if (heroMesh && Math.abs(velY) + Math.abs(velX) >= INERTIA_KICK) {
    inertiaMesh = heroMesh;
    gsap.ticker.add(tickInertia);
    renderer.domElement.style.cursor = 'grab'; // ainda "no" hero durante a inércia
  } else {
    killInertia();
    renderer.domElement.style.cursor = '';
  }
});

const stats = import.meta.env.DEV ? new Stats() : null;
if (stats) {
  stats.dom.id = 'stats';
  stats.dom.style.cssText = 'position: fixed; bottom: 1rem; left: 1rem; z-index: 10';
  document.body.appendChild(stats.dom);
}

gsap.ticker.add(() => {
  stats?.begin();
  renderer.render(scene, camera);
  stats?.end();
});

const current = { cluster: '', media: 'filmes' as Media, mode: 'estreia' as Mode, filter: 'tudo' as Filter };

// tema curado do título (se existir): o UI, o rim e o fundo seguem o item em palco.
// Sem tema → acento do cluster. Temas vivem em src/data/themes.json (extraído do
// legado themes.js por tools/extract_themes.mjs).
function applyTitleTheme(item: CatalogItem | null): void {
  const theme: TitleTheme | null = item ? themeFor(item) : null;
  const accent = theme?.accent ?? CLUSTER_ACCENT[current.cluster];
  document.body.style.setProperty('--accent', accent);
  document.body.style.setProperty('--ink', theme?.ink ?? '#efe7da');
  document.body.style.setProperty('--accent2', theme?.accent2 ?? '#a9782f');
  gsap.to(rim.color, { r: new THREE.Color(accent).r, g: new THREE.Color(accent).g, b: new THREE.Color(accent).b, duration: 0.8, ease: 'power2.out' });
  const bg = theme?.bg;
  if (bg) {
    const c = new THREE.Color(bg);
    gsap.to(scene.background as THREE.Color, { r: c.r, g: c.g, b: c.b, duration: 0.8, ease: 'power2.out' });
  } else {
    gsap.to(scene.background as THREE.Color, { r: 0x0e / 255, g: 0x0c / 255, b: 0x0a / 255, duration: 0.8, ease: 'power2.out' });
  }
}

function applyHero(group: THREE.Group, p: number): void {
  const n = group.children.filter((c) => c.userData.slot !== undefined).length;
  const focus = p * (n - 1);
  const h = Math.min(n - 1, Math.round(focus));
  const hero = applyFocus(group, focus, h, REDUCED);
  if (h !== heroIdx && hero) {
    if (heroMesh) unposeHero(heroMesh, !REDUCED);
    heroIdx = h;
    heroMesh = hero;
    poseHero(hero, !REDUCED);
    applyTitleTheme(hero.userData.item as CatalogItem);
    preview.show(hero.userData.item, hero.userData.format);
  }
}

function dossieText(n: number): string {
  const base = `DOSSIÊ ${CLUSTER_LABELS[current.cluster]} — ${n} PERCURSOS · ${MEDIA_LABEL[current.media]} · ${MODE_LABEL[current.mode]}`;
  if (current.filter !== 'tudo') {
    const f = current.filter === 'visto' ? 'VISTO' : 'POR VER';
    return `${base} · ${f}`;
  }
  return base;
}

function mount(cluster: string, media: Media, mode: Mode, filter: Filter): void {
  document.body.dataset.cluster = cluster;
  applyTitleTheme(null); // volta ao acento do cluster (o hero re-tematiza no onUpdate)
  rim.color = new THREE.Color(CLUSTER_ACCENT[cluster]);
  detail.close();
  st?.kill();
  st = null;
  if (currentGroup) scene.remove(currentGroup);
  currentGroup = null;
  restoreFilter();

  camera.position.set(0, 1.0, 4.2);
  camera.lookAt(0, 1.0, 0);
  heroMesh = null;
  heroIdx = -1;
  preview.hide();

  const all = itemsFor(cluster, MODE_CAT[mode], media);
  const items = all.filter((i) => passesFilter(i, filter));
  const n = items.length;

  dossie.textContent = dossieText(n);

  if (n === 0) {
    scrollSpace.style.height = '100vh';
    empty.hidden = false;
    percurso.textContent = '';
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
    return;
  }

  empty.hidden = true;

  const key = `${cluster}|${media}`;
  let group = shelfCache.get(key);
  if (!group) {
    group = buildShelf(all, MODE_CAT[mode], CLUSTER_ACCENT[cluster]);
    shelfCache.set(key, group);
  } else if (group.userData.mode !== MODE_CAT[mode]) {
    applyOrder(group, all, MODE_CAT[mode], false);
  }

  let shown: THREE.Group;
  if (filter === 'tudo') {
    shown = group;
  } else {
    const fg = new THREE.Group();
    for (const child of [...group.children]) {
      const item = child.userData.item as CatalogItem | undefined;
      if (!item || passesFilter(item, filter)) fg.add(child); // meshes já existentes — sem duplicar geometrias
    }
    applyOrder(fg, items, MODE_CAT[mode], false); // slots contíguos do subgrupo
    filterGroup = fg;
    filterSourceKey = key;
    shown = fg;
  }
  scene.add(shown);
  currentGroup = shown;

  const span = (n - 1) * SPACING;
  const xmin = -span / 2;
  const xmax = span / 2;

  scrollSpace.style.height = `${n * 45}vh`;

  st = ScrollTrigger.create({
    trigger: scrollSpace,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    snap: { snapTo: 1 / (n - 1), duration: 0.25, ease: 'power2.out' }, // assenta sempre no slot → hero centrado
    onUpdate: (self) => {
      const p = self.progress;
      camera.position.x = xmin + (xmax - xmin) * p;
      camera.lookAt(camera.position.x, 1.0, 0);
      const h = Math.min(n - 1, Math.round(p * (n - 1)));
      percurso.textContent = `PERCURSO ${h + 1}/${n}`;
      applyHero(shown, p);
    },
  });

  // o scrub só corre onUpdate quando há scroll; sem isto a estante abria a meio
  camera.position.x = xmin;
  camera.lookAt(xmin, 1.0, 0);
  percurso.textContent = `PERCURSO 1/${n}`;
  applyHero(shown, 0);

  // carimbo: drop + stagger de assentamento ao montar (o hero já está em palco)
  if (!REDUCED) {
    const slots = shown.children
      .filter((c) => c.userData.item && c.userData.slot !== heroIdx)
      .map((c) => (c as THREE.Mesh).position);
    if (slots.length) {
      gsap.from(slots, {
        y: (_i: number, p: THREE.Vector3) => p.y + 0.35,
        duration: 0.5,
        ease: 'power3.out',
        stagger: { each: 0.006, from: 0 },
      });
    }
  }

  window.scrollTo(0, 0);
  ScrollTrigger.refresh();
}

function onNav(cluster: string, media: Media, mode: Mode, filter: Filter): void {
  const topChanged = cluster !== current.cluster || media !== current.media;
  const filterChanged = filter !== current.filter;
  current.cluster = cluster;
  current.media = media;
  current.mode = mode;
  current.filter = filter;
  if (!topChanged && !filterChanged) {
    const items = itemsFor(cluster, MODE_CAT[mode], media).filter((i) => passesFilter(i, filter));
    if (currentGroup && currentGroup.userData.mode !== MODE_CAT[mode]) {
      detail.close();
      if (heroMesh) {
        unposeHero(heroMesh, false); // slots mudam no morph — hero sai de palco já
        heroMesh = null;
        heroIdx = -1;
      }
      applyOrder(currentGroup, items, MODE_CAT[mode], !REDUCED);
      applyHero(currentGroup, st?.progress ?? 0); // re-põe o hero no slot novo
    }
    dossie.textContent = dossieText(items.length);
    return;
  }
  mount(cluster, media, mode, filter);
}

const navApi = initNav(onNav);

function jumpToItem(item: CatalogItem): void {
  detail.close(); // o dossiê pode estar aberto (chip) ou a busca pode saltar por cima
  const media: Media = item.type === 'movie' ? 'filmes' : 'series';
  let filter: Filter = current.filter;
  if (filter !== 'tudo' && !passesFilter(item, filter)) filter = 'tudo'; // fora do filtro → mostra tudo para saltar
  const s: NavState = { cluster: item.cluster, media, mode: current.mode, filter };
  navApi.setState(s);
  writeState(s); // hash mesmo quando o estado é igual (1.º pick do estado por omissão)
  const items = itemsFor(item.cluster, MODE_CAT[current.mode], media).filter((i) => passesFilter(i, filter));
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx < 1 || items.length < 2) return; // já no 1.º slot (ou inexistente)
  const p = idx / (items.length - 1);
  setTimeout(() => {
    window.scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight));
  }, 80); // deixa o mount/refresh assentar; o snap assenta no slot e pose o hero
}

initSearch(jumpToItem);

// A — nav + busca auto-escondidas: esconde a descer, mostra a subir / rato no topo / focus
const hideable = document.querySelectorAll<HTMLElement>('#nav, #search');
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const d = y - lastY;
  if (d > 4 && y > 80) hideable.forEach((el) => el.classList.add('nav-hidden'));
  else if (d < -4) hideable.forEach((el) => el.classList.remove('nav-hidden'));
  lastY = y;
}, { passive: true });
window.addEventListener('mousemove', (ev) => {
  if (ev.clientY < 64) hideable.forEach((el) => el.classList.remove('nav-hidden'));
}, { passive: true });
hideable.forEach((el) => el.addEventListener('focusin', () => el.classList.remove('nav-hidden')));

// --- navegação por teclado da estante (a11y) ---
function shelfCount(): number {
  return itemsFor(current.cluster, MODE_CAT[current.mode], current.media).filter((i) => passesFilter(i, current.filter)).length;
}

function scrollToSlot(index: number): void {
  const n = shelfCount();
  if (n < 2) return;
  window.scrollTo(0, (index / (n - 1)) * (document.documentElement.scrollHeight - innerHeight));
}

function keyIgnored(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return true;
  if (document.activeElement === document.getElementById('search')) return true;
  if (document.getElementById('nav')?.contains(document.activeElement)) return true;
  if (document.getElementById('detail')?.classList.contains('open')) return true;
  return e.ctrlKey || e.metaKey || e.altKey;
}

window.addEventListener('keydown', (e) => {
  if (keyIgnored(e)) return;
  const n = shelfCount();
  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      if (n >= 2) scrollToSlot(heroIdx < 0 ? 0 : (heroIdx + 1) % n);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (n >= 2) scrollToSlot(heroIdx < 0 ? n - 1 : (heroIdx - 1 + n) % n);
      break;
    case 'Home':
      e.preventDefault();
      scrollToSlot(0);
      break;
    case 'End':
      e.preventDefault();
      scrollToSlot(n - 1);
      break;
    case 'Enter':
      if (heroMesh && document.activeElement !== document.getElementById('preview-open')) detail.open(heroMesh);
      break;
  }
});

window.addEventListener('mv-next-in-path', () => {
  if (!currentGroup || !st) return;
  const n = shelfCount();
  if (n < 2) return;
  // o índice atual vem do progresso do ScrollTrigger — com o dossiê aberto o
  // heroIdx foi libertado (=-2), por isso não é fonte fiável do item em palco
  const cur = Math.min(n - 1, Math.max(0, Math.round(st.progress * (n - 1))));
  const next = (cur + 1) % n;
  detail.close(); // o dossiê fecha e o novo hero sobe em palco com o salto
  scrollToSlot(next);
});

window.addEventListener('mv-next-unwatched', () => {
  if (!currentGroup || !st) return;
  const items = itemsFor(current.cluster, MODE_CAT[current.mode], current.media).filter((i) => passesFilter(i, current.filter));
  const n = items.length;
  if (n < 2) return;
  const cur = Math.min(n - 1, Math.max(0, Math.round(st.progress * (n - 1))));
  for (let step = 1; step <= n; step++) {
    const idx = (cur + step) % n;
    if (!isWatched(items[idx].id)) {
      detail.close();
      scrollToSlot(idx);
      return;
    }
  }
  // percurso todo visto — fica-se no dossiê
});