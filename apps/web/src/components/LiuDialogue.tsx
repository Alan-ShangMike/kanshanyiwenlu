import { useEffect, useRef, useState } from "react";
import { Compass, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import type { PlayerState } from "@kanshan/shared";
import { api, ApiError } from "../api";

interface DialogueLine {
  id: number;
  role: "liu" | "player";
  text: string;
}

interface LiuDialogueProps {
  player: PlayerState;
  seed: string | null;
  guideLabel?: string;
  onGuide?: () => void;
  onClose: () => void;
}

function openingLine(player: PlayerState) {
  if (player.completedCategoryIds.length === 0) {
    return "谢邀。人在元素港，刚下飞舟。先别问我是谁。码头那根金光柱下是氢原子，按住 E 数清 1 枚金色质子。质子数就是它的名字。以上。";
  }
  if (player.completedCategoryIds.length >= 5) {
    return "谢邀。六类元素规律都醒了。远处还有一格没有署名，先别急着离开，我想看看今天的裂隙会留下什么。以上。";
  }
  return "你现在的路线没有唯一答案。想继续主线，我会指方向；想乱逛，我就负责把离谱的发现记下来。";
}

export function LiuDialogue({ player, seed, guideLabel, onGuide, onClose }: LiuDialogueProps) {
  const [lines, setLines] = useState<DialogueLine[]>([
    {
      id: 0,
      role: "liu",
      text: seed ?? openingLine(player)
    }
  ]);
  const [suggestions, setSuggestions] = useState([
    "氢原子在哪？",
    "质子数为什么是名字？",
    "身份门怎么开？"
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"deepseek" | "local">("local");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [lines, busy]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    const nextId = lines.length + 1;
    setLines((current) => [
      ...current,
      { id: nextId, role: "player", text: trimmed }
    ]);
    setInput("");
    setBusy(true);
    try {
      const response = await api.guide(trimmed);
      setSource(response.source);
      setSuggestions(response.suggestions);
      setLines((current) => [
        ...current,
        { id: current.length + 1, role: "liu", text: response.text }
      ]);
    } catch (error) {
      setLines((current) => [
        ...current,
        {
          id: current.length + 1,
          role: "liu",
          text:
            error instanceof ApiError
              ? `刚才的频道有点堵：${error.message}`
              : "刚才的频道有点堵，不过我会先留在港口。"
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialogue-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="dialogue-panel"
        role="dialog"
        aria-modal="true"
        aria-label="与刘看山对话"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialogue-close" onClick={onClose} aria-label="关闭对话">
          <X size={19} />
        </button>
        <div className="dialogue-portrait">
          <img src="/assets/liu-kanshan/computer.png" alt="" />
          <span className={`ai-source ${source}`}>
            <Sparkles size={12} />
            {source === "deepseek" ? "智能引导" : "离线引导"}
          </span>
        </div>
        <div className="dialogue-main">
          <header>
            <div>
              <span className="eyebrow">周期庭院引路人</span>
              <h2>刘看山</h2>
            </div>
            <span className="dialogue-status">正在听</span>
          </header>

          <div
            className="dialogue-lines"
            ref={scrollRef}
            role="log"
            aria-live="polite"
            tabIndex={0}
          >
            {lines.map((line) => (
              <div key={line.id} className={`dialogue-line ${line.role}`}>
                {line.role === "liu" ? (
                  <span className="line-avatar">看山</span>
                ) : null}
                <p>{line.text}</p>
              </div>
            ))}
            {busy ? (
              <div className="dialogue-line liu">
                <span className="line-avatar">看山</span>
                <p className="typing-line">
                  <LoaderCircle className="spin" size={14} />
                  正在把线索理顺
                </p>
              </div>
            ) : null}
          </div>

          <div className="dialogue-suggestions">
            {suggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                disabled={busy}
                onClick={() => void send(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {onGuide ? (
            <div className="dialogue-guide">
              <button type="button" className="dialogue-guide-button" onClick={onGuide}>
                <Compass size={16} />
                一键返航{guideLabel ? ` · 去${guideLabel}` : ""}
              </button>
            </div>
          ) : null}

          <form
            className="dialogue-input"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              maxLength={240}
              placeholder="问问看山，或者说说你想做什么"
              onChange={(event) => setInput(event.target.value)}
            />
            <button
              className="icon-button accent"
              disabled={busy || !input.trim()}
              aria-label="发送"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
