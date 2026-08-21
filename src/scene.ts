import * as THREE from 'three';
import { buildRoom } from './room';

export function setupScene(accentHex?: string): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  rim: THREE.DirectionalLight;
} {
  const canvas = document.getElementById('scene') as HTMLCanvasElement;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0c0a);
  scene.fog = new THREE.Fog(0x0e0c0a, 8, 28);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);

  const ambient = new THREE.AmbientLight(0xffffff, 0.32);
  const key = new THREE.DirectionalLight(0xffd9a0, 1.15);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 30;
  key.shadow.camera.left = -20; key.shadow.camera.right = 20;
  key.shadow.camera.top = 8; key.shadow.camera.bottom = -4;
  key.shadow.bias = -0.0005;
  const rim = new THREE.DirectionalLight(0x7a8cff, 0.25);
  rim.color = new THREE.Color(accentHex ?? '#d8a24a');
  rim.position.set(0, 2, -4);
  scene.add(ambient, key, rim);

  buildRoom(scene);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, rim };
}