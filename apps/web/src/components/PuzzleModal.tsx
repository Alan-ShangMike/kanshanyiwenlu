import { Fragment, useMemo, useState, type ComponentType } from "react";
import { ArrowRight, RotateCcw, X } from "lucide-react";
import type { CategoryDefinition, KnowledgeCard, PuzzleKind } from "@kanshan/shared";
import { CommitButton, ElementToken, ProtonCluster, ShellHitmap, dropTargetProps, useShake } from "./puzzleKit";

interface PuzzleModalProps {
  category: CategoryDefinition;
  card: KnowledgeCard;
  mode?: "main" | "micro";
  microPuzzleKind?: "symbol-memory" | "tile-sort" | "orbit-link";
  microTitle?: string;
  onClose: () => void;
  onSolved: () => void;
}

interface PuzzleProps {
  onSolved: () => void;
}

function MissionStrip({ action, effect }: { action: string; effect: string }) {
  return (
    <div className="mission-strip">
      <div>
        <small>你要做什么</small>
        <strong>{action}</strong>
      </div>
      <ArrowRight size={18} />
      <div>
        <small>成功后</small>
        <strong>{effect}</strong>
      </div>
    </div>
  );
}

function AtomicIdentityPuzzle({ onSolved }: PuzzleProps) {
  const orreries = [
    { id: "hydride", protons: 1, shells: 1, electrons: 2, decoy: "电子 2", decoyKind: "electron", answer: "H" },
    { id: "c14", protons: 6, shells: 2, mass: 14, decoy: "质量 14", decoyKind: "mass", answer: "C" },
    { id: "oxide", protons: 8, shells: 2, electrons: 10, decoy: "电子 10", decoyKind: "electron", answer: "O" }
  ];
  const [held, setHeld] = useState<string | null>(null);
  const [scanned, setScanned] = useState<Record<string, boolean>>({});
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const { token, shake } = useShake();
  const [hint, setHint] = useState("先点每颗原子的金色核，读出质子数，再给它命名。电子和质量都是伪装。");
  const solved = orreries.every((item) => placed[item.id] === item.answer);
  const remaining = ["H", "C", "O"].filter((symbol) => !Object.values(placed).includes(symbol));

  function scan(id: string) {
    const target = orreries.find((item) => item.id === id)!;
    setScanned((current) => ({ ...current, [id]: true }));
    setHint(`这颗核里有 ${target.protons} 枚质子。按这个数给它命名，不要看旁边的伪装。`);
  }

  function place(id: string, incoming?: string) {
    if (!scanned[id]) {
      shake(id);
      setHint("先点金色原子核。没有读出质子数，就不能给它起名字。");
      return;
    }
    const symbol = incoming || held;
    if (!symbol) {
      setHint("核已经读出来了。拿起 H、C 或 O，放到对应的原子上。");
      return;
    }
    const target = orreries.find((item) => item.id === id)!;
    if (symbol !== target.answer) {
      shake(id);
      setHint(
        symbol === "H"
          ? "氢只有 1 枚质子。别被电子数量骗走。"
          : symbol === "C"
            ? "碳的质子数是 6。质量 14 只说明它更重。"
            : "氧的质子数是 8。多出来的电子改变的是电荷，不是名字。"
      );
      return;
    }
    setPlaced((current) => ({ ...current, [id]: symbol }));
    setHeld(null);
    setHint("质子数不变，它仍是同一种元素。电子和中子只能改电荷或重量。");
  }

  function pokeDecoy(id: string, kind: string) {
    shake(id);
    setHint(kind === "mass" ? "质量数会被中子改写，不决定元素身份。" : "电子在外面绕行，多一枚或少一枚只会变成离子。");
  }

  return (
    <div className="puzzle-stage">
      <MissionStrip action="先扫描原子核，再按质子数给伪装原子命名" effect="获得原子视野，读取地图上的无名元素" />
      <div className="orrery-row">
        {orreries.map((item) => {
          const revealed = Boolean(scanned[item.id]);
          return (
            <div
              key={item.id}
              className={`orrery-card is-board ${token === item.id ? "is-shaking" : ""} ${placed[item.id] ? "is-filled" : ""} ${revealed ? "is-scanned" : ""}`}
            >
              <div className={`mini-orrery shells-${item.shells}`}>
                <button
                  type="button"
                  className={`scan-nucleus ${revealed ? "is-on" : ""}`}
                  onClick={() => scan(item.id)}
                  aria-label="扫描原子核"
                >
                  {revealed ? <ProtonCluster count={item.protons} lit /> : <span className="nucleus-unknown">?</span>}
                </button>
                {Array.from({ length: item.shells }, (_, index) => (
                  <span key={index} className="mini-orbit" />
                ))}
              </div>
              <small>{revealed ? `金色质子 ${item.protons} 枚` : "点核，读取质子数"}</small>
              <button
                type="button"
                className={`decoy-chip ${token === item.id ? "is-shaking" : ""}`}
                onClick={() => pokeDecoy(item.id, item.decoyKind)}
              >
                {item.decoy}
              </button>
              <button
                type="button"
                className={`drop-slot ${placed[item.id] ? "is-filled" : ""} ${revealed ? "" : "is-locked"}`}
                onClick={() => place(item.id)}
                {...dropTargetProps((symbol) => place(item.id, symbol))}
              >
                {placed[item.id] ?? (revealed ? "放入符号" : "先扫描")}
              </button>
            </div>
          );
        })}
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
        {!remaining.length ? <em>三颗伪装原子都已正名</em> : <em>{held ? `正在放置 ${held}` : "先点核，再把符号拖上去"}</em>}
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onSolved}>
        确认元素身份 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function PeriodicPlacementPuzzle({ onSolved }: PuzzleProps) {
  const cells = [
    { id: "2-1", period: 2, group: 1 },
    { id: "2-17", period: 2, group: 17 },
    { id: "2-18", period: 2, group: 18, answer: "Ne" },
    { id: "3-1", period: 3, group: 1, answer: "Na" },
    { id: "3-17", period: 3, group: 17, answer: "Cl" },
    { id: "3-18", period: 3, group: 18 }
  ];
  const [held, setHeld] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const { token, shake } = useShake();
  const [hint, setHint] = useState("周期是横行，族是纵列。把 Na、Cl、Ne 放到正确坐标。");
  const solved = cells.filter((cell) => cell.answer).every((cell) => placed[cell.id] === cell.answer);
  const remaining = ["Na", "Cl", "Ne"].filter((symbol) => !Object.values(placed).includes(symbol));

  function place(id: string, incoming?: string) {
    const symbol = incoming || held;
    if (!symbol) return;
    const cell = cells.find((item) => item.id === id)!;
    if (cell.answer !== symbol) {
      shake(id);
      setHint(
        symbol === "Na"
          ? "钠在第 3 周期第 1 族，最外层只有 1 个电子。"
          : symbol === "Cl"
            ? "氯在第 3 周期第 17 族。"
            : "氖是第 2 周期第 18 族的稀有气体。"
      );
      return;
    }
    setPlaced((current) => ({ ...current, [id]: symbol }));
    setHeld(null);
    setHint("同族元素通常有相似的价电子结构。");
  }

  return (
    <div className="puzzle-stage">
      <MissionStrip action="把 Na、Cl、Ne 放到正确的周期-族坐标" effect="获得周期步，让同族石柱连成高台" />
      <div className="periodic-board">
        <span className="board-corner" />
        <span>1 族</span>
        <span>17 族</span>
        <span>18 族</span>
        {[2, 3].map((period) => (
          <Fragment key={period}>
            <span className="period-label">第 {period} 周期</span>
            {cells.filter((cell) => cell.period === period).map((cell) => (
              <button
                key={cell.id}
                type="button"
                className={`board-cell ${cell.answer ? "is-slot" : "is-empty"} ${token === cell.id ? "is-shaking" : ""} ${placed[cell.id] ? "is-filled" : ""}`}
                onClick={() => cell.answer && place(cell.id)}
                disabled={!cell.answer}
                {...(cell.answer ? dropTargetProps((symbol) => place(cell.id, symbol)) : {})}
              >
                {placed[cell.id] ?? (cell.answer ? "放这里" : "")}
              </button>
            ))}
          </Fragment>
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
        <em>{held ? `正在放置 ${held}` : "把元素砖拖进对应格子，或先点砖再点格"}</em>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onSolved}>
        校准周期坐标 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function ElectronShellPuzzle({ onSolved }: PuzzleProps) {
  const caps = [2, 8, 8];
  const [shells, setShells] = useState([0, 0, 0]);
  const { token, shake } = useShake();
  const total = shells.reduce((sum, value) => sum + value, 0);
  const solved = shells.join("-") === "2-8-1";
  const [hint, setHint] = useState("点击内层电子云放入电子。钠一共 11 个电子，常见排布是 2-8-1。");

  function add(index: number) {
    if (total >= 11) {
      shake("atom");
      setHint("钠只有 11 个电子。先点已放入的电子收回，再调整外层。");
      return;
    }
    if (shells[index]! >= caps[index]!) {
      setHint(index === 2 ? "最外层只要 1 个电子。点已放入的电子收回，或改点内层。" : "这一层已经满了。点外一层，或点已放入的电子收回。");
      return;
    }
    const next = shells.map((value, itemIndex) => (itemIndex === index ? value + 1 : value));
    setShells(next);
    if (index > 0 && shells[index - 1]! < caps[index - 1]!) {
      setHint("电子先填满较内层，再进入外层。");
    } else {
      setHint(`已放置 ${next.reduce((sum, value) => sum + value, 0)} / 11 个电子。`);
    }
  }

  function remove(index: number) {
    if (!shells[index]) return;
    setShells((current) => current.map((value, itemIndex) => (itemIndex === index ? value - 1 : value)));
  }

  return (
    <div className="puzzle-stage">
      <MissionStrip action="为钠原子排布电子层" effect="获得价电子牵引，接通地图中的电子轨道" />
      <div className={`shell-atom ${token ? "is-shaking" : ""}`}>
        <ShellHitmap
          rings={[
            { label: "内层电子云，已有 " + shells[0] + " 个电子", onPick: () => add(0) },
            { label: "次外层电子云，已有 " + shells[1] + " 个电子", onPick: () => add(1) },
            { label: "最外层电子云，已有 " + shells[2] + " 个电子", onPick: () => add(2) }
          ]}
        />
        <div className="shell-nucleus">
          <strong>Na</strong>
          <small>11</small>
        </div>
        {shells.map((count, index) => (
          <span
            key={index}
            className={`shell-ring ring-${index} ${count === caps[index] || (index === 2 && count === 1) ? "is-stable" : ""}`}
          >
            {Array.from({ length: count }, (_, electron) => (
              <button
                key={electron}
                type="button"
                className="electron-dot"
                aria-label={`收回第 ${index + 1} 层电子`}
                style={{ transform: `rotate(${(360 / Math.max(count, 1)) * electron}deg) translateX(${58 + index * 28}px)` }}
                onClick={(event) => {
                  event.stopPropagation();
                  remove(index);
                }}
              />
            ))}
          </span>
        ))}
      </div>
      <div className="shell-readout">
        <span>{shells.join(" - ") || "0 - 0 - 0"}</span>
        <em>已放置 {total} / 11</em>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <div className="inline-actions">
        <button
          className="ghost-button"
          onClick={() => {
            setShells([0, 0, 0]);
            setHint("点击内层电子云放入电子。钠一共 11 个电子，常见排布是 2-8-1。");
          }}
        >
          <RotateCcw size={15} />清空
        </button>
        <CommitButton ready={solved} onCommit={onSolved}>
          稳定电子轨道 <ArrowRight size={16} />
        </CommitButton>
      </div>
    </div>
  );
}

function FamilySortPuzzle({ onSolved }: PuzzleProps) {
  const bins = [
    { id: "alkali", label: "碱金属", motif: "vine", accepts: ["Li", "Na", "K"] },
    { id: "halogen", label: "卤素", motif: "crystal", accepts: ["F", "Cl", "Br"] },
    { id: "noble", label: "稀有气体", motif: "lantern", accepts: ["He", "Ne", "Ar"] }
  ];
  const [held, setHeld] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const { token, shake } = useShake();
  const [hint, setHint] = useState("把九种元素送进对应的家族温室。同族通常有相似的价电子结构。");
  const solved = bins.every((bin) => bin.accepts.every((symbol) => placed[symbol] === bin.id));
  const remaining = bins.flatMap((bin) => bin.accepts).filter((symbol) => !placed[symbol]);

  function drop(binId: string, incoming?: string) {
    const symbol = incoming || held;
    if (!symbol) return;
    const bin = bins.find((item) => item.id === binId)!;
    if (!bin.accepts.includes(symbol)) {
      shake(binId);
      setHint(
        ["Li", "Na", "K"].includes(symbol)
          ? `${symbol} 是碱金属，最外层只有 1 个电子。`
          : ["F", "Cl", "Br"].includes(symbol)
            ? `${symbol} 是卤素，差 1 个电子就满层。`
            : `${symbol} 是稀有气体，最外层已经稳定。`
      );
      return;
    }
    setPlaced((current) => ({ ...current, [symbol]: binId }));
    setHeld(null);
    setHint("同族元素会表现出相近的化学性质。");
  }

  return (
    <div className="puzzle-stage">
      <MissionStrip action="把三组元素送回对应的家族温室" effect="获得族性共鸣，唤醒同族设施" />
      <div className="family-bins">
        {bins.map((bin) => (
          <button
            key={bin.id}
            type="button"
            className={`family-bin motif-${bin.motif} ${token === bin.id ? "is-shaking" : ""}`}
            onClick={() => drop(bin.id)}
            {...dropTargetProps((symbol) => drop(bin.id, symbol))}
          >
            <small>{bin.label}</small>
            <div className="bin-chips">
              {bin.accepts
                .filter((symbol) => placed[symbol] === bin.id)
                .map((symbol) => (
                  <span key={symbol}>{symbol}</span>
                ))}
            </div>
          </button>
        ))}
      </div>
      <div className="token-tray wrap">
        {remaining.map((symbol) => (
          <ElementToken
            key={symbol}
            symbol={symbol}
            selected={held === symbol}
            onPick={(value) => setHeld((current) => (current === value ? null : value))}
          />
        ))}
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onSolved}>
        完成家族分组 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function BondBuilderPuzzle({ onSolved }: PuzzleProps) {
  const [ionic, setIonic] = useState<"idle" | "held" | "done">("idle");
  const [covalent, setCovalent] = useState<"idle" | "held" | "done">("idle");
  const { token, shake } = useShake();
  const [hint, setHint] = useState("先让钠把最外层电子交给氯，再让两个氢共享一对电子。");
  const solved = ionic === "done" && covalent === "done";

  return (
    <div className="puzzle-stage">
      <MissionStrip action="完成一次电子转移和一次电子共享" effect="获得化学键编织，修复断裂的分子结构" />
      <div className="bond-lab">
        <div className={`bond-pair ${token === "ionic" ? "is-shaking" : ""} ${ionic === "done" ? "is-filled" : ""}`}>
          <button
            type="button"
            className={`bond-atom ${ionic === "held" ? "selected" : ""}`}
            onClick={() => {
              if (ionic === "done") return;
              setIonic("held");
              setHint("钠倾向失去电子。把这枚电子点到氯上。");
            }}
          >
            <strong>Na</strong>
            {ionic !== "done" ? <span className="electron-dot home" /> : <em>+</em>}
          </button>
          <span className={`bond-link ${ionic === "done" ? "ionic" : "idle"}`} />
          <button
            type="button"
            className="bond-atom"
            onClick={() => {
              if (ionic === "done") return;
              if (ionic !== "held") {
                shake("ionic");
                setHint("先点钠最外层的那枚电子，再交给氯。");
                return;
              }
              setIonic("done");
              setHint("电子转移形成离子键：Na⁺ 与 Cl⁻ 互相吸引。");
            }}
          >
            <strong>Cl</strong>
            {ionic === "done" ? <em>−</em> : <span className="electron-need">7</span>}
          </button>
          <small>离子键</small>
        </div>
        <div className={`bond-pair ${token === "covalent" ? "is-shaking" : ""} ${covalent === "done" ? "is-filled" : ""}`}>
          <button
            type="button"
            className={`bond-atom ${covalent === "held" ? "selected" : ""}`}
            onClick={() => {
              if (covalent === "done") return;
              setCovalent("held");
              setHint("氢也可以提供一枚电子。再点另一个氢，让它们共享。");
            }}
          >
            <strong>H</strong>
            {covalent !== "done" ? <span className="electron-dot home" /> : null}
          </button>
          <span className={`bond-link ${covalent === "done" ? "covalent" : "idle"}`} />
          <button
            type="button"
            className="bond-atom"
            onClick={() => {
              if (covalent === "done") return;
              if (covalent !== "held") {
                shake("covalent");
                setHint("两个氢都只有 1 个电子，要点两边才能共享。");
                return;
              }
              setCovalent("done");
              setHint("电子共享形成共价键，两个氢都获得稳定的双电子结构。");
            }}
          >
            <strong>H</strong>
            {covalent !== "done" ? <span className="electron-dot home" /> : null}
          </button>
          <small>共价键</small>
        </div>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onSolved}>
        编织稳定连接 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function IsotopePuzzle({ onSolved }: PuzzleProps) {
  const [n12, setN12] = useState(0);
  const [n14, setN14] = useState(0);
  const { token, shake } = useShake();
  const solved = n12 === 6 && n14 === 8;
  const hint = solved
    ? "同位素的质子数相同、中子数不同。质量数等于质子数与中子数之和。"
    : "两枚碳都锁着 6 枚质子。为碳-12 加 6 枚中子，为碳-14 加 8 枚中子。";

  function add(kind: "12" | "14") {
    if (kind === "12") {
      setN12((value) => {
        if (value >= 10) {
          shake("12");
          return value;
        }
        return value + 1;
      });
    } else {
      setN14((value) => {
        if (value >= 10) {
          shake("14");
          return value;
        }
        return value + 1;
      });
    }
  }

  return (
    <div className="puzzle-stage">
      <MissionStrip action="用质子数和中子数还原两种碳的质量数" effect="获得同位回声，进入隐藏的同位素穹室" />
      <div className="isotope-row">
        {[
          { id: "12", label: "碳-12", neutrons: n12, target: 6 },
          { id: "14", label: "碳-14", neutrons: n14, target: 8 }
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`isotope-core ${token === item.id ? "is-shaking" : ""} ${item.neutrons === item.target ? "is-filled" : ""}`}
            onClick={() => add(item.id as "12" | "14")}
          >
            <strong>{item.label}</strong>
            <ProtonCluster count={6} lit />
            <div className="neutron-row">
              {Array.from({ length: item.neutrons }, (_, index) => (
                <span key={index} className="neutron-bead" />
              ))}
            </div>
            <small>质量数 {6 + item.neutrons}</small>
          </button>
        ))}
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <div className="inline-actions">
        <button className="ghost-button" onClick={() => { setN12(0); setN14(0); }}>
          <RotateCcw size={15} />清空中子
        </button>
        <CommitButton ready={solved} onCommit={onSolved}>
          确认同位关系 <ArrowRight size={16} />
        </CommitButton>
      </div>
    </div>
  );
}

function SymbolMemoryPuzzle({ onSolved }: PuzzleProps) {
  const deck = useMemo(() => {
    const faces = ["H", "C", "O", "H", "C", "O"];
    for (let index = faces.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [faces[index], faces[swap]] = [faces[swap]!, faces[index]!];
    }
    return faces;
  }, []);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const solved = matched.length === 3;

  function flip(index: number) {
    if (lock || flipped.includes(index) || matched.includes(deck[index]!)) return;
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length < 2) return;
    const [a, b] = next;
    setLock(true);
    window.setTimeout(() => {
      if (deck[a!] === deck[b!]) setMatched((current) => [...current, deck[a!]!]);
      setFlipped([]);
      setLock(false);
    }, 520);
  }

  return (
    <div className="puzzle-stage">
      <MissionStrip action="翻开成对的元素符号，记住 H、C、O" effect="获得元素坐标片 × 1" />
      <div className="memory-grid">
        {deck.map((face, index) => {
          const open = flipped.includes(index) || matched.includes(face);
          return (
            <button
              key={`${face}-${index}`}
              type="button"
              className={`memory-card ${open ? "is-open" : ""} ${matched.includes(face) ? "is-filled" : ""}`}
              onClick={() => flip(index)}
            >
              {open ? face : "?"}
            </button>
          );
        })}
      </div>
      <p className={`puzzle-feedback ${solved ? "success-feedback" : ""}`}>
        {solved ? "三对符号都对上了。质子数 1、6、8 就是它们的身份。" : "一次翻两张。配对成功会留在台上。"}
      </p>
      <CommitButton ready={solved} onCommit={onSolved}>
        记下符号 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function TileSortPuzzle({ onSolved }: PuzzleProps) {
  const slots = [
    { id: "1", answer: "H" },
    { id: "6", answer: "C" },
    { id: "8", answer: "O" },
    { id: "10", answer: "Ne" }
  ];
  const [held, setHeld] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const { token, shake } = useShake();
  const solved = slots.every((slot) => placed[slot.id] === slot.answer);
  const remaining = ["H", "C", "O", "Ne"].filter((symbol) => !Object.values(placed).includes(symbol));

  function place(id: string, incoming?: string) {
    const symbol = incoming || held;
    if (!symbol) return;
    const slot = slots.find((item) => item.id === id)!;
    if (slot.answer !== symbol) {
      shake(id);
      return;
    }
    setPlaced((current) => ({ ...current, [id]: symbol }));
    setHeld(null);
  }

  return (
    <div className="puzzle-stage">
      <MissionStrip action="按原子序数把 H、C、O、Ne 放到数轴上" effect="获得元素坐标片 × 1" />
      <div className="number-line">
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            className={`line-slot ${token === slot.id ? "is-shaking" : ""} ${placed[slot.id] ? "is-filled" : ""}`}
            onClick={() => place(slot.id)}
            {...dropTargetProps((symbol) => place(slot.id, symbol))}
          >
            <small>{slot.id}</small>
            <strong>{placed[slot.id] ?? "·"}</strong>
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
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>
        {token ? "原子序数就是质子数。再数一次。" : "先找出最小的原子序数，再依次比较质子数。"}
      </p>
      <CommitButton ready={solved} onCommit={onSolved}>
        确认顺序 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function OrbitLinkPuzzle({ onSolved }: PuzzleProps) {
  const order = [0, 1, 2];
  const [progress, setProgress] = useState(0);
  const { token, shake } = useShake();
  const solved = progress >= 3;

  function click(index: number) {
    if (solved) return;
    if (index !== order[progress]) {
      shake("atom");
      setProgress(0);
      return;
    }
    setProgress((value) => value + 1);
  }

  return (
    <div className="puzzle-stage">
      <MissionStrip action="按电子层从内到外点亮钠的轨道" effect="获得电子轨道线 × 1" />
      <div className={`shell-atom compact ${token ? "is-shaking" : ""}`}>
        <ShellHitmap
          rings={[
            { label: "内层电子云", onPick: () => click(0) },
            { label: "次外层电子云", onPick: () => click(1) },
            { label: "最外层电子云", onPick: () => click(2) }
          ]}
        />
        <div className="shell-nucleus">
          <strong>Na</strong>
          <small>2-8-1</small>
        </div>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`shell-ring ring-${index} ${progress > index ? "is-stable" : ""}`}
          />
        ))}
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>
        {solved
          ? "电子先占据较内层，钠的最外层只留下 1 个电子。"
          : token
            ? "顺序错了。从最靠近原子核的那一层重新连。"
            : "先点内层 2，再点第二层 8，最后点最外层 1。"}
      </p>
      <CommitButton ready={solved} onCommit={onSolved}>
        接通轨道 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

const puzzleComponents: Record<PuzzleKind, ComponentType<PuzzleProps>> = {
  "atomic-identity": AtomicIdentityPuzzle,
  "periodic-placement": PeriodicPlacementPuzzle,
  "electron-shells": ElectronShellPuzzle,
  "family-sort": FamilySortPuzzle,
  "bond-builder": BondBuilderPuzzle,
  "isotope-balance": IsotopePuzzle
};

export function PuzzleModal({
  category,
  card,
  mode = "main",
  microPuzzleKind,
  microTitle,
  onClose,
  onSolved
}: PuzzleModalProps) {
  const Puzzle =
    mode === "micro"
      ? {
          "symbol-memory": SymbolMemoryPuzzle,
          "tile-sort": TileSortPuzzle,
          "orbit-link": OrbitLinkPuzzle
        }[microPuzzleKind ?? "symbol-memory"]
      : puzzleComponents[category.puzzleKind];

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="puzzle-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="puzzle-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">{mode === "micro" ? "元素机关 · 可选探索" : `知识区域 · ${category.subtitle}`}</span>
            <h2 id="puzzle-title">{mode === "micro" ? microTitle : category.name}</h2>
            <p className="question-line">
              {mode === "micro" ? "这是一次可选的现场练习，完成后会在周期庭院留下变化。" : card.summary}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>
        <Puzzle onSolved={onSolved} />
      </section>
    </div>
  );
}
