import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const PLAYER_MODEL_URL = "/assets/characters/kanshan-player-idle.glb";
export const PLAYER_TARGET_HEIGHT = 1.18;
export const PLAYER_MAX_FOOTPRINT = 0.42;

export function loadPlayerAvatar(): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      PLAYER_MODEL_URL,
      (gltf) => {
        const root = new THREE.Group();
        const model = gltf.scene;
        model.name = "kanshan-player";
        model.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) {
            if (!(material instanceof THREE.MeshStandardMaterial)) continue;
            material.roughness = Math.max(material.roughness, 0.76);
            material.metalness = Math.min(material.metalness, 0.08);
            material.envMapIntensity = 0.22;
            if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
          }
        });
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        model.scale.setScalar(PLAYER_TARGET_HEIGHT / Math.max(size.y, 0.0001));
        box.setFromObject(model);
        const scaled = box.getSize(new THREE.Vector3());
        const footprint = Math.max(scaled.x, scaled.z);
        if (footprint > PLAYER_MAX_FOOTPRINT) {
          const slim = PLAYER_MAX_FOOTPRINT / footprint;
          model.scale.x *= slim;
          model.scale.z *= slim;
          box.setFromObject(model);
        }
        model.position.set(
          -(box.min.x + box.max.x) / 2,
          -box.min.y,
          -(box.min.z + box.max.z) / 2
        );
        root.add(model);
        resolve(root);
      },
      undefined,
      reject
    );
  });
}

export function lerpAngle(from: number, to: number, t: number) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}
