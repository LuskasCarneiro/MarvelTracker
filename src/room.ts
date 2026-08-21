import * as THREE from 'three';

// ponytail: sala TVA — arquivo quente com madeira e betão, 5 meshes, 0 texturas
export function buildRoom(scene: THREE.Scene): void {
  // chão — tábuas largas de carvalho escuro, recebe sombra (120 cobre a maior estante: MCU 57×1.7≈97)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 30),
    new THREE.MeshStandardMaterial({ color: 0x1e1a16, roughness: 0.85, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.075 - 0.075; // abaixo da prateleira (board a -0.075, 0.15 espessura)
  floor.receiveShadow = true;
  scene.add(floor);

  // parede de fundo — betão quente com painéis verticais subtis
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.92, metalness: 0.02 })
  );
  backWall.position.set(0, 5.5, -2.2);
  scene.add(backWall);

  // sancas de luz quente no encontro parede/chão e parede/teto
  const stripGeo = new THREE.PlaneGeometry(120, 0.06);
  const stripMat = new THREE.MeshBasicMaterial({ color: 0x3d2e1e });
  const bottomStrip = new THREE.Mesh(stripGeo, stripMat);
  bottomStrip.position.set(0, 0.02, -2.18);
  scene.add(bottomStrip);
  const topStrip = new THREE.Mesh(stripGeo, stripMat);
  topStrip.position.set(0, 11.4, -2.18);
  scene.add(topStrip);

  // paredes laterais — fecham o volume sem roubar foco da estante
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x231e1a, roughness: 0.9 });
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), sideMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-60, 5.5, 13);
  scene.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), sideMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(60, 5.5, 13);
  scene.add(rightWall);

  // teto — fecha a sala, evita céu infinito no reflexo
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 30),
    new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 12;
  scene.add(ceiling);

  // luz de teto quente por cima da estante — simula calha TVA
  const topLight = new THREE.PointLight(0xffc07a, 18, 20, 1.6);
  topLight.position.set(0, 10, 0);
  scene.add(topLight);

  // luz de preenchimento fria lateral — separa a sala do fundo
  const fill = new THREE.PointLight(0x8aa0ff, 6, 30, 2);
  fill.position.set(-12, 4, 6);
  scene.add(fill);
}
