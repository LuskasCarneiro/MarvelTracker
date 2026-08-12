import * as THREE from 'three';
import { gsap } from 'gsap';
import { formatFor, type CatalogItem, type EraFormat } from './data/catalog';

export const SPACING = 1.7;

const DARK = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });

function fitCover(texture: THREE.Texture, faceW: number, faceH: number) {
  const img = texture.image as HTMLImageElement | undefined;
  if (!img) return;
  const texAspect = img.width / img.height;
  const faceAspect = faceW / faceH;
  let repeatX = 1;
  let repeatY = 1;
  if (texAspect > faceAspect) {
    repeatX = faceAspect / texAspect;
  } else {
    repeatY = texAspect / faceAspect;
  }
  texture.repeat.set(repeatX, repeatY);
  texture.offset.set((1 - repeatX) / 2, (1 - repeatY) / 2);
}

function coverMaterial(poster: string, faceW: number, faceH: number) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(poster, (tex) => fitCover(tex, faceW, faceH));
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 });
}

function effectiveYear(item: CatalogItem, mode: 'release' | 'story'): number {
  return mode === 'story' ? (item.storyYear ?? item.releaseYear) : item.releaseYear;
}

function geometryFor(format: EraFormat): {
  geometry: THREE.BufferGeometry;
  faceW: number;
  faceH: number;
  coverIndex: number;
  height: number;
} {
  if (format === 'reel') {
    // r=0.8: Ø1.6 fica abaixo do SPACING (1.7) — rolos adjacentes não se intersectam
    const geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 48);
    geometry.rotateX(Math.PI / 2);
    return { geometry, faceW: 1.6, faceH: 1.6, coverIndex: 1, height: 1.6 };
  }
  const dims: Record<'vhs' | 'dvd' | 'bluray', { box: [number, number, number]; faceW: number; faceH: number; height: number }> = {
    vhs: { box: [1.87, 1.03, 0.25], faceW: 1.87, faceH: 1.03, height: 1.03 },
    dvd: { box: [1.35, 1.9, 0.14], faceW: 1.35, faceH: 1.9, height: 1.9 },
    bluray: { box: [1.35, 1.72, 0.12], faceW: 1.35, faceH: 1.72, height: 1.72 },
  };
  const d = dims[format];
  return {
    geometry: new THREE.BoxGeometry(d.box[0], d.box[1], d.box[2]),
    faceW: d.faceW,
    faceH: d.faceH,
    coverIndex: 4,
    height: d.height,
  };
}

function meshFor(item: CatalogItem, format: EraFormat, x: number): THREE.Mesh {
  const { geometry, faceW, faceH, coverIndex, height } = geometryFor(format);
  const materials = new Array<THREE.Material>(geometry.groups.length).fill(DARK);
  const cover = coverMaterial(item.poster, faceW, faceH);
  materials[coverIndex] = cover;
  const mesh = new THREE.Mesh(geometry, materials);
  mesh.position.set(x, height / 2, 0);
  mesh.userData.item = item;
  mesh.userData.format = format;
  mesh.userData.coverMaterial = cover;
  mesh.userData.height = height;
  return mesh;
}

function rebuildMesh(mesh: THREE.Mesh, item: CatalogItem, format: EraFormat, x: number) {
  mesh.geometry.dispose();
  (mesh.userData.coverMaterial as THREE.Material | undefined)?.dispose();
  const { geometry, faceW, faceH, coverIndex, height } = geometryFor(format);
  const materials = new Array<THREE.Material>(geometry.groups.length).fill(DARK);
  const cover = coverMaterial(item.poster, faceW, faceH);
  materials[coverIndex] = cover;
  mesh.geometry = geometry;
  mesh.material = materials;
  mesh.userData.format = format;
  mesh.userData.coverMaterial = cover;
  mesh.userData.height = height;
  mesh.position.x = x;
  mesh.position.y = height / 2;
}

export function buildShelf(items: CatalogItem[], mode: 'release' | 'story' = 'release', accentHex?: string): THREE.Group {
  const shelf = new THREE.Group();
  const n = items.length;
  const x0 = -((n - 1) * SPACING) / 2;

  items.forEach((item, i) => {
    const mesh = meshFor(item, formatFor(effectiveYear(item, mode)), x0 + i * SPACING);
    mesh.userData.slot = i;
    shelf.add(mesh);
  });

  const boardMat = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.95 });
  const base = new THREE.Color(0x141210);
  const c = new THREE.Color(accentHex ?? '#d8a24a');
  boardMat.color = base.lerp(c, 0.25);
  const board = new THREE.Mesh(new THREE.BoxGeometry((n - 1) * SPACING + 2, 0.15, 1.2), boardMat);
  board.position.set(0, -0.075, 0);
  shelf.add(board);

  shelf.userData.mode = mode;

  // ponytail: 1 Mesh por item (~60 draw calls nesta estante); o contrato docs/05 prevê InstancedMesh + atlas quando entrarem as 12 estantes.
  return shelf;
}

export function applyOrder(
  group: THREE.Group,
  items: CatalogItem[],
  mode: 'release' | 'story',
  animate: boolean
): void {
  const n = items.length;
  const x0 = -((n - 1) * SPACING) / 2;
  const byId = new Map<string, THREE.Mesh>();
  for (const child of group.children) {
    const item = child.userData.item as CatalogItem | undefined;
    if (item) byId.set(item.id, child as THREE.Mesh);
  }

  items.forEach((item, i) => {
    const mesh = byId.get(item.id);
    if (!mesh) return;
    mesh.userData.slot = i;
    const x = x0 + i * SPACING;
    const format = formatFor(effectiveYear(item, mode));
    if (!animate) {
      if (format !== mesh.userData.format) rebuildMesh(mesh, item, format, x);
      else mesh.position.x = x;
      return;
    }
    if (format !== mesh.userData.format) {
      gsap.to(mesh.scale, {
        x: 0, y: 0, z: 0,
        duration: 0.25,
        ease: 'power2.in',
        delay: i * 0.01,
        onComplete: () => {
          rebuildMesh(mesh, item, format, x);
          gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: 'power3.out' });
        },
      });
    } else {
      gsap.to(mesh.position, { x, duration: 0.5, ease: 'power3.inOut', delay: i * 0.01 });
    }
  });

  group.userData.mode = mode;
}

export function applyFocus(group: THREE.Group, focus: number, heroIdx: number, reduced: boolean): THREE.Mesh | null {
  const meshes = group.children
    .filter((c) => c.userData.slot !== undefined)
    .sort((a, b) => (a.userData.slot as number) - (b.userData.slot as number));
  meshes.forEach((m, i) => {
    if (i === heroIdx || reduced) return; // o palco é do hero
    const e = Math.max(0, 1 - Math.abs(i - focus) / 1.5);
    m.position.z = e * 0.25;
    m.rotation.x = -e * 0.05;
  });
  return (meshes[heroIdx] as THREE.Mesh | undefined) ?? null;
}

// --- hero: sai da prateleira e levita ---
const STAGE_Z = 1.0;
const STAGE_LIFT = 0.2;

export function killBob(mesh: THREE.Mesh): void {
  (mesh.userData.bob as gsap.core.Tween | undefined)?.kill();
  mesh.userData.bob = undefined;
}

export function poseHero(mesh: THREE.Mesh, animate: boolean): void {
  killBob(mesh);
  gsap.killTweensOf(mesh.position);
  gsap.killTweensOf(mesh.rotation);
  const stageY = (mesh.userData.height as number) / 2 + STAGE_LIFT;
  mesh.userData.stageY = stageY;
  const startBob = () => {
    mesh.userData.bob = gsap.to(mesh.position, {
      y: stageY + 0.06, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1,
    });
  };
  if (!animate) {
    mesh.position.y = stageY;
    mesh.position.z = STAGE_Z;
    mesh.rotation.set(0, 0, 0);
    return; // sem bob: reduced-motion = pose estática
  }
  gsap.to(mesh.position, { y: stageY, z: STAGE_Z, duration: 0.5, ease: 'power3.out', onComplete: startBob });
  gsap.to(mesh.rotation, { x: 0, duration: 0.5, ease: 'power3.out' });
}

export function unposeHero(mesh: THREE.Mesh, animate: boolean): void {
  killBob(mesh);
  gsap.killTweensOf(mesh.position);
  gsap.killTweensOf(mesh.rotation);
  const y = (mesh.userData.height as number) / 2;
  if (!animate) {
    mesh.position.y = y;
    mesh.position.z = 0;
    mesh.rotation.set(0, 0, 0);
    return;
  }
  gsap.to(mesh.position, { y, z: 0, duration: 0.5, ease: 'power3.inOut' });
  gsap.to(mesh.rotation, { x: 0, y: 0, z: 0, duration: 0.5, ease: 'power3.inOut' });
}