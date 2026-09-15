import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FLOOR_LIFT, GRID_X, GRID_Z, gridToWorld } from "./islandLayout";

export type ArtRole = "world" | "landmark";

export type ArtModelSpec = {
  id: string;
  file: string;
  role: ArtRole;
  gx: number;
  gy: number;
  height?: number;
  width?: number;
  depth?: number;
  lift?: number;
  yawFrom?: [number, number];
  yaw?: number;
  nestle?: { dx: number; dy: number; amount: number };
  landmarkKind?: string;
  landmarkId?: string;
};

export type ArtLoadProgress = {
  loaded: number;
  total: number;
  current?: string;
  error?: string;
};

const MODEL_DIR = "/assets/models";

export const QUAY_ART_MODELS: ArtModelSpec[] = [
  {
    id: "forum-hex",
    file: "e4bba52c-0b69-4b38-b106-c2692c6bcc07.glb",
    role: "world",
    gx: 8,
    gy: 30,
    width: 1.58,
    depth: 1.58,
    height: 0.08,
    lift: 0.012,
    nestle: { dx: 0, dy: 1, amount: 0.9 }
  },
  {
    id: "liu-kanshan",
    file: "a3570dea-fb86-4274-9c93-b486fbef7a33.glb",
    role: "landmark",
    gx: 4,
    gy: 25,
    height: 0.95,
    landmarkKind: "liu"
  },
  {
    id: "symbol-lectern",
    file: "e2c1f85e-a9af-435a-8a74-31e0119c5b91.glb",
    role: "world",
    gx: 6,
    gy: 30.35,
    height: 0.92,
    lift: 0.02,
    nestle: { dx: 0, dy: 1, amount: 0.2 },
    landmarkKind: "micro-puzzle",
    landmarkId: "element-symbol-memory"
  },
  {
    id: "quay-chapel",
    file: "b61ca2cb-54f0-4400-8603-59a0674d134f.glb",
    role: "world",
    gx: 1.35,
    gy: 26.4,
    height: 2.92,
    width: 2.85,
    depth: 1.68,
    yawFrom: [1, 0],
    lift: 0
  },
  {
    id: "quay-parapet",
    file: "9ebb198a-d87f-4f48-bebb-52285154639b.glb",
    role: "world",
    gx: 9.6,
    gy: 31.12,
    width: 11.6,
    height: 0.85,
    depth: 0.38,
    yawFrom: [0, -1],
    lift: 0
  },
  {
    id: "quay-palace-face",
    file: "4079f8e4-fd7a-46b2-bd52-c32faec278bf.glb",
    role: "world",
    gx: 13.2,
    gy: 21.85,
    width: 4.6,
    height: 2.9,
    depth: 1.42,
    yawFrom: [0, 1],
    lift: 0
  },
  {
    id: "atom-carbon",
    file: "1cd05b04-9d6c-495e-a9b8-fc94d9ccc264.glb",
    role: "landmark",
    gx: 11,
    gy: 24,
    height: 0.28,
    width: 0.4,
    depth: 0.4,
    lift: 0.02,
    nestle: { dx: 0, dy: -1, amount: 0.28 },
    landmarkKind: "field-clue",
    landmarkId: "atom-carbon"
  },
  {
    id: "quay-palace",
    file: "8e1bbf27-3972-46d4-b460-e750e3b1b612.glb",
    role: "world",
    gx: 5.8,
    gy: 21.85,
    width: 4.8,
    height: 3.05,
    depth: 1.68,
    yawFrom: [0, 1],
    lift: 0
  },
  {
    id: "quay-gatehouse",
    file: "8ddc5532-6c20-49ef-9274-46dfebe026bc.glb",
    role: "landmark",
    gx: 15,
    gy: 25,
    width: 2.9,
    height: 2.7,
    depth: 1.15,
    yawFrom: [-1, 0],
    lift: 0,
    nestle: { dx: 1, dy: 0, amount: 0.18 },
    landmarkKind: "gate",
    landmarkId: "gate-atomic-forum"
  },
  {
    id: "atom-oxygen",
    file: "b85ce67c-fe72-4b0c-8bb7-db1a4d1a554a.glb",
    role: "landmark",
    gx: 14,
    gy: 24,
    height: 0.28,
    width: 0.4,
    depth: 0.4,
    lift: 0.02,
    nestle: { dx: 0, dy: -1, amount: 0.28 },
    landmarkKind: "field-clue",
    landmarkId: "atom-oxygen"
  },
  {
    id: "atom-hydrogen",
    file: "0cae86b8-aed2-42fb-b12b-db1b64fb0d5e.glb",
    role: "landmark",
    gx: 8,
    gy: 24,
    height: 0.28,
    width: 0.4,
    depth: 0.4,
    lift: 0.02,
    nestle: { dx: 0, dy: -1, amount: 0.28 },
    landmarkKind: "field-clue",
    landmarkId: "atom-hydrogen"
  }
];

export function artLandmarkCell(kind: string, id?: string) {
  const spec = QUAY_ART_MODELS.find((item) => item.landmarkKind === kind && (!id || item.landmarkId === id));
  if (!spec) return null;
  return { x: Math.round(spec.gx), y: Math.round(spec.gy) };
}

export function artModelUrl(file: string) {
  return `${MODEL_DIR}/${file}`;
}

export function yawToward(dx: number, dy: number) {
  return Math.atan2((dx - dy) * GRID_X, (dx + dy) * GRID_Z);
}


function prepareModel(scene: THREE.Object3D, spec: ArtModelSpec) {
  const root = new THREE.Group();
  const model = scene;
  model.name = spec.id;
  model.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const glow = spec.landmarkKind === "field-clue"
      ? 0.34
      : spec.landmarkKind === "category" || spec.landmarkKind === "micro-puzzle"
        ? 0.2
        : spec.landmarkKind === "gate"
          ? 0.16
          : 0;
    const glowColor = spec.landmarkKind === "field-clue" ? 0xe7c56a : 0xd4b06a;
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      material.roughness = Math.max(material.roughness, 0.76);
      material.metalness = Math.min(material.metalness, 0.08);
      material.envMapIntensity = 0.22;
      if (glow > 0) {
        material.emissive = new THREE.Color(glowColor);
        material.emissiveIntensity = Math.max(material.emissiveIntensity, glow);
      }
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
    }
  });

  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const hasBoxFit = Boolean(spec.width || spec.depth);
  const uniformOnly = Boolean(spec.height) && !hasBoxFit;
  let sx = 1;
  let sy = 1;
  let sz = 1;
  if (uniformOnly) {
    sx = sy = sz = spec.height! / Math.max(size.y, 0.0001);
  } else if (spec.width && !spec.height && !spec.depth) {
    const footprint = Math.max(size.x, size.z);
    sx = sy = sz = spec.width / Math.max(footprint, 0.0001);
  } else {
    sy = spec.height ? spec.height / Math.max(size.y, 0.0001) : 1;
    sx = spec.width ? spec.width / Math.max(size.x, 0.0001) : sy;
    sz = spec.depth ? spec.depth / Math.max(size.z, 0.0001) : sx;
  }
  model.scale.set(sx, sy, sz);
  model.updateMatrixWorld(true);
  box.setFromObject(model);
  model.position.set(
    -(box.min.x + box.max.x) / 2,
    -box.min.y + (spec.lift ?? 0),
    -(box.min.z + box.max.z) / 2
  );
  root.add(model);
  if (spec.yawFrom) {
    const [dx, dy] = spec.yawFrom;
    root.rotation.y = yawToward(dx, dy);
  }
  if (spec.yaw) root.rotation.y += spec.yaw;
  root.userData.artId = spec.id;
  return root;
}

function yieldFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export function loadArtModel(spec: ArtModelSpec): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${spec.id} timed out`)), 90000);
    loader.load(
      artModelUrl(spec.file),
      (gltf) => {
        window.clearTimeout(timer);
        try {
          resolve(prepareModel(gltf.scene, spec));
        } catch (error) {
          reject(error);
        }
      },
      undefined,
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function nestleOffset(gx: number, gy: number, nestle?: ArtModelSpec["nestle"]) {
  if (!nestle) return { x: 0, z: 0 };
  const origin = gridToWorld(gx, gy);
  const toward = gridToWorld(gx + nestle.dx, gy + nestle.dy);
  return {
    x: (toward.x - origin.x) * nestle.amount,
    z: (toward.z - origin.z) * nestle.amount
  };
}

export function placeWorldArt(root: THREE.Object3D, spec: ArtModelSpec, model: THREE.Group, surfaceY: number) {
  const point = gridToWorld(spec.gx, spec.gy);
  const shift = nestleOffset(spec.gx, spec.gy, spec.nestle);
  model.position.set(point.x + shift.x, surfaceY, point.z + shift.z);
  root.add(model);
}

export async function mountQuayArt(options: {
  worldRoot: THREE.Object3D;
  landmarks: THREE.Object3D;
  surfaceY: (x: number, y: number) => number;
  quaySurface?: number;
  alive?: () => boolean;
  onProgress?: (progress: ArtLoadProgress) => void;
}) {
  const landmarkIndex = new Map<string, THREE.Object3D>();
  options.landmarks.traverse((node) => {
    const kind = String(node.userData.kind ?? "");
    if (!kind) return;
    const id = typeof node.userData.id === "string" ? node.userData.id : "";
    landmarkIndex.set(id ? `${kind}:${id}` : kind, node);
  });
  const quaySurface = options.quaySurface ?? 1.05 + FLOOR_LIFT;
  const total = QUAY_ART_MODELS.length;
  let loaded = 0;
  options.onProgress?.({ loaded, total });

  for (const spec of QUAY_ART_MODELS) {
    if (options.alive && !options.alive()) return;
    options.onProgress?.({ loaded, total, current: spec.id });
    try {
      const model = await loadArtModel(spec);
      if (options.alive && !options.alive()) return;
      if (spec.role === "landmark") {
        const key = spec.landmarkId ? `${spec.landmarkKind}:${spec.landmarkId}` : String(spec.landmarkKind ?? "");
        const host = landmarkIndex.get(key);
        if (host) {
          const shift = nestleOffset(spec.gx, spec.gy, spec.nestle);
          model.position.set(shift.x, spec.lift ?? 0, shift.z);
          host.add(model);
          host.traverse((node) => {
            if (spec.id === "liu-kanshan" && node instanceof THREE.Sprite && node.userData.billboard) {
              node.visible = false;
            }
            const role = String(node.userData.role ?? "");
            const keepChemistry = role === "proton" || role === "electron" || role === "scan-core" || role === "unknown-glyph" || role === "reveal-glyph" || role === "accent" || role === "slot" || role === "slot-match";
            if (node.userData.hideWhenArt && !keepChemistry) node.visible = false;
          });
          loaded += 1;
          options.onProgress?.({ loaded, total, current: spec.id });
          await yieldFrame();
          continue;
        }
      }
      const y = spec.role === "world" ? quaySurface : options.surfaceY(Math.round(spec.gx), Math.round(spec.gy));
      placeWorldArt(options.worldRoot, spec, model, y);
      loaded += 1;
      options.onProgress?.({ loaded, total, current: spec.id });
      await yieldFrame();
    } catch (error) {
      console.warn("Failed to mount art", spec.id, error);
      options.onProgress?.({
        loaded,
        total,
        current: spec.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
