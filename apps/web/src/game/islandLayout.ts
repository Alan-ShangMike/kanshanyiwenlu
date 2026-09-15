export const GRID_X = 1;
export const GRID_Z = 0.82;
export const MOVE_MS = 360;
export const FLOOR_LIFT = 0.07;
export const FLOOR_INSET = 1;
export const INTERACT_RANGE = 3;
export const QUEST_RANGE = 4;

export const spawnPosition = { x: 5, y: 28 };
export const liuPosition = { x: 4, y: 25 };
export const dailyRiftPosition = { x: 13, y: 28 };

export const microPuzzleDefinitions = [
  { id: "element-symbol-memory", title: "元素符号记忆台", label: "符号记忆台", puzzleKind: "symbol-memory" as const, position: { x: 6, y: 30 }, color: 0xe6bd55 },
  { id: "periodic-tile-sort", title: "周期坐标拼台", label: "坐标拼台", puzzleKind: "tile-sort" as const, position: { x: 22, y: 23 }, color: 0x55b4a3 },
  { id: "electron-orbit-link", title: "电子轨道连线", label: "轨道连线", puzzleKind: "orbit-link" as const, position: { x: 29, y: 17 }, color: 0x61a9d5 }
];

export const occupantCells: Array<{ x: number; y: number }> = [
  spawnPosition,
  liuPosition,
  dailyRiftPosition,
  { x: 8, y: 24 },
  { x: 11, y: 24 },
  { x: 14, y: 24 },
  { x: 8, y: 30 },
  { x: 15, y: 25 },
  { x: 20, y: 22 },
  { x: 18, y: 24 },
  { x: 27, y: 18 },
  { x: 25, y: 20 },
  { x: 34, y: 17 },
  { x: 33, y: 17 },
  { x: 38, y: 11 },
  { x: 37, y: 13 },
  { x: 41, y: 4 },
  { x: 40, y: 6 },
  { x: 16, y: 14 },
  { x: 28, y: 25 },
  { x: 35, y: 22 },
  { x: 40, y: 10 },
  ...microPuzzleDefinitions.map((item) => item.position)
];

const GATE_CELLS = [
  { x: 15, y: 25 },
  { x: 18, y: 24 },
  { x: 25, y: 20 },
  { x: 33, y: 17 },
  { x: 37, y: 13 },
  { x: 40, y: 6 }
];

const WALK_THROUGH = new Set([
  `${spawnPosition.x},${spawnPosition.y}`,
  `${dailyRiftPosition.x},${dailyRiftPosition.y}`,
  ...GATE_CELLS.map((cell) => `${cell.x},${cell.y}`)
]);

const QUAY_PROP_BLOCKS: Array<{ x: number; y: number }> = [
  { x: 15, y: 24 },
  { x: 15, y: 26 },
  { x: 6, y: 24 },
  { x: 7, y: 24 },
  { x: 12, y: 24 },
  { x: 13, y: 24 },
  { x: 4, y: 26 },
  { x: 4, y: 27 }
];

export const propSolids: Array<{ x: number; y: number }> = [
  ...occupantCells.filter((cell) => !WALK_THROUGH.has(`${cell.x},${cell.y}`)),
  ...QUAY_PROP_BLOCKS
];

export type PlatformSpec = {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  surface: number;
  body: number;
  floor: number;
  lip: number;
  accent: number;
  wall: number;
};

export const platforms: PlatformSpec[] = [
  { id: "quay", x0: 3, y0: 23, x1: 16, y1: 31, surface: 1.05, body: 0xc47b58, floor: 0xd6a468, lip: 0x8e5340, accent: 0xe7c56a, wall: 0xb56b4e },
  { id: "periodic", x0: 17, y0: 20, x1: 23, y1: 25, surface: 1.92, body: 0x5f9178, floor: 0xc9ad72, lip: 0x3f6a56, accent: 0x7ec7b0, wall: 0x4f7d66 },
  { id: "electron", x0: 24, y0: 16, x1: 30, y1: 22, surface: 2.78, body: 0x4f7f96, floor: 0xc3a878, lip: 0x355a6c, accent: 0x7eb7d2, wall: 0x3e6c80 },
  { id: "family", x0: 32, y0: 15, x1: 36, y1: 20, surface: 3.58, body: 0xc56d62, floor: 0xd19662, lip: 0x8a4a46, accent: 0xe08972, wall: 0xb45b55 },
  { id: "bond", x0: 35, y0: 9, x1: 41, y1: 14, surface: 4.48, body: 0xb3875c, floor: 0xcc9a58, lip: 0x7a5a3f, accent: 0xd9a07a, wall: 0x9a704c },
  { id: "isotope", x0: 38, y0: 2, x1: 43, y1: 7, surface: 5.72, body: 0x6d829c, floor: 0xc0ae86, lip: 0x4a5d72, accent: 0xb7c3e0, wall: 0x5b6f86 },
  { id: "neon", x0: 14, y0: 12, x1: 18, y1: 15, surface: 1.92, body: 0x5f9178, floor: 0xc9ad72, lip: 0x3f6a56, accent: 0x9fe0c8, wall: 0x4f7d66 },
  { id: "span", x0: 17, y0: 16, x1: 18, y1: 19, surface: 1.92, body: 0x5f9178, floor: 0xc9ad72, lip: 0x3f6a56, accent: 0x9fe0c8, wall: 0x4f7d66 },
  { id: "noble", x0: 26, y0: 24, x1: 30, y1: 27, surface: 2.78, body: 0x4f7f96, floor: 0xc3a878, lip: 0x355a6c, accent: 0xd7c56a, wall: 0x3e6c80 },
  { id: "water", x0: 33, y0: 21, x1: 37, y1: 24, surface: 3.58, body: 0xc56d62, floor: 0xd19662, lip: 0x8a4a46, accent: 0x7ec7d2, wall: 0xb45b55 }
];

export const bridges: Array<{ a: [number, number]; b: [number, number]; main: boolean }> = [
  { a: [16, 25], b: [17, 25], main: true },
  { a: [16, 24], b: [17, 24], main: true },
  { a: [23, 21], b: [24, 21], main: true },
  { a: [23, 20], b: [24, 20], main: true },
  { a: [30, 18], b: [32, 17], main: true },
  { a: [35, 15], b: [36, 13], main: true },
  { a: [40, 9], b: [40, 7], main: true },
  { a: [18, 20], b: [18, 19], main: false },
  { a: [17, 20], b: [17, 19], main: false },
  { a: [18, 16], b: [18, 15], main: false },
  { a: [17, 16], b: [17, 15], main: false },
  { a: [28, 22], b: [28, 24], main: false },
  { a: [35, 20], b: [35, 21], main: false }
];

export type WalkMap = {
  height: Map<string, number>;
  platformId: Map<string, string>;
  walls: Set<string>;
  doors: Set<string>;
};

export function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

export function gridToWorld(x: number, y: number) {
  return { x: (x - y) * GRID_X, z: (x + y) * GRID_Z };
}

export function worldToGrid(worldX: number, worldZ: number) {
  const a = worldX / GRID_X;
  const b = worldZ / GRID_Z;
  return { x: Math.round((a + b) / 2), y: Math.round((b - a) / 2) };
}

export function platformCenter(platform: PlatformSpec) {
  return { x: (platform.x0 + platform.x1) / 2, y: (platform.y0 + platform.y1) / 2 };
}

export function isRimCell(platform: PlatformSpec, x: number, y: number) {
  return x === platform.x0 || x === platform.x1 || y === platform.y0 || y === platform.y1;
}

function cellsOnLine(ax: number, ay: number, bx: number, by: number) {
  const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  const cells: Array<[number, number]> = [];
  if (steps === 0) return [[ax, ay] as [number, number]];
  for (let index = 0; index <= steps; index += 1) {
    const x = Math.round(ax + ((bx - ax) * index) / steps);
    const y = Math.round(ay + ((by - ay) * index) / steps);
    const last = cells.at(-1);
    if (!last || last[0] !== x || last[1] !== y) cells.push([x, y]);
  }
  return cells;
}

export { cellsOnLine };


function expandBridgeDoors(doors: Set<string>) {
  const cells = [...doors].map((key) => key.split(",").map(Number) as [number, number]);
  for (const [ax, ay] of cells) {
    for (const [bx, by] of cells) {
      if (Math.abs(bx - ax) !== 1 || Math.abs(by - ay) !== 1) continue;
      doors.add(cellKey(ax, by));
      doors.add(cellKey(bx, ay));
    }
  }
}

export function buildWalkMap(): WalkMap {
  const height = new Map<string, number>();
  const platformId = new Map<string, string>();
  const walls = new Set<string>();
  const doors = new Set<string>();

  for (const bridge of bridges) {
    for (const [x, y] of cellsOnLine(bridge.a[0], bridge.a[1], bridge.b[0], bridge.b[1])) {
      doors.add(cellKey(x, y));
    }
  }
  expandBridgeDoors(doors);

  for (const platform of platforms) {
    for (let x = platform.x0; x <= platform.x1; x += 1) {
      for (let y = platform.y0; y <= platform.y1; y += 1) {
        const key = cellKey(x, y);
        const rim = isRimCell(platform, x, y);
        const door = doors.has(key);
        if (rim && !door) {
          walls.add(key);
          continue;
        }
        height.set(key, platform.surface);
        platformId.set(key, platform.id);
      }
    }
  }

  for (const bridge of bridges) {
    const start = height.get(cellKey(bridge.a[0], bridge.a[1])) ?? 1.05;
    const end = height.get(cellKey(bridge.b[0], bridge.b[1])) ?? start;
    const cells = cellsOnLine(bridge.a[0], bridge.a[1], bridge.b[0], bridge.b[1]);
    cells.forEach(([x, y], index) => {
      const key = cellKey(x, y);
      if (walls.has(key)) walls.delete(key);
      if (height.has(key)) return;
      const t = cells.length === 1 ? 0 : index / (cells.length - 1);
      height.set(key, start + (end - start) * t);
    });
  }

  for (const cell of propSolids) {
    const key = cellKey(cell.x, cell.y);
    if (doors.has(key)) continue;
    height.delete(key);
  }

  return { height, platformId, walls, doors };
}

export function surfaceAt(walk: WalkMap, x: number, y: number) {
  return walk.height.get(cellKey(x, y));
}

export const GATE_PASSAGES: Record<string, Array<[number, number]>> = {
  "gate-atomic-forum": [[16, 24], [16, 25], [17, 24], [17, 25]],
  "gate-periodic-gallery": [[23, 20], [23, 21], [24, 20], [24, 21]],
  "gate-electron-observatory": [[30, 18], [31, 18], [32, 17], [31, 17], [32, 18]],
  "gate-family-greenhouse": [[35, 15], [36, 14], [36, 13], [35, 14], [36, 15]],
  "gate-bond-workshop": [[40, 9], [40, 8], [40, 7]]
};

export function sealedGateCells(openedGateIds: string[] | Set<string>, occupy?: { x: number; y: number }) {
  const opened = openedGateIds instanceof Set ? openedGateIds : new Set(openedGateIds);
  const blocked = new Set<string>();
  const here = occupy ? cellKey(occupy.x, occupy.y) : "";
  for (const [gateId, cells] of Object.entries(GATE_PASSAGES)) {
    if (opened.has(gateId)) continue;
    for (const [x, y] of cells) {
      const key = cellKey(x, y);
      if (key === here) continue;
      blocked.add(key);
    }
  }
  return blocked;
}

export function canStandAt(
  walk: WalkMap,
  x: number,
  y: number,
  width: number,
  height: number,
  blocked?: Set<string>
) {
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  if (blocked?.has(cellKey(x, y))) return false;
  return walk.height.has(cellKey(x, y));
}

const SEARCH_DIRS: Array<[number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]
];

export function findPath(
  walk: WalkMap,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  width: number,
  height: number,
  blocked?: Set<string>
) {
  if (!canStandAt(walk, toX, toY, width, height, blocked)) return null;
  if (fromX === toX && fromY === toY) return [];
  const start = cellKey(fromX, fromY);
  const goal = cellKey(toX, toY);
  const queue: Array<[number, number]> = [[fromX, fromY]];
  const came = new Map<string, string | null>([[start, null]]);
  for (let index = 0; index < queue.length; index += 1) {
    const [x, y] = queue[index]!;
    if (cellKey(x, y) === goal) break;
    for (const [dx, dy] of SEARCH_DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const key = cellKey(nx, ny);
      if (came.has(key) || !canStandAt(walk, nx, ny, width, height, blocked)) continue;
      came.set(key, cellKey(x, y));
      queue.push([nx, ny]);
    }
  }
  if (!came.has(goal)) return null;
  const path: Array<[number, number]> = [];
  let cursor: string | null = goal;
  while (cursor && cursor !== start) {
    const [x, y] = cursor.split(",").map(Number) as [number, number];
    path.push([x, y]);
    cursor = came.get(cursor) ?? null;
  }
  path.reverse();
  return path;
}

export function nearestWalkable(walk: WalkMap, x: number, y: number, radius = 2, blocked?: Set<string>) {
  const walkable = (cx: number, cy: number) => walk.height.has(cellKey(cx, cy)) && !blocked?.has(cellKey(cx, cy));
  if (walkable(x, y)) return { x, y };
  let best: { x: number; y: number } | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const key of walk.height.keys()) {
    const parts = key.split(",");
    const cx = Number(parts[0]);
    const cy = Number(parts[1]);
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !walkable(cx, cy)) continue;
    const distance = Math.max(Math.abs(cx - x), Math.abs(cy - y));
    if (distance > radius || distance >= bestDistance) continue;
    best = { x: cx, y: cy };
    bestDistance = distance;
  }
  return best;
}

export function reservedKeys() {
  return new Set(occupantCells.map((cell) => cellKey(cell.x, cell.y)));
}

export function terraceThickness(platform: PlatformSpec) {
  let depth = 0.78;
  for (const other of platforms) {
    if (other.id === platform.id || other.surface >= platform.surface) continue;
    const xGap = platform.x1 < other.x0 ? other.x0 - platform.x1 : other.x1 < platform.x0 ? platform.x0 - other.x1 : 0;
    const yGap = platform.y1 < other.y0 ? other.y0 - platform.y1 : other.y1 < platform.y0 ? platform.y0 - other.y1 : 0;
    if (xGap > 1 || yGap > 1) continue;
    depth = Math.min(depth, platform.surface - other.surface - 0.18);
  }
  return Math.min(0.96, Math.max(0.56, depth));
}

export function missingOccupants(walk: WalkMap) {
  return occupantCells.filter((cell) => !walk.height.has(cellKey(cell.x, cell.y)));
}

export function owningPlatform(x: number, y: number) {
  return platforms.find((platform) => x >= platform.x0 && x <= platform.x1 && y >= platform.y0 && y <= platform.y1);
}

export type WallSegment = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  edge: "y0" | "y1" | "x0" | "x1";
};

export function platformWallSegments(platform: PlatformSpec, doors: Set<string>): WallSegment[] {
  const segments: WallSegment[] = [];

  const flush = (run: Array<[number, number]>, edge: WallSegment["edge"]) => {
    if (!run.length) return;
    const xs = run.map((cell) => cell[0]);
    const ys = run.map((cell) => cell[1]);
    segments.push({
      x0: Math.min(...xs),
      y0: Math.min(...ys),
      x1: Math.max(...xs),
      y1: Math.max(...ys),
      edge
    });
  };

  const collect = (cells: Array<[number, number]>, edge: WallSegment["edge"]) => {
    const run: Array<[number, number]> = [];
    for (const cell of cells) {
      if (doors.has(cellKey(cell[0], cell[1]))) {
        flush(run, edge);
        run.length = 0;
        continue;
      }
      run.push(cell);
    }
    flush(run, edge);
  };

  const alongX: Array<[number, number]> = [];
  for (let x = platform.x0; x <= platform.x1; x += 1) alongX.push([x, platform.y0]);
  collect(alongX, "y0");
  alongX.length = 0;
  for (let x = platform.x0; x <= platform.x1; x += 1) alongX.push([x, platform.y1]);
  collect(alongX, "y1");

  const alongY: Array<[number, number]> = [];
  for (let y = platform.y0 + 1; y <= platform.y1 - 1; y += 1) alongY.push([platform.x0, y]);
  collect(alongY, "x0");
  alongY.length = 0;
  for (let y = platform.y0 + 1; y <= platform.y1 - 1; y += 1) alongY.push([platform.x1, y]);
  collect(alongY, "x1");

  return segments;
}

export function adjacentWallCell(walk: WalkMap, x: number, y: number) {
  const neighbors: Array<[number, number]> = [
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];
  for (const [dx, dy] of neighbors) {
    const nx = x + dx;
    const ny = y + dy;
    if (walk.walls.has(cellKey(nx, ny))) return { x: nx, y: ny };
  }
  return null;
}
