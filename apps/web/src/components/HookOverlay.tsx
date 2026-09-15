import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { WorldHookDefinition } from "@kanshan/shared";
import { CommitButton, ElementToken, dropTargetProps, useShake } from "./puzzleKit";

interface HookOverlayProps {
  hook: WorldHookDefinition;
  onClose: () => void;
  onSolved: () => void;
}

function BlankTileBoard({ onSolved }: { onSolved: () => void }) {
  const [held, setHeld] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);
  const { token, shake } = useShake();
  const [hint, setHint] = useState("石格只留下原子序数 10。把对应的元素符号放回去。");
  const solved = placed === "Ne";
  const remaining = ["C", "O", "Ne", "Na"].filter((symbol) => symbol !== placed);

  function place(incoming?: string) {
    const symbol = incoming || held;
    if (!symbol) {
      setHint("先从托盘拿起一个元素符号。");
      return;
    }
    if (symbol !== "Ne") {
      shake("tile");
      setHint(
        symbol === "Na"
          ? "钠是 11 号。10 号元素的最外层已经排满。"
          : symbol === "C"
            ? "碳是 6 号。再往右数到 10。"
            : "氧是 8 号。10 号才是氖。"
      );
      return;
    }
    setPlaced("Ne");
    setHeld(null);
    setHint("原子序数 10 就是氖。稀有气体的最外层已经稳定。");
  }

  return (
    <div className="puzzle-stage">
      <p className="hook-brief">空白格不肯显示名字，只留下一个金色的 10。</p>
      <button
        type="button"
        className={`blank-tile ${token === "tile" ? "is-shaking" : ""} ${solved ? "is-filled" : ""}`}
        onClick={() => place()}
        {...dropTargetProps(place)}
      >
        <small>原子序数</small>
        <strong>10</strong>
        <em>{placed ?? "放回符号"}</em>
      </button>
      <div className="token-tray">
        {remaining.map((symbol) => (
          <ElementToken
            key={symbol}
            symbol={symbol}
            selected={held === symbol}
            onPick={(value) => setHeld((current) => (current === value ? null : value))}
          />
        ))}
        <em>{held ? `正在放置 ${held}` : "把 Ne 拖回写着 10 的石格"}</em>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onSolved}>
        让 Ne 重新浮现 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function NobleShellBoard({ onSolved }: { onSolved: () => void }) {
  const [outer, setOuter] = useState(0);
  const { token, shake } = useShake();
  const [hint, setHint] = useState("氖的内层已经有 2 个电子。把最外层补到 8，它就会像氦和氩一样安静。");
  const solved = outer === 8;

  function add() {
    if (solved) return;
    if (outer >= 8) return;
    const next = outer + 1;
    setOuter(next);
    setHint(next === 8 ? "最外层满了。稀有气体因此不愿成键。" : `外层 ${next} / 8。继续点空位。`);
  }

  function pokeStable(id: string) {
    if (solved) return;
    shake(id);
    setHint(id === "He" ? "氦的第一层已经排满 2 个电子。" : "氩的最外层也是 8，所以它同样安静。");
  }

  return (
    <div className="puzzle-stage">
      <p className="hook-brief">三盏第 18 族的灯都在等一个满层的外轨道。</p>
      <div className="lantern-row">
        <button type="button" className={`family-bin motif-lantern ${token === "He" ? "is-shaking" : ""} is-filled`} onClick={() => pokeStable("He")}>
          <small>He</small>
          <div className="mini-orrery shells-1 is-filled">
            <span className="shell-nucleus compact"><strong>2</strong></span>
            <span className="mini-orbit orbit-0">
              {Array.from({ length: 2 }, (_, index) => (
                <span key={index} className="electron-dot" style={{ transform: `rotate(${index * 180}deg) translateX(22px)` }} />
              ))}
            </span>
          </div>
        </button>
        <div className={`family-bin motif-lantern ${solved ? "is-filled" : ""}`}>
          <small>Ne</small>
          <button
            type="button"
            className="mini-orrery shells-2 noble-shell"
            onClick={add}
            aria-label="为氖补全外层电子"
          >
            <span className="shell-nucleus compact"><strong>{outer}/8</strong></span>
            <span className="mini-orbit orbit-0">
              {Array.from({ length: 2 }, (_, index) => (
                <span key={index} className="electron-dot" style={{ transform: `rotate(${index * 180}deg) translateX(22px)` }} />
              ))}
            </span>
            <span className="mini-orbit orbit-1">
              {Array.from({ length: 8 }, (_, index) => (
                <span
                  key={index}
                  className={`electron-dot ${index < outer ? "is-on" : "is-slot"}`}
                  style={{ transform: `rotate(${index * 45}deg) translateX(38px)` }}
                />
              ))}
            </span>
          </button>
        </div>
        <button type="button" className={`family-bin motif-lantern ${token === "Ar" ? "is-shaking" : ""} is-filled`} onClick={() => pokeStable("Ar")}>
          <small>Ar</small>
          <div className="mini-orrery shells-2 is-filled">
            <span className="shell-nucleus compact"><strong>8</strong></span>
            <span className="mini-orbit orbit-1">
              {Array.from({ length: 8 }, (_, index) => (
                <span key={index} className="electron-dot" style={{ transform: `rotate(${index * 45}deg) translateX(34px)` }} />
              ))}
            </span>
          </div>
        </button>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onSolved}>
        点亮三盏静默灯 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function WaterBondBoard({ onSolved }: { onSolved: () => void }) {
  const [complete, setComplete] = useState(false);
  const { token, shake } = useShake();
  const [hint, setHint] = useState("氧在中间，两边各要一条共价键。点那条还在闪的虚线。");

  return (
    <div className="puzzle-stage">
      <p className="hook-brief">水分子拱门少了一条键，影子因此缺了一角。</p>
      <div className={`water-arch ${token ? "is-shaking" : ""} ${complete ? "is-filled" : ""}`}>
        <button type="button" className="water-atom" onClick={() => { shake("H1"); setHint("点的是氢原子。要补的是它和氧之间的键。"); }}>
          H
        </button>
        <span className="water-bond is-complete" />
        <button type="button" className="water-atom oxygen" onClick={() => { shake("O"); setHint("氧已经就位。它还需要第二条键。"); }}>
          O
        </button>
        <button
          type="button"
          className={`water-bond ${complete ? "is-complete" : "is-missing"}`}
          onClick={() => {
            setComplete(true);
            setHint("两条共价键都接上了。氧共享两对电子，水分子重新站稳。");
          }}
          aria-label="补上缺失的共价键"
        />
        <button type="button" className="water-atom" onClick={() => { shake("H2"); setHint("这颗氢在等一条共享电子对。"); }}>
          H
        </button>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : complete ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={complete} onCommit={onSolved}>
        让拱门投下完整影子 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function CarbonEchoBoard({ onSolved }: { onSolved: () => void }) {
  const [marked, setMarked] = useState<string[]>([]);
  const { token, shake } = useShake();
  const [hint, setHint] = useState("两枚碳一轻一重。点它们共同拥有的金色质子，不要点质量数。");
  const solved = marked.includes("12") && marked.includes("14");

  function mark(id: string) {
    if (solved) return;
    setMarked((current) => (current.includes(id) ? current : [...current, id]));
    setHint("同位素的质子数相同。再点另一枚核里的金色质子。");
  }

  return (
    <div className="puzzle-stage">
      <p className="hook-brief">碳-14 多了两声中子回响，但元素名字没有改。</p>
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
              onClick={() => mark(item.id)}
              aria-label={`${item.label} 的质子`}
            >
              {Array.from({ length: 6 }, (_, index) => <span key={index} className="proton-bead" />)}
            </button>
            <div className="neutron-row">
              {Array.from({ length: item.neutrons }, (_, index) => <span key={index} className="neutron-bead" />)}
            </div>
            <button
              type="button"
              className={`mass-chip ${token === item.id ? "is-shaking" : ""}`}
              onClick={() => {
                shake(item.id);
                setHint("那是质量数，会被中子改变。先数金色的质子。");
              }}
            >
              质量数 {item.mass}
            </button>
          </div>
        ))}
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
      <CommitButton ready={solved} onCommit={onSolved}>
        收下碳年代回声 <ArrowRight size={16} />
      </CommitButton>
    </div>
  );
}

function HookBoard({ hook, onSolved }: { hook: WorldHookDefinition; onSolved: () => void }) {
  switch (hook.id) {
    case "blank-element-tile":
      return <BlankTileBoard onSolved={onSolved} />;
    case "noble-gas-pavilion":
      return <NobleShellBoard onSolved={onSolved} />;
    case "water-molecule-arch":
      return <WaterBondBoard onSolved={onSolved} />;
    case "carbon-fourteen-echo":
      return <CarbonEchoBoard onSolved={onSolved} />;
    default:
      return (
        <div className="puzzle-stage">
          <p className="hook-brief">{hook.hint}</p>
          <CommitButton ready onCommit={onSolved}>
            收录这处结构 <ArrowRight size={16} />
          </CommitButton>
        </div>
      );
  }
}

export function HookOverlay({ hook, onClose, onSolved }: HookOverlayProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="puzzle-modal hook-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hook-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">隐藏结构 · {hook.label}</span>
            <h2 id="hook-title">{hook.title}</h2>
            <p className="question-line">{hook.description}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>
        <HookBoard hook={hook} onSolved={onSolved} />
      </section>
    </div>
  );
}
