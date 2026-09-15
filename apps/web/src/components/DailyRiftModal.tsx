import { useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ExternalLink,
  Radio,
  Sparkles,
  X
} from "lucide-react";
import type { DailyRift } from "@kanshan/shared";
import { CommitButton, useShake } from "./puzzleKit";

interface DailyRiftModalProps {
  rift: DailyRift;
  completed: boolean;
  onClose: () => void;
  onSolved: () => void;
}

export function DailyRiftModal({
  rift,
  completed,
  onClose,
  onSolved
}: DailyRiftModalProps) {
  const [held, setHeld] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(completed ? rift.puzzle.correctAnswer : null);
  const [feedback, setFeedback] = useState<string | null>(completed ? "裂隙已经稳定。" : null);
  const { token, shake } = useShake();
  const solved = placed === rift.puzzle.correctAnswer;

  function place() {
    if (completed || solved) return;
    if (!held) {
      setFeedback("先从下方拿起一条证据，再放到判断槽里。");
      return;
    }
    if (held !== rift.puzzle.correctAnswer) {
      shake("slot");
      setFeedback("这条证据链对不上。换一条再放入判断槽。");
      setHeld(null);
      setPlaced(null);
      return;
    }
    setPlaced(held);
    setHeld(null);
    setFeedback("回声稳定，裂隙开始收束。");
  }

  return (
    <div className="modal-backdrop rift-backdrop" onMouseDown={onClose}>
      <section
        className="rift-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rift-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">
              <CalendarClock size={14} />
              每日临时地图 · 08:00 刷新
            </span>
            <h2 id="rift-title">{rift.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>

        <div className="rift-content">
          <section className="rift-brief">
            <div className="rift-signal">
              <Radio size={20} />
              <span>{completed ? "裂隙已稳定" : "裂隙正在回响"}</span>
            </div>
            <p>{rift.premise}</p>
            <div className="objective-strip">
              <span>当前目标</span>
              <strong>{rift.objective}</strong>
            </div>
            <div className="rift-mechanics">
              {rift.mechanics.map((mechanic) => (
                <span key={mechanic}>{mechanic}</span>
              ))}
            </div>
          </section>

          <section className="zhihu-source-card">
            <header>
              <div>
                <span className="eyebrow">知乎热点回声</span>
                <h3>{rift.sourceTopic.title}</h3>
              </div>
              <a
                className="icon-button"
                href={rift.sourceTopic.url}
                target="_blank"
                rel="noreferrer"
                aria-label="打开原始热点"
              >
                <ExternalLink size={17} />
              </a>
            </header>
            <p>{rift.sourceTopic.summary}</p>
            {rift.sourceTopic.keyPoints.length ? (
              <div className="source-key-points">
                <strong>关键观点</strong>
                <ul>
                  {rift.sourceTopic.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="source-attribution">
              <span>
                {rift.sourceTopic.authorName ? (
                  <>
                    作者：
                    {rift.sourceTopic.authorUrl ? (
                      <a
                        href={rift.sourceTopic.authorUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {rift.sourceTopic.authorName}
                      </a>
                    ) : (
                      rift.sourceTopic.authorName
                    )}
                  </>
                ) : (
                  "作者信息：热榜接口暂未返回"
                )}
              </span>
              <small>只使用标题与摘要做游戏化转译，不复制原回答。</small>
            </div>
          </section>

          <section className="rift-puzzle">
            <span className="section-label">裂隙判断</span>
            <h3>{rift.puzzle.prompt}</h3>
            <button
              type="button"
              className={`evidence-slot ${token === "slot" ? "is-shaking" : ""} ${placed ? "is-filled" : ""}`}
              disabled={completed}
              onClick={place}
            >
              <small>判断槽</small>
              <strong>{placed ?? "放入一条证据"}</strong>
            </button>
            <div className="token-tray wrap">
              {rift.puzzle.options.filter((option) => option !== placed).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`evidence-chip ${held === option ? "selected" : ""}`}
                  disabled={completed}
                  onClick={() => {
                    setHeld((current) => (current === option ? null : option));
                    setFeedback(null);
                  }}
                >
                  {option}
                </button>
              ))}
              <em>{held ? "再点判断槽放上去" : "先选证据，再放入判断槽"}</em>
            </div>
            {feedback ? <p className={`rift-feedback ${token ? "error-feedback" : solved ? "success-feedback" : ""}`}>{feedback}</p> : null}
          </section>
        </div>

        <footer className="modal-actions">
          <div className="reward-hint">
            <Sparkles size={16} />
            <span>
              奖励：{rift.reward.skinId ?? "限定收藏"} · 今日异闻处理员
            </span>
          </div>
          {completed ? (
            <button className="primary-button" onClick={onClose}>
              已收录进异闻录
              <Check size={16} />
            </button>
          ) : (
            <CommitButton ready={solved} auto={!completed} onCommit={onSolved}>
              提交判断
              <ArrowRight size={16} />
            </CommitButton>
          )}
        </footer>
      </section>
    </div>
  );
}
