import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { AccessGateDefinition } from "@kanshan/shared";
import { CommitButton, ElementToken, IDENTITY_SOCKETS, ProtonCluster, dropTargetProps, identityComplete, tryPlaceIdentity, useShake } from "./puzzleKit";

interface GateOverlayProps {
  gate: AccessGateDefinition;
  collectedSymbols?: string[];
  heldSymbol?: string | null;
  placedSymbols?: Record<string, string>;
  onHold?: (symbol: string | null) => void;
  onPlace?: (socketId: string, symbol: string) => void;
  onClose: () => void;
  onOpened: () => void;
}

export function IdentitySocketRow({
  collectedSymbols,
  heldSymbol,
  placed,
  compact = false,
  onHold,
  onPlace
}: {
  collectedSymbols: string[];
  heldSymbol: string | null;
  placed: Record<string, string>;
  compact?: boolean;
  onHold: (symbol: string | null) => void;
  onPlace: (socketId: string, symbol: string) => void;
}) {
  const { token, shake } = useShake();
  const [hint, setHint] = useState(
    collectedSymbols.length
      ? "拿起符号，点到质子数相同的格子上。门上的 1、6、8 也可以直接点。"
      : "门上已经写好 1、6、8。先去扫描发光原子，再回来放入。"
  );
  const held = heldSymbol;
  const solved = identityComplete(placed);
  const remaining = collectedSymbols.filter((symbol) => !Object.values(placed).includes(symbol));

  function place(id: string, incoming?: string) {
    const result = tryPlaceIdentity(id, incoming || held, collectedSymbols, placed);
    if (!result.ok) {
      if (result.shake) shake(id);
      setHint(result.reason);
      return;
    }
    onPlace(id, result.socket.answer);
    onHold(null);
    setHint(
      result.remaining === 0
        ? "三个原子序数都对上了。门会按质子数放行。"
        : `${result.socket.name}对上了 ${result.socket.protons}。还可以继续扫描，或放入下一个样本。`
    );
  }

  return (
    <div className={`identity-socket-kit ${compact ? "is-compact" : ""}`}>
      <div className={`gate-socket-row ${compact ? "is-world" : ""}`}>
        {IDENTITY_SOCKETS.map((socket) => {
          const filled = placed[socket.id];
          const matching = !filled && held === socket.answer;
          return (
            <button
              key={socket.id}
              type="button"
              className={`gate-socket ${token === socket.id ? "is-shaking" : ""} ${filled ? "is-filled" : ""} ${matching ? "is-match" : ""}`}
              onClick={() => place(socket.id)}
              {...dropTargetProps((symbol) => place(socket.id, symbol))}
            >
              <small>原子序数 {socket.protons}</small>
              <ProtonCluster count={socket.protons} compact lit={Boolean(filled) || matching} />
              <strong>{filled ?? socket.protons}</strong>
              <em>{filled ? `${socket.name}已对上` : matching ? `放入 ${held}` : compact ? `点 ${socket.id}` : "点这里放入"}</em>
            </button>
          );
        })}
      </div>
      <p className={`gate-inventory-hint ${token ? "is-error" : solved ? "is-success" : ""}`}>
        {hint}
      </p>
      {compact ? (
        <small className="world-insert-keys">
          {!collectedSymbols.length
            ? "先扫描发光原子"
            : held
              ? `正在拿着 ${held} · 快捷键 ${held === "H" ? "1" : held === "C" ? "6" : "8"}`
              : remaining.length
                ? `样本袋还有 ${remaining.join("、")}`
                : "三个样本都已对上"}
        </small>
      ) : null}
    </div>
  );
}

function IdentityGateBoard({
  collectedSymbols,
  heldSymbol,
  placed,
  onHold,
  onPlace,
  onOpened
}: {
  collectedSymbols: string[];
  heldSymbol: string | null;
  placed: Record<string, string>;
  onHold: (symbol: string | null) => void;
  onPlace: (socketId: string, symbol: string) => void;
  onOpened: () => void;
}) {
  const solved = identityComplete(placed);
  return (
    <div className="puzzle-stage">
      <p className="hook-brief">这扇门只认原子核里的质子数。电子绕得再忙，也改不了元素名字。</p>
      <IdentitySocketRow
        collectedSymbols={collectedSymbols}
        heldSymbol={heldSymbol}
        placed={placed}
        onHold={onHold}
        onPlace={onPlace}
      />
      <CommitButton ready={solved} onCommit={onOpened}>
        打开无名原子庭 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function StairGateBoard({ onOpened }: { onOpened: () => void }) {
  const steps = [
    { id: "low", label: "最小", answer: "H" },
    { id: "mid", label: "中间", answer: "C" },
    { id: "high", label: "最大", answer: "O" }
  ];
  const [held, setHeld] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const { token, shake } = useShake();
  const [hint, setHint] = useState("台阶只按质子数升高。把 H、C、O 从小到大排上去。");
  const solved = steps.every((step) => placed[step.id] === step.answer);
  const remaining = ["O", "H", "C"].filter((symbol) => !Object.values(placed).includes(symbol));

  function place(id: string, incoming?: string) {
    const symbol = incoming || held;
    if (!symbol) {
      setHint("先从托盘拿起一个元素符号。");
      return;
    }
    const step = steps.find((item) => item.id === id)!;
    if (symbol !== step.answer) {
      shake(id);
      setHint("质子数更小的元素应该站在更低的台阶上。");
      return;
    }
    setPlaced((current) => ({ ...current, [id]: symbol }));
    setHeld(null);
    setHint("原子序数从小到大，台阶就会连成路。");
  }

  return (
    <div className="puzzle-stage">
      <p className="hook-brief">原子序数阶不看名字的笔画，只看原子核里有几枚质子。</p>
      <div className="stair-board">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={`stair-step ${token === step.id ? "is-shaking" : ""} ${placed[step.id] ? "is-filled" : ""}`}
            style={{ transform: `translateX(${index * 18}px)` }}
            onClick={() => place(step.id)}
            {...dropTargetProps((symbol) => place(step.id, symbol))}
          >
            <small>{step.label}</small>
            <strong>{placed[step.id] ?? "·"}</strong>
          </button>
        ))}
      </div>
      <div className="token-tray">
        {remaining.map((symbol) => (
          <ElementToken
            key={symbol}
            symbol={symbol}
            selected={held === symbol}
            onPick={(value) => setHeld((current) => (current === value ? null : value))}
          />
        ))}
        <em>{held ? `正在放置 ${held}` : "按质子数 1 → 6 → 8 往上排，可拖放"}</em>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onOpened}>
        让台阶接通 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function ChargeLiftBoard({ onOpened }: { onOpened: () => void }) {
  const [read, setRead] = useState(false);
  const { token, shake } = useShake();
  const [hint, setHint] = useState("升降台要读的是核电荷。点原子核，不要点绕行的电子。");

  return (
    <div className="puzzle-stage">
      <p className="hook-brief">核电荷等于质子数。电子再忙，也改不了元素身份。</p>
      <div className={`lift-atom ${token ? "is-shaking" : ""} ${read ? "is-filled" : ""}`}>
        <button
          type="button"
          className="shell-nucleus"
          onClick={() => {
            setRead(true);
            setHint("核电荷是 11，这是钠。升降台认出了中心原子。");
          }}
          aria-label="读取原子核"
        >
          <strong>{read ? "Na" : "?"}</strong>
          <small>{read ? "11" : "点这里"}</small>
        </button>
        {[0, 1, 2].map((ring) => (
          <span key={ring} className={`mini-orbit orbit-${ring}`}>
            {Array.from({ length: ring === 0 ? 2 : ring === 1 ? 8 : 1 }, (_, electron) => (
              <button
                key={electron}
                type="button"
                className="electron-dot"
                aria-label="电子"
                style={{ transform: `rotate(${(360 / (ring === 1 ? 8 : ring === 0 ? 2 : 1)) * electron}deg) translateX(${36 + ring * 18}px)` }}
                onClick={() => {
                  if (read) return;
                  shake("atom");
                  setHint("电子在外面绕行，不决定核电荷。");
                }}
              />
            ))}
          </span>
        ))}
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : read ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={read} onCommit={onOpened}>
        启动升降台 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function VineGateBoard({ onOpened }: { onOpened: () => void }) {
  const [held, setHeld] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const { token, shake } = useShake();
  const [hint, setHint] = useState("藤门只让同一族往上爬。把最外层只有 1 个电子的元素送进去。");
  const alkali = ["Li", "Na", "K"];
  const remaining = ["Li", "Ne", "Na", "Cl", "K"].filter((symbol) => !placed.includes(symbol));
  const solved = alkali.every((symbol) => placed.includes(symbol)) && placed.length === 3;

  function drop(incoming?: string) {
    const symbol = incoming || held;
    if (!symbol) {
      setHint("先拿起一个元素符号，再放到藤门上。");
      return;
    }
    if (!alkali.includes(symbol)) {
      shake("vine");
      setHint(symbol === "Cl" ? "氯是卤素，最外层有 7 个电子。" : "氖是稀有气体，最外层已经排满。");
      return;
    }
    setPlaced((current) => [...current, symbol]);
    setHeld(null);
    setHint("同族元素上下排列，藤门就会一起醒来。");
  }

  return (
    <div className="puzzle-stage">
      <p className="hook-brief">同族元素常常有相同的价电子数，所以化学脾气也相近。</p>
      <button
        type="button"
        className={`vine-column ${token === "vine" ? "is-shaking" : ""} ${solved ? "is-filled" : ""}`}
        onClick={() => drop()}
        {...dropTargetProps(drop)}
      >
        <small>第 1 族</small>
        <div className="bin-chips">
          {placed.map((symbol) => (
            <span key={symbol}>{symbol}</span>
          ))}
        </div>
        <em>{placed.length ? `${placed.length} / 3` : "放入碱金属"}</em>
      </button>
      <div className="token-tray wrap">
        {remaining.map((symbol) => (
          <ElementToken
            key={symbol}
            symbol={symbol}
            selected={held === symbol}
            onPick={(value) => setHeld((current) => (current === value ? null : value))}
          />
        ))}
        <em>{held ? `正在放置 ${held}` : "只把 Li、Na、K 拖上藤门"}</em>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onOpened}>
        展开同族藤门 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function ValenceBridgeBoard({ onOpened }: { onOpened: () => void }) {
  const [held, setHeld] = useState(false);
  const [docked, setDocked] = useState(false);
  const { token, shake } = useShake();
  const [hint, setHint] = useState("桥面缺一枚最外层电子。先点钠的价电子，再点空位。");

  return (
    <div className="puzzle-stage">
      <p className="hook-brief">钠倾向失去最外层那一枚电子，空轨道接住它，断桥就会对齐。</p>
      <div className={`bond-lab compact ${token ? "is-shaking" : ""}`}>
        <div className={`bond-pair ${docked ? "is-filled" : ""}`}>
          <button
            type="button"
            className={`bond-atom ${held ? "selected" : ""}`}
            onClick={() => {
              if (docked) return;
              setHeld(true);
              setHint("电子已经提起。点到桥面空位上。");
            }}
          >
            <strong>Na</strong>
            {!docked && !held ? <span className="electron-dot home" /> : <em>+</em>}
          </button>
          <button
            type="button"
            className={`bond-link ${docked ? "ionic" : held ? "ready" : "idle"}`}
            onClick={() => {
              if (docked) return;
              if (!held) {
                shake("bridge");
                setHint("先点钠最外层的那枚电子。");
                return;
              }
              setDocked(true);
              setHint("价电子滑入空位，通往成键工坊的桥重新对齐。");
            }}
            aria-label="桥面空位"
          />
          <div className="bond-atom is-static">
            <strong>空位</strong>
            {docked ? <span className="electron-dot home" /> : <span className="electron-need">?</span>}
          </div>
          <small>价层断桥</small>
        </div>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : docked ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={docked} onCommit={onOpened}>
        接通断桥 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function CarbonDoorBoard({ onOpened }: { onOpened: () => void }) {
  const [marked, setMarked] = useState<string[]>([]);
  const { token, shake } = useShake();
  const [hint, setHint] = useState("两扇碳门重量不同。点它们共同的金色质子，不要点质量数。");
  const solved = marked.includes("12") && marked.includes("14");

  function markCore(id: string) {
    if (solved) return;
    setMarked((current) => (current.includes(id) ? current : [...current, id]));
    setHint("同位素的质子数相同。再确认另一扇门。");
  }

  return (
    <div className="puzzle-stage">
      <p className="hook-brief">碳-12 和碳-14 都是碳，因为它们都有 6 枚质子。</p>
      <div className="isotope-row">
        {[
          { id: "12", label: "碳-12", neutrons: 6, mass: 12 },
          { id: "14", label: "碳-14", neutrons: 8, mass: 14 }
        ].map((item) => (
          <div key={item.id} className={`isotope-core ${marked.includes(item.id) ? "is-filled" : ""}`}>
            <strong>{item.label}</strong>
            <button
              type="button"
              className="proton-cluster static"
              onClick={() => markCore(item.id)}
              aria-label={`${item.label} 的质子`}
            >
              {Array.from({ length: 6 }, (_, index) => <span key={index} className="proton-bead" />)}
            </button>
            <button
              type="button"
              className={`mass-chip ${token === item.id ? "is-shaking" : ""}`}
              onClick={() => {
                shake(item.id);
                setHint("质量数会被中子改变。先找两扇门都有的 6 枚质子。");
              }}
            >
              质量数 {item.mass}
            </button>
          </div>
        ))}
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onOpened}>
        打开双重碳门 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function GateBoard({
  gate,
  collectedSymbols,
  heldSymbol,
  placedSymbols,
  onHold,
  onPlace,
  onOpened
}: {
  gate: AccessGateDefinition;
  collectedSymbols: string[];
  heldSymbol: string | null;
  placedSymbols: Record<string, string>;
  onHold: (symbol: string | null) => void;
  onPlace: (socketId: string, symbol: string) => void;
  onOpened: () => void;
}) {
  switch (gate.id) {
    case "gate-atomic-forum":
      return (
        <IdentityGateBoard
          collectedSymbols={collectedSymbols}
          heldSymbol={heldSymbol}
          placed={placedSymbols}
          onHold={onHold}
          onPlace={onPlace}
          onOpened={onOpened}
        />
      );
    case "gate-periodic-gallery":
      return <StairGateBoard onOpened={onOpened} />;
    case "gate-electron-observatory":
      return <ChargeLiftBoard onOpened={onOpened} />;
    case "gate-family-greenhouse":
      return <VineGateBoard onOpened={onOpened} />;
    case "gate-bond-workshop":
      return <ValenceBridgeBoard onOpened={onOpened} />;
    case "gate-isotope-vault":
      return <CarbonDoorBoard onOpened={onOpened} />;
    default:
      return (
        <div className="puzzle-stage">
          <p className="hook-brief">{gate.clearedMessage}</p>
          <CommitButton ready onCommit={onOpened}>
            打开通路 <ArrowRight size={16} />
          </CommitButton>
        </div>
      );
  }
}

export function GateOverlay({
  gate,
  collectedSymbols = [],
  heldSymbol = null,
  placedSymbols = {},
  onHold = () => undefined,
  onPlace = () => undefined,
  onClose,
  onOpened
}: GateOverlayProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="puzzle-modal hook-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">通路机关 · {gate.label}</span>
            <h2 id="gate-title">{gate.label}</h2>
            <p className="question-line">{gate.blockedMessage}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>
        <GateBoard
          gate={gate}
          collectedSymbols={collectedSymbols}
          heldSymbol={heldSymbol}
          placedSymbols={placedSymbols}
          onHold={onHold}
          onPlace={onPlace}
          onOpened={onOpened}
        />
      </section>
    </div>
  );
}
