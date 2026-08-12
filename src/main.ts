import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { itemsFor, CLUSTER_ACCENT, CLUSTER_LABELS, type CatalogItem } from './data/catalog';
import { setupScene } from './scene';
import { applyFocus, applyOrder, buildShelf, poseHero, SPACING, unposeHero } from './shelf';
import { initDetail } from './ui/detail';
import { initNav, writeState, type Media, type Mode, type NavState } from './ui/nav';
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
    if (mesh !== heroMesh) return;
    unposeHero(mesh, false); // hero volta ao slot antes do quick path
    heroMesh = null;
    heroIdx = -2; // -2 = libertado pelo detalhe; onClose repõe
  },
  onOpen: () => preview.hide(),
  onClose: () => {
    heroIdx = -1; // força re-pose: o refresh() não dispara onUpdate com progresso igual
    if (currentGroup && st) applyHero(currentGroup, st.progress);
  },
});

// drag-to-rotate do hero (o click-pós-drag é suprimido no detail.ts)
const dragRay = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let dragging = false;
let lastPX = 0;
let lastPY = 0;

renderer.domElement.addEventListener('pointerdown', (ev) => {
  if (!heroMesh) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  dragRay.setFromCamera(ndc, camera);
  if (!dragRay.intersectObject(heroMesh, false).length) return;
  dragging = true;
  lastPX = ev.clientX;
  lastPY = ev.clientY;
  renderer.domElement.setPointerCapture(ev.pointerId);
  (heroMesh.userData.bob as gsap.core.Tween | undefined)?.pause();
  renderer.domElement.style.cursor = 'grabbing';
});
window.addEventListener('pointermove', (ev) => {
  if (dragging && heroMesh) {
    const dx = ev.clientX - lastPX;
    const dy = ev.clientY - lastPY;
    lastPX = ev.clientX;
    lastPY = ev.clientY;
    heroMesh.rotation.y += dx * 0.01;
    heroMesh.rotation.x = THREE.MathUtils.clamp(heroMesh.rotation.x + dy * 0.005, -0.5, 0.5);
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
  renderer.domElement.style.cursor = '';
  (heroMesh?.userData.bob as gsap.core.Tween | undefined)?.resume();
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

const current = { cluster: '', media: 'filmes' as Media, mode: 'estreia' as Mode };

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
    preview.show(hero.userData.item, hero.userData.format);
  }
}

function dossieText(n: number): string {
  return `DOSSIÊ ${CLUSTER_LABELS[current.cluster]} — ${n} PERCURSOS · ${MEDIA_LABEL[current.media]} · ${MODE_LABEL[current.mode]}`;
}

function mount(cluster: string, media: Media, mode: Mode): void {
  document.body.dataset.cluster = cluster;
  rim.color = new THREE.Color(CLUSTER_ACCENT[cluster]);
  detail.close();
  st?.kill();
  st = null;
  if (currentGroup) scene.remove(currentGroup);
  currentGroup = null;

  camera.position.set(0, 1.0, 4.2);
  camera.lookAt(0, 1.0, 0);
  heroMesh = null;
  heroIdx = -1;
  preview.hide();

  const items = itemsFor(cluster, MODE_CAT[mode], media);
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
    group = buildShelf(items, MODE_CAT[mode], CLUSTER_ACCENT[cluster]);
    shelfCache.set(key, group);
  } else if (group.userData.mode !== MODE_CAT[mode]) {
    applyOrder(group, items, MODE_CAT[mode], false);
  }
  scene.add(group);
  currentGroup = group;

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
      applyHero(group, p);
    },
  });

  // o scrub só corre onUpdate quando há scroll; sem isto a estante abria a meio
  camera.position.x = xmin;
  camera.lookAt(xmin, 1.0, 0);
  percurso.textContent = `PERCURSO 1/${n}`;
  applyHero(group, 0);

  window.scrollTo(0, 0);
  ScrollTrigger.refresh();
}

function onNav(cluster: string, media: Media, mode: Mode): void {
  const topChanged = cluster !== current.cluster || media !== current.media;
  current.cluster = cluster;
  current.media = media;
  current.mode = mode;
  if (!topChanged) {
    const items = itemsFor(cluster, MODE_CAT[mode], media);
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
  mount(cluster, media, mode);
}

const navApi = initNav(onNav);

function jumpToItem(item: CatalogItem): void {
  detail.close(); // o dossiê pode estar aberto (chip) ou a busca pode saltar por cima
  const media: Media = item.type === 'movie' ? 'filmes' : 'series';
  const s: NavState = { cluster: item.cluster, media, mode: current.mode };
  navApi.setState(s);
  writeState(s); // hash mesmo quando o estado é igual (1.º pick do estado por omissão)
  const items = itemsFor(item.cluster, MODE_CAT[current.mode], media);
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