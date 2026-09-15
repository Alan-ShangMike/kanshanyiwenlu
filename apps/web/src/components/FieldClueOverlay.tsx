import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import type { FieldClueDefinition } from "@kanshan/shared";
import { CommitButton, prefersReducedMotion, useShake } from "./puzzleKit";

interface FieldClueOverlayProps {
  clue: FieldClueDefinition;
  inspectedCount: number;
  totalCount: number;
  alreadyInspected: boolean;
  onClose: () => void;
  onRecord: () => void;
}

const samples: Record<string, { protons: number; electrons: number[]; symbol: string }> = {
  "atom-hydrogen": { protons: 1, electrons: [1], symbol: "H" },
  "atom-carbon": { protons: 6, electrons: [2, 4], symbol: "C" },
  "atom-oxygen": { protons: 8, electrons: [2, 6], symbol: "O" }
};

export function FieldClueOverlay({
  clue,
  inspectedCount,
  totalCount,
  alreadyInspected,
  onClose,
  onRecord
}: FieldClueOverlayProps) {
  const sample = samples[clue.id] ?? samples["atom-hydrogen"]!;
  const [marked, setMarked] = useState<number[]>(() =>
    alreadyInspected ? Array.from({ length: sample.protons }, (_, index) => index) : []
  );
  const [scanning, setScanning] = useState(false);
  const { token, shake } = useShake();
  const solved = marked.length === sample.protons;
  const returning = inspectedCount > 0;
  const [hint, setHint] = useState(
    alreadyInspected
      ? `质子数为 ${sample.protons}，元素身份是 ${sample.symbol}。`
      : inspectedCount > 0
        ? "按住金色核。质子数就是它的名字。"
        : "按住金色原子核，让仪器一枚一枚数出质子。外层蓝点是电子，不要点它们。"
  );
  const nextCount = Math.min(totalCount, inspectedCount + (solved && !alreadyInspected ? 1 : 0));

  const protons = useMemo(
    () =>
      Array.from({ length: sample.protons }, (_, index) => {
        const angle = (Math.PI * 2 * index) / sample.protons - Math.PI / 2;
        const radius = sample.protons === 1 ? 0 : sample.protons <= 6 ? 16 : 18;
        return {
          id: index,
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius
        };
      }),
    [sample.protons]
  );

  useEffect(() => {
    if (!scanning || solved) return;
    if (prefersReducedMotion()) {
      setMarked(protons.map((proton) => proton.id));
      setScanning(false);
      setHint(`质子数为 ${sample.protons}，元素身份由此确定。`);
      return;
    }
    const id = window.setInterval(() => {
      setMarked((current) => {
        if (current.length >= sample.protons) return current;
        const nextId = protons.find((proton) => !current.includes(proton.id))?.id;
        if (nextId === undefined) return current;
        return [...current, nextId];
      });
    }, 140);
    return () => window.clearInterval(id);
  }, [protons, sample.protons, scanning, solved]);

  useEffect(() => {
    if (!scanning) return;
    if (marked.length === sample.protons) {
      setHint(`质子数为 ${sample.protons}，元素身份由此确定。`);
      setScanning(false);
    } else if (marked.length) {
      setHint(`仪器正在计数：${marked.length} / ${sample.protons}`);
    }
  }, [marked.length, sample.protons, scanning]);

  function startScan(event?: { currentTarget: HTMLElement; pointerId: number }) {
    if (solved || scanning) return;
    event?.currentTarget.setPointerCapture(event.pointerId);
    setScanning(true);
    setHint("对准原子核。质子带正电，一枚一枚被点亮。");
  }

  function stopScan() {
    if (solved) return;
    setScanning(false);
    if (!marked.length) setHint("按住金色核继续扫描。电子绕行不改身份。");
  }

  function markProton(id: number) {
    if (solved) return;
    setScanning(false);
    setMarked((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      if (next.length === sample.protons) {
        setHint(`质子数为 ${sample.protons}，元素身份由此确定。`);
      } else {
        setHint(`已点亮 ${next.length} / ${sample.protons} 枚质子。也可直接点原子核自动计数。`);
      }
      return next;
    });
  }

  function pokeElectron() {
    if (solved) return;
    shake("electron");
    setHint("那是电子，它在轨道上绕行，不决定元素身份。");
  }

  return (
    <div className="clue-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="clue-panel clue-board"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clue-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button clue-close" onClick={onClose} aria-label="关闭观察记录">
          <X size={18} />
        </button>
        <div className={`clue-instrument ${token === "electron" ? "is-shaking" : ""}`}>
          <div className={`mini-orrery shells-${sample.electrons.length} ${solved ? "is-filled" : ""} ${scanning ? "is-scanning" : ""}`}>
            {scanning ? <span className="scan-ring" /> : null}
            {!solved ? <span className="scan-callout">{scanning ? "正在计数" : "按住金色核"}</span> : <span className="scan-callout is-ready">点符号拿起</span>}
            <button
              type="button"
              className="proton-cluster scan-target"
              onPointerDown={(event) => startScan(event)}
              onPointerUp={stopScan}
              onPointerCancel={stopScan}
              onClick={() => startScan()}
              aria-label="按住扫描原子核"
            >
              {protons.map((proton) => (
                <span
                  key={proton.id}
                  role="presentation"
                  className={`proton-bead ${marked.includes(proton.id) ? "is-on" : ""}`}
                  style={{ left: `${proton.x}%`, top: `${proton.y}%` }}
                  onClick={(event) => {
                    event.stopPropagation();
                    markProton(proton.id);
                  }}
                />
              ))}
            </button>
            {sample.electrons.map((count, ring) => (
              <span key={ring} className={`mini-orbit orbit-${ring}`}>
                {Array.from({ length: count }, (_, electron) => (
                  <button
                    key={electron}
                    type="button"
                    className="electron-dot"
                    aria-label="电子"
                    style={{
                      transform: `rotate(${(360 / count) * electron}deg) translateX(${28 + ring * 16}px)`
                    }}
                    onClick={pokeElectron}
                  />
                ))}
              </span>
            ))}
            <strong
              className={solved && !alreadyInspected ? "pickup-ready" : ""}
              onClick={() => {
                if (solved && !alreadyInspected) onRecord();
              }}
            >
              {solved ? sample.symbol : marked.length || "?"}
            </strong>
          </div>
          <small>{solved ? clue.reading : scanning ? "正在计数质子" : "按住金色原子核"}</small>
        </div>
        <div className="clue-copy">
          <span className="eyebrow">现场调查 · {clue.title}</span>
          <h2 id="clue-title">{clue.label}</h2>
          <p>
            {solved
              ? clue.observation
              : returning
                ? "对准中心的金色核。电子绕行不改身份，数完就能收进样本袋。"
                : "这颗原子还没有名字。把探针对准中心的金色原子核，仪器会替你数出质子；外层绕行的蓝点不要算进去。"}
          </p>
          <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{hint}</p>
          {solved ? (
            <div className="clue-conclusion">
              <small>写进样本袋</small>
              <strong>{clue.conclusion}</strong>
            </div>
          ) : null}
          <div className="clue-footer">
            <span>
              <Check size={14} />
              元素样本 {alreadyInspected ? inspectedCount : nextCount} / {totalCount}
            </span>
            {alreadyInspected ? (
              <button className="primary-button" onClick={onClose}>
                回到地图
                <ArrowRight size={16} />
              </button>
            ) : (
              <CommitButton ready={solved} auto={false} onCommit={onRecord}>
                拿起 {sample.symbol}
                <ArrowRight size={16} />
              </CommitButton>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export function FieldScanHud({
  clueId,
  marked,
  total,
  complete,
  holding,
  onHoldChange,
  onPickup
}: {
  clueId: string;
  marked: number;
  total: number;
  complete: boolean;
  holding: boolean;
  onHoldChange: (holding: boolean) => void;
  onPickup: () => void;
}) {
  const sample = samples[clueId] ?? samples["atom-hydrogen"]!;
  const atomName = clueId === "atom-hydrogen" ? "氢原子" : clueId === "atom-carbon" ? "碳原子" : clueId === "atom-oxygen" ? "氧原子" : "发光原子";
  const protons = Array.from({ length: sample.protons }, (_, index) => {
    const angle = (Math.PI * 2 * index) / sample.protons - Math.PI / 2;
    const radius = sample.protons === 1 ? 0 : sample.protons <= 6 ? 16 : 18;
    return {
      id: index,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius
    };
  });

  return (
    <div className={`field-scan-hud glass-panel is-quest ${complete ? "is-ready" : ""} ${holding ? "is-holding" : ""}`}>
      <span className="quest-glow" aria-hidden="true" />
      <div
        className={`mini-orrery shells-${sample.electrons.length} ${complete ? "is-filled" : ""} ${holding ? "is-scanning" : ""}`}
        onPointerDown={(event) => {
          if (complete) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          onHoldChange(true);
        }}
        onPointerUp={() => onHoldChange(false)}
        onPointerCancel={() => onHoldChange(false)}
      >
        <button
          type="button"
          className={`proton-cluster scan-target ${holding || complete ? "is-on" : ""}`}
          aria-label="扫描原子核"
          onClick={() => {
            if (complete) onPickup();
          }}
        >
          {protons.map((proton) => (
            <span
              key={proton.id}
              className={`proton-bead ${proton.id < marked ? "is-on" : ""}`}
              style={{ left: `${proton.x}%`, top: `${proton.y}%` }}
            />
          ))}
        </button>
        {sample.electrons.map((count, ring) => (
          <span key={ring} className={`mini-orbit orbit-${ring}`}>
            {Array.from({ length: count }, (_, electron) => (
              <span
                key={electron}
                className="electron-dot"
                style={{
                  transform: `rotate(${(360 / count) * electron}deg) translateX(${22 + ring * 12}px)`
                }}
              />
            ))}
          </span>
        ))}
        <strong
          className={complete ? "pickup-ready" : ""}
          onClick={() => {
            if (complete) onPickup();
          }}
        >
          {complete ? sample.symbol : marked || "?"}
        </strong>
      </div>
      <div className="field-scan-copy">
        <span className={`prompt-key is-scan ${holding ? "is-holding" : ""}`} aria-hidden="true">E</span>
        <div>
          <small>{complete ? `${atomName} · 身份已确定` : `任务目标 · ${atomName}`}</small>
          <strong>{complete ? `质子数 ${total}，这是 ${sample.symbol}` : holding ? `正在计数金色质子 ${marked} / ${total}` : `按住 E，只数${atomName}的金色质子`}</strong>
          <em>{complete ? "按 E 或点击符号，把样本拿在手上。" : "外层蓝点是电子，不要算进去。质子数就是它的名字。"}</em>
        </div>
        {complete ? (
          <button type="button" className="primary-button" onClick={onPickup}>
            拿起 {sample.symbol}
          </button>
        ) : null}
      </div>
    </div>
  );
}

