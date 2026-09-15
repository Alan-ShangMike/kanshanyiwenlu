import { useState } from "react";
import { ArrowRight, ExternalLink, Link2Off, X } from "lucide-react";
import type { CategoryDefinition, KnowledgeCard } from "@kanshan/shared";
import { CommitButton, ShellHitmap, useShake } from "./puzzleKit";

interface KnowledgeModalProps {
  category: CategoryDefinition;
  card: KnowledgeCard;
  alreadyRead: boolean;
  onClose: () => void;
  onEnterPuzzle: () => void;
}

export function KnowledgeModal({
  category,
  card,
  alreadyRead,
  onClose,
  onEnterPuzzle
}: KnowledgeModalProps) {
  const { token, shake } = useShake();
  const [picked, setPicked] = useState<string | null>(alreadyRead ? "correct" : null);
  const solved = picked === "correct";

  function pick(id: string) {
    if (solved) return;
    if (id !== "correct") {
      shake(id);
      setPicked(null);
      return;
    }
    setPicked("correct");
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="knowledge-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="knowledge-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">知乎知识卷宗 · {category.subtitle}</span>
            <h2 id="knowledge-title">{card.title}</h2>
            <p className="question-line">{card.question}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>

        <div className="knowledge-body">
          <div className="knowledge-purpose">
            <span>你为什么来到这里</span>
            <strong>{category.description}</strong>
            <small>先看摘要，再在现场图上点出那条能用的规律。</small>
          </div>
          <div className="summary-block">
            <span className="section-label">摘要</span>
            <p>{card.summary}</p>
          </div>

          <div>
            <span className="section-label">关键观点</span>
            <ol className="key-points">
              {card.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ol>
          </div>

          <LawBoard categoryId={category.id} picked={picked} token={token} onPick={pick} />

          <div className="source-strip">
            <div className="source-icon">
              {card.source.url ? <ExternalLink size={18} /> : <Link2Off size={18} />}
            </div>
            <div>
              <span className="section-label">原始来源</span>
              <p>{card.source.title}</p>
              <p className="muted">
                {card.source.authorName
                  ? `作者：${card.source.authorName}`
                  : "作者信息将在接入真实知乎回答后显示"}
              </p>
            </div>
            {card.source.url ? (
              <a
                className="text-link"
                href={card.source.url}
                target="_blank"
                rel="noreferrer"
              >
                查看原文
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        </div>

        <footer className="modal-actions">
          <span className="muted">
            {alreadyRead ? "本章节已收录进异闻录。" : solved ? "规律已锁定，即将进入现场操作。" : "点对现场图，才能开始操作。"}
          </span>
          <CommitButton ready={solved} auto={!alreadyRead} onCommit={onEnterPuzzle}>
            用这条规律去操作
            <ArrowRight size={16} />
          </CommitButton>
        </footer>
      </section>
    </div>
  );
}

function LawBoard({
  categoryId,
  picked,
  token,
  onPick
}: {
  categoryId: string;
  picked: string | null;
  token: string | null;
  onPick: (id: string) => void;
}) {
  const solved = picked === "correct";
  if (categoryId === "periodic-gallery") {
    return (
      <div className="law-board">
        <span className="section-label">现场规律</span>
        <h3>哪张地图能把迷路的元素送回家？</h3>
        <div className="law-choice-row">
          <button
            type="button"
            className={`law-map ${token === "mass" ? "is-shaking" : ""}`}
            onClick={() => onPick("mass")}
          >
            <small>按重量排队</small>
            <strong>H C O Ne Na</strong>
            <em>质量数越大越靠后</em>
          </button>
          <button
            type="button"
            className={`law-map grid ${solved ? "is-filled" : ""}`}
            onClick={() => onPick("correct")}
          >
            <small>周期表坐标</small>
            <span className="mini-period">
              <i>Li</i><i>C</i><i>Ne</i>
              <i>Na</i><i>Si</i><i>Ar</i>
            </span>
            <em>横行是周期，纵列是族</em>
          </button>
        </div>
        <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>
          {solved ? "同族上下对齐，周期左右延伸。拿这张地图去放砖。" : token ? "重量会变，坐标更稳。再看另一张图。" : "点选一张能预测化学行为的地图。"}
        </p>
      </div>
    );
  }

  if (categoryId === "electron-observatory") {
    return (
      <div className="law-board">
        <span className="section-label">现场规律</span>
        <h3>钠容易失去的是哪一枚电子？</h3>
        <div className={`lift-atom law-atom ${token ? "is-shaking" : ""} ${solved ? "is-filled" : ""}`}>
          <ShellHitmap
            rings={[
              { label: "内层电子云", onPick: () => onPick("inner") },
              { label: "次外层电子云", onPick: () => onPick("inner") },
              { label: "最外层电子云", onPick: () => onPick("correct") }
            ]}
          />
          <button type="button" className="shell-nucleus" onClick={() => onPick("nucleus")}>
            <strong>Na</strong>
            <small>核</small>
          </button>
          {[0, 1, 2].map((ring) => (
            <span key={ring} className={`mini-orbit orbit-${ring}`}>
              {Array.from({ length: ring === 0 ? 2 : ring === 1 ? 8 : 1 }, (_, electron) => (
                <button
                  key={electron}
                  type="button"
                  className={`electron-dot ${ring === 2 ? "valence" : ""}`}
                  aria-label={ring === 2 ? "最外层电子" : "内层电子"}
                  style={{
                    transform: `rotate(${(360 / (ring === 1 ? 8 : ring === 0 ? 2 : 1)) * electron}deg) translateX(${44 + ring * 16}px)`
                  }}
                  onClick={() => onPick(ring === 2 ? "correct" : "inner")}
                />
              ))}
            </span>
          ))}
        </div>
        <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>
          {solved ? "最外层只有 1 个电子，所以钠倾向失去它。" : token === "nucleus" ? "原子核决定身份，不决定反应倾向。" : token ? "内层电子通常不参与成键。" : "点最外层那枚发光的电子，内层电子云也可以点。"}
        </p>
      </div>
    );
  }

  if (categoryId === "family-greenhouse") {
    return (
      <div className="law-board">
        <span className="section-label">现场规律</span>
        <h3>哪一间温室里的元素会一起醒来？</h3>
        <div className="law-choice-row">
          <button
            type="button"
            className={`family-bin motif-vine ${solved ? "is-filled" : ""}`}
            onClick={() => onPick("correct")}
          >
            <small>同族</small>
            <div className="bin-chips"><span>Li</span><span>Na</span><span>K</span></div>
            <em>最外层都是 1</em>
          </button>
          <button
            type="button"
            className={`family-bin motif-lantern ${token === "mix" ? "is-shaking" : ""}`}
            onClick={() => onPick("mix")}
          >
            <small>路遇的邻居</small>
            <div className="bin-chips"><span>Li</span><span>C</span><span>Ne</span></div>
            <em>原子序数连续</em>
          </button>
        </div>
        <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>
          {solved ? "同族通常有相似的价电子结构，所以脾气也相近。" : token ? "连续的原子序数不等于一家人。" : "选出真正属于同一族的那一组。"}
        </p>
      </div>
    );
  }

  if (categoryId === "bond-workshop") {
    return (
      <div className="law-board">
        <span className="section-label">现场规律</span>
        <h3>金属钠和非金属氯之间，该怎么连？</h3>
        <div className="bond-lab compact">
          <button
            type="button"
            className={`bond-pair ${solved ? "is-filled" : ""}`}
            onClick={() => onPick("correct")}
          >
            <div className="bond-atom"><strong>Na</strong><em>+</em></div>
            <span className="bond-link ionic" />
            <div className="bond-atom"><strong>Cl</strong><em>-</em></div>
            <small>电子转移</small>
          </button>
          <button
            type="button"
            className={`bond-pair ${token === "share" ? "is-shaking" : ""}`}
            onClick={() => onPick("share")}
          >
            <div className="bond-atom"><strong>H</strong></div>
            <span className="bond-link covalent" />
            <div className="bond-atom"><strong>H</strong></div>
            <small>电子共享</small>
          </button>
        </div>
        <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>
          {solved ? "金属与非金属倾向转移电子，形成离子键。" : token ? "两个氢才会共享电子。钠和氯是另一种关系。" : "点选更符合 Na 与 Cl 的那种连接。"}
        </p>
      </div>
    );
  }

  if (categoryId === "isotope-vault") {
    return (
      <div className="law-board">
        <span className="section-label">现场规律</span>
        <h3>两枚碳一轻一重，点出它们仍是同一种元素的原因。</h3>
        <div className="isotope-row">
          {["碳-12", "碳-14"].map((label) => (
            <div key={label} className={`isotope-core ${solved ? "is-filled" : ""}`}>
              <strong>{label}</strong>
              <button type="button" className="proton-cluster static" onClick={() => onPick("correct")} aria-label="质子">
                {Array.from({ length: 6 }, (_, index) => <span key={index} className="proton-bead" />)}
              </button>
              <button
                type="button"
                className={`mass-chip ${token === "mass" ? "is-shaking" : ""}`}
                onClick={() => onPick("mass")}
              >
                质量数不同
              </button>
            </div>
          ))}
        </div>
        <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>
          {solved ? "质子数相同，所以都叫碳；中子数不同，所以重量不同。" : token ? "质量数会被中子改写。先看两边相同的金色质子。" : "点两枚核里都有的金色质子。"}
        </p>
      </div>
    );
  }

  return (
    <div className="law-board">
      <span className="section-label">现场规律</span>
      <h3>点出决定元素名字的部分</h3>
      <div className={`lift-atom law-atom ${token ? "is-shaking" : ""} ${solved ? "is-filled" : ""}`}>
        <button type="button" className="mass-chip law-mass" onClick={() => onPick("mass")}>
          质量数
        </button>
        <button type="button" className="shell-nucleus" onClick={() => onPick("correct")}>
          <strong>质子</strong>
          <small>点这里</small>
        </button>
        <span className="mini-orbit orbit-0">
          {Array.from({ length: 4 }, (_, electron) => (
            <button
              key={electron}
              type="button"
              className="electron-dot"
              aria-label="电子"
              style={{ transform: `rotate(${90 * electron}deg) translateX(42px)` }}
              onClick={() => onPick("electron")}
            />
          ))}
        </span>
      </div>
      <p className={`puzzle-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>
        {solved ? "质子数就是原子序数，也是元素的名字。" : token === "mass" ? "质量数会被中子改变，不决定元素身份。" : token ? "电子只在外面绕，改不了名字。" : "对照摘要，点原子核。"}
      </p>
    </div>
  );
}
