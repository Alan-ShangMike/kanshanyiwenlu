import { useEffect, useRef } from "react";
import * as THREE from "three";
import type {
  DailyRift,
  GridPosition,
  PlayerState,
  RegionDefinition
} from "@kanshan/shared";
import {
  FLOOR_LIFT,
  GATE_PASSAGES,
  INTERACT_RANGE,
  MOVE_MS,
  bridges,
  buildWalkMap,
  canStandAt as canStandOnIsland,
  cellKey,
  dailyRiftPosition,
  findPath,
  gridToWorld,
  liuPosition,
  microPuzzleDefinitions,
  nearestWalkable,
  owningPlatform,
  platforms,
  sealedGateCells,
  spawnPosition,
  surfaceAt,
  terraceThickness,
  worldToGrid,
  type WalkMap
} from "../game/islandLayout";
import {
  glyphTexture,
  hexColor,
  paintTexture,
  plasterFloorTexture,
  skyTexture,
  terraceBodyPrism,
  towardCameraOffset,
  travelerTexture,
  walkFloorPrism,
} from "../game/worldGeom";
import { lerpAngle, loadPlayerAvatar } from "../game/playerAvatar";
import { artLandmarkCell, mountQuayArt, QUAY_ART_MODELS, stripArtById } from "../game/artModels";
import {
  addAtomOrreryLandmark,
  addBlankTenTile,
  addCarbonEchoProp,
  addDesertAndLagoon,
  addDistantMesas,
  addHookInlay,
  addKeystoneGate,
  addLandmarkKit,
  addMonumentGate,
  addNobleLanterns,
  addOpenBook,
  addQuestNameplate,
  addSealedArch,
  addStairBridge,
  addTrailMarker,
  addWaterMoleculeProp,
  dressPlatform,
  QUAY_COURTYARD_NESTLE,
  QUAY_GATE_UP_NESTLE,
  QUAY_GATE_LEFT_NESTLE,
  QUAY_FORUM_LEFT_NESTLE,
  QUAY_LIU_NESTLE,
  syncLandmarkVisual
} from "../game/worldArt";

export type WorldInteraction =
  | { kind: "field-clue"; id: string; label: string; inspected: boolean }
  | { kind: "micro-puzzle"; id: string; label: string; title: string; puzzleKind: "symbol-memory" | "tile-sort" | "orbit-link"; solved: boolean; locked: boolean }
  | { kind: "category"; id: string; label: string; locked: boolean; completed: boolean }
  | { kind: "liu"; label: string }
  | { kind: "rift"; label: string }
  | { kind: "gate"; id: string; label: string; locked: boolean; opened: boolean }
  | { kind: "world-hook"; id: string; label: string; title: string; locked: boolean; discovered: boolean };

export type QuestHint = {
  kind: WorldInteraction["kind"];
  id?: string;
};

export type FieldScanState = {
  id: string;
  marked: number;
  total: number;
  complete: boolean;
  holding: boolean;
};

export type SeekGuide = {
  label: string;
  action: string;
  distance: number;
  nearby: boolean;
  angle: number;
};

const ATOM_SPEC: Record<string, { shells: number; color: number; letter: string; protons: number; electrons: number[] }> = {
  "atom-hydrogen": { shells: 1, color: 0xe7c56a, letter: "H", protons: 1, electrons: [1] },
  "atom-carbon": { shells: 2, color: 0x55b4a3, letter: "C", protons: 6, electrons: [2, 4] },
  "atom-oxygen": { shells: 2, color: 0x61a9d5, letter: "O", protons: 8, electrons: [2, 6] }
};

interface GameCanvasProps {
  region: RegionDefinition;
  player: PlayerState;
  completedMicroPuzzleIds: string[];
  dailyRift: DailyRift | null;
  renderKey: string;
  inputBlocked?: boolean;
  questHint?: QuestHint | null;
  guideToken?: number;
  heldSymbol?: string | null;
  placedSymbols?: Record<string, string>;
  hudScanHold?: boolean;
  onInteract: (interaction: WorldInteraction) => void;
  onPlaceIdentity?: (socketId: string) => void;
  onPickupClue?: (id: string) => void;
  onFieldScan?: (scan: FieldScanState | null) => void;
  onSeekUpdate?: (seek: SeekGuide | null) => void;
  onSavePosition: (position: GridPosition) => void;
  onNearbyChange: (interaction: WorldInteraction | null) => void;
}

function nearbyDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

const GRID_MOVE_DIRS: Array<[number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1]
];

const MOVE_KEY_SET = new Set(["W", "A", "S", "D", "ARROWUP", "ARROWDOWN", "ARROWLEFT", "ARROWRIGHT"]);

function isMoveKey(key: string) {
  return MOVE_KEY_SET.has(key);
}

function passageAlongX(gateId: string) {
  const cells = GATE_PASSAGES[gateId];
  if (!cells?.length) return true;
  const first = cells[0]!;
  const last = cells[cells.length - 1]!;
  return Math.abs(last[0] - first[0]) >= Math.abs(last[1] - first[1]);
}

function colorHex(value: number) {
  return `#${value.toString(16).padStart(6, "0")}`;
}

class KnowledgeIslandScene {
  readonly scene = new THREE.Scene();
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.OrthographicCamera(-16, 16, 10, -10, 0.1, 180);
  private readonly root = new THREE.Group();
  private readonly interactiveRoot = new THREE.Group();
  private readonly artRoot = new THREE.Group();
  private readonly questTrail = new THREE.Group();
  private readonly walkMeshes: THREE.Object3D[] = [];
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly actor = new THREE.Group();
  private readonly actorModel = new THREE.Group();
  private readonly actorShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 20),
    new THREE.MeshBasicMaterial({ color: 0x1a1410, transparent: true, opacity: 0.28 })
  );
  private readonly actorSprite: THREE.Sprite;
  private actorReady = false;
  private actorFacing = Math.atan2(9.2, 11.4);
  private readonly propsRef: { current: GameCanvasProps };
  private readonly heldKeys = new Set<string>();
  private readonly walk: WalkMap = buildWalkMap();
  private readonly onKeyDown = (event: KeyboardEvent) => this.handleKeyDown(event);
  private readonly onKeyUp = (event: KeyboardEvent) => this.handleKeyUp(event);
  private readonly onBlur = () => {
    this.heldKeys.clear();
    this.queuedDirection = null;
    if (this.eHeld) {
      this.eHeld = false;
      this.finishScanHold();
    }
  };
  private queuedDirection: [number, number] | null = null;
  private moveContinuing = false;
  private moving: { from: THREE.Vector3; to: THREE.Vector3; targetX: number; targetY: number; elapsed: number; ease: "in" | "linear" | "out" | "inout"; after?: () => void } | null = null;
  private pathQueue: Array<[number, number]> | null = null;
  private guidedWalk = false;
  private leftoverMoveKeys = new Set<string>();
  private guideTokenSeen = 0;
  private stepsSinceSave = 0;
  private pendingInteract = false;
  private pendingTarget: { kind: string; id?: string; x: number; y: number } | null = null;
  private pendingSocketId: string | null = null;
  private carrySymbol: string | null = null;
  private eHeld = false;
  private scanAuto = false;
  private scanAcc = 0;
  private activeScanId: string | null = null;
  private scanEmitKey = "";
  private readonly scanProgress = new Map<string, number>();
  private readonly carrySprite: THREE.Sprite;
  private readonly seekArrow = new THREE.Group();
  private readonly identitySocketIds = ["1", "6", "8"];
  private playerGrid: GridPosition;
  private activeInteractionKey = "";
  private trailKey = "";
  private seekEmitKey = "";
  private readonly screenScratch = new THREE.Vector3();
  private frame = 0;
  private disposed = false;
  private artHud: HTMLDivElement | null = null;
  private readonly spriteScratch = new THREE.Vector3();
  private cameraViewHeight = 11.2;
  private cameraLookLift = 0.82;
  private cameraFocusReady = false;
  private readonly cameraFocus = new THREE.Vector3();
  private readonly camLook = new THREE.Vector3();
  private readonly camRight = new THREE.Vector3();
  private readonly camUp = new THREE.Vector3();
  private readonly ndcFeet = new THREE.Vector3();
  private readonly ndcHead = new THREE.Vector3();
  private readonly moveDesired = new THREE.Vector3();
  private readonly moveWorld = new THREE.Vector3();

  constructor(private readonly mount: HTMLDivElement, props: GameCanvasProps) {
    this.propsRef = { current: props };
    this.playerGrid = { ...props.player.position };
    if (new URLSearchParams(window.location.search).has("art")) {
      this.playerGrid = { x: spawnPosition.x, y: spawnPosition.y, z: this.surfaceY(spawnPosition.x, spawnPosition.y) };
    } else {
      const blocked = sealedGateCells(props.player.openedGateIds);
      const width = props.region.width;
      const height = props.region.height;
      const pathHome = findPath(this.walk, this.playerGrid.x, this.playerGrid.y, spawnPosition.x, spawnPosition.y, width, height, blocked);
      const stranded = !pathHome && (this.playerGrid.x !== spawnPosition.x || this.playerGrid.y !== spawnPosition.y);
      if (!canStandOnIsland(this.walk, this.playerGrid.x, this.playerGrid.y, width, height, blocked) || stranded) {
        const snapped = nearestWalkable(this.walk, spawnPosition.x, spawnPosition.y, 8, blocked) ?? spawnPosition;
        this.playerGrid = { x: snapped.x, y: snapped.y, z: this.surfaceY(snapped.x, snapped.y) };
      }
    }
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xead6b8, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.mount.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute("aria-label", "周期庭院探索场景");
    this.renderer.domElement.setAttribute("tabindex", "0");
    this.renderer.domElement.setAttribute("role", "application");
    const texture = travelerTexture();
    this.actorSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, transparent: true, depthTest: true, depthWrite: false, alphaTest: 0.12
    }));
    this.carrySprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glyphTexture("H", "#E7C56A"),
      transparent: true,
      depthTest: false,
      depthWrite: false
    }));
    this.carrySprite.center.set(0.5, 0);
    this.carrySprite.scale.set(0.36, 0.36, 1);
    this.carrySprite.position.set(0, 1.48, 0);
    this.carrySprite.visible = false;
    this.carrySprite.renderOrder = 12;
    this.actorSprite.center.set(0.5, 0.02);
    this.actorSprite.renderOrder = 8;
    this.setupScene();
    this.buildWorld();
    this.bindInput();
    this.resize();
    this.animate();
  }

  updateProps(props: GameCanvasProps) {
    const wasHudHold = Boolean(this.propsRef.current.hudScanHold);
    this.propsRef.current = props;
    if (this.activeScanId && props.player.inspectedClueIds.includes(this.activeScanId)) {
      this.scanProgress.delete(this.activeScanId);
      this.activeScanId = null;
      this.scanAuto = false;
      this.eHeld = false;
      this.emitScan();
    }
    if (props.hudScanHold) {
      const nearby = this.findNearbyInteraction();
      if (nearby?.kind === "field-clue" && !nearby.inspected) this.beginScan(nearby.id, false);
    } else if (wasHudHold && !this.eHeld) {
      this.finishScanHold();
    }
    this.syncCarriedSample();
    this.updateNearbyInteraction();
    const token = props.guideToken ?? 0;
    if (token !== this.guideTokenSeen) {
      this.guideTokenSeen = token;
      if (token > 0) this.guideToQuest();
    }
  }

  private surfaceY(x: number, y: number) {
    const base = surfaceAt(this.walk, x, y) ?? owningPlatform(x, y)?.surface ?? 1.05;
    return base + FLOOR_LIFT;
  }

  private gridWorld(x: number, y: number, cameraPush: number) {
    const point = gridToWorld(x, y);
    const pos = new THREE.Vector3(point.x, this.surfaceY(x, y), point.z);
    pos.add(towardCameraOffset(this.camera, pos, cameraPush));
    return { point, pos };
  }

  private shiftFromNeighbors(
    x: number,
    y: number,
    pos: THREE.Vector3,
    point: { x: number; z: number },
    towardWalls: boolean,
    amount: number
  ) {
    let ox = 0;
    let oz = 0;
    const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      const key = cellKey(x + dx, y + dy);
      if (towardWalls) {
        if (!this.walk.walls.has(key)) continue;
      } else if (this.walk.doors.has(key) || this.walk.height.has(key)) {
        continue;
      }
      const from = gridToWorld(x + dx, y + dy);
      ox += (towardWalls ? from.x - point.x : point.x - from.x) * amount;
      oz += (towardWalls ? from.z - point.z : point.z - from.z) * amount;
    }
    const maxShift = towardWalls ? 0.22 : 0.46;
    const length = Math.hypot(ox, oz);
    if (length > maxShift && length > 0) {
      ox *= maxShift / length;
      oz *= maxShift / length;
    }
    pos.x += ox;
    pos.z += oz;
    return pos;
  }

  private surfaceWorld(x: number, y: number) {
    const { point, pos } = this.gridWorld(x, y, 0.02);
    return this.shiftFromNeighbors(x, y, pos, point, false, 0.4);
  }

  private landmarkWorld(x: number, y: number) {
    const { point, pos } = this.gridWorld(x, y, 0.02);
    return this.shiftFromNeighbors(x, y, pos, point, true, 0.16);
  }

  resize() {
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    this.renderer.setSize(width, height, false);
    this.updateCamera();
  }

  private setupScene() {
    this.scene.fog = new THREE.Fog(0xe7d3b4, 18, 48);
    this.scene.background = new THREE.Color(0xead6b8);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(96, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false })
    );
    sky.rotation.y = 0.35;
    this.scene.add(sky);
    this.scene.add(this.root);
    this.artRoot.name = "quay-art";
    this.root.add(this.artRoot);
    this.root.add(this.interactiveRoot);
    this.questTrail.renderOrder = 4;
    this.root.add(this.questTrail);
    this.scene.add(new THREE.HemisphereLight(0xffe6cc, 0xa57b5c, 0.98));
    const sun = new THREE.DirectionalLight(0xffe4bd, 2.05);
    sun.position.set(-18, 28, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -38;
    sun.shadow.camera.right = 38;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -22;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 80;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9ec9c6, 0.72);
    fill.position.set(20, 10, -8);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xf6d7a0, 0.28);
    rim.position.set(8, 14, 22);
    this.scene.add(rim);
  }

  private material(value: number, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
    return new THREE.MeshStandardMaterial({
      color: value,
      roughness: 0.78,
      metalness: 0.04,
      flatShading: true,
      ...options
    });
  }

  private addBackdrop() {
    addDistantMesas(this.root);
  }

  private addWater() {
    addDesertAndLagoon(this.root);
  }

  private addPlatforms() {
    platforms.forEach((platform) => {
      const mass = terraceThickness(platform);
      const bodyTex = paintTexture(colorHex(platform.body), colorHex(platform.lip), colorHex(platform.floor), "plaster");
      const floorTex = plasterFloorTexture(colorHex(platform.floor), colorHex(platform.floor), colorHex(platform.lip));
      this.root.add(terraceBodyPrism(platform, platform.surface, mass, this.material(platform.body, { roughness: 0.9, map: bodyTex }), 0.04));
      this.root.add(terraceBodyPrism(platform, platform.surface + 0.04, 0.08, this.material(platform.lip, { roughness: 0.66 }), 0.12));
      const floor = walkFloorPrism(platform, platform.surface + FLOOR_LIFT, 0.06, this.material(platform.floor, { roughness: 0.86, map: floorTex }));
      floor.userData.walkable = true;
      this.walkMeshes.push(floor);
      this.root.add(floor);
      dressPlatform(this.root, platform, this.walk.doors, this.walkMeshes, {
        nicheXs: platform.id === "quay" ? [8, 11, 14] : []
      });
    });
  }

  private addBridges() {
    bridges.forEach((bridge) => {
      addStairBridge(this.root, this.walkMeshes, bridge.a, bridge.b, (x, y) => this.surfaceY(x, y), bridge.main);
    });
  }

  private buildWorld() {
    this.addWater();
    this.addBackdrop();
    this.addPlatforms();
    this.addBridges();
    this.addInteractiveLandmarks();
    this.addPlayer();
    this.mountImportedArt();
  }

  private mountImportedArt() {
    const quay = platforms.find((platform) => platform.id === "quay");
    const chip = document.createElement("div");
    chip.className = "art-load-chip";
    chip.setAttribute("role", "status");
    chip.textContent = `导入美术 0/${QUAY_ART_MODELS.length}`;
    this.mount.appendChild(chip);
    console.info("[kanshan-art] start", QUAY_ART_MODELS.length);
    this.artHud = chip;
    void mountQuayArt({
      worldRoot: this.artRoot,
      landmarks: this.interactiveRoot,
      surfaceY: (x, y) => this.surfaceY(x, y),
      quaySurface: (quay?.surface ?? 1.05) + FLOOR_LIFT,
      alive: () => !this.disposed,
      onProgress: (progress) => {
        console.info("[kanshan-art]", progress.loaded, "/", progress.total, progress.current ?? "", progress.error ?? "");
        if (!this.artHud) return;
        if (progress.error) {
          this.artHud.textContent = `美术失败 ${progress.current ?? ""} ${progress.error}`;
          return;
        }
        this.artHud.textContent = progress.loaded >= progress.total
          ? `美术已导入 ${progress.loaded}/${progress.total}`
          : `导入美术 ${progress.loaded}/${progress.total} ${progress.current ?? ""}`;
        if (progress.loaded >= progress.total) {
          stripArtById(this.root, ["forum-book"]);
          const left: string[] = [];
          this.root.traverse((node) => {
            const id = String(node.userData.artId ?? "");
            if (id) left.push(id);
          });
          this.artHud.textContent = `美术已导入 ${progress.loaded}/${progress.total} · ${left.join(",") || "无模型"}`;
          window.setTimeout(() => this.artHud?.remove(), 12000);
        }
      }
    }).catch((error) => {
      console.warn("Failed to mount quay art", error);
      if (this.artHud) this.artHud.textContent = `美术导入失败 ${String(error)}`;
    });
  }

  private addInteractiveLandmarks() {
    const props = this.propsRef.current;
    props.region.categories.forEach((category) => {
      const cell = artLandmarkCell("category", category.id) ?? category.position;
      const group = this.addGroup(cell, "category", category.id);
      const zoneColor = hexColor(category.color);
      addOpenBook(group, { accent: zoneColor, compact: category.id === "atomic-forum" });
      addLandmarkKit(group, 1.42, category.id === "atomic-forum" ? "按 E 打开" : "按 E");
      addQuestNameplate(
        group,
        category.id === "atomic-forum" ? "原子论坛" : category.name,
        category.id === "atomic-forum" ? "点出元素规律" : "按 E 打开读经台",
        2.38
      );
      group.visible = !category.hidden || category.prerequisiteSkillIds.every((id) => props.player.unlockedSkillIds.includes(id));
    });
    props.region.fieldClues.forEach((clue) => {
      const group = this.addGroup(clue.position, "field-clue", clue.id);
      const spec = ATOM_SPEC[clue.id];
      if (spec) addAtomOrreryLandmark(group, spec);
      addLandmarkKit(group, 1.85, "按住 E 数质子");
      const titles: Record<string, [string, string]> = {
        "atom-hydrogen": ["氢原子", "先数 1 个金色质子"],
        "atom-carbon": ["碳原子", "数 6 个金色质子"],
        "atom-oxygen": ["氧原子", "数 8 个金色质子"]
      };
      const plate = titles[clue.id] ?? ["发光原子", "按住 E 扫描"];
      addQuestNameplate(group, plate[0], plate[1], 3.42);
    });
    microPuzzleDefinitions.forEach((puzzle) => {
      const cell = artLandmarkCell("micro-puzzle", puzzle.id) ?? puzzle.position;
      const group = this.addGroup(cell, "micro-puzzle", puzzle.id);
      if (puzzle.id !== "element-symbol-memory") {
        addOpenBook(group, {
          accent: puzzle.color,
          letters: puzzle.puzzleKind === "symbol-memory" ? ["H", "C", "O"] : undefined
        });
      }
      addLandmarkKit(group, 1.35, "按 E 练习");
    });
    props.region.gates.forEach((gate) => {
      const group = this.addGroup(gate.position, "gate", gate.id);
      const opened = props.player.openedGateIds.includes(gate.id);
      const alongX = passageAlongX(gate.id);
      if (gate.id === "gate-atomic-forum") {
        addKeystoneGate(group, this.identitySocketIds.map((socketId) => Boolean(props.placedSymbols?.[socketId])), opened);
        addQuestNameplate(group, "身份门", "放入 1 · 6 · 8", 2.72);
      } else {
        addMonumentGate(group, opened, alongX);
        addQuestNameplate(group, gate.label, "打开通路", 2.42);
        const passage = GATE_PASSAGES[gate.id]?.[0];
        if (passage) {
          const seal = this.addGroup({ x: passage[0], y: passage[1] }, "gate", gate.id);
          addSealedArch(seal, opened, alongX);
        }
      }
      addLandmarkKit(group, 1.48, gate.id === "gate-atomic-forum" ? "放入 1 6 8" : "按 E 开门");
    });
    props.region.worldHooks.forEach((hook) => {
      const group = this.addGroup(hook.position, "world-hook", hook.id);
      const discovered = props.player.discoveredWorldHookIds.includes(hook.id);
      if (hook.id === "blank-element-tile") addBlankTenTile(group, discovered);
      else if (hook.id === "noble-gas-pavilion") addNobleLanterns(group, discovered);
      else if (hook.id === "water-molecule-arch") addWaterMoleculeProp(group, discovered);
      else if (hook.id === "carbon-fourteen-echo") addCarbonEchoProp(group, discovered);
      else {
        const hookColor = hook.kind === "rare-phenomenon" ? 0xe77e9d : hook.kind === "memory-echo" ? 0x75c5d4 : 0xe8c56a;
        addHookInlay(group, hookColor);
      }
      addLandmarkKit(group, 1.32, "按 E 调查");
      addQuestNameplate(group, hook.label, "按 E 调查", 2.32);
    });
    const liu = this.addGroup(liuPosition, "liu");
    const liuMap = new THREE.TextureLoader().load("/assets/liu-kanshan/computer.png");
    liuMap.colorSpace = THREE.SRGBColorSpace;
    const liuSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: liuMap, transparent: true, depthTest: true, depthWrite: false, alphaTest: 0.38 }));
    liuSprite.center.set(0.5, 0.02);
    liuSprite.scale.set(0.48, 0.48, 1);
    liuSprite.position.set(0, 0.02, 0);
    liuSprite.renderOrder = 8;
    liuSprite.userData.billboard = true;
    liu.add(liuSprite);
    addLandmarkKit(liu, 1.32, "可以问路");
    if (props.dailyRift) {
      const rift = this.addGroup(dailyRiftPosition, "rift");
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 8, 24), new THREE.MeshBasicMaterial({ color: 0x75c5d4, transparent: true, opacity: 0.8 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.02;
      rift.add(ring);
      addLandmarkKit(rift, 1.32, "每日异闻");
    }
  }

  private nestleToward(position: { x: number; y: number }, dx: number, dy: number, amount: number) {
    const origin = gridToWorld(position.x, position.y);
    const toward = gridToWorld(position.x + dx, position.y + dy);
    return {
      x: (toward.x - origin.x) * amount,
      z: (toward.z - origin.z) * amount
    };
  }

  private addGroup(position: { x: number; y: number }, kind: string, id?: string) {
    const group = new THREE.Group();
    if (kind === "field-clue") {
      const { pos } = this.gridWorld(position.x, position.y, 0.02);
      group.position.copy(pos);
      const shift = this.nestleToward(position, 0, 1, QUAY_COURTYARD_NESTLE);
      group.position.x += shift.x;
      group.position.z += shift.z;
      group.position.y += 0.02;
    } else if (kind === "liu") {
      const { pos } = this.gridWorld(position.x, position.y, 0.02);
      group.position.copy(pos);
      const shift = this.nestleToward(position, -1, 0, QUAY_LIU_NESTLE);
      group.position.x += shift.x;
      group.position.z += shift.z;
      group.position.y += 0.02;
    } else {
      group.position.copy(this.landmarkWorld(position.x, position.y));
      if (kind === "category" && id === "atomic-forum") {
        const left = this.nestleToward(position, 0, 1, QUAY_FORUM_LEFT_NESTLE);
        group.position.x += left.x;
        group.position.z += left.z;
      }
      if (kind === "gate" && id === "gate-atomic-forum" && position.x === 15 && position.y === 25) {
        const shift = this.nestleToward(position, -1, 0, QUAY_GATE_UP_NESTLE);
        const left = this.nestleToward(position, 0, 1, QUAY_GATE_LEFT_NESTLE);
        group.position.x += shift.x + left.x;
        group.position.z += shift.z + left.z;
      }
    }
    group.userData.kind = kind;
    group.userData.gridX = position.x;
    group.userData.gridY = position.y;
    if (id) group.userData.id = id;
    this.interactiveRoot.add(group);
    return group;
  }

  private addPlayer() {
    this.actor.position.copy(this.surfaceWorld(this.playerGrid.x, this.playerGrid.y));
    this.actorShadow.rotation.x = -Math.PI / 2;
    this.actorShadow.position.y = 0.018;
    this.actor.add(this.actorShadow);
    const playerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.22, 28),
      new THREE.MeshBasicMaterial({
        color: 0xe7c56a,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
        fog: false
      })
    );
    playerRing.rotation.x = -Math.PI / 2;
    playerRing.position.y = 0.04;
    playerRing.renderOrder = 6;
    playerRing.userData.role = "player-ring";
    this.actor.add(playerRing);
    this.actorSprite.center.set(0.5, 0.02);
    this.actorSprite.scale.set(1.12, 1.12, 1);
    this.actorSprite.position.set(0, 0.02, 0);
    this.actor.add(this.actorSprite);
    this.actorModel.rotation.y = this.actorFacing;
    this.actor.add(this.actorModel);
    this.actor.add(this.carrySprite);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0xe7c56a,
      transparent: true,
      opacity: 0.98,
      depthTest: false,
      depthWrite: false,
      fog: false
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.78, 10), arrowMat);
    cone.rotation.x = Math.PI / 2;
    cone.position.z = 1.18;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 10), arrowMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.z = 0.68;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 20),
      new THREE.MeshBasicMaterial({
        color: 0xfff1b0,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false,
        fog: false
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.03;
    this.seekArrow.add(cone, tail, disc);
    this.seekArrow.position.y = 0.08;
    this.seekArrow.renderOrder = 20;
    this.actor.add(this.seekArrow);
    this.root.add(this.actor);
    this.loadPlayerModel();
  }

  private loadPlayerModel() {
    void loadPlayerAvatar().then((avatar) => {
      if (this.disposed) return;
      this.actorModel.clear();
      this.actorModel.add(avatar);
      this.actorReady = true;
      this.actorSprite.visible = false;
    }).catch((error) => {
      console.warn("Failed to load player avatar", error);
    });
  }

  private syncCarriedSample() {
    const symbol = this.propsRef.current.heldSymbol ?? null;
    this.carrySprite.visible = Boolean(symbol);
    if (!symbol || symbol === this.carrySymbol) return;
    this.carrySymbol = symbol;
    const material = this.carrySprite.material as THREE.SpriteMaterial;
    material.map = glyphTexture(symbol, "#E7C56A");
    material.needsUpdate = true;
  }

  private bindInput() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.addEventListener("pointerdown", () => this.renderer.domElement.focus());
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (this.propsRef.current.inputBlocked || this.guidedWalk) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const interactiveHit = this.raycaster.intersectObjects(this.interactiveRoot.children, true)[0];
    if (interactiveHit) {
      let node: THREE.Object3D | null = interactiveHit.object;
      let slotIndex: number | undefined;
      let landmark: THREE.Object3D | null = null;
      while (node) {
        if (node.userData.role === "slot" && typeof node.userData.slotIndex === "number") {
          slotIndex = node.userData.slotIndex;
        }
        if (node.parent === this.interactiveRoot) {
          landmark = node;
          break;
        }
        node = node.parent;
      }
      if (
        landmark &&
        landmark.userData.kind === "gate" &&
        landmark.userData.id === "gate-atomic-forum" &&
        slotIndex !== undefined &&
        this.propsRef.current.onPlaceIdentity
      ) {
        this.tryPlaceIdentitySocket(landmark, slotIndex);
        return;
      }
      if (landmark && typeof landmark.userData.gridX === "number") {
        this.tryInteractWith(
          String(landmark.userData.kind ?? ""),
          typeof landmark.userData.id === "string" ? landmark.userData.id : undefined,
          landmark.userData.gridX as number,
          landmark.userData.gridY as number
        );
        return;
      }
    }
    const hit = this.raycaster.intersectObjects(this.walkMeshes, false)[0]
      ?? this.raycaster.intersectObjects(this.root.children.filter((object) => object !== this.actor), true)[0];
    if (!hit) return;
    const grid = worldToGrid(hit.point.x, hit.point.z);
    const snapped = nearestWalkable(this.walk, grid.x, grid.y, 2, this.blockedSet());
    if (!snapped) return;
    if (nearbyDistance(this.playerGrid, snapped) > 18) return;
    this.pendingInteract = false;
    this.walkTowards(snapped.x, snapped.y);
  };

  private handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toUpperCase();
    const moveKey = isMoveKey(key);
    if (moveKey) event.preventDefault();
    if (event.repeat) return;
    if (key === "E" && !this.propsRef.current.inputBlocked) {
      if (this.guidedWalk) return;
      const interaction = this.findNearbyInteraction();
      if (interaction?.kind === "field-clue" && !interaction.inspected && !this.isOutOfOrderAtom(interaction)) {
        event.preventDefault();
        this.eHeld = true;
        const marked = this.scanProgress.get(interaction.id) ?? 0;
        if (marked >= this.protonTotal(interaction.id)) {
          this.activeScanId = interaction.id;
          this.pickupIfReady();
          return;
        }
        this.beginScan(interaction.id, false);
        return;
      }
      if (interaction) {
        event.preventDefault();
        this.activateInteraction(interaction);
      }
      return;
    }
    if (!moveKey) return;
    if (this.propsRef.current.inputBlocked) return;
    if (this.guidedWalk) {
      if (this.leftoverMoveKeys.has(key)) {
        this.heldKeys.add(key);
        return;
      }
      this.endGuidedWalk();
    }
    this.leftoverMoveKeys.clear();
    this.heldKeys.add(key);
    this.consumeHeldDirection();
  }

  private handleKeyUp(event: KeyboardEvent) {
    const key = event.key.toUpperCase();
    this.heldKeys.delete(key);
    if (key === "E" && this.eHeld) {
      this.eHeld = false;
      this.finishScanHold();
    }
  }

  private heldMoveDirection(): [number, number] | null {
    let forward = 0;
    let right = 0;
    if (this.heldKeys.has("W") || this.heldKeys.has("ARROWUP")) forward += 1;
    if (this.heldKeys.has("S") || this.heldKeys.has("ARROWDOWN")) forward -= 1;
    if (this.heldKeys.has("D") || this.heldKeys.has("ARROWRIGHT")) right += 1;
    if (this.heldKeys.has("A") || this.heldKeys.has("ARROWLEFT")) right -= 1;
    if (forward === 0 && right === 0) return null;
    this.camera.getWorldDirection(this.camLook);
    this.camLook.y = 0;
    if (this.camLook.lengthSq() < 0.0001) this.camLook.set(-1, 0, -1);
    this.camLook.normalize();
    this.camRight.crossVectors(this.camLook, this.actor.up).normalize();
    this.moveDesired.copy(this.camLook).multiplyScalar(forward).addScaledVector(this.camRight, right);
    if (this.moveDesired.lengthSq() < 0.0001) return null;
    this.moveDesired.normalize();
    let best: [number, number] = GRID_MOVE_DIRS[0]!;
    let bestDot = Number.NEGATIVE_INFINITY;
    for (const dir of GRID_MOVE_DIRS) {
      const world = gridToWorld(dir[0], dir[1]);
      this.moveWorld.set(world.x, 0, world.z).normalize();
      const dot = this.moveWorld.dot(this.moveDesired);
      if (dot > bestDot) {
        bestDot = dot;
        best = dir;
      }
    }
    return best;
  }

  private blockedSet() {
    return sealedGateCells(this.propsRef.current.player.openedGateIds, this.playerGrid);
  }

  private leftoverMoveOnly() {
    const held = [...this.heldKeys].filter(isMoveKey);
    if (!held.length) {
      this.leftoverMoveKeys.clear();
      return false;
    }
    return held.every((key) => this.leftoverMoveKeys.has(key));
  }

  private beginGuidedWalk() {
    this.guidedWalk = true;
    this.leftoverMoveKeys = new Set([...this.heldKeys].filter(isMoveKey));
    this.queuedDirection = null;
    this.eHeld = false;
    this.scanAuto = false;
  }

  private endGuidedWalk(options?: { arrived?: boolean; keepPending?: boolean }) {
    this.guidedWalk = false;
    this.pathQueue = null;
    if (!options?.keepPending) {
      this.pendingInteract = false;
      this.pendingTarget = null;
      this.pendingSocketId = null;
    }
    this.leftoverMoveKeys = options?.arrived
      ? new Set([...this.heldKeys].filter(isMoveKey))
      : new Set();
  }

  private consumeHeldDirection() {
    if (this.propsRef.current.inputBlocked || this.guidedWalk || this.leftoverMoveOnly()) {
      this.queuedDirection = null;
      return;
    }
    const direction = this.heldMoveDirection();
    this.queuedDirection = direction;
    if (!direction || this.moving) return;
    this.tryMove(direction[0], direction[1]);
  }

  private tryMove(dx: number, dy: number) {
    if (this.moving) return;
    const region = this.propsRef.current.region;
    const blocked = this.blockedSet();
    const stand = (x: number, y: number) => canStandOnIsland(this.walk, x, y, region.width, region.height, blocked);
    const fromX = this.playerGrid.x;
    const fromY = this.playerGrid.y;
    const destX = fromX + dx;
    const destY = fromY + dy;
    if (stand(destX, destY)) {
      this.movePlayer(destX, destY);
      return;
    }
    if (dx !== 0 && dy !== 0) {
      if (stand(fromX + dx, fromY)) {
        this.movePlayer(fromX + dx, fromY);
        return;
      }
      if (stand(fromX, fromY + dy)) {
        this.movePlayer(fromX, fromY + dy);
      }
      return;
    }
    const destKey = cellKey(destX, destY);
    const blockedByProp = !this.walk.walls.has(destKey) && !this.walk.height.has(destKey);
    if (!blockedByProp) return;
    const slides: Array<[number, number]> = dx !== 0
      ? [[destX, fromY + 1], [destX, fromY - 1]]
      : [[fromX + 1, destY], [fromX - 1, destY]];
    for (const [sx, sy] of slides) {
      if (stand(sx, sy)) {
        this.movePlayer(sx, sy);
        return;
      }
    }
  }

  private walkTowards(targetX: number, targetY: number) {
    const region = this.propsRef.current.region;
    const path = findPath(this.walk, this.playerGrid.x, this.playerGrid.y, targetX, targetY, region.width, region.height, this.blockedSet());
    if (!path) {
      this.endGuidedWalk();
      return;
    }
    if (path.length === 0) {
      if (this.pendingInteract) this.finishPendingInteract();
      else this.endGuidedWalk({ arrived: true });
      return;
    }
    this.pathQueue = path;
    if (this.moving) {
      this.moving.after = () => this.advancePath();
      return;
    }
    this.advancePath();
  }

  private guideToQuest() {
    const target = this.seekTargetGroup();
    if (!target || typeof target.userData.gridX !== "number" || typeof target.userData.gridY !== "number") {
      this.endGuidedWalk();
      return;
    }
    this.beginGuidedWalk();
    this.tryInteractWith(
      String(target.userData.kind ?? ""),
      typeof target.userData.id === "string" ? target.userData.id : undefined,
      target.userData.gridX,
      target.userData.gridY
    );
  }

  private advancePath() {
    if (this.moving || !this.pathQueue) return;
    const next = this.pathQueue.shift();
    if (!next) {
      this.pathQueue = null;
      if (this.guidedWalk && !this.pendingInteract) this.endGuidedWalk({ arrived: true });
      return;
    }
    this.movePlayer(next[0], next[1], () => this.advancePath());
  }

  private movePlayer(x: number, y: number, after?: () => void) {
    const to = this.surfaceWorld(x, y);
    const dx = to.x - this.actor.position.x;
    const dz = to.z - this.actor.position.z;
    if (dx * dx + dz * dz > 0.0001) this.actorFacing = Math.atan2(dx, dz);
    const holding = this.heldMoveDirection() !== null;
    const ease = holding ? "linear" : this.moveContinuing ? "out" : "inout";
    this.moveContinuing = holding;
    this.moving = { from: this.actor.position.clone(), to, targetX: x, targetY: y, elapsed: 0, ease, after };
  }

  private interactionFromLandmark(kind: string, id?: string): WorldInteraction | null {
    const props = this.propsRef.current;
    if (kind === "field-clue" && id) {
      const clue = props.region.fieldClues.find((item) => item.id === id);
      if (!clue) return null;
      const inspected = props.player.inspectedClueIds.includes(id);
      return {
        kind: "field-clue",
        id,
        label: inspected ? clue.label : (id === "atom-hydrogen" ? "氢原子" : id === "atom-carbon" ? "碳原子" : id === "atom-oxygen" ? "氧原子" : "发光原子"),
        inspected
      };
    }
    if (kind === "gate" && id) {
      const gate = props.region.gates.find((item) => item.id === id);
      if (!gate) return null;
      const cluesMet = gate.requiredClueIds.every((clueId) => props.player.inspectedClueIds.includes(clueId));
      const previewable = gate.id === "gate-atomic-forum";
      return {
        kind: "gate",
        id: gate.id,
        label: gate.label,
        locked: !gate.requiredSkillIds.every((skillId) => props.player.unlockedSkillIds.includes(skillId)) || (!previewable && !cluesMet),
        opened: props.player.openedGateIds.includes(gate.id)
      };
    }
    if (kind === "category" && id) {
      const category = props.region.categories.find((item) => item.id === id);
      if (!category) return null;
      return {
        kind: "category",
        id: category.id,
        label: category.name,
        locked:
          !category.prerequisiteSkillIds.every((skillId) => props.player.unlockedSkillIds.includes(skillId)) ||
          Boolean(props.region.gates.find((item) => item.categoryId === category.id && !props.player.openedGateIds.includes(item.id))),
        completed: props.player.completedCategoryIds.includes(category.id)
      };
    }
    if (kind === "micro-puzzle" && id) {
      const puzzle = microPuzzleDefinitions.find((item) => item.id === id);
      if (!puzzle) return null;
      return {
        kind: "micro-puzzle",
        ...puzzle,
        solved: props.completedMicroPuzzleIds.includes(puzzle.id),
        locked: false
      };
    }
    if (kind === "liu") return { kind: "liu", label: "和刘看山谈谈" };
    if (kind === "rift") return props.dailyRift ? { kind: "rift", label: "调查今日裂隙" } : null;
    if (kind === "world-hook" && id) {
      const hook = props.region.worldHooks.find((item) => item.id === id);
      if (!hook) return null;
      return {
        kind: "world-hook",
        id: hook.id,
        label: hook.label,
        title: hook.title,
        locked: !hook.requiredSkillIds.every((skillId) => props.player.unlockedSkillIds.includes(skillId)),
        discovered: props.player.discoveredWorldHookIds.includes(hook.id)
      };
    }
    return null;
  }

  private tryPlaceIdentitySocket(group: THREE.Object3D, slotIndex: number) {
    const socketId = this.identitySocketIds[slotIndex];
    if (!socketId || !this.propsRef.current.onPlaceIdentity) return;
    const gridX = group.userData.gridX as number;
    const gridY = group.userData.gridY as number;
    if (nearbyDistance(this.playerGrid, { x: gridX, y: gridY }) <= INTERACT_RANGE) {
      this.endGuidedWalk({ arrived: true });
      this.propsRef.current.onPlaceIdentity(socketId);
      return;
    }
    const snapped = nearestWalkable(this.walk, gridX, gridY, 2, this.blockedSet());
    if (!snapped || nearbyDistance(this.playerGrid, snapped) > 18) {
      this.endGuidedWalk();
      return;
    }
    this.pendingSocketId = socketId;
    this.pendingTarget = { kind: "gate", id: String(group.userData.id ?? "gate-atomic-forum"), x: gridX, y: gridY };
    this.pendingInteract = true;
    if (snapped.x === this.playerGrid.x && snapped.y === this.playerGrid.y) {
      this.finishPendingInteract();
      return;
    }
    this.walkTowards(snapped.x, snapped.y);
  }

  private tryInteractWith(kind: string, id: string | undefined, gridX: number, gridY: number) {
    const interaction = this.interactionFromLandmark(kind, id);
    if (!interaction) {
      this.endGuidedWalk();
      return;
    }
    if (nearbyDistance(this.playerGrid, { x: gridX, y: gridY }) <= INTERACT_RANGE) {
      this.endGuidedWalk({ arrived: true });
      this.activateInteraction(interaction);
      return;
    }
    const snapped = nearestWalkable(this.walk, gridX, gridY, 2, this.blockedSet());
    if (!snapped || nearbyDistance(this.playerGrid, snapped) > 18) {
      this.endGuidedWalk();
      return;
    }
    this.pendingTarget = { kind, id, x: gridX, y: gridY };
    this.pendingInteract = true;
    if (snapped.x === this.playerGrid.x && snapped.y === this.playerGrid.y) {
      this.finishPendingInteract();
      return;
    }
    this.walkTowards(snapped.x, snapped.y);
  }

  private finishPendingInteract() {
    const target = this.pendingTarget;
    const socketId = this.pendingSocketId;
    const wasGuided = this.guidedWalk;
    this.pendingInteract = false;
    this.pendingTarget = null;
    this.pendingSocketId = null;
    this.endGuidedWalk({ arrived: wasGuided });
    if (socketId) {
      this.propsRef.current.onPlaceIdentity?.(socketId);
      return;
    }
    if (!target) {
      const interaction = this.findNearbyInteraction(INTERACT_RANGE);
      if (interaction) this.activateInteraction(interaction);
      return;
    }
    if (nearbyDistance(this.playerGrid, { x: target.x, y: target.y }) > INTERACT_RANGE) return;
    const interaction = this.interactionFromLandmark(target.kind, target.id);
    if (interaction) this.activateInteraction(interaction);
  }

  private protonTotal(id: string) {
    return ATOM_SPEC[id]?.protons ?? 1;
  }

  private isScanHolding() {
    return this.eHeld || Boolean(this.propsRef.current.hudScanHold);
  }

  private emitScan() {
    const id = this.activeScanId;
    const payload = id
      ? {
          id,
          marked: this.scanProgress.get(id) ?? 0,
          total: this.protonTotal(id),
          complete: (this.scanProgress.get(id) ?? 0) >= this.protonTotal(id),
          holding: this.isScanHolding() || this.scanAuto
        }
      : null;
    const key = payload ? JSON.stringify(payload) : "";
    if (key === this.scanEmitKey) return;
    this.scanEmitKey = key;
    this.propsRef.current.onFieldScan?.(payload);
  }

  private beginScan(id: string, auto: boolean) {
    if (this.propsRef.current.player.inspectedClueIds.includes(id)) return;
    this.activeScanId = id;
    this.scanAuto = auto;
    if (!this.scanProgress.has(id)) this.scanProgress.set(id, 0);
    this.emitScan();
    this.syncLandmarks();
  }

  private finishScanHold() {
    if (this.scanAuto) return;
    if (this.activeScanId && (this.scanProgress.get(this.activeScanId) ?? 0) >= this.protonTotal(this.activeScanId)) {
      this.pickupIfReady();
      return;
    }
    this.emitScan();
  }

  private pickupIfReady() {
    const id = this.activeScanId;
    if (!id) return false;
    if ((this.scanProgress.get(id) ?? 0) < this.protonTotal(id)) return false;
    this.propsRef.current.onPickupClue?.(id);
    this.scanProgress.delete(id);
    this.activeScanId = null;
    this.scanAuto = false;
    this.eHeld = false;
    this.emitScan();
    this.syncLandmarks();
    return true;
  }

  private isOutOfOrderAtom(interaction: WorldInteraction) {
    if (interaction.kind !== "field-clue" || interaction.inspected) return false;
    const hint = this.propsRef.current.questHint;
    return hint?.kind === "field-clue" && Boolean(hint.id) && hint.id !== interaction.id;
  }

  private activateInteraction(interaction: WorldInteraction) {
    if (interaction.kind === "field-clue" && !interaction.inspected) {
      if (this.isOutOfOrderAtom(interaction)) {
        this.propsRef.current.onInteract(interaction);
        return;
      }
      const marked = this.scanProgress.get(interaction.id) ?? 0;
      if (marked >= this.protonTotal(interaction.id)) {
        this.activeScanId = interaction.id;
        this.pickupIfReady();
        return;
      }
      this.beginScan(interaction.id, true);
      return;
    }
    this.propsRef.current.onInteract(interaction);
  }

  private matchesQuestHint(interaction: WorldInteraction | null) {
    const hint = this.propsRef.current.questHint;
    if (!hint || !interaction) return false;
    return interaction.kind === hint.kind && (!hint.id || ("id" in interaction && interaction.id === hint.id));
  }

  private findNearbyInteraction(maxDistance = INTERACT_RANGE): WorldInteraction | null {
    const props = this.propsRef.current;
    const matches: Array<{ distance: number; interaction: WorldInteraction }> = [];
    const consider = (x: number, y: number, interaction: WorldInteraction | null) => {
      if (!interaction) return;
      const distance = nearbyDistance(this.playerGrid, { x, y });
      if (distance <= maxDistance) matches.push({ distance, interaction });
    };
    props.region.fieldClues.forEach((clue) => consider(clue.position.x, clue.position.y, this.interactionFromLandmark("field-clue", clue.id)));
    props.region.gates.forEach((gate) => {
      const interaction = this.interactionFromLandmark("gate", gate.id);
      consider(gate.position.x, gate.position.y, interaction);
      GATE_PASSAGES[gate.id]?.forEach(([x, y]) => consider(x, y, interaction));
    });
    props.region.categories.forEach((category) => {
      const cell = artLandmarkCell("category", category.id) ?? category.position;
      consider(cell.x, cell.y, this.interactionFromLandmark("category", category.id));
    });
    microPuzzleDefinitions.forEach((puzzle) => {
      const cell = artLandmarkCell("micro-puzzle", puzzle.id) ?? puzzle.position;
      consider(cell.x, cell.y, this.interactionFromLandmark("micro-puzzle", puzzle.id));
    });
    consider(liuPosition.x, liuPosition.y, this.interactionFromLandmark("liu"));
    if (props.dailyRift) consider(dailyRiftPosition.x, dailyRiftPosition.y, this.interactionFromLandmark("rift"));
    props.region.worldHooks.forEach((hook) => consider(hook.position.x, hook.position.y, this.interactionFromLandmark("world-hook", hook.id)));
    if (!matches.length) return null;
    const isDistractor = (kind: WorldInteraction["kind"]) =>
      kind === "liu" || kind === "rift" || kind === "micro-puzzle" || kind === "world-hook";
    const hinted = matches
      .filter((item) => this.matchesQuestHint(item.interaction) && item.distance <= INTERACT_RANGE)
      .sort((a, b) => a.distance - b.distance)[0];
    if (hinted) return hinted.interaction;
    if (props.heldSymbol) {
      const gate = matches.find((item) =>
        item.interaction.kind === "gate" &&
        !item.interaction.opened &&
        !item.interaction.locked &&
        item.distance <= INTERACT_RANGE
      );
      if (gate) return gate.interaction;
    }
    const usable = matches.filter((item) => {
      if (item.distance > INTERACT_RANGE) return false;
      if (isDistractor(item.interaction.kind) && item.distance > 1) return false;
      return true;
    });
    if (!usable.length) return null;
    usable.sort((a, b) => {
      const rank = (item: (typeof usable)[number]) => {
        if (item.interaction.kind === "field-clue" && !item.interaction.inspected) return 0;
        if (item.interaction.kind === "gate" && !item.interaction.opened) return 1;
        if (item.interaction.kind === "category" && !item.interaction.completed) return 2;
        return 3;
      };
      const rankDiff = rank(a) - rank(b);
      return rankDiff !== 0 ? rankDiff : a.distance - b.distance;
    });
    return usable[0]!.interaction;
  }

  private landmarkMatches(group: THREE.Object3D, interaction: WorldInteraction | null) {
    if (!interaction) return false;
    if (group.userData.kind !== interaction.kind) return false;
    if ("id" in interaction) return group.userData.id === interaction.id;
    return true;
  }

  private syncLandmarks(interaction = this.findNearbyInteraction()) {
    const props = this.propsRef.current;
    this.interactiveRoot.children.forEach((group) => {
      const kind = group.userData.kind as string;
      const id = group.userData.id as string | undefined;
      let lit = false;
      let visible = true;
      let slots: boolean[] | undefined;
      if (kind === "field-clue" && id) lit = props.player.inspectedClueIds.includes(id);
      if (kind === "micro-puzzle" && id) lit = props.completedMicroPuzzleIds.includes(id);
      if (kind === "category" && id) {
        const category = props.region.categories.find((item) => item.id === id);
        lit = props.player.completedCategoryIds.includes(id);
        if (category?.hidden) {
          visible = category.prerequisiteSkillIds.every((skillId) => props.player.unlockedSkillIds.includes(skillId));
        }
      }
      if (kind === "gate" && id) {
        lit = props.player.openedGateIds.includes(id);
        if (id === "gate-atomic-forum") {
          const placed = props.placedSymbols ?? {};
          slots = this.identitySocketIds.map((socketId) => Boolean(placed[socketId]));
        }
      }
      if (kind === "world-hook" && id) lit = props.player.discoveredWorldHookIds.includes(id);
      group.visible = visible;
      const hint = props.questHint;
      const isQuest = Boolean(hint && kind === hint.kind && (!hint.id || id === hint.id));
      const uninspectedAtom = kind === "field-clue" && Boolean(id && !props.player.inspectedClueIds.includes(id));
      const placed = props.placedSymbols ?? {};
      const held = props.heldSymbol;
      const matches = kind === "gate" && id === "gate-atomic-forum"
        ? this.identitySocketIds.map((socketId, index) => held === ["H", "C", "O"][index] && !placed[socketId])
        : undefined;
      const scanMarked = kind === "field-clue" && id ? (this.scanProgress.get(id) ?? 0) : 0;
      const scanComplete = Boolean(uninspectedAtom && id && scanMarked >= this.protonTotal(id));
      const ownNearby = nearbyDistance(this.playerGrid, { x: group.userData.gridX as number, y: group.userData.gridY as number }) <= INTERACT_RANGE;
      const nearby = this.landmarkMatches(group, interaction) && ownNearby;
      const seek = isQuest && !nearby;
      const idle = false;
      syncLandmarkVisual(group as THREE.Group, {
        nearby,
        seek,
        idle,
        quest: isQuest,
        lit,
        slots,
        matches,
        scanMarked,
        scanComplete
      });
    });
  }

  private seekTargetGroup() {
    const hint = this.propsRef.current.questHint;
    return this.interactiveRoot.children.find((group) => {
      if (!hint) {
        return group.userData.kind === "field-clue" && Boolean(group.userData.seekPulse);
      }
      if (group.userData.kind !== hint.kind) return false;
      return !hint.id || group.userData.id === hint.id;
    }) ?? this.interactiveRoot.children.find((group) => Boolean(group.userData.seekPulse)) ?? null;
  }

  private seekLabelFor(group: THREE.Object3D) {
    const kind = String(group.userData.kind ?? "");
    const id = typeof group.userData.id === "string" ? group.userData.id : "";
    if (kind === "field-clue") {
      if (id === "atom-hydrogen") return "氢原子";
      if (id === "atom-carbon") return "碳原子";
      if (id === "atom-oxygen") return "氧原子";
      return "发光原子";
    }
    if (kind === "gate") return id === "gate-atomic-forum" ? "身份门" : "通路机关";
    if (kind === "category") return id === "atomic-forum" ? "原子论坛" : "读经台";
    if (kind === "micro-puzzle") return "现场机关";
    if (kind === "liu") return "刘看山";
    if (kind === "rift") return "今日裂隙";
    return "下一个目标";
  }

  private seekActionFor(group: THREE.Object3D, nearby: boolean) {
    const kind = String(group.userData.kind ?? "");
    if (!nearby) return "跟着金光柱和金色脚印走";
    if (kind === "field-clue") return "按住 E 扫描金色质子";
    if (kind === "gate") return this.propsRef.current.heldSymbol ? "把符号放入门格" : "点样本袋拿起符号";
    if (kind === "category") return "按 E 打开读经台";
    if (kind === "micro-puzzle") return "按 E 开始现场练习";
    return "按 E 互动";
  }

  private emitSeek(interaction: WorldInteraction | null) {
    const target = this.seekTargetGroup();
    if (!target || typeof target.userData.gridX !== "number") {
      if (this.seekEmitKey !== "") {
        this.seekEmitKey = "";
        this.propsRef.current.onSeekUpdate?.(null);
      }
      return;
    }
    this.screenScratch.copy(this.actor.position).project(this.camera);
    const ax = this.screenScratch.x;
    const ay = this.screenScratch.y;
    this.screenScratch.copy(target.position).project(this.camera);
    const angle = Math.atan2(this.screenScratch.x - ax, this.screenScratch.y - ay) * (180 / Math.PI);
    const nearby = this.landmarkMatches(target, interaction);
    const payload = {
      label: this.seekLabelFor(target),
      action: this.seekActionFor(target, nearby),
      distance: nearbyDistance(this.playerGrid, { x: target.userData.gridX as number, y: target.userData.gridY as number }),
      nearby,
      angle: Math.round(angle / 3) * 3
    };
    const key = JSON.stringify(payload);
    if (key === this.seekEmitKey) return;
    this.seekEmitKey = key;
    this.propsRef.current.onSeekUpdate?.(payload);
  }

  private rebuildQuestTrail() {
    const target = this.seekTargetGroup();
    const region = this.propsRef.current.region;
    const dest = target && typeof target.userData.gridX === "number"
      ? nearestWalkable(this.walk, target.userData.gridX as number, target.userData.gridY as number, 2, this.blockedSet())
      : null;
    const close = Boolean(
      dest && (
        nearbyDistance(this.playerGrid, dest) <= 1 ||
        this.landmarkMatches(target!, this.findNearbyInteraction())
      )
    );
    const key = dest
      ? `${this.playerGrid.x},${this.playerGrid.y}|${dest.x},${dest.y}|${close}|${String(target?.userData.kind ?? "")}:${String(target?.userData.id ?? "")}`
      : "none";
    if (key === this.trailKey) return;
    this.trailKey = key;
    while (this.questTrail.children.length) {
      const child = this.questTrail.children[0]!;
      child.traverse((node) => {
        const mesh = node as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose?.();
      });
      this.questTrail.remove(child);
    }
    if (!dest || close) return;
    const path = findPath(this.walk, this.playerGrid.x, this.playerGrid.y, dest.x, dest.y, region.width, region.height, this.blockedSet());
    if (!path?.length) return;
    const points: Array<{ x: number; y: number; hero: boolean }> = [];
    path.forEach((cell, index) => {
      const last = index === path.length - 1;
      const first = index === 0;
      if (!first && !last) return;
      points.push({
        x: cell[0],
        y: cell[1],
        hero: true
      });
    });
    points.forEach((point, index) => {
      const marker = addTrailMarker(point.hero || index === 0 || index >= points.length - 2);
      marker.position.copy(this.surfaceWorld(point.x, point.y));
      marker.position.y += 0.26;
      marker.userData.baseY = marker.position.y;
      marker.userData.trailIndex = index;
      const next = points[index + 1] ?? point;
      const from = this.surfaceWorld(point.x, point.y);
      const to = this.surfaceWorld(next.x, next.y);
      marker.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
      this.questTrail.add(marker);
    });
  }

  private updateNearbyInteraction() {
    const interaction = this.findNearbyInteraction();
    const key = interaction ? JSON.stringify(interaction) : "";
    if (key !== this.activeInteractionKey) {
      this.activeInteractionKey = key;
      this.propsRef.current.onNearbyChange(interaction);
    }
    this.rebuildQuestTrail();
    this.emitSeek(interaction);
    if (interaction?.kind === "field-clue" && !interaction.inspected) {
      this.activeScanId = interaction.id;
      this.emitScan();
    } else if (!this.isScanHolding() && !this.scanAuto) {
      if (this.activeScanId) {
        this.activeScanId = null;
        this.emitScan();
      }
    }
    this.syncLandmarks(interaction);
  }

  private updateCamera() {
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    const aspect = width / height;
    const platform = owningPlatform(this.playerGrid.x, this.playerGrid.y);
    const bridge = bridges.find((item) => {
      const near = (cell: [number, number]) => Math.max(Math.abs(this.playerGrid.x - cell[0]), Math.abs(this.playerGrid.y - cell[1])) <= 1;
      return near(item.a) || near(item.b);
    });
    let spanX = platform ? platform.x1 - platform.x0 + 5.2 : 13;
    let spanY = platform ? platform.y1 - platform.y0 + 4.4 : 11;
    if (bridge) {
      spanX = Math.max(spanX, Math.abs(bridge.b[0] - bridge.a[0]) + 8.4);
      spanY = Math.max(spanY, Math.abs(bridge.b[1] - bridge.a[1]) + 7.2);
    }
    const starter = this.propsRef.current.questHint?.id === "atom-hydrogen";
    if (platform?.id === "quay" && !bridge) {
      spanX = starter ? 10.4 : 11.6;
      spanY = starter ? 9.2 : 10.2;
    }
    const viewHeight = Math.max(bridge ? 12.4 : 11.2, spanY * 1.08, (spanX * 0.88) / Math.max(aspect, 0.8));
    const player = this.actor.position;
    const focus = player.clone();
    if (bridge) {
      const a = gridToWorld(bridge.a[0], bridge.a[1]);
      const b = gridToWorld(bridge.b[0], bridge.b[1]);
      focus.x = player.x * 0.62 + ((a.x + b.x) / 2) * 0.38;
      focus.z = player.z * 0.62 + ((a.z + b.z) / 2) * 0.38;
      focus.y = (this.surfaceY(bridge.a[0], bridge.a[1]) + this.surfaceY(bridge.b[0], bridge.b[1])) / 2;
    } else if (platform) {
      const center = gridToWorld((platform.x0 + platform.x1) / 2, (platform.y0 + platform.y1) / 2);
      const playerBias = 0.9;
      focus.x = player.x * playerBias + center.x * (1 - playerBias);
      focus.z = player.z * playerBias + center.z * (1 - playerBias);
      focus.y = platform.surface;
    }
    const seek = this.seekTargetGroup();
    const nearbyQuest = Boolean(seek && this.landmarkMatches(seek, this.findNearbyInteraction()));
    if (seek && !bridge) {
      const blend = nearbyQuest ? 0.06 : 0.12;
      focus.x = focus.x * (1 - blend) + seek.position.x * blend;
      focus.z = focus.z * (1 - blend) + seek.position.z * blend;
      focus.y = focus.y * (1 - blend) + seek.position.y * blend;
    }
    const lookLift = nearbyQuest ? 1.18 : 0.98;
    if (!this.cameraFocusReady) {
      this.cameraFocus.copy(focus);
      this.cameraViewHeight = viewHeight;
      this.cameraLookLift = lookLift;
      this.cameraFocusReady = true;
    } else {
      this.cameraFocus.lerp(focus, 0.22);
      this.cameraViewHeight += (viewHeight - this.cameraViewHeight) * 0.18;
      this.cameraLookLift += (lookLift - this.cameraLookLift) * 0.16;
    }
    this.camera.left = -this.cameraViewHeight * aspect / 2;
    this.camera.right = this.cameraViewHeight * aspect / 2;
    this.camera.top = this.cameraViewHeight / 2;
    this.camera.bottom = -this.cameraViewHeight / 2;
    this.camera.updateProjectionMatrix();
    this.placeCamera();
    this.keepPlayerOnScreen();
  }

  private placeCamera() {
    this.camera.position.set(this.cameraFocus.x + 9.2, this.cameraFocus.y + 11.0, this.cameraFocus.z + 11.4);
    this.camera.lookAt(this.cameraFocus.x + 0.8, this.cameraFocus.y + this.cameraLookLift, this.cameraFocus.z + 0.7);
    this.camera.updateMatrixWorld();
  }

  private keepPlayerOnScreen() {
    const feet = this.actor.position;
    this.ndcFeet.set(feet.x, feet.y + 0.04, feet.z).project(this.camera);
    this.ndcHead.set(feet.x, feet.y + 1.62, feet.z).project(this.camera);
    const minX = Math.min(this.ndcFeet.x, this.ndcHead.x);
    const maxX = Math.max(this.ndcFeet.x, this.ndcHead.x);
    const minY = Math.min(this.ndcFeet.y, this.ndcHead.y);
    const maxY = Math.max(this.ndcFeet.y, this.ndcHead.y);
    const limitX = 0.62;
    const limitTop = 0.58;
    const limitBottom = -0.72;
    let shiftX = 0;
    let shiftY = 0;
    if (maxX > limitX) shiftX += maxX - limitX;
    if (minX < -limitX) shiftX += minX + limitX;
    if (maxY > limitTop) shiftY += maxY - limitTop;
    if (minY < limitBottom) shiftY += minY - limitBottom;
    if (Math.abs(shiftX) < 0.001 && Math.abs(shiftY) < 0.001) return;
    this.camRight.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();
    this.camUp.setFromMatrixColumn(this.camera.matrixWorld, 1).normalize();
    const halfW = (this.camera.right - this.camera.left) / 2;
    const halfH = (this.camera.top - this.camera.bottom) / 2;
    this.cameraFocus.addScaledVector(this.camRight, shiftX * halfW);
    this.cameraFocus.addScaledVector(this.camUp, shiftY * halfH);
    this.placeCamera();
  }

  private settleSprite(sprite: THREE.Sprite, bob: number) {
    const parent = sprite.parent;
    if (!parent) return;
    parent.getWorldPosition(this.spriteScratch);
    const offset = towardCameraOffset(this.camera, this.spriteScratch, 0.06);
    sprite.position.set(offset.x, 0.02 + bob, offset.z);
  }

  private animate = () => {
    if (this.disposed) return;
    this.frame = window.requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    this.consumeHeldDirection();
    if (this.moving) {
      this.moving.elapsed += delta * 1000;
      const t = Math.min(1, this.moving.elapsed / MOVE_MS);
      const ease = this.moving.ease;
      const eased = ease === "linear"
        ? t
        : ease === "in"
          ? t * t
          : ease === "out"
            ? 1 - (1 - t) * (1 - t)
            : t * t * (3 - 2 * t);
      this.actor.position.lerpVectors(this.moving.from, this.moving.to, eased);
      if (t >= 1) {
        const complete = this.moving;
        this.moving = null;
        this.playerGrid = { x: complete.targetX, y: complete.targetY, z: this.surfaceY(complete.targetX, complete.targetY) };
        this.actor.position.copy(this.surfaceWorld(this.playerGrid.x, this.playerGrid.y));
        this.stepsSinceSave += 1;
        if (this.stepsSinceSave >= 4) {
          this.stepsSinceSave = 0;
          this.propsRef.current.onSavePosition({ ...this.playerGrid });
        }
        complete.after?.();
        this.updateNearbyInteraction();
        if (this.pendingInteract && !this.pathQueue?.length) {
          this.finishPendingInteract();
        }
        this.consumeHeldDirection();
        if (!this.moving) this.moveContinuing = false;
      }
    }
    const scanId = this.activeScanId;
    if (scanId && (this.isScanHolding() || this.scanAuto) && !this.propsRef.current.player.inspectedClueIds.includes(scanId)) {
      const nearby = this.findNearbyInteraction();
      if (nearby?.kind !== "field-clue" || nearby.id !== scanId) {
        this.scanAuto = false;
        if (nearby?.kind === "field-clue" && !nearby.inspected) this.activeScanId = nearby.id;
        else this.activeScanId = null;
        this.emitScan();
      } else {
        const total = this.protonTotal(scanId);
        const marked = this.scanProgress.get(scanId) ?? 0;
        if (marked < total) {
          this.scanAcc += delta;
          if (this.scanAcc >= 0.14) {
            this.scanAcc = 0;
            this.scanProgress.set(scanId, marked + 1);
            this.emitScan();
            this.syncLandmarks();
          }
        } else if (this.scanAuto) {
          this.scanAuto = false;
          this.emitScan();
        }
      }
    }
    this.actorModel.rotation.y = lerpAngle(this.actorModel.rotation.y, this.actorFacing, 1 - Math.pow(0.001, delta));
    if (this.actorReady) {
      const walk = Boolean(this.moving);
      const bob = walk ? Math.abs(Math.sin(elapsed * 7.2)) * 0.028 : Math.sin(elapsed * 2.1) * 0.012;
      this.actorModel.position.y = bob;
    } else {
      this.settleSprite(this.actorSprite, Math.sin(elapsed * 2.1) * 0.01);
    }
    if (this.carrySprite.visible) {
      this.carrySprite.position.y = 1.48 + Math.sin(elapsed * 3.4) * 0.04;
    }
    const seekTarget = this.seekTargetGroup();
    this.seekArrow.visible = false;
    this.root.traverse((object) => {
      if (object.userData.spin) object.rotation.z += delta * 0.18;
      if (object.userData.billboard && object instanceof THREE.Sprite) this.settleSprite(object, 0);
      if (object.userData.phase !== undefined) {
        const baseY = object.userData.baseY ?? object.position.y;
        object.position.y = baseY + Math.sin(elapsed * 1.6 + object.userData.phase) * 0.03;
      }
      if (object.userData.role === "player-ring") {
        const pulse = 1 + Math.sin(elapsed * 1.8) * 0.03;
        object.scale.set(pulse, pulse, 1);
        const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material) material.opacity = 0.16 + Math.sin(elapsed * 1.8) * 0.05;
      }
      if (object.userData.role === "halo" || object.userData.role === "halo-glow") {
        const pulse = Boolean(object.parent?.userData.nearbyPulse);
        const seek = Boolean(object.parent?.userData.seekPulse);
        const idle = Boolean(object.parent?.userData.idlePulse);
        const scale = pulse ? 1 + Math.sin(elapsed * 3.4) * 0.08 : seek ? 1 + Math.sin(elapsed * 1.8) * 0.05 : idle ? 1 + Math.sin(elapsed * 1.2) * 0.03 : 1;
        object.scale.set(scale, scale, 1);
        const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material) {
          const glow = object.userData.role === "halo-glow";
          const base = glow ? (pulse ? 0.32 : seek ? 0.2 : idle ? 0.12 : 0) : (pulse ? 0.72 : seek ? 0.48 : idle ? 0.28 : 0);
          const wave = pulse ? 3.4 : seek ? 1.8 : 1.2;
          material.opacity = (pulse || seek || idle) ? base + Math.sin(elapsed * wave) * (pulse ? 0.12 : 0.08) : 0;
        }
      }
      if (object.userData.role === "beacon") {
        const pulse = Boolean(object.parent?.userData.nearbyPulse);
        const seek = Boolean(object.parent?.userData.seekPulse);
        const quest = Boolean(object.parent?.userData.questPulse);
        const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material) material.opacity = pulse ? 0.92 + Math.sin(elapsed * 2.6) * 0.08 : quest ? 0.86 + Math.sin(elapsed * 2.2) * 0.1 : seek ? 0.62 + Math.sin(elapsed * 1.8) * 0.12 : 0;
        const px = Number(object.userData.pulseX ?? 1.06);
        object.scale.set(px, 1 + Math.sin(elapsed * 2.2) * 0.05, px);
      }
      if (object.userData.role === "beacon-star") {
        const pulse = Boolean(object.parent?.userData.nearbyPulse);
        const seek = Boolean(object.parent?.userData.seekPulse);
        const quest = Boolean(object.parent?.userData.questPulse);
        const baseY = object.userData.baseY ?? 7.48;
        object.position.y = baseY + Math.sin(elapsed * 2.8) * 0.1;
        object.rotation.y += delta * 1.8;
        const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material) material.opacity = pulse ? 0.92 + Math.sin(elapsed * 3.1) * 0.08 : quest ? 0.8 + Math.sin(elapsed * 2.6) * 0.12 : seek ? 0.5 + Math.sin(elapsed * 2.2) * 0.1 : 0;
      }
      if (object.userData.role === "quest-crown" && object.visible) {
        const baseY = object.userData.baseY ?? 3.55;
        object.position.y = baseY + Math.sin(elapsed * 2.5) * 0.08;
        object.rotation.y += delta * 1.35;
      }
      if (object.userData.role === "quest-pointer" && object.visible) {
        const baseY = object.userData.baseY ?? 2.72;
        object.position.y = baseY + Math.sin(elapsed * 3.1) * 0.12;
        object.rotation.y += delta * 1.8;
      }
      if ((object.userData.role === "interact-flag" || object.userData.role === "interact-book" || object.userData.role === "interact-spark") && object.visible) {
        const baseY = object.userData.baseY ?? 1.58;
        object.position.y = baseY + Math.sin(elapsed * 2.8) * 0.06;
        object.rotation.y += delta * (object.userData.role === "interact-spark" ? 1.6 : 0.85);
      }
      if (object.userData.role === "scan-reticle" && object.visible) {
        const pulse = 1 + Math.sin(elapsed * 3.4) * 0.08;
        object.scale.set(pulse, pulse, 1);
        const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material) material.opacity = 0.72 + Math.sin(elapsed * 3.4) * 0.2;
      }
      if (object.userData.role === "prompt" && object.visible) {
        const baseY = object.userData.baseY ?? 0.78;
        object.position.y = baseY + Math.sin(elapsed * 2.8) * 0.05;
      }
      if (object.userData.role === "prompt-caption" && object.visible) {
        const baseY = object.userData.baseY ?? object.position.y;
        object.position.y = baseY + Math.sin(elapsed * 2.6) * 0.04;
      }
      if (object.userData.role === "nameplate" && object.visible) {
        const baseY = object.userData.baseY ?? object.position.y;
        object.position.y = baseY + Math.sin(elapsed * 2.15) * 0.05;
      }
      if (object.userData.role === "trail") {
        const baseY = object.userData.baseY ?? object.position.y;
        const index = Number(object.userData.trailIndex ?? 0);
        const pulse = Math.sin(elapsed * 3.2 + index * 0.7);
        object.position.y = baseY + pulse * 0.08;
        object.scale.setScalar(1 + pulse * 0.08);
      }
      if (object.userData.role === "callout-ring" && object.visible) {
        const nearby = Boolean(object.parent?.userData.nearbyPulse);
        const quest = Boolean(object.parent?.userData.questPulse);
        const idle = Boolean(object.parent?.userData.idlePulse);
        const base = nearby ? 1.16 : quest ? 1.06 : idle ? 0.92 : 1;
        const wave = nearby ? 2.8 : quest ? 2.2 : 1.6;
        const pulse = base + Math.sin(elapsed * wave) * (nearby ? 0.1 : 0.05);
        object.scale.set(pulse, pulse, 1);
        const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material) material.opacity = (nearby ? 0.78 : quest ? 0.64 : 0.48) + Math.sin(elapsed * wave) * 0.16;
      }
      if (object.userData.role === "slot-match" && object.visible) {
        const pulse = 1 + Math.sin(elapsed * 3.2) * 0.08;
        object.scale.set(pulse, pulse, 1);
        const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (material) material.opacity = 0.38 + Math.sin(elapsed * 3.2) * 0.18;
      }
    });
    this.updateCamera();
    this.emitSeek(this.findNearbyInteraction());
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    window.cancelAnimationFrame(this.frame);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.dispose();
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((item) => item.dispose());
      else mesh.material?.dispose();
    });
    this.artHud?.remove();
    this.artHud = null;
    this.renderer.domElement.remove();
  }
}

export function GameCanvas(props: GameCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<KnowledgeIslandScene | null>(null);
  const propsRef = useRef<GameCanvasProps>({ ...props });
  propsRef.current = { ...propsRef.current, ...props };

  useEffect(() => {
    if (!parentRef.current) return;
    const scene = new KnowledgeIslandScene(parentRef.current, propsRef.current);
    sceneRef.current = scene;
    const observer = new ResizeObserver(() => scene.resize());
    observer.observe(parentRef.current);
    return () => {
      observer.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, [props.renderKey]);

  useEffect(() => {
    sceneRef.current?.updateProps(propsRef.current);
  }, [props]);

  return <div className="game-canvas" ref={parentRef} tabIndex={-1} />;
}

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload();
  });
}
