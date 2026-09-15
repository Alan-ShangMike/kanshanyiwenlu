import * as THREE from "three";
import { FLOOR_INSET, GRID_X, GRID_Z, gridToWorld, type PlatformSpec, type WallSegment } from "./islandLayout";

export function paintTexture(base: string, shade: string, light: string, mode: "plaster" | "floor" | "water" = "plaster") {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 18, 256);
  gradient.addColorStop(0, light);
  gradient.addColorStop(0.55, base);
  gradient.addColorStop(1, shade);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = shade;
  ctx.fillRect(0, 188, 256, 68);
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(92, 64, 96, 44, -0.32, 0, Math.PI * 2);
  ctx.fill();
  if (mode === "floor") {
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = shade;
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, 200, 200);
    ctx.globalAlpha = 0.07;
    ctx.strokeRect(58, 58, 140, 140);
  }
  if (mode === "water") {
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = light;
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.ellipse(128, 128, 28 + i * 18, 16 + i * 10, 0.16, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function mosaicTexture(a: string, b: string, grout: string) {
  return plasterFloorTexture(a, b, grout);
}

export function plasterFloorTexture(base: string, wash: string, grout: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const fill = ctx.createLinearGradient(0, 0, 48, 256);
  fill.addColorStop(0, wash || base);
  fill.addColorStop(0.38, base);
  fill.addColorStop(1, grout || base);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = wash || base;
  ctx.beginPath();
  ctx.ellipse(108, 78, 110, 58, -0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = grout || base;
  ctx.beginPath();
  ctx.ellipse(188, 186, 84, 46, 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = wash || base;
  ctx.beginPath();
  ctx.ellipse(40, 200, 52, 28, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.repeat.set(1, 1);
  return texture;
}

export function travelerTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 256);

  const cloak = "#c47b58";
  const cloakDark = "#8e5340";
  const cloakLight = "#e2b08a";
  const skin = "#edc9a3";
  const brass = "#e7c56a";
  const boot = "#5a332c";

  ctx.fillStyle = "rgba(26, 20, 16, 0.18)";
  ctx.beginPath();
  ctx.ellipse(128, 236, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = boot;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(108, 214, 16, 18, 5);
    ctx.roundRect(132, 214, 16, 18, 5);
  } else {
    ctx.rect(108, 214, 16, 18);
    ctx.rect(132, 214, 16, 18);
  }
  ctx.fill();

  ctx.fillStyle = cloakDark;
  ctx.beginPath();
  ctx.moveTo(92, 208);
  ctx.lineTo(164, 208);
  ctx.lineTo(150, 118);
  ctx.lineTo(106, 118);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.moveTo(98, 206);
  ctx.lineTo(158, 206);
  ctx.lineTo(146, 122);
  ctx.lineTo(110, 122);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = cloakLight;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(128, 124);
  ctx.lineTo(146, 204);
  ctx.lineTo(128, 204);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = cloakDark;
  ctx.beginPath();
  ctx.ellipse(128, 112, 28, 22, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.ellipse(128, 116, 24, 18, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(128, 108, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5a332c";
  ctx.beginPath();
  ctx.ellipse(122, 106, 2.2, 2.6, 0, 0, Math.PI * 2);
  ctx.ellipse(136, 106, 2.2, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = brass;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(136, 107, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(247, 234, 210, 0.35)";
  ctx.beginPath();
  ctx.arc(136, 107, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = brass;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(129, 107);
  ctx.lineTo(118, 109);
  ctx.stroke();

  ctx.fillStyle = brass;
  ctx.beginPath();
  ctx.arc(128, 148, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7ead2";
  ctx.beginPath();
  ctx.arc(128, 148, 2.4, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function glyphTexture(letter: string, color: string, caption = "") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(88, 48, 36, 0.92)";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(14, 14, 100, 100, 18);
  else ctx.rect(14, 14, 100, 100);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = caption ? "700 52px 'Noto Sans SC', serif" : "700 64px 'Noto Sans SC', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 64, caption ? 54 : 70);
  if (caption) {
    ctx.font = "600 20px 'Noto Sans SC', sans-serif";
    ctx.fillText(caption, 64, 94);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function inlayTexture(gold: string, cream: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = gold;
  ctx.fillRect(0, 0, 128, 128);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = cream;
  ctx.fillRect(10, 10, 108, 108);
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = cream;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 80, 80);
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function skyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#f7e7c8");
  gradient.addColorStop(0.34, "#ead3b6");
  gradient.addColorStop(0.62, "#d5c3b0");
  gradient.addColorStop(0.82, "#b7c4c0");
  gradient.addColorStop(1, "#8aa39c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 8, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export function parallelogramCorners(x0: number, y0: number, x1: number, y1: number, inset = 0) {
  const pad = Math.min(inset, Math.max(0, (x1 - x0) * 0.48), Math.max(0, (y1 - y0) * 0.48));
  return [
    gridToWorld(x0 + pad, y0 + pad),
    gridToWorld(x1 - pad, y0 + pad),
    gridToWorld(x1 - pad, y1 - pad),
    gridToWorld(x0 + pad, y1 - pad)
  ];
}

export function localOffset(dx: number, dy: number) {
  return new THREE.Vector3((dx - dy) * GRID_X, 0, (dx + dy) * GRID_Z);
}

function addQuad(
  positions: number[],
  normals: number[],
  uvs: number[],
  indices: number[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  d: THREE.Vector3
) {
  const ab = new THREE.Vector3().subVectors(b, a);
  const ad = new THREE.Vector3().subVectors(d, a);
  const normal = new THREE.Vector3().crossVectors(ab, ad);
  if (normal.lengthSq() < 1e-10) return;
  normal.normalize();
  const start = positions.length / 3;
  const verts = [a, b, c, d];
  verts.forEach((vertex, index) => {
    positions.push(vertex.x, vertex.y, vertex.z);
    normals.push(normal.x, normal.y, normal.z);
    uvs.push(index === 0 || index === 3 ? 0 : 1, index <= 1 ? 0 : 1);
  });
  indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
}

export function prismFromXZCorners(
  corners: Array<{ x: number; z: number }>,
  bottomY: number,
  topY: number
) {
  const top = corners.map((corner) => new THREE.Vector3(corner.x, topY, corner.z));
  const bottom = corners.map((corner) => new THREE.Vector3(corner.x, bottomY, corner.z));
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  addQuad(positions, normals, uvs, indices, top[0]!, top[3]!, top[2]!, top[1]!);
  addQuad(positions, normals, uvs, indices, bottom[0]!, bottom[1]!, bottom[2]!, bottom[3]!);
  for (let index = 0; index < 4; index += 1) {
    const next = (index + 1) % 4;
    addQuad(positions, normals, uvs, indices, bottom[next]!, bottom[index]!, top[index]!, top[next]!);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

export function isoPrismGeometry(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bottomY: number,
  topY: number,
  inset = 0
) {
  return prismFromXZCorners(parallelogramCorners(x0, y0, x1, y1, inset), bottomY, topY);
}

export function localIsoPrismGeometry(halfX: number, halfY: number, bottomY: number, topY: number) {
  const corners = [
    localOffset(-halfX, -halfY),
    localOffset(halfX, -halfY),
    localOffset(halfX, halfY),
    localOffset(-halfX, halfY)
  ];
  return prismFromXZCorners(corners, bottomY, topY);
}

export function prismMesh(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  topY: number,
  thickness: number,
  material: THREE.Material,
  inset = 0
) {
  const depth = Math.max(0.04, thickness);
  const geometry = isoPrismGeometry(x0, y0, x1, y1, topY - depth, topY, inset);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function isoBlock(
  cx: number,
  cy: number,
  halfX: number,
  halfY: number,
  topY: number,
  height: number,
  material: THREE.Material
) {
  return prismMesh(cx - halfX, cy - halfY, cx + halfX, cy + halfY, topY, Math.max(0.04, height), material);
}

export function localIsoMesh(
  halfX: number,
  halfY: number,
  topY: number,
  height: number,
  material: THREE.Material
) {
  const mesh = new THREE.Mesh(
    localIsoPrismGeometry(halfX, halfY, topY - Math.max(0.04, height), topY),
    material
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function platformPrism(platform: PlatformSpec, topY: number, thickness: number, material: THREE.Material, inset = 0) {
  return prismMesh(platform.x0, platform.y0, platform.x1, platform.y1, topY, thickness, material, inset);
}

export function walkFloorPrism(platform: PlatformSpec, topY: number, thickness: number, material: THREE.Material) {
  const pad = FLOOR_INSET;
  const x0 = platform.x0 + pad;
  const y0 = platform.y0 + pad;
  const x1 = Math.max(x0 + 0.6, platform.x1 - pad);
  const y1 = Math.max(y0 + 0.6, platform.y1 - pad);
  return prismMesh(x0, y0, x1, y1, topY, thickness, material, 0.06);
}

export function terraceBodyBounds(platform: PlatformSpec) {
  if (platform.id === "periodic") {
    return { x0: platform.x0 + 0.22, y0: platform.y0, x1: platform.x1, y1: platform.y1 - 0.16 };
  }
  return platform;
}

export function terraceBodyPrism(platform: PlatformSpec, topY: number, thickness: number, material: THREE.Material, inset = 0) {
  const bounds = terraceBodyBounds(platform);
  return prismMesh(bounds.x0, bounds.y0, bounds.x1, bounds.y1, topY, thickness, material, inset);
}

export function wallPrism(segment: WallSegment, topY: number, height: number, material: THREE.Material) {
  if (segment.edge === "y0") {
    return prismMesh(segment.x0 - 0.02, segment.y0 - 0.52, segment.x1 + 0.02, segment.y0 + 0.08, topY, height, material);
  }
  if (segment.edge === "y1") {
    return prismMesh(segment.x0 - 0.02, segment.y1 - 0.08, segment.x1 + 0.02, segment.y1 + 0.52, topY, height, material);
  }
  if (segment.edge === "x0") {
    return prismMesh(segment.x0 - 0.52, segment.y0 - 0.02, segment.x0 + 0.08, segment.y1 + 0.02, topY, height, material);
  }
  return prismMesh(segment.x1 - 0.08, segment.y0 - 0.02, segment.x1 + 0.52, segment.y1 + 0.02, topY, height, material);
}

export function hexColor(value: string) {
  return Number.parseInt(value.replace("#", ""), 16);
}

export function towardCameraOffset(camera: THREE.Camera, from: THREE.Vector3, amount: number) {
  const dir = camera.position.clone().sub(from);
  dir.y = 0;
  if (dir.lengthSq() < 0.0001) return new THREE.Vector3(0, 0, 0);
  return dir.normalize().multiplyScalar(amount);
}
