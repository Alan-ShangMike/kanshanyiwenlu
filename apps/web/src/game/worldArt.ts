import * as THREE from "three";
import { cellKey, cellsOnLine, FLOOR_LIFT, GRID_X, GRID_Z, isRimCell, owningPlatform, type PlatformSpec } from "./islandLayout";
import { glyphTexture, inlayTexture, isoBlock, localIsoMesh, localOffset, paintTexture, plasterFloorTexture, platformPrism, prismMesh } from "./worldGeom";

type Mat = THREE.MeshStandardMaterial;

export function makeStandard(color: number, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.04,
    flatShading: true,
    ...options
  });
}

const PATH_STONE_HALF = 0.2;
const PATH_LIP_HALF = 0.24;
const PATH_GOLD_HALF = 0.07;
const PATH_LIFT = FLOOR_LIFT + 0.018;

type PathStamp = {
  edges: Set<string>;
  pads: Set<string>;
};

function createPathStamp(): PathStamp {
  return { edges: new Set(), pads: new Set() };
}

function colorHex(value: number) {
  return `#${value.toString(16).padStart(6, "0")}`;
}

function gridPoint(gx: number, gy: number) {
  return { x: (gx - gy) * GRID_X, z: (gx + gy) * GRID_Z };
}

function addMesa(root: THREE.Object3D, x: number, z: number, y: number, size: number, height: number, body: THREE.Material, cap: THREE.Material) {
  const layers: Array<[number, number]> = [
    [size, height * 0.55],
    [size * 0.72, height * 0.28],
    [size * 0.48, height * 0.17]
  ];
  let top = y;
  layers.forEach(([width, layerHeight], index) => {
    const mesh = localIsoMesh(width, width * 0.72, top + layerHeight, layerHeight, index === layers.length - 1 ? cap : body);
    mesh.position.set(x, 0, z);
    root.add(mesh);
    top += layerHeight;
  });
}

export function addDesertAndLagoon(root: THREE.Object3D) {
  const sandTex = paintTexture("#e4cba8", "#c9ad86", "#f6e6cc", "floor");
  const sand = new THREE.Mesh(
    new THREE.CircleGeometry(58, 64),
    makeStandard(0xe4cba8, { roughness: 0.97, map: sandTex, flatShading: false })
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(4, -1.78, 28);
  sand.receiveShadow = true;
  const band = new THREE.Mesh(
    new THREE.RingGeometry(22, 28, 48),
    makeStandard(0xd9b78e, { roughness: 0.98, flatShading: false })
  );
  band.rotation.x = -Math.PI / 2;
  band.position.set(6, -1.74, 30);
  const waterTex = paintTexture("#5f9a90", "#2f5f5e", "#c5ebe0", "water");
  const pool = prismMesh(-1.2, 26.4, 1.35, 29.1, -0.42, 0.22, makeStandard(0x4f8f8c, {
    roughness: 0.12,
    metalness: 0.18,
    transparent: true,
    opacity: 0.92,
    map: waterTex,
    flatShading: false
  }));
  const rim = prismMesh(-1.45, 26.2, 1.55, 29.3, -0.28, 0.16, makeStandard(0xcbb089, { roughness: 0.84 }));
  const sheen = prismMesh(-0.55, 27.1, 0.7, 28.4, -0.38, 0.04, makeStandard(0xb7e0d6, {
    roughness: 0.08,
    metalness: 0.22,
    transparent: true,
    opacity: 0.32,
    flatShading: false
  }));
  root.add(sand, band, rim, pool, sheen);
}

export function addDistantMesas(root: THREE.Object3D) {
  const stone = makeStandard(0xd7b08a, { roughness: 0.92 });
  const cool = makeStandard(0x8aa79a, { roughness: 0.92 });
  const cap = makeStandard(0xf2ddc0, { roughness: 0.84 });
  addMesa(root, -42, -6, 0.05, 2.6, 3.6, stone, cap);
  addMesa(root, 52, 10, 0.1, 2.0, 2.9, cool, cap);
  addMesa(root, 10, 62, -0.08, 1.9, 2.4, stone, cap);
  addMesa(root, -28, 58, 0.08, 2.2, 2.8, cool, cap);
  addMesa(root, 40, 52, 0.28, 1.6, 2.1, stone, cap);
  addMesa(root, -48, 24, 0.12, 1.5, 2.0, cool, cap);
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(5.2, 20),
    new THREE.MeshBasicMaterial({ color: 0xf8d7a0, transparent: true, opacity: 0.94, fog: false, depthWrite: false })
  );
  sun.position.set(-30, 21, -12);
  sun.lookAt(0, 8, 28);
  root.add(sun);
}

export function addIsoTree(root: THREE.Object3D, gx: number, gy: number, surfaceY: number, scale: number, leaf: number) {
  const origin = gridPoint(gx, gy);
  const trunk = isoBlock(gx, gy, 0.04 * scale, 0.04 * scale, surfaceY + 0.62 * scale, 0.62 * scale, makeStandard(0xf4eee2, { roughness: 0.9 }));
  root.add(trunk);
  const foliage = makeStandard(leaf, { roughness: 0.9 });
  for (let layer = 0; layer < 4; layer += 1) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry((0.42 - layer * 0.07) * scale, 0.5 * scale, 6),
      foliage
    );
    cone.position.set(origin.x, surfaceY + 0.78 * scale + layer * 0.32 * scale, origin.z);
    cone.castShadow = true;
    cone.receiveShadow = true;
    root.add(cone);
  }
}

function pathMaterials() {
  const stone = makeStandard(0xc08a52, {
    roughness: 0.84,
    map: paintTexture("#c08a52", "#8d5530", "#e2c08a", "floor")
  });
  const lip = makeStandard(0x8d5532, { roughness: 0.74 });
  const gold = makeStandard(0xd4a85a, {
    roughness: 0.48,
    metalness: 0.08,
    emissive: 0x8d5532,
    emissiveIntensity: 0.04,
    map: inlayTexture("#d4a85a", "#e8c9a0")
  });
  return { stone, lip, gold };
}

export function addStairBridge(
  root: THREE.Object3D,
  walkMeshes: THREE.Object3D[],
  a: [number, number],
  b: [number, number],
  heightAt: (x: number, y: number) => number,
  main: boolean
) {
  const { stone, gold, lip } = pathMaterials();
  const railMat = makeStandard(0x8d5a38, { roughness: 0.68 });
  const pierMat = makeStandard(0x8e5340, { roughness: 0.82 });
  const lift = PATH_LIFT;
  const startY = heightAt(a[0], a[1]) + lift;
  const endY = heightAt(b[0], b[1]) + lift;
  const start = gridPoint(a[0], a[1]);
  const end = gridPoint(b[0], b[1]);
  const from = new THREE.Vector3(start.x, startY, start.z);
  const to = new THREE.Vector3(end.x, endY, end.z);
  const along = to.clone().sub(from);
  const span = Math.max(along.length(), 0.001);
  const dir = along.clone().normalize();
  const slopeQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  const flatDir = new THREE.Vector3(dir.x, 0, dir.z);
  if (flatDir.lengthSq() < 0.0001) flatDir.set(0, 0, 1);
  else flatDir.normalize();
  const side = new THREE.Vector3().crossVectors(flatDir, new THREE.Vector3(0, 1, 0));
  if (side.lengthSq() < 0.0001) side.set(1, 0, 0);
  else side.normalize();
  const width = main ? 1.26 : 0.7;
  const mid = from.clone().lerp(to, 0.5);

  const addLanding = (gx: number, gy: number, top: number) => {
    const pad = isoBlock(gx, gy, width * 0.46, width * 0.46, top, 0.05, stone);
    pad.userData.walkable = true;
    walkMeshes.push(pad);
    root.add(pad);
    root.add(isoBlock(gx, gy, 0.16, 0.16, top + 0.014, 0.016, gold));
  };

  addLanding(a[0], a[1], startY);
  addLanding(b[0], b[1], endY);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, span + 0.18), stone);
  deck.position.copy(mid);
  deck.quaternion.copy(slopeQuat);
  deck.castShadow = true;
  deck.receiveShadow = true;
  deck.userData.walkable = true;
  walkMeshes.push(deck);
  root.add(deck);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(main ? 0.42 : 0.18, 0.028, span + 0.16), gold);
  stripe.position.copy(mid);
  stripe.position.y += 0.058;
  stripe.quaternion.copy(slopeQuat);
  stripe.receiveShadow = true;
  root.add(stripe);
  const bondCount = Math.max(2, Math.round(span / 0.72));
  for (let index = 1; index < bondCount; index += 1) {
    const t = index / bondCount;
    const p = from.clone().lerp(to, t);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(main ? 0.07 : 0.05, 10, 8), gold);
    bead.position.copy(p);
    bead.position.y += 0.09;
    root.add(bead);
  }

  const lipL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, span + 0.12), lip);
  const lipR = lipL.clone();
  lipL.position.copy(mid).addScaledVector(side, width * 0.5);
  lipR.position.copy(mid).addScaledVector(side, -width * 0.5);
  lipL.quaternion.copy(slopeQuat);
  lipR.quaternion.copy(slopeQuat);
  root.add(lipL, lipR);

  const pierCount = Math.max(1, Math.round(span / 1.35));
  for (let index = 1; index <= pierCount; index += 1) {
    const t = index / (pierCount + 1);
    const gx = Math.round(a[0] + (b[0] - a[0]) * t);
    const gy = Math.round(a[1] + (b[1] - a[1]) * t);
    if (owningPlatform(gx, gy)) continue;
    const p = from.clone().lerp(to, t);
    const pierH = Math.max(0.48, p.y - 0.16);
    const pier = new THREE.Mesh(new THREE.BoxGeometry(main ? 0.2 : 0.14, pierH, main ? 0.2 : 0.14), pierMat);
    pier.position.set(p.x, p.y - pierH * 0.5 - 0.02, p.z);
    pier.castShadow = true;
    pier.receiveShadow = true;
    root.add(pier);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(main ? 0.26 : 0.18, 0.05, main ? 0.26 : 0.18), lip);
    cap.position.set(p.x, p.y - 0.04, p.z);
    root.add(cap);
  }

  for (const sign of [-1, 1] as const) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, span + 0.08), railMat);
    rail.position.copy(mid).addScaledVector(side, sign * width * 0.46);
    rail.position.y += 0.22;
    rail.quaternion.copy(slopeQuat);
    root.add(rail);
    const postCount = Math.max(2, Math.round(span / 0.62));
    for (let index = 0; index <= postCount; index += 1) {
      const t = index / postCount;
      const p = from.clone().lerp(to, t);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.04), railMat);
      post.position.copy(p).addScaledVector(side, sign * width * 0.46);
      post.position.y += 0.12;
      post.castShadow = true;
      root.add(post);
    }
  }
}

export function addIsoDoorway(_root: THREE.Object3D, _gx: number, _gy: number, _surfaceY: number, _alongX: boolean, _material: Mat, _opened = true) {
  // Door frames are generated from platform door cells so posts stay off the walkable tile.
}

export function addFloorMosaic(root: THREE.Object3D, platform: PlatformSpec) {
  const floor = makeStandard(platform.floor, {
    roughness: 0.9,
    map: plasterFloorTexture(colorHex(platform.floor), colorHex(platform.accent), colorHex(platform.lip))
  });
  root.add(platformPrism(platform, platform.surface + 0.062, 0.016, floor, 0.045));
}

const PLATFORM_PATHS: Record<string, Array<Array<[number, number]>>> = {
  periodic: [
    [[17, 24], [20, 24], [20, 21], [23, 21]],
    [[20, 21], [18, 21], [18, 20]]
  ],
  electron: [
    [[24, 20], [27, 20], [27, 18], [30, 18]],
    [[27, 20], [28, 20], [28, 22]]
  ],
  family: [
    [[32, 17], [35, 17], [35, 15]],
    [[35, 17], [35, 20]]
  ],
  bond: [
    [[36, 13], [36, 11], [40, 11], [40, 9]]
  ],
  isotope: [
    [[40, 7], [40, 5], [41, 5], [41, 4]]
  ],
  neon: [
    [[17, 15], [16, 15], [16, 14]]
  ],
  noble: [
    [[28, 24], [28, 25]]
  ],
  water: [
    [[35, 21], [35, 22]]
  ]
};

function registerWalk(mesh: THREE.Mesh, walkMeshes?: THREE.Object3D[]) {
  mesh.userData.walkable = true;
  walkMeshes?.push(mesh);
  return mesh;
}

function pathEdgeKey(x0: number, y0: number, x1: number, y1: number) {
  const a = `${x0},${y0}`;
  const b = `${x1},${y1}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function stampBondPad(
  root: THREE.Object3D,
  surface: number,
  x: number,
  y: number,
  walkMeshes: THREE.Object3D[] | undefined,
  stamp: PathStamp,
  materials: ReturnType<typeof pathMaterials>
) {
  const key = `${x},${y}`;
  if (stamp.pads.has(key)) return;
  stamp.pads.add(key);
  const { stone, lip, gold } = materials;
  const stoneTop = surface + PATH_LIFT;
  const goldTop = surface + PATH_LIFT + 0.012;
  root.add(isoBlock(x, y, PATH_LIP_HALF + 0.04, PATH_LIP_HALF + 0.04, stoneTop - 0.004, 0.014, lip));
  root.add(registerWalk(isoBlock(x, y, PATH_STONE_HALF + 0.04, PATH_STONE_HALF + 0.04, stoneTop, 0.02, stone), walkMeshes));
  root.add(isoBlock(x, y, PATH_GOLD_HALF + 0.02, PATH_GOLD_HALF + 0.02, goldTop, 0.01, gold));
}

function stampBondSpan(
  root: THREE.Object3D,
  surface: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  walkMeshes: THREE.Object3D[] | undefined,
  stamp: PathStamp,
  materials: ReturnType<typeof pathMaterials>
): boolean {
  if (x0 === x1 && y0 === y1) return false;
  const alongX = y0 === y1 && x0 !== x1;
  const alongY = x0 === x1 && y0 !== y1;
  if (!alongX && !alongY) {
    const line = cellsOnLine(x0, y0, x1, y1);
    if (line.length <= 2) return false;
    let connected = false;
    for (let index = 0; index < line.length - 1; index += 1) {
      const from = line[index]!;
      const to = line[index + 1]!;
      connected = stampBondSpan(root, surface, from[0], from[1], to[0], to[1], walkMeshes, stamp, materials) || connected;
    }
    return connected;
  }
  const key = pathEdgeKey(x0, y0, x1, y1);
  if (stamp.edges.has(key)) return true;
  stamp.edges.add(key);
  const { stone, lip, gold } = materials;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const stoneTop = surface + PATH_LIFT;
  const goldTop = surface + PATH_LIFT + 0.012;
  const spanX = alongX ? Math.abs(x1 - x0) / 2 + PATH_STONE_HALF : PATH_STONE_HALF;
  const spanY = alongY ? Math.abs(y1 - y0) / 2 + PATH_STONE_HALF : PATH_STONE_HALF;
  const lipX = alongX ? spanX + 0.018 : PATH_LIP_HALF;
  const lipY = alongY ? spanY + 0.018 : PATH_LIP_HALF;
  const goldX = alongX ? Math.abs(x1 - x0) / 2 + PATH_GOLD_HALF : PATH_GOLD_HALF;
  const goldY = alongY ? Math.abs(y1 - y0) / 2 + PATH_GOLD_HALF : PATH_GOLD_HALF;
  root.add(isoBlock(mx, my, lipX, lipY, stoneTop - 0.004, 0.014, lip));
  root.add(registerWalk(isoBlock(mx, my, spanX, spanY, stoneTop, 0.02, stone), walkMeshes));
  root.add(isoBlock(mx, my, goldX, goldY, goldTop, 0.01, gold));
  return true;
}

function addBondPath(
  root: THREE.Object3D,
  surface: number,
  cells: Array<[number, number]>,
  walkMeshes?: THREE.Object3D[],
  stamp: PathStamp = createPathStamp()
) {
  const materials = pathMaterials();
  cells.forEach((cell, index) => {
    const next = cells[index + 1];
    if (next) stampBondSpan(root, surface, cell[0], cell[1], next[0], next[1], walkMeshes, stamp, materials);
  });
  cells.forEach(([x, y]) => {
    stampBondPad(root, surface, x, y, walkMeshes, stamp, materials);
  });
}

function addBondRuns(
  root: THREE.Object3D,
  surface: number,
  runs: Array<Array<[number, number]>>,
  walkMeshes?: THREE.Object3D[],
  stamp: PathStamp = createPathStamp()
) {
  runs.forEach((run) => addBondPath(root, surface, run, walkMeshes, stamp));
}

function addDoorRunners(
  root: THREE.Object3D,
  platform: PlatformSpec,
  doors: Set<string>,
  walkMeshes?: THREE.Object3D[],
  stamp: PathStamp = createPathStamp()
) {
  const found: Array<[number, number]> = [];
  for (let x = platform.x0; x <= platform.x1; x += 1) {
    for (let y = platform.y0; y <= platform.y1; y += 1) {
      if (!doors.has(cellKey(x, y)) || !isRimCell(platform, x, y)) continue;
      found.push([x, y]);
    }
  }
  if (!found.length) return;
  const materials = pathMaterials();
  found.forEach(([x, y]) => stampBondPad(root, platform.surface, x, y, walkMeshes, stamp, materials));
}

export const QUAY_NICHE_NESTLE = 0.22;
export const QUAY_COURTYARD_NESTLE = 0.34;
export const QUAY_LIU_NESTLE = 0.88;
export const QUAY_GATE_UP_NESTLE = 1.28;
export const QUAY_GATE_LEFT_NESTLE = 2.42;
export const QUAY_FORUM_LEFT_NESTLE = 0.9;

function addGlyphPlate(root: THREE.Object3D, x: number, y: number, surface: number, letter: string, color: number, caption = "") {
  const plate = prismMesh(x - 0.18, y - 0.03, x + 0.18, y + 0.04, surface + 1.08, 0.34, makeStandard(0x3f241f, { roughness: 0.84 }));
  const inlay = prismMesh(x - 0.14, y - 0.012, x + 0.14, y + 0.05, surface + 1.06, 0.28, makeStandard(color, {
    emissive: color,
    emissiveIntensity: 0.2,
    roughness: 0.4
  }));
  const origin = gridPoint(x, y + 0.05);
  const toward = gridPoint(x, y + 1);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.24),
    new THREE.MeshBasicMaterial({
      map: glyphTexture(letter, `#${color.toString(16).padStart(6, "0")}`, caption),
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  mesh.position.set(origin.x, surface + 0.9, origin.z);
  mesh.lookAt(toward.x, surface + 0.9, toward.z);
  mesh.renderOrder = 4;
  root.add(plate, inlay, mesh);
}

function addDoorThresholds(root: THREE.Object3D, platform: PlatformSpec, doors: Set<string>) {
  const { gold, lip } = pathMaterials();
  for (let x = platform.x0; x <= platform.x1; x += 1) {
    for (let y = platform.y0; y <= platform.y1; y += 1) {
      if (!isRimCell(platform, x, y) || !doors.has(cellKey(x, y))) continue;
      root.add(isoBlock(x, y, 0.26, 0.26, platform.surface + PATH_LIFT, 0.02, lip));
      root.add(isoBlock(x, y, 0.1, 0.1, platform.surface + PATH_LIFT + 0.01, 0.012, gold));
    }
  }
}

function addBackPalace(root: THREE.Object3D, platform: PlatformSpec, niches: Array<{ x: number; letter: string; color: number; caption: string; shells: number }>) {
  const y = platform.y0;
  const face = y + 0.04;
  const back = y - 1.08;
  const rear = 0.26;
  const wellBack = back + rear;
  const x0 = 2.00;
  const x1 = 15.78;
  const wallH = 1.52;
  const lintelH = 0.34;
  const openingH = wallH - lintelH;
  const top = platform.surface + wallH;
  const openingHalf = 0.42;
  const jambW = 0.11;
  const wall = makeStandard(platform.wall, { roughness: 0.82, map: paintTexture("#b56b4e", "#8e5340", "#f3ddc0", "plaster") });
  const lip = makeStandard(platform.lip, { roughness: 0.6 });
  const cream = makeStandard(platform.floor, { roughness: 0.68 });
  const deep = makeStandard(0x3a221e, { roughness: 0.94 });

  root.add(prismMesh(x0, back, x1, wellBack, top, wallH, wall));
  root.add(prismMesh(x0 - 0.04, back - 0.04, x1 + 0.04, wellBack + 0.02, top + 0.09, 0.09, lip));

  const sorted = [...niches].sort((a, b) => a.x - b.x);
  let cursor = x0;
  sorted.forEach((niche) => {
    const open0 = niche.x - openingHalf;
    const open1 = niche.x + openingHalf;
    if (open0 - jambW - cursor > 0.08) {
      root.add(prismMesh(cursor, wellBack, open0 - jambW, face, top, wallH, wall));
      root.add(prismMesh(cursor, wellBack, open0 - jambW, face, top + 0.09, 0.09, lip));
    }
    cursor = open1 + jambW;
  });
  if (x1 - cursor > 0.08) {
    root.add(prismMesh(cursor, wellBack, x1, face, top, wallH, wall));
    root.add(prismMesh(cursor, wellBack, x1, face, top + 0.09, 0.09, lip));
  }

  sorted.forEach((niche) => {
    const open0 = niche.x - openingHalf;
    const open1 = niche.x + openingHalf;
    root.add(prismMesh(open0 - jambW, wellBack, open0, face, platform.surface + openingH, openingH, cream));
    root.add(prismMesh(open1, wellBack, open1 + jambW, face, platform.surface + openingH, openingH, cream));
    root.add(prismMesh(open0 - jambW, face - 0.12, open1 + jambW, face, top, lintelH, wall));
    root.add(prismMesh(open0 - jambW, face - 0.12, open1 + jambW, face, top + 0.07, 0.07, lip));
    root.add(prismMesh(open0 + 0.03, wellBack - 0.02, open1 - 0.03, wellBack + 0.16, platform.surface + openingH, openingH, deep));
    root.add(prismMesh(open0 + 0.04, wellBack, open1 - 0.04, face - 0.04, platform.surface + 0.07, 0.07, cream));
    addGlyphPlate(root, niche.x, wellBack + 0.06, platform.surface, niche.letter, niche.color, niche.caption);
  });
}

function addFrontParapet(root: THREE.Object3D, platform: PlatformSpec, doors: Set<string>, height = 0.22) {
  const y = platform.y1;
  const wall = makeStandard(platform.wall, { roughness: 0.8 });
  const lip = makeStandard(platform.lip, { roughness: 0.62 });
  const cells: number[] = [];
  const flush = () => {
    if (!cells.length) return;
    const lipH = Math.min(0.08, height * 0.45);
    root.add(prismMesh(cells[0]! - 0.06, y + 0.08, cells.at(-1)! + 0.06, y + 0.46, platform.surface + height, height, wall));
    root.add(prismMesh(cells[0]! - 0.06, y + 0.12, cells.at(-1)! + 0.06, y + 0.5, platform.surface + height + lipH, lipH, lip));
    cells.length = 0;
  };
  for (let x = platform.x0; x <= platform.x1; x += 1) {
    const isDoor = doors.has(cellKey(x, y));
    const besideDoor = doors.has(cellKey(x - 1, y)) || doors.has(cellKey(x + 1, y));
    if (isDoor || besideDoor) {
      flush();
      if (isDoor) root.add(prismMesh(x - 0.38, y - 0.08, x + 0.38, y + 0.12, platform.surface + 0.09, 0.03, lip));
      continue;
    }
    cells.push(x);
  }
  flush();
}

function addLowSideWall(root: THREE.Object3D, platform: PlatformSpec, edge: "x0" | "x1", doors: Set<string>, skipRange?: [number, number], height = 0.2) {
  const wall = makeStandard(platform.wall, { roughness: 0.8 });
  const lip = makeStandard(platform.lip, { roughness: 0.62 });
  const x = edge === "x0" ? platform.x0 : platform.x1;
  const outside = edge === "x0" ? -0.38 : 0.38;
  const inner = edge === "x0" ? -0.16 : 0.16;
  const xA = Math.min(x + inner, x + outside);
  const xB = Math.max(x + inner, x + outside);
  const cells: number[] = [];
  const openAt = (y: number) => (
    doors.has(cellKey(x, y))
    || Boolean(skipRange && y >= skipRange[0] && y <= skipRange[1])
  );
  const flush = () => {
    if (!cells.length) return;
    const lipH = Math.min(0.06, height * 0.4);
    root.add(prismMesh(xA, cells[0]! - 0.04, xB, cells.at(-1)! + 0.04, platform.surface + height, height, wall));
    root.add(prismMesh(xA, cells[0]!, xB, cells.at(-1)!, platform.surface + height + lipH, lipH, lip));
    cells.length = 0;
  };
  for (let y = platform.y0 + 1; y <= platform.y1 - 1; y += 1) {
    if (openAt(y)) {
      if (doors.has(cellKey(x, y))) {
        const slabA = Math.min(x + inner * 0.2, x + outside * 0.55);
        const slabB = Math.max(x + inner * 0.2, x + outside * 0.55);
        root.add(prismMesh(slabA, y - 0.42, slabB, y + 0.42, platform.surface + 0.09, 0.03, lip));
      }
      flush();
      continue;
    }
    cells.push(y);
  }
  flush();
}

function addLiuChapel(root: THREE.Object3D, platform: PlatformSpec) {
  const wall = makeStandard(platform.wall, { roughness: 0.8, map: paintTexture("#b56b4e", "#8e5340", "#f3ddc0", "plaster") });
  const lip = makeStandard(platform.lip, { roughness: 0.6 });
  const cream = makeStandard(platform.floor, { roughness: 0.66 });
  const deep = makeStandard(0x3a221e, { roughness: 0.94 });
  const cushion = makeStandard(0xc47b58, { roughness: 0.58 });
  const x = platform.x0;
  const face = 3.10;
  const back = x - 1.00;
  const rear = 0.24;
  const wellBack = back + rear;
  const y0 = platform.y0 + 0.04;
  const y1 = 25.62;
  const open0 = 24.64;
  const open1 = 25.36;
  const jambW = 0.10;
  const wallH = 1.52;
  const lintelH = 0.34;
  const openingH = wallH - lintelH;
  const top = platform.surface + wallH;
  root.add(prismMesh(back, y0, wellBack, y1, top, wallH, wall));
  root.add(prismMesh(back - 0.04, y0 - 0.02, wellBack + 0.02, y1 + 0.04, top + 0.09, 0.09, lip));
  root.add(prismMesh(wellBack, y0, face, open0 - jambW, top, wallH, wall));
  root.add(prismMesh(wellBack, y0, face, open0 - jambW, top + 0.09, 0.09, lip));
  root.add(prismMesh(wellBack, open1 + jambW, face, y1, top, wallH, wall));
  root.add(prismMesh(wellBack, open1 + jambW, face, y1, top + 0.09, 0.09, lip));
  root.add(prismMesh(wellBack, open0 - jambW, face, open0, platform.surface + openingH, openingH, cream));
  root.add(prismMesh(wellBack, open1, face, open1 + jambW, platform.surface + openingH, openingH, cream));
  root.add(prismMesh(face - 0.12, open0 - jambW, face, open1 + jambW, top, lintelH, wall));
  root.add(prismMesh(face - 0.12, open0 - jambW, face, open1 + jambW, top + 0.07, 0.07, lip));
  root.add(prismMesh(wellBack - 0.02, open0, wellBack + 0.16, open1, platform.surface + openingH, openingH, deep));
  root.add(prismMesh(wellBack, open0 + 0.04, face - 0.04, open1 - 0.04, platform.surface + 0.07, 0.07, cream));
  root.add(isoBlock(2.52, 25, 0.10, 0.08, platform.surface + 0.12, 0.08, cream));
  root.add(isoBlock(2.52, 25, 0.07, 0.06, platform.surface + 0.18, 0.06, cushion));
}

function addEastGatehouse(root: THREE.Object3D, platform: PlatformSpec) {
  const wall = makeStandard(platform.wall, { roughness: 0.76 });
  const cream = makeStandard(platform.floor, { roughness: 0.64 });
  const pierX = platform.x1 + 0.10;
  const pierY = 27;
  const pierH = 1.28;
  root.add(isoBlock(pierX, pierY, 0.06, 0.08, platform.surface + pierH, pierH, wall));
  root.add(isoBlock(pierX, pierY, 0.08, 0.10, platform.surface + pierH + 0.07, 0.07, cream));
  const origin = gridPoint(pierX, pierY);
  const crest = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.01, 8, 16),
    makeStandard(0x75c5d4, { emissive: 0x75c5d4, emissiveIntensity: 0.18, roughness: 0.32 })
  );
  crest.position.set(origin.x, platform.surface + pierH + 0.18, origin.z);
  crest.rotation.x = Math.PI / 2.2;
  crest.userData.spin = true;
  root.add(crest);
}

function addWallPlanter(root: THREE.Object3D, gx: number, gy: number, surface: number, leaf: number) {
  const pot = makeStandard(0x8a5340, { roughness: 0.74 });
  const foliage = makeStandard(leaf, { roughness: 0.88 });
  root.add(isoBlock(gx, gy, 0.18, 0.14, surface + 0.2, 0.2, pot));
  const origin = gridPoint(gx, gy);
  const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), foliage);
  crown.position.set(origin.x, surface + 0.42, origin.z);
  crown.castShadow = true;
  root.add(crown);
}

function addPassagePiers(root: THREE.Object3D, platform: PlatformSpec, gx: number, yA: number, yB: number, outward: 1 | -1) {
  const wall = makeStandard(platform.wall, { roughness: 0.76 });
  const cream = makeStandard(platform.floor, { roughness: 0.64 });
  const pierX = gx + outward * 0.12;
  const pierH = 1.28;
  const halfX = 0.06;
  const halfY = 0.08;
  root.add(isoBlock(pierX, yA, halfX, halfY, platform.surface + pierH, pierH, wall));
  root.add(isoBlock(pierX, yB, halfX, halfY, platform.surface + pierH, pierH, wall));
  root.add(isoBlock(pierX, yA, halfX + 0.02, halfY + 0.02, platform.surface + pierH + 0.07, 0.07, cream));
  root.add(isoBlock(pierX, yB, halfX + 0.02, halfY + 0.02, platform.surface + pierH + 0.07, 0.07, cream));
}

function edgeFacesPlatform(platform: PlatformSpec, edge: "x0" | "x1", y: number) {
  const gx = edge === "x0" ? platform.x0 - 1 : platform.x1 + 1;
  const other = owningPlatform(gx, y);
  return Boolean(other && other.id !== platform.id);
}

function addEdgePassages(root: THREE.Object3D, platform: PlatformSpec, doors: Set<string>) {
  (["x0", "x1"] as const).forEach((edge) => {
    const gx = edge === "x0" ? platform.x0 : platform.x1;
    const ys: number[] = [];
    for (let y = platform.y0; y <= platform.y1; y += 1) {
      if (doors.has(cellKey(gx, y))) ys.push(y);
    }
    if (!ys.length) return;
    if (ys.some((y) => edgeFacesPlatform(platform, edge, y))) return;
    addPassagePiers(root, platform, gx, Math.min(...ys) - 0.22, Math.max(...ys) + 0.22, edge === "x0" ? -1 : 1);
  });
}

function dressQuay(root: THREE.Object3D, platform: PlatformSpec, doors: Set<string>, walkMeshes?: THREE.Object3D[]) {
  const stamp = createPathStamp();
  addBondRuns(root, platform.surface, [
    [[5, 28], [5, 25], [16, 25]],
    [[5, 25], [4, 25]],
    [[8, 25], [8, 24]],
    [[11, 25], [11, 24]],
    [[14, 25], [14, 24]]
  ], walkMeshes, stamp);
  addDoorThresholds(root, platform, doors);
}

function addSplitNorthWall(root: THREE.Object3D, platform: PlatformSpec, doors: Set<string>, height: number, depth: number) {
  const y = platform.y0;
  const wall = makeStandard(platform.wall, { roughness: 0.8 });
  const lip = makeStandard(platform.lip, { roughness: 0.6 });
  const cells: number[] = [];
  const flush = () => {
    if (cells.length < 1) return;
    const x0 = cells[0]! + 0.18;
    const x1 = cells.at(-1)! - 0.18;
    if (x1 - x0 < 0.55) {
      cells.length = 0;
      return;
    }
    root.add(prismMesh(x0, y - depth, x1, y - 0.04, platform.surface + height, height, wall));
    root.add(prismMesh(x0 + 0.12, y - depth * 0.72, x1 - 0.12, y - 0.1, platform.surface + height + 0.16, 0.16, lip));
    cells.length = 0;
  };
  for (let x = platform.x0 + 1; x <= platform.x1 - 1; x += 1) {
    if (doors.has(cellKey(x, y))) {
      flush();
      continue;
    }
    cells.push(x);
  }
  flush();
}

function addTerraceMonument(root: THREE.Object3D, platform: PlatformSpec, doors: Set<string>) {
  if (platform.id === "span") return;
  const y = platform.y0;
  const wall = makeStandard(platform.wall, { roughness: 0.8 });
  const lip = makeStandard(platform.lip, { roughness: 0.6 });
  const cream = makeStandard(platform.floor, { roughness: 0.68 });
  const accent = makeStandard(platform.accent, { roughness: 0.4, metalness: 0.14, emissive: platform.accent, emissiveIntensity: 0.12 });
  const midX = (platform.x0 + platform.x1) / 2;
  if (platform.id === "periodic") {
    for (let x = platform.x0 + 2; x <= platform.x1 - 1; x += 1.5) {
      if (doors.has(cellKey(Math.round(x), y))) continue;
      root.add(isoBlock(x, y - 0.1, 0.12, 0.1, platform.surface + 1.08, 1.08, wall));
      root.add(isoBlock(x, y - 0.1, 0.16, 0.14, platform.surface + 1.16, 0.1, cream));
    }
    addSplitNorthWall(root, platform, doors, 0.22, 0.16);
    return;
  }
  if (platform.id === "electron") {
    addSplitNorthWall(root, platform, doors, 1.18, 0.42);
    const origin = gridPoint(midX, y - 0.16);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.028, 8, 24), accent);
    ring.position.set(origin.x, platform.surface + 1.42, origin.z);
    ring.rotation.x = Math.PI / 2.4;
    ring.userData.spin = true;
    root.add(ring);
    return;
  }
  if (platform.id === "family") {
    for (const x of [platform.x0 + 1, midX]) {
      if (doors.has(cellKey(Math.round(x), y))) continue;
      root.add(prismMesh(x - 0.28, y - 0.18, x + 0.28, y - 0.02, platform.surface + 1.12, 1.12, wall));
      root.add(prismMesh(x - 0.32, y - 0.16, x + 0.32, y - 0.04, platform.surface + 1.24, 0.12, lip));
    }
    return;
  }
  if (platform.id === "bond") {
    const left = platform.x0 + 1.1;
    const right = platform.x1 - 2.4;
    root.add(isoBlock(left, y - 0.12, 0.14, 0.12, platform.surface + 1.18, 1.18, wall));
    root.add(isoBlock(right, y - 0.12, 0.14, 0.12, platform.surface + 1.18, 1.18, wall));
    root.add(prismMesh(left - 0.08, y - 0.2, right + 0.08, y - 0.04, platform.surface + 1.32, 0.12, accent));
    return;
  }
  if (platform.id === "isotope") {
    addSplitNorthWall(root, platform, doors, 1.08, 0.42);
    const origin = gridPoint(midX, y - 0.12);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.5),
      makeStandard(platform.accent, { transparent: true, opacity: 0.34, roughness: 0.28, emissive: platform.accent, emissiveIntensity: 0.1 })
    );
    dome.position.set(origin.x, platform.surface + 1.08, origin.z);
    root.add(dome);
    return;
  }
  addSplitNorthWall(root, platform, doors, 0.92, 0.28);
  if (platform.id === "water") {
    const origin = gridPoint(midX, y - 0.08);
    const molecule = new THREE.Group();
    molecule.position.set(origin.x, platform.surface + 1.18, origin.z);
    const oxygen = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), makeStandard(0x75c5d4, { emissive: 0x75c5d4, emissiveIntensity: 0.22 }));
    const hydrogenA = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0), makeStandard(0xe6bd55, { emissive: 0xe6bd55, emissiveIntensity: 0.18 }));
    const hydrogenB = hydrogenA.clone();
    hydrogenA.position.set(-0.16, 0.06, 0.03);
    hydrogenB.position.set(0.16, 0.06, 0.03);
    molecule.add(oxygen, hydrogenA, hydrogenB);
    root.add(molecule);
  }
}

export function addCourtyardPath(root: THREE.Object3D, cells: Array<[number, number]>, surfaceAt: (x: number, y: number) => number, walkMeshes?: THREE.Object3D[]) {
  if (!cells.length) return;
  addBondPath(root, surfaceAt(cells[0]![0], cells[0]![1]), cells, walkMeshes);
}

export function dressPlatform(
  root: THREE.Object3D,
  platform: PlatformSpec,
  doors: Set<string>,
  walkMeshes: THREE.Object3D[] = [],
  _extras: { nicheXs?: number[] } = {}
) {
  if (platform.id === "quay") {
    dressQuay(root, platform, doors, walkMeshes);
    return;
  }
  const stamp = createPathStamp();
  if (platform.id === "span") {
    addBondRuns(root, platform.surface, [
      [[18, 19], [18, 16]],
      [[17, 16], [17, 19]]
    ], walkMeshes, stamp);
    addDoorRunners(root, platform, doors, walkMeshes, stamp);
    addDoorThresholds(root, platform, doors);
    addFrontParapet(root, platform, doors, 0.16);
    return;
  }
  const path = PLATFORM_PATHS[platform.id];
  if (path) addBondRuns(root, platform.surface, path, walkMeshes, stamp);
  addDoorRunners(root, platform, doors, walkMeshes, stamp);
  addDoorThresholds(root, platform, doors);
  addTerraceMonument(root, platform, doors);
  addFrontParapet(root, platform, doors, 0.22);
  addLowSideWall(root, platform, "x0", doors);
  addLowSideWall(root, platform, "x1", doors);
  addEdgePassages(root, platform, doors);
}

export function addLiuAlcove(group: THREE.Group, surfaceLift = 0) {
  const cream = makeStandard(0xf3ddc0, { roughness: 0.62 });
  const cushion = makeStandard(0xc47b58, { roughness: 0.58 });
  group.add(localIsoMesh(0.18, 0.12, 0.04 + surfaceLift, 0.04, cream));
  group.add(localIsoMesh(0.11, 0.08, 0.08 + surfaceLift, 0.04, cushion));
}

function addGateBars(group: THREE.Group, alongX: boolean, opened: boolean, height = 1.18) {
  const gold = makeStandard(0xe7c56a, {
    emissive: 0xe7c56a,
    emissiveIntensity: 0.32,
    roughness: 0.36,
    metalness: 0.2
  });
  const bars = new THREE.Group();
  bars.userData.role = "gate-bars";
  bars.visible = !opened;
  for (let index = 0; index < 5; index += 1) {
    const offset = -0.2 + index * 0.1;
    const bar = localIsoMesh(alongX ? 0.016 : 0.018, alongX ? 0.018 : 0.016, height, height - 0.04, gold);
    const point = alongX ? localOffset(0.04, offset) : localOffset(offset, 0.04);
    bar.position.set(point.x, 0, point.z);
    bars.add(bar);
  }
  const railY = [height * 0.32, height * 0.68];
  railY.forEach((top) => {
    const rail = localIsoMesh(alongX ? 0.018 : 0.24, alongX ? 0.24 : 0.018, top, 0.04, gold);
    const point = alongX ? localOffset(0.04, 0) : localOffset(0, 0.04);
    rail.position.set(point.x, 0, point.z);
    bars.add(rail);
  });
  group.add(bars);
  return bars;
}

export function addMonumentGate(group: THREE.Group, opened: boolean, alongX: boolean) {
  const stone = makeStandard(0xc47b58, { roughness: 0.6 });
  const dark = makeStandard(0x8e5340, { roughness: 0.7 });
  const gemColor = opened ? 0x9fd99a : 0xe8c56a;
  const left = alongX ? localOffset(0, -0.3) : localOffset(-0.3, 0);
  const right = alongX ? localOffset(0, 0.3) : localOffset(0.3, 0);
  const pillarL = localIsoMesh(alongX ? 0.09 : 0.08, alongX ? 0.08 : 0.09, 1.22, 1.22, stone);
  const pillarR = localIsoMesh(alongX ? 0.09 : 0.08, alongX ? 0.08 : 0.09, 1.22, 1.22, stone);
  pillarL.position.set(left.x, 0, left.z);
  pillarR.position.set(right.x, 0, right.z);
  const lintel = localIsoMesh(alongX ? 0.12 : 0.38, alongX ? 0.38 : 0.12, 1.34, 0.18, dark);
  group.add(pillarL, pillarR, lintel);
  const gem = localIsoMesh(alongX ? 0.08 : 0.12, alongX ? 0.12 : 0.08, 1.42, 0.1, makeStandard(gemColor, {
    emissive: gemColor,
    emissiveIntensity: opened ? 0.36 : 0.16,
    roughness: 0.38
  }));
  gem.userData.role = "accent";
  gem.userData.baseEmissive = opened ? 0.36 : 0.16;
  group.add(gem);
  addGateBars(group, alongX, opened, 1.12);
}

export function addSealedArch(group: THREE.Group, opened: boolean, alongX = true) {
  const stone = makeStandard(0xb56b4e, { roughness: 0.62 });
  const dark = makeStandard(0x6d3f32, { roughness: 0.72 });
  const left = alongX ? localOffset(0, -0.34) : localOffset(-0.34, 0);
  const right = alongX ? localOffset(0, 0.34) : localOffset(0.34, 0);
  const pillarL = localIsoMesh(alongX ? 0.11 : 0.09, alongX ? 0.09 : 0.11, 1.38, 1.38, stone);
  const pillarR = localIsoMesh(alongX ? 0.11 : 0.09, alongX ? 0.09 : 0.11, 1.38, 1.38, stone);
  pillarL.position.set(left.x, 0, left.z);
  pillarR.position.set(right.x, 0, right.z);
  const lintel = localIsoMesh(alongX ? 0.14 : 0.42, alongX ? 0.42 : 0.14, 1.5, 0.2, dark);
  const threshold = localIsoMesh(alongX ? 0.16 : 0.36, alongX ? 0.36 : 0.16, 0.08, 0.08, dark);
  group.add(pillarL, pillarR, lintel, threshold);
  addGateBars(group, alongX, opened, 1.26);
  addClickPlate(group, 0.86);
}

export function addClickPlate(group: THREE.Group, radius = 0.34) {
  const plate = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = 0.04;
  group.add(plate);
}

export function addHookInlay(group: THREE.Group, color: number) {
  group.add(localIsoMesh(0.18, 0.18, 0.016, 0.016, makeStandard(color, {
    emissive: color,
    emissiveIntensity: 0.18,
    roughness: 0.46,
    transparent: true,
    opacity: 0.88
  })));
}

export function addWallTablet(group: THREE.Group, color: number) {
  const plate = localIsoMesh(0.2, 0.08, 0.58, 0.48, makeStandard(0x6d5a48, { roughness: 0.7 }));
  const face = localIsoMesh(0.14, 0.05, 0.54, 0.34, makeStandard(color, { emissive: color, emissiveIntensity: 0.28, roughness: 0.42 }));
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.1, 0),
    makeStandard(color, { emissive: color, emissiveIntensity: 0.4 })
  );
  core.position.y = 0.38;
  group.add(plate, face, core);
}

export function addAtomSample(group: THREE.Group, shells: number, color: number) {
  const stone = makeStandard(0xf3ddc0, { roughness: 0.72 });
  const accent = makeStandard(color, { emissive: color, emissiveIntensity: 0.32, roughness: 0.36 });
  group.add(localIsoMesh(0.16, 0.12, 0.08, 0.08, stone));
  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), accent);
  nucleus.position.y = 0.32;
  group.add(nucleus);
  for (let ring = 0; ring < shells; ring += 1) {
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(0.12 + ring * 0.08, 0.012, 8, 22),
      makeStandard(color, { emissive: color, emissiveIntensity: 0.24, roughness: 0.3 })
    );
    orbit.position.y = 0.32;
    orbit.rotation.set(Math.PI / 2.3, ring * 0.4, ring * 0.5);
    orbit.userData.spin = true;
    group.add(orbit);
  }
}

export function addForumDais(group: THREE.Group, color: number, completed: boolean) {
  const stone = makeStandard(0xf3ddc0, { roughness: 0.74 });
  const accent = makeStandard(color, {
    emissive: color,
    emissiveIntensity: completed ? 0.36 : 0.14,
    roughness: 0.46,
    metalness: 0.12
  });
  group.add(localIsoMesh(0.36, 0.36, 0.028, 0.028, stone));
  group.add(localIsoMesh(0.2, 0.2, 0.038, 0.014, accent));
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 20), accent);
  orbit.rotation.x = Math.PI / 2;
  orbit.position.y = 0.05;
  group.add(orbit);
  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), accent);
  nucleus.position.y = 0.055;
  group.add(nucleus);
}

export function addIsoLectern(group: THREE.Group, color: number) {
  addOpenBook(group, { accent: color, compact: true });
}

export function addIsoLantern(root: THREE.Object3D, gx: number, gy: number, surfaceY: number) {
  const post = isoBlock(gx, gy, 0.045, 0.045, surfaceY + 1.12, 0.42, makeStandard(0x6a5340, { roughness: 0.74 }));
  const origin = gridPoint(gx, gy);
  const lamp = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.1, 0),
    makeStandard(0xf0c56a, { emissive: 0xd7a227, emissiveIntensity: 0.55, roughness: 0.32 })
  );
  lamp.position.set(origin.x, surfaceY + 1.32, origin.z);
  lamp.userData.phase = gx + gy;
  lamp.userData.baseY = lamp.position.y;
  root.add(post, lamp);
}

export function addCategorySculpture(group: THREE.Group, index: number, accent: number, completed: boolean) {
  const light = makeStandard(accent, { emissive: accent, emissiveIntensity: completed ? 0.38 : 0.14, roughness: 0.42, metalness: 0.16 });
  const dark = makeStandard(0x5a4a3e, { roughness: 0.76 });
  if (index === 0) {
    for (let i = 0; i < 3; i += 1) {
      const p = localOffset(Math.cos((i / 3) * Math.PI * 2) * 0.2, Math.sin((i / 3) * Math.PI * 2) * 0.2);
      const nub = localIsoMesh(0.08, 0.08, 0.42, 0.2, light);
      nub.position.set(p.x, 0, p.z);
      group.add(nub);
    }
  } else if (index === 1) {
    for (let i = 0; i < 4; i += 1) {
      const step = localIsoMesh(0.12, 0.12, 0.16 + i * 0.1, 0.1 + i * 0.04, light);
      const p = localOffset(-0.2 + i * 0.13, 0);
      step.position.set(p.x, 0, p.z);
      group.add(step);
    }
  } else if (index === 2) {
    [0.18, 0.3].forEach((radius, ring) => {
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.022, 8, 24), light);
      orbit.rotation.set(Math.PI / 2.4, ring * 0.35, ring * 0.28);
      orbit.position.y = 0.46;
      orbit.userData.spin = true;
      group.add(orbit);
    });
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), light);
    nucleus.position.y = 0.46;
    group.add(nucleus);
  } else if (index === 3) {
    for (let i = 0; i < 3; i += 1) {
      const p = localOffset(-0.2 + i * 0.2, 0);
      const pot = localIsoMesh(0.08, 0.08, 0.28, 0.28, dark);
      pot.position.set(p.x, 0, p.z);
      const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), light);
      leaf.position.set(p.x, 0.4, p.z);
      group.add(pot, leaf);
    }
  } else if (index === 4) {
    const left = localIsoMesh(0.08, 0.08, 0.52, 0.52, dark);
    const right = localIsoMesh(0.08, 0.08, 0.52, 0.52, dark);
    const l = localOffset(-0.18, 0);
    const r = localOffset(0.18, 0);
    left.position.set(l.x, 0, l.z);
    right.position.set(r.x, 0, r.z);
    group.add(left, right, localIsoMesh(0.26, 0.06, 0.58, 0.08, light));
  } else {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5),
      makeStandard(accent, { transparent: true, opacity: 0.32, emissive: accent, emissiveIntensity: 0.14 })
    );
    dome.position.y = 0.12;
    const a = localIsoMesh(0.08, 0.08, 0.32, 0.24, light);
    const b = localIsoMesh(0.08, 0.08, 0.4, 0.32, dark);
    const pa = localOffset(-0.1, 0);
    const pb = localOffset(0.1, 0);
    a.position.set(pa.x, 0, pa.z);
    b.position.set(pb.x, 0, pb.z);
    group.add(dome, a, b);
  }
}

function addGlyphSprite(group: THREE.Group, letter: string, color: string, y: number, scale = 0.22) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glyphTexture(letter, color),
    transparent: true,
    depthTest: true,
    depthWrite: false
  }));
  sprite.center.set(0.5, 0.5);
  sprite.position.y = y;
  sprite.scale.set(scale, scale, 1);
  sprite.renderOrder = 7;
  group.add(sprite);
  return sprite;
}

let promptTextureCache: THREE.CanvasTexture | null = null;
function promptTexture() {
  if (promptTextureCache) return promptTextureCache;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(255, 241, 176, 0.98)";
  ctx.strokeStyle = "rgba(142, 83, 64, 0.98)";
  ctx.lineWidth = 16;
  if (typeof ctx.roundRect === "function") ctx.roundRect(18, 18, 220, 220, 42);
  else ctx.rect(18, 18, 220, 220);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3f3126";
  ctx.font = "900 148px 'Noto Sans SC', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("E", 128, 142);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  promptTextureCache = texture;
  return texture;
}

const captionCache = new Map<string, THREE.CanvasTexture>();
function captionTexture(text: string) {
  const hit = captionCache.get(text);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 160);
  ctx.fillStyle = "rgba(36, 24, 16, 0.9)";
  ctx.strokeStyle = "rgba(231, 197, 106, 0.98)";
  ctx.lineWidth = 7;
  if (typeof ctx.roundRect === "function") ctx.roundRect(18, 28, 476, 104, 32);
  else ctx.rect(18, 28, 476, 104);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff4dc";
  ctx.font = "800 52px 'Noto Sans SC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 82);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  captionCache.set(text, texture);
  return texture;
}

function cueMaterial(color: number, opacity = 0) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    fog: false
  });
}

function solidCue(color: number, opacity = 0.98) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
    fog: false
  });
}

const nameplateCache = new Map<string, THREE.CanvasTexture>();
export function nameplateTexture(title: string, subtitle = "") {
  const key = `${title}|${subtitle}`;
  const hit = nameplateCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 160);
  ctx.fillStyle = "rgba(36, 24, 16, 0.86)";
  ctx.strokeStyle = "rgba(231, 197, 106, 0.95)";
  ctx.lineWidth = 6;
  if (typeof ctx.roundRect === "function") ctx.roundRect(18, 18, 476, 124, 28);
  else ctx.rect(18, 18, 476, 124);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff4dc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 44px 'Noto Sans SC', sans-serif";
  ctx.fillText(title, 256, subtitle ? 68 : 80);
  if (subtitle) {
    ctx.fillStyle = "#e7c56a";
    ctx.font = "700 28px 'Noto Sans SC', sans-serif";
    ctx.fillText(subtitle, 256, 112);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  nameplateCache.set(key, texture);
  return texture;
}

export function addQuestNameplate(group: THREE.Group, title: string, subtitle = "", height = 2.42) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nameplateTexture(title, subtitle),
    transparent: true,
    depthTest: false,
    depthWrite: false
  }));
  sprite.center.set(0.5, 0);
  sprite.position.y = height;
  sprite.scale.set(3.36, 1.04, 1);
  sprite.visible = false;
  sprite.renderOrder = 18;
  sprite.userData.role = "nameplate";
  sprite.userData.baseY = height;
  group.add(sprite);
  return sprite;
}

export function addTrailMarker(hero = false) {
  const group = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.CircleGeometry(hero ? 0.46 : 0.34, 28),
    new THREE.MeshBasicMaterial({
      color: 0x6a3f24,
      transparent: true,
      opacity: 0.88,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.05;
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(hero ? 0.38 : 0.27, 28),
    new THREE.MeshBasicMaterial({
      color: 0xe7c56a,
      transparent: true,
      opacity: hero ? 0.96 : 0.88,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.06;
  const outline = new THREE.Mesh(
    new THREE.ConeGeometry(hero ? 0.24 : 0.18, hero ? 0.52 : 0.4, 3),
    new THREE.MeshBasicMaterial({
      color: 0x6a3f24,
      transparent: true,
      opacity: 0.98,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  outline.rotation.x = Math.PI / 2;
  outline.position.set(0, hero ? 0.34 : 0.28, hero ? 0.08 : 0.05);
  const chevron = new THREE.Mesh(
    new THREE.ConeGeometry(hero ? 0.18 : 0.14, hero ? 0.46 : 0.34, 3),
    new THREE.MeshBasicMaterial({
      color: 0xe7c56a,
      transparent: true,
      opacity: 0.98,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  chevron.rotation.x = Math.PI / 2;
  chevron.position.set(0, hero ? 0.38 : 0.32, hero ? 0.1 : 0.07);
  group.add(rim, glow, outline, chevron);
  group.userData.role = "trail";
  group.userData.hero = hero;
  group.renderOrder = 8;
  return group;
}

const badgeCache = new Map<string, THREE.CanvasTexture>();
function badgeTexture(letter: string) {
  const hit = badgeCache.get(letter);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 256);
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.fillStyle = "#e7c56a";
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = "#6a3f24";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(128, 128, 86, 0, Math.PI * 2);
  ctx.fillStyle = "#fff4dc";
  ctx.fill();
  ctx.fillStyle = "#3f3126";
  ctx.font = letter.length > 1 ? "800 88px 'Noto Sans SC', sans-serif" : "900 120px 'Noto Sans SC', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 128, 140);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  badgeCache.set(letter, texture);
  return texture;
}

function interactBadgeLetter(group: THREE.Group) {
  const kind = String(group.userData.kind ?? "");
  const id = String(group.userData.id ?? "");
  if (id === "atom-hydrogen") return "H";
  if (id === "atom-carbon") return "C";
  if (id === "atom-oxygen") return "O";
  if (id === "gate-atomic-forum") return "门";
  if (id === "atomic-forum") return "书";
  if (kind === "category" || kind === "micro-puzzle") return "书";
  return null;
}

export function addInteractBadge(group: THREE.Group, letter: string, height = 1.72) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: badgeTexture(letter),
    transparent: true,
    depthTest: false,
    depthWrite: false
  }));
  const atom = group.userData.kind === "field-clue";
  sprite.center.set(0.5, 0.5);
  sprite.position.set(atom ? 0.78 : 0, height, atom ? 0.2 : 0);
  sprite.scale.set(0.86, 0.86, 1);
  sprite.visible = false;
  sprite.renderOrder = 19;
  sprite.userData.role = "interact-badge";
  sprite.userData.baseY = height;
  sprite.userData.baseScale = 0.86;
  group.add(sprite);
  return sprite;
}

export function addLandmarkKit(group: THREE.Group, promptHeight = 1.35, captionText = "按住 E") {
  addClickPlate(group, 1.22);
  const atom = group.userData.kind === "field-clue";
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.48, 1.18, 48),
    new THREE.MeshBasicMaterial({
      color: 0xe7c56a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.05;
  halo.visible = false;
  halo.userData.role = "halo";
  halo.renderOrder = 4;
  group.add(halo);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(1.08, 36),
    new THREE.MeshBasicMaterial({
      color: 0xffe08a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.06;
  glow.visible = false;
  glow.userData.role = "halo-glow";
  glow.renderOrder = 3;
  group.add(glow);

  const callout = new THREE.Mesh(new THREE.TorusGeometry(atom ? 0.94 : 0.74, atom ? 0.11 : 0.09, 10, 40), solidCue(0xe7c56a, 0.98));
  callout.rotation.x = Math.PI / 2;
  callout.position.y = 0.16;
  callout.visible = false;
  callout.renderOrder = 5;
  callout.userData.role = "callout-ring";
  group.add(callout);

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(atom ? 0.1 : 0.12, atom ? 0.24 : 0.3, atom ? 3.6 : 5.8, 24, 1, true), solidCue(0xe7c56a, 0.94));
  beacon.position.y = atom ? 3.15 : 3.4;
  beacon.visible = false;
  beacon.renderOrder = 14;
  beacon.userData.role = "beacon";
  group.add(beacon);

  const star = new THREE.Mesh(new THREE.OctahedronGeometry(atom ? 0.2 : 0.24, 0), solidCue(0xfff1b0, 0.98));
  star.position.y = atom ? 5.15 : 6.5;
  star.visible = false;
  star.renderOrder = 15;
  star.userData.role = "beacon-star";
  star.userData.baseY = atom ? 5.15 : 6.5;
  group.add(star);

  const pointer = new THREE.Mesh(new THREE.ConeGeometry(atom ? 0.26 : 0.22, atom ? 0.58 : 0.48, 4), solidCue(0xfff1b0, 0.98));
  pointer.rotation.x = Math.PI;
  pointer.position.y = atom ? 2.72 : promptHeight + 1.08;
  pointer.visible = false;
  pointer.renderOrder = 17;
  pointer.userData.role = "quest-pointer";
  pointer.userData.baseY = pointer.position.y;
  group.add(pointer);

  const spark = new THREE.Mesh(new THREE.OctahedronGeometry(atom ? 0.14 : 0.12, 0), solidCue(0xfff1b0, 0.98));
  spark.position.set(atom ? 0.78 : 0, atom ? 2.05 : promptHeight + 0.52, atom ? 0.24 : 0);
  spark.visible = false;
  spark.renderOrder = 16;
  spark.userData.role = "interact-spark";
  spark.userData.baseY = spark.position.y;
  group.add(spark);

  const crown = new THREE.Group();
  crown.position.y = atom ? 3.95 : 2.72;
  crown.visible = false;
  crown.renderOrder = 17;
  crown.userData.role = "quest-crown";
  crown.userData.baseY = atom ? 3.95 : 2.72;
  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), solidCue(0xfff1b0, 0.98));
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 28), solidCue(0xe7c56a, 0.96));
  orbit.rotation.x = Math.PI / 2.15;
  const electron = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), solidCue(0x61a9d5, 0.98));
  electron.position.set(0.22, 0.03, 0);
  crown.add(nucleus, orbit, electron);
  group.add(crown);

  const book = new THREE.Group();
  book.position.set(atom ? 0.86 : 0, atom ? 1.58 : promptHeight + 0.28, atom ? 0.24 : 0);
  book.visible = false;
  book.renderOrder = 17;
  book.userData.role = "interact-book";
  book.userData.baseY = book.position.y;
  const cover = new THREE.Mesh(new THREE.BoxGeometry(atom ? 0.78 : 0.92, 0.07, atom ? 0.52 : 0.64), solidCue(0x8e5340, 0.98));
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, atom ? 0.54 : 0.66), solidCue(0x6a3f24, 0.98));
  spine.position.y = 0.02;
  const leftPage = new THREE.Mesh(new THREE.BoxGeometry(atom ? 0.34 : 0.4, 0.035, atom ? 0.46 : 0.56), solidCue(0xffe08a, 0.98));
  leftPage.position.set(atom ? -0.2 : -0.24, 0.08, 0);
  leftPage.rotation.z = 0.34;
  const rightPage = new THREE.Mesh(new THREE.BoxGeometry(atom ? 0.34 : 0.4, 0.035, atom ? 0.46 : 0.56), solidCue(0xfff4dc, 0.98));
  rightPage.position.set(atom ? 0.2 : 0.24, 0.08, 0);
  rightPage.rotation.z = -0.34;
  const glyph = new THREE.Mesh(new THREE.SphereGeometry(atom ? 0.055 : 0.05, 10, 8), solidCue(0xe7c56a, 0.98));
  glyph.position.set(0, 0.16, 0);
  book.add(cover, spine, leftPage, rightPage, glyph);
  group.add(book);

  const prompt = new THREE.Sprite(new THREE.SpriteMaterial({
    map: promptTexture(),
    transparent: true,
    depthTest: false,
    depthWrite: false
  }));
  prompt.center.set(0.5, 0.5);
  prompt.position.set(atom ? 0.9 : 0, atom ? 2.08 : promptHeight + 0.92, atom ? 0.3 : 0);
  prompt.scale.set(atom ? 1.36 : 1.16, atom ? 1.36 : 1.16, 1);
  prompt.visible = false;
  prompt.renderOrder = 16;
  prompt.userData.role = "prompt";
  prompt.userData.baseY = prompt.position.y;
  group.add(prompt);

  const caption = new THREE.Sprite(new THREE.SpriteMaterial({
    map: captionTexture(captionText),
    transparent: true,
    depthTest: false,
    depthWrite: false
  }));
  caption.center.set(0.5, 0.5);
  caption.position.set(atom ? 0.9 : 0, atom ? 2.62 : promptHeight + 1.42, atom ? 0.3 : 0);
  caption.scale.set(1.95, 0.56, 1);
  caption.visible = false;
  caption.renderOrder = 16;
  caption.userData.role = "prompt-caption";
  caption.userData.baseY = caption.position.y;
  group.add(caption);

  const letter = interactBadgeLetter(group);
  if (letter) addInteractBadge(group, letter, atom ? 2.08 : promptHeight + 0.72);
}

export function syncLandmarkVisual(
  group: THREE.Group,
  state: {
    nearby: boolean;
    lit: boolean;
    seek?: boolean;
    idle?: boolean;
    quest?: boolean;
    slots?: boolean[];
    matches?: boolean[];
    scanMarked?: number;
    scanComplete?: boolean;
  }
) {
  const quest = Boolean(state.quest);
  const seek = Boolean(state.seek);
  const idle = Boolean(state.idle);
  const atom = group.userData.kind === "field-clue";
  group.userData.nearbyPulse = state.nearby;
  group.userData.seekPulse = seek && !state.nearby;
  group.userData.idlePulse = idle && !state.nearby && !seek;
  group.userData.questPulse = quest;
  group.traverse((object) => {
    const role = object.userData.role as string | undefined;
    if (role === "prompt") {
      object.visible = !state.lit && state.nearby;
      object.scale.setScalar(state.nearby ? (atom ? 1.72 : 1.42) : 0.3);
      return;
    }
    if (role === "prompt-caption") {
      object.visible = state.nearby;
      object.scale.set(atom ? 2.42 : 2.08, 0.66, 1);
      return;
    }
    if (role === "nameplate") {
      object.visible = false;
      return;
    }
    if (role === "quest-crown" || role === "quest-pointer" || role === "interact-spark" || role === "interact-flag") {
      object.visible = false;
      return;
    }
    if (role === "scan-reticle") {
      object.visible = state.nearby && !state.lit;
      return;
    }
    if (role === "interact-book") {
      object.visible = false;
      return;
    }
    if (role === "interact-badge") {
      object.visible = false;
      return;
    }
    if (role === "callout-ring") {
      object.visible = state.nearby;
      object.scale.setScalar(state.nearby ? 1.08 : 1);
      return;
    }
    if (role === "halo" || role === "halo-glow") {
      object.visible = state.nearby || (quest && seek);
      const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = role === "halo-glow"
          ? (state.nearby ? 0.28 : quest && seek ? 0.12 : 0)
          : (state.nearby ? 0.7 : quest && seek ? 0.28 : 0);
      }
      return;
    }
    if (role === "beacon" || role === "beacon-star") {
      object.visible = false;
      return;
    }
    if (role === "accent") {
      const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
      const items = Array.isArray(material) ? material : [material];
      items.forEach((item) => {
        if (item && "emissiveIntensity" in item) {
          item.emissiveIntensity = state.lit ? 0.46 : (object.userData.baseEmissive ?? 0.14);
        }
      });
      return;
    }
    if (role === "slot") {
      const index = object.userData.slotIndex as number;
      const filled = Boolean(state.slots?.[index]);
      const matching = Boolean(state.matches?.[index]) && !filled;
      if (object.userData.slotFace === "digit") {
        object.visible = !filled;
        return;
      }
      if (object.userData.slotFace === "letter") {
        object.visible = filled;
        return;
      }
      const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
      if (material && "emissive" in material) {
        const standard = material as THREE.MeshStandardMaterial;
        standard.color.setHex(filled ? 0xe7c56a : matching ? 0xd7a85a : 0x6a5340);
        standard.emissive.setHex(filled ? 0xe7c56a : matching ? 0xe7c56a : 0x3a2a22);
        standard.emissiveIntensity = filled ? 0.4 : matching ? 0.28 : 0.05;
      }
      return;
    }
    if (role === "gate-bars") {
      object.visible = !state.lit;
      return;
    }
    if (role === "slot-match") {
      const index = object.userData.slotIndex as number;
      const matching = Boolean(state.matches?.[index]) && !state.slots?.[index];
      object.visible = matching;
      return;
    }
    if (role === "scan-core") {
      const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (material && "emissiveIntensity" in material) {
        material.emissiveIntensity = state.lit ? 0.52 : state.scanComplete ? 0.46 : state.nearby ? 0.34 : (object.userData.baseEmissive ?? 0.16);
      }
      return;
    }
    if (role === "proton") {
      const marked = Boolean(state.lit || state.scanComplete || (state.scanMarked ?? 0) > (object.userData.protonIndex ?? 0));
      const hero = Boolean(object.userData.heroProton);
      const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (material && "emissiveIntensity" in material) {
        material.color.setHex(marked || hero ? 0xe7c56a : 0xb88946);
        material.emissive.setHex(marked || hero ? 0xe7c56a : 0x6a4a22);
        material.emissiveIntensity = marked ? 0.82 : hero ? 0.38 : 0.16;
      }
      object.scale.setScalar(marked ? (hero ? 1.28 : 1.14) : hero ? 1.12 : 0.92);
      return;
    }
    if (role === "unknown-glyph") {
      object.visible = !state.lit && !state.scanComplete && state.nearby;
      return;
    }
    if (role === "reveal-glyph") {
      object.visible = Boolean(state.lit || state.scanComplete);
      return;
    }
    if (role === "missing-bond") {
      object.visible = !state.lit;
      return;
    }
    if (role === "complete-bond") {
      object.visible = state.lit;
    }
  });
}

export function addOpenBook(
  group: THREE.Group,
  options: { accent?: number; letters?: string[]; compact?: boolean } = {}
) {
  const book = new THREE.Group();
  book.userData.hideWhenArt = true;
  const accent = options.accent ?? 0xe7c56a;
  const compact = options.compact ?? false;
  const cream = makeStandard(0xf3ddc0, { roughness: 0.6 });
  const clay = makeStandard(0xc47b58, { roughness: 0.56 });
  const gold = makeStandard(accent, {
    emissive: accent,
    emissiveIntensity: 0.22,
    roughness: 0.38,
    metalness: 0.16
  });
  const pedestal = compact ? 0.1 : 0.14;
  book.add(localIsoMesh(compact ? 0.13 : 0.16, compact ? 0.1 : 0.12, pedestal, pedestal, cream));
  book.add(localIsoMesh(compact ? 0.18 : 0.2, compact ? 0.12 : 0.14, pedestal + 0.045, 0.045, clay));
  const pageY = pedestal + 0.07;
  const left = localIsoMesh(0.09, 0.07, pageY, 0.016, cream);
  const right = localIsoMesh(0.09, 0.07, pageY, 0.016, cream);
  const lp = localOffset(-0.07, 0.01);
  const rp = localOffset(0.07, 0.01);
  left.position.set(lp.x, 0, lp.z);
  right.position.set(rp.x, 0, rp.z);
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.018, 6), gold);
  hex.position.y = pageY + 0.012;
  hex.userData.role = "accent";
  hex.userData.baseEmissive = 0.22;
  book.add(left, right, hex);
  (options.letters ?? []).forEach((letter, index) => {
    const sprite = addGlyphSprite(book, letter, "#E7C56A", pageY + 0.16, compact ? 0.13 : 0.16);
    const point = localOffset(-0.12 + index * 0.12, 0.05);
    sprite.position.x += point.x;
    sprite.position.z += point.z;
  });
  book.traverse((node) => {
    node.userData.hideWhenArt = true;
  });
  group.add(book);
}

export function addAtomOrreryLandmark(
  group: THREE.Group,
  spec: { shells: number; color: number; letter: string; protons: number; electrons: number[] }
) {
  const stone = makeStandard(0xf3ddc0, { roughness: 0.7 });
  const gold = makeStandard(0xe7c56a, { emissive: 0xe7c56a, emissiveIntensity: 0.16, roughness: 0.32, metalness: 0.12 });
  const accent = makeStandard(spec.color, { emissive: spec.color, emissiveIntensity: 0.22, roughness: 0.34 });
  const electronMat = makeStandard(0x61a9d5, { emissive: 0x61a9d5, emissiveIntensity: 0.34, roughness: 0.28 });
  const base = localIsoMesh(0.11, 0.09, 0.06, 0.06, stone);
  base.userData.hideWhenArt = true;
  group.add(base);
  const hydrogen = spec.protons === 1;
  const orreryY = hydrogen ? 0.54 : 0.78;
  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(hydrogen ? 0.06 : 0.1, 0), gold);
  nucleus.position.y = orreryY;
  nucleus.userData.role = "scan-core";
  nucleus.userData.baseEmissive = 0.22;
  group.add(nucleus);
  const protonRadius = hydrogen ? 0.18 : spec.protons <= 6 ? 0.16 : 0.2;
  const heroShift = hydrogen ? localOffset(0.12, 0.24) : { x: 0, z: 0 };
  for (let index = 0; index < spec.protons; index += 1) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(hydrogen ? 0.14 : 0.05, 10, 8), gold.clone());
    const angle = (Math.PI * 2 * index) / spec.protons - Math.PI / 2;
    bead.position.set(
      Math.cos(angle) * protonRadius + heroShift.x,
      orreryY + (hydrogen ? 0.02 : Math.sin(angle * 1.35) * 0.02),
      Math.sin(angle) * protonRadius + heroShift.z
    );
    bead.userData.role = "proton";
    bead.userData.protonIndex = index;
    bead.userData.heroProton = hydrogen;
    group.add(bead);
  }
  if (hydrogen) {
    nucleus.position.x = heroShift.x;
    nucleus.position.z = heroShift.z;
  }
  const cloud = new THREE.Group();
  cloud.position.set(heroShift.x, orreryY, heroShift.z);
  cloud.userData.spin = true;
  group.add(cloud);
  spec.electrons.forEach((count, ring) => {
    const radius = (hydrogen ? 0.22 : 0.28) + ring * 0.16;
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.016, 8, 28), accent.clone());
    orbit.rotation.set(Math.PI / 2.25, ring * 0.42, ring * 0.5);
    orbit.userData.role = "accent";
    orbit.userData.baseEmissive = 0.28;
    cloud.add(orbit);
    for (let electron = 0; electron < count; electron += 1) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), electronMat.clone());
      const angle = (Math.PI * 2 * electron) / count + ring * 0.35;
      bead.position.set(Math.cos(angle) * radius, Math.sin(angle * 0.4) * 0.04, Math.sin(angle) * radius);
      bead.userData.role = "electron";
      cloud.add(bead);
    }
  });
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.44, 36),
    new THREE.MeshBasicMaterial({
      color: 0xe7c56a,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  reticle.rotation.x = -Math.PI / 2;
  reticle.position.set(heroShift.x, orreryY + 0.02, heroShift.z);
  reticle.visible = false;
  reticle.renderOrder = 6;
  reticle.userData.role = "scan-reticle";
  group.add(reticle);
  const glyphY = orreryY + (hydrogen ? 0.42 : 0.58);
  const unknown = addGlyphSprite(group, "?", "#F6E6CC", glyphY, hydrogen ? 0.22 : 0.28);
  unknown.position.x += heroShift.x;
  unknown.position.z += heroShift.z;
  unknown.userData.role = "unknown-glyph";
  const revealed = addGlyphSprite(group, spec.letter, `#${spec.color.toString(16).padStart(6, "0")}`, glyphY, hydrogen ? 0.28 : 0.32);
  revealed.position.x += heroShift.x;
  revealed.position.z += heroShift.z;
  revealed.userData.role = "reveal-glyph";
  revealed.visible = false;
}

export function addHexMedallion(group: THREE.Group, completed: boolean) {
  const gold = makeStandard(0xe7c56a, {
    emissive: 0xe7c56a,
    emissiveIntensity: completed ? 0.36 : 0.14,
    roughness: 0.4,
    metalness: 0.18
  });
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.036, 6), gold);
  hex.position.y = 0.028;
  hex.userData.role = "accent";
  hex.userData.baseEmissive = completed ? 0.36 : 0.14;
  group.add(hex);
  for (let index = 0; index < 4; index += 1) {
    const tick = localIsoMesh(0.028, 0.01, 0.05, 0.018, gold);
    const point = localOffset(
      Math.cos((index / 4) * Math.PI * 2 + Math.PI / 4) * 0.16,
      Math.sin((index / 4) * Math.PI * 2 + Math.PI / 4) * 0.16
    );
    tick.position.set(point.x, 0, point.z);
    tick.userData.role = "accent";
    group.add(tick);
  }
}

export function addFloorTablet(group: THREE.Group, color: number) {
  group.add(localIsoMesh(0.22, 0.14, 0.03, 0.03, makeStandard(0x6d5a48, { roughness: 0.7 })));
  const face = localIsoMesh(0.16, 0.1, 0.046, 0.016, makeStandard(color, {
    emissive: color,
    emissiveIntensity: 0.2,
    roughness: 0.42
  }));
  face.userData.role = "accent";
  face.userData.baseEmissive = 0.2;
  group.add(face);
}

export function addKeystoneGate(group: THREE.Group, filled: boolean[], opened = false) {
  const digits = ["1", "6", "8"];
  const letters = ["H", "C", "O"];
  const stone = makeStandard(0xf3ddc0, { roughness: 0.68 });
  const clay = makeStandard(0xc47b58, { roughness: 0.58 });
  const dark = makeStandard(0x8e5340, { roughness: 0.7 });
  const gold = makeStandard(0xe7c56a, {
    emissive: 0xe7c56a,
    emissiveIntensity: 0.24,
    roughness: 0.38,
    metalness: 0.16
  });

  const plinth = localIsoMesh(0.34, 0.78, 0.08, 0.08, dark);
  plinth.userData.hideWhenArt = true;
  group.add(plinth);
  const step = localIsoMesh(0.28, 0.7, 0.16, 0.08, clay);
  step.userData.hideWhenArt = true;
  group.add(step);
  const back = localIsoMesh(0.1, 0.76, 1.48, 1.32, stone);
  const backPoint = localOffset(-0.22, 0);
  back.position.set(backPoint.x, 0, backPoint.z);
  back.userData.hideWhenArt = true;
  group.add(back);
  const lintel = localIsoMesh(0.14, 0.8, 1.6, 0.2, dark);
  lintel.position.set(backPoint.x, 0, backPoint.z);
  lintel.userData.hideWhenArt = true;
  group.add(lintel);

  digits.forEach((digit, index) => {
    const point = localOffset(0.12, -0.42 + index * 0.42);
    const pillar = localIsoMesh(0.12, 0.12, 0.86, 0.7, clay);
    pillar.position.set(point.x, 0, point.z);
    pillar.userData.hideWhenArt = true;
    group.add(pillar);
    const socket = localIsoMesh(0.1, 0.1, 1.02, 0.28, makeStandard(filled[index] ? 0xe7c56a : 0x6a5340, {
      emissive: filled[index] ? 0xe7c56a : 0x3a2a22,
      emissiveIntensity: filled[index] ? 0.4 : 0.06,
      roughness: 0.4
    }));
    socket.position.set(point.x, 0, point.z);
    socket.userData.role = "slot";
    socket.userData.slotIndex = index;
    group.add(socket);
    const plate = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 20),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    plate.rotation.x = -Math.PI / 2;
    plate.position.set(point.x, 1.06, point.z);
    plate.userData.role = "slot";
    plate.userData.slotIndex = index;
    group.add(plate);
    const match = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.24, 28),
      new THREE.MeshBasicMaterial({
        color: 0xe7c56a,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    match.rotation.x = -Math.PI / 2;
    match.position.set(point.x, 1.08, point.z);
    match.userData.role = "slot-match";
    match.userData.slotIndex = index;
    match.visible = false;
    group.add(match);
    const digitGlyph = addGlyphSprite(group, digit, filled[index] ? "#E7C56A" : "#F6E6CC", 1.18, 0.28);
    digitGlyph.position.x += point.x;
    digitGlyph.position.z += point.z;
    digitGlyph.userData.role = "slot";
    digitGlyph.userData.slotIndex = index;
    digitGlyph.userData.slotFace = "digit";
    const letterGlyph = addGlyphSprite(group, letters[index]!, "#E7C56A", 1.18, 0.3);
    letterGlyph.position.x += point.x;
    letterGlyph.position.z += point.z;
    letterGlyph.userData.role = "slot";
    letterGlyph.userData.slotIndex = index;
    letterGlyph.userData.slotFace = "letter";
    letterGlyph.visible = Boolean(filled[index]);
  });

  const bars = addGateBars(group, true, opened, 1.34);
  const barShift = localOffset(0.18, 0);
  bars.position.x += barShift.x;
  bars.position.z += barShift.z;
  bars.traverse((node) => {
    node.userData.hideWhenArt = true;
  });
}

export function addBlankTenTile(group: THREE.Group, discovered: boolean) {
  group.add(localIsoMesh(0.2, 0.2, 0.04, 0.04, makeStandard(0xf3ddc0, { roughness: 0.7 })));
  const inlay = localIsoMesh(0.14, 0.14, 0.055, 0.016, makeStandard(0xe7c56a, {
    emissive: 0xe7c56a,
    emissiveIntensity: discovered ? 0.4 : 0.16,
    roughness: 0.4
  }));
  inlay.userData.role = "accent";
  inlay.userData.baseEmissive = 0.16;
  group.add(inlay);
  addGlyphSprite(group, "10", "#8E5340", 0.22, 0.2);
  const neon = addGlyphSprite(group, "Ne", "#55B4A3", 0.42, 0.2);
  neon.userData.role = "reveal-glyph";
  neon.visible = discovered;
}

export function addNobleLanterns(group: THREE.Group, discovered: boolean) {
  const gold = makeStandard(0xe7c56a, {
    emissive: 0xe7c56a,
    emissiveIntensity: discovered ? 0.5 : 0.16,
    roughness: 0.34
  });
  for (let index = 0; index < 3; index += 1) {
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), gold);
    const point = localOffset(
      Math.cos((index / 3) * Math.PI * 2) * 0.16,
      Math.sin((index / 3) * Math.PI * 2) * 0.16
    );
    lamp.position.set(point.x, 0.2, point.z);
    lamp.userData.role = "accent";
    lamp.userData.baseEmissive = 0.16;
    lamp.userData.phase = index * 0.9;
    lamp.userData.baseY = 0.2;
    group.add(lamp);
  }
}

export function addWaterMoleculeProp(group: THREE.Group, completed: boolean) {
  const oxygen = makeStandard(0x61a9d5, { emissive: 0x61a9d5, emissiveIntensity: 0.22, roughness: 0.36 });
  const hydrogen = makeStandard(0xf3ddc0, { roughness: 0.52 });
  const bond = makeStandard(0xe7c56a, { emissive: 0xe7c56a, emissiveIntensity: 0.2, roughness: 0.4 });
  const missing = makeStandard(0x8e5340, { transparent: true, opacity: 0.38, roughness: 0.7 });
  const o = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), oxygen);
  o.position.y = 0.22;
  o.userData.role = "accent";
  const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), hydrogen);
  const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), hydrogen);
  const p1 = localOffset(-0.16, 0.08);
  const p2 = localOffset(0.16, 0.08);
  h1.position.set(p1.x, 0.16, p1.z);
  h2.position.set(p2.x, 0.16, p2.z);
  const b1 = localIsoMesh(0.09, 0.018, 0.18, 0.018, bond);
  const bp1 = localOffset(-0.08, 0.04);
  b1.position.set(bp1.x, 0, bp1.z);
  const b2missing = localIsoMesh(0.09, 0.018, 0.18, 0.018, missing);
  const bp2 = localOffset(0.08, 0.04);
  b2missing.position.set(bp2.x, 0, bp2.z);
  b2missing.userData.role = "missing-bond";
  b2missing.visible = !completed;
  const b2full = localIsoMesh(0.09, 0.018, 0.18, 0.018, bond);
  b2full.position.set(bp2.x, 0, bp2.z);
  b2full.userData.role = "complete-bond";
  b2full.visible = completed;
  group.add(o, h1, h2, b1, b2missing, b2full);
  addGlyphSprite(group, "O", "#61A9D5", 0.4, 0.16);
}

export function addCarbonEchoProp(group: THREE.Group, discovered: boolean) {
  const accent = makeStandard(0x9589d2, { emissive: 0x9589d2, emissiveIntensity: discovered ? 0.42 : 0.18, roughness: 0.36 });
  const c12 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), accent);
  const c14 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), accent);
  const p1 = localOffset(-0.14, 0);
  const p2 = localOffset(0.14, 0);
  c12.position.set(p1.x, 0.2, p1.z);
  c14.position.set(p2.x, 0.22, p2.z);
  c12.userData.role = "accent";
  c14.userData.role = "accent";
  c12.userData.baseEmissive = 0.18;
  c14.userData.baseEmissive = 0.18;
  group.add(c12, c14);
  const g12 = addGlyphSprite(group, "12", "#9589D2", 0.4, 0.15);
  g12.position.x += p1.x;
  g12.position.z += p1.z;
  const g14 = addGlyphSprite(group, "14", "#9589D2", 0.42, 0.15);
  g14.position.x += p2.x;
  g14.position.z += p2.z;
  const six = addGlyphSprite(group, "6", "#E7C56A", 0.58, 0.18);
  six.userData.role = "reveal-glyph";
  six.visible = discovered;
}
