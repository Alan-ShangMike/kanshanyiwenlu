import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode
} from "react";

export const IDENTITY_SOCKETS = [
  { id: "1", protons: 1, answer: "H", name: "氢" },
  { id: "6", protons: 6, answer: "C", name: "碳" },
  { id: "8", protons: 8, answer: "O", name: "氧" }
] as const;

export type IdentitySocket = (typeof IDENTITY_SOCKETS)[number];

export function identityComplete(placed: Record<string, string>) {
  return IDENTITY_SOCKETS.every((socket) => placed[socket.id] === socket.answer);
}

export function tryPlaceIdentity(
  socketId: string,
  symbol: string | null,
  collectedSymbols: string[],
  placed: Record<string, string>
): { ok: true; socket: IdentitySocket; remaining: number } | { ok: false; reason: string; shake?: boolean } {
  const socket = IDENTITY_SOCKETS.find((item) => item.id === socketId);
  if (!socket) return { ok: false, reason: "没有这个格子。" };
  if (placed[socket.id]) return { ok: false, reason: "这个格子已经对上了。" };
  if (!symbol) return { ok: false, reason: "先从右上角样本袋拿起 H、C 或 O。" };
  if (!collectedSymbols.includes(symbol)) {
    return { ok: false, reason: "这个符号还没采集。先去扫描发光的原子核。", shake: true };
  }
  if (Object.values(placed).includes(symbol)) {
    return { ok: false, reason: "这个符号已经对上另一格了。", shake: true };
  }
  if (symbol !== socket.answer) {
    const reasons: Record<string, string> = {
      H: "氢只有 1 枚金色质子，对不上这个格。",
      C: "碳的质子数是 6，去找那一簇。",
      O: "氧的质子数是 8。"
    };
    return { ok: false, reason: reasons[symbol] ?? "质子数对不上。", shake: true };
  }
  return {
    ok: true,
    socket,
    remaining: IDENTITY_SOCKETS.length - (Object.keys(placed).length + 1)
  };
}


export function ShellHitmap({
  rings
}: {
  rings: Array<{ label: string; onPick: () => void }>;
}) {
  // Match the visual orbits (inset 24% / 8% / 2%). Draw outer first so the
  // inner electron cloud remains a solid, easy-to-hit disc.
  const radii = [26, 42, 49];
  return (
    <svg className="shell-hitmap" viewBox="0 0 100 100" role="group" aria-label="电子云层">
      {[2, 1, 0].map((index) => {
        const ring = rings[index];
        if (!ring) return null;
        return (
          <circle
            key={index}
            className={`shell-hit ring-${index}`}
            cx="50"
            cy="50"
            r={radii[index] ?? 26}
            role="button"
            tabIndex={0}
            aria-label={ring.label}
            onClick={(event) => {
              event.stopPropagation();
              ring.onPick();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                ring.onPick();
              }
            }}
          />
        );
      })}
    </svg>
  );
}

export function useShake() {
  const [token, setToken] = useState<string | null>(null);
  function shake(id: string) {
    setToken(id);
    window.setTimeout(() => setToken((current) => (current === id ? null : current)), 320);
  }
  return { token, shake };
}

export function useAutoAdvance(ready: boolean, action: () => void, delay = 720) {
  const fired = useRef(false);
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    if (!ready || fired.current) return;
    const id = window.setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      actionRef.current();
    }, delay);
    return () => window.clearTimeout(id);
  }, [delay, ready]);

  return () => {
    if (fired.current) return;
    fired.current = true;
    actionRef.current();
  };
}

export function CommitButton({
  ready,
  onCommit,
  children,
  auto = true
}: {
  ready: boolean;
  onCommit: () => void;
  children: ReactNode;
  auto?: boolean;
}) {
  const skip = useAutoAdvance(Boolean(ready && auto), onCommit);
  return (
    <button
      type="button"
      className={`primary-button ${ready ? "is-ready" : ""}`}
      disabled={!ready}
      onClick={skip}
    >
      {children}
    </button>
  );
}

export function ElementToken({
  symbol,
  selected,
  onPick
}: {
  symbol: string;
  selected: boolean;
  onPick: (symbol: string) => void;
}) {
  return (
    <button
      type="button"
      draggable
      className={`element-token ${selected ? "selected" : ""}`}
      onClick={() => onPick(symbol)}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/symbol", symbol);
        event.dataTransfer.setData("text/plain", symbol);
        event.dataTransfer.effectAllowed = "copy";
        if (!selected) onPick(symbol);
      }}
    >
      {symbol}
    </button>
  );
}

export function SampleChip({
  symbol,
  name,
  filled,
  selected,
  justFilled,
  used,
  hotkey,
  onPick
}: {
  symbol: string;
  name: string;
  filled: boolean;
  selected: boolean;
  justFilled?: boolean;
  used?: boolean;
  hotkey?: string;
  onPick?: (symbol: string) => void;
}) {
  return (
    <button
      type="button"
      draggable={filled && !used}
      data-symbol={symbol}
      className={`sample-chip ${filled ? "is-filled" : ""} ${selected ? "is-selected" : ""} ${justFilled ? "is-just-filled" : ""} ${used ? "is-used" : ""}`}
      disabled={!filled}
      title={
        used
          ? `${name}已经放入身份门`
          : filled
            ? `${name}已在袋中，点一下拿起或拖到机关上${hotkey ? `（${hotkey}）` : ""}`
            : `尚未采集${name}`
      }
      aria-pressed={selected}
      onClick={() => {
        if (!filled || used) return;
        onPick?.(symbol);
      }}
      onDragStart={(event) => {
        if (!filled || used) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData("text/symbol", symbol);
        event.dataTransfer.setData("text/plain", symbol);
        event.dataTransfer.effectAllowed = "copy";
        if (!selected) onPick?.(symbol);
      }}
    >
      {symbol}
    </button>
  );
}

export function dropTargetProps(onDrop: (symbol?: string) => void) {
  return {
    onDragOver: (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      event.currentTarget.classList.add("is-drop-ready");
    },
    onDragLeave: (event: DragEvent<HTMLButtonElement>) => {
      event.currentTarget.classList.remove("is-drop-ready");
    },
    onDrop: (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.classList.remove("is-drop-ready");
      const symbol =
        event.dataTransfer.getData("text/symbol") ||
        event.dataTransfer.getData("text/plain") ||
        undefined;
      onDrop(symbol);
    }
  };
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ProtonCluster({
  count,
  lit = true,
  compact = false
}: {
  count: number;
  lit?: boolean;
  compact?: boolean;
}) {
  return (
    <span className={`proton-cluster ${compact ? "compact" : ""}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(count, 1) - Math.PI / 2;
        const radius = count === 1 ? 0 : count <= 6 ? 16 : 18;
        return (
          <span
            key={index}
            className={`proton-bead ${lit ? "is-on" : ""}`}
            style={{ left: `${50 + Math.cos(angle) * radius}%`, top: `${50 + Math.sin(angle) * radius}%` }}
          />
        );
      })}
    </span>
  );
}

export function HeldCursor({ symbol }: { symbol: string }) {
  const node = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!node.current) return;
      node.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -120%)`;
      setReady(true);
    };
    const start = () => setDragging(true);
    const end = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("dragstart", start);
    window.addEventListener("dragend", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("dragstart", start);
      window.removeEventListener("dragend", end);
    };
  }, []);

  if (dragging) return null;
  return (
    <div ref={node} className={`held-cursor ${ready ? "is-ready" : ""}`} aria-hidden="true">
      <strong>{symbol}</strong>
      <small>点门上的 1 / 6 / 8</small>
    </div>
  );
}

export function FlyingSample({
  symbol,
  from,
  to,
  onDone
}: {
  symbol: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  onDone: () => void;
}) {
  const node = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = node.current;
    if (!el) return;
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) scale(1.12)`;
    const play = window.requestAnimationFrame(() => {
      el.style.transform = "translate3d(0, 0, 0) translate(-50%, -50%) scale(0.72)";
      el.style.opacity = "0.12";
    });
    const timer = window.setTimeout(onDone, 560);
    return () => {
      window.cancelAnimationFrame(play);
      window.clearTimeout(timer);
    };
  }, [from.x, from.y, onDone, to.x, to.y]);

  return (
    <span
      ref={node}
      className="flying-sample"
      style={{ left: to.x, top: to.y }}
    >
      {symbol}
    </span>
  );
}
