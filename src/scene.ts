import * as THREE from 'three';

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

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0c0a);
  scene.fog = new THREE.Fog(0x0e0c0a, 6, 30);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  const key = new THREE.DirectionalLight(0xffd9a0, 1.2);
  key.position.set(0, 4, 4);
  const rim = new THREE.DirectionalLight(0x7a8cff, 0.25);
  rim.color = new THREE.Color(accentHex ?? '#d8a24a');
  rim.position.set(0, 2, -4);
  scene.add(ambient, key, rim);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, rim };
}