import { useState } from "react";
import { ArrowRight, BookOpen, MessageCircle, SkipForward, X } from "lucide-react";
import type { CategoryDefinition, PlayerState } from "@kanshan/shared";

interface StoryLine {
  speaker: "liu" | "player" | "narrator";
  name: string;
  text: string;
  mood: string;
}

interface StoryEpisodeProps {
  category: CategoryDefinition;
  player: PlayerState;
  onClose: () => void;
  onStudy: () => void;
}

const episodes: Record<string, { chapter: string; hook: string; lines: StoryLine[] }> = {
  "atomic-forum": {
    chapter: "序章 · 无名的三个名字",
    hook: "庭院入口的三颗原子同时失去了元素符号。",
    lines: [
      { speaker: "narrator", name: "周期庭院", mood: "记录", text: "风从知识街尽头吹来，三块元素铭牌在石台上翻了个面。" },
      { speaker: "liu", name: "刘看山", mood: "观察", text: "别急着给它们贴名字。先看看原子核里有几枚质子，身份线索通常藏在那里。" },
      { speaker: "player", name: "你", mood: "推理", text: "也就是说，外观和重量都可能骗人，质子数才是它的身份证？" },
      { speaker: "liu", name: "刘看山", mood: "点头", text: "答对一半就已经很危险了。剩下的一半，去问问那三颗原子自己。" }
    ]
  },
  "periodic-gallery": {
    chapter: "第一章 · 迷路的元素砖",
    hook: "元素砖把周期表当成了没有路牌的城市。",
    lines: [
      { speaker: "narrator", name: "周期坐标廊", mood: "广播", text: "一排元素砖在街角打转，每一块都坚称自己没有走错。" },
      { speaker: "liu", name: "刘看山", mood: "指路", text: "横着看是周期，竖着看是族。它们不是随机散落，而是在一张行为地图上排队。" },
      { speaker: "player", name: "你", mood: "确认", text: "那我先用原子序数确认顺序，再用行和列找位置。" },
      { speaker: "liu", name: "刘看山", mood: "轻笑", text: "很好。城市不会因为你记住路牌而变小，但元素的迷路会。" }
    ]
  },
  "electron-observatory": {
    chapter: "第二章 · 轨道上的灯",
    hook: "高台上的电子轨道正在把最外层的灯一盏盏甩出去。",
    lines: [
      { speaker: "narrator", name: "电子云台", mood: "警报", text: "蓝色轨道交错成云，内层和外层的电子灯光混在了一起。" },
      { speaker: "liu", name: "刘看山", mood: "提醒", text: "先别被旋转吓到。内层电子通常安静地待着，真正决定很多化学选择的是价电子。" },
      { speaker: "player", name: "你", mood: "观察", text: "所以要按层排布，最后盯住最外层，不能只数总数。" },
      { speaker: "liu", name: "刘看山", mood: "认真", text: "把那一层点亮，悬空的路就知道该往哪里落了。" }
    ]
  },
  "family-greenhouse": {
    chapter: "第三章 · 温室里的远亲",
    hook: "温室把几位性格相似的元素分错了房间。",
    lines: [
      { speaker: "narrator", name: "元素家族温室", mood: "喧闹", text: "锂、钠、钾在同一扇门外排队，氟和氯却在另一边争论谁更像家长。" },
      { speaker: "liu", name: "刘看山", mood: "解释", text: "同族像拥有相似的价电子习惯。不是长得像，而是最外层的行为有共同节奏。" },
      { speaker: "player", name: "你", mood: "整理", text: "把同一列的元素放回一起，就能预测它们相似的脾气。" },
      { speaker: "liu", name: "刘看山", mood: "打趣", text: "化学里的家谱比群聊清静，至少第十八族通常不急着参与争论。" }
    ]
  },
  "bond-workshop": {
    chapter: "第四章 · 两种合作方式",
    hook: "工坊的桥断成两种形状：一条要转移，一条要共享。",
    lines: [
      { speaker: "narrator", name: "成键工坊", mood: "回响", text: "两枚原子站在断桥两侧，手里各捧着一枚发光电子。" },
      { speaker: "liu", name: "刘看山", mood: "提问", text: "关系稳定不只有一种写法。有时电子转移，形成相反电荷的离子；有时电子共享，形成共价键。" },
      { speaker: "player", name: "你", mood: "选择", text: "我得先看参与者的价电子结构，再决定是交接还是一起握住。" },
      { speaker: "liu", name: "刘看山", mood: "鼓励", text: "去把桥编回来。别担心，原子不会因为共享一对电子就要求你们平分早餐。" }
    ]
  },
  "isotope-vault": {
    chapter: "终章 · 同名的两种重量",
    hook: "穹室里有两个碳原子，它们的重量不同，却都坚持自己叫碳。",
    lines: [
      { speaker: "narrator", name: "同位素穹室", mood: "低语", text: "两束回声在穹顶交汇，一束标着 12，一束标着 14。" },
      { speaker: "liu", name: "刘看山", mood: "温和", text: "别被质量数带偏。元素身份先看质子数；中子数不同，才让同一种元素有了不同的重量。" },
      { speaker: "player", name: "你", mood: "推导", text: "碳-12 和碳-14 都有 6 个质子，只是中子数分别是 6 和 8。" },
      { speaker: "liu", name: "刘看山", mood: "收束", text: "这就是同位素。记住这点，穹室最后一扇门会把整个庭院的关系串起来。" }
    ]
  }
};

export function StoryEpisode({ category, player, onClose, onStudy }: StoryEpisodeProps) {
  const episode = episodes[category.id] ?? episodes["atomic-forum"]!;
  const [lineIndex, setLineIndex] = useState(0);
  const line = episode.lines[lineIndex]!;
  const lastLine = lineIndex === episode.lines.length - 1;
  const completedBefore = player.completedCategoryIds.includes(category.id);

  function advance() {
    if (lastLine) {
      onStudy();
      return;
    }
    setLineIndex((current) => current + 1);
  }

  return (
    <div className="story-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="story-episode"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="story-header">
          <div>
            <span className="eyebrow"><MessageCircle size={14} /> 知识街剧情记录</span>
            <h2 id="story-title">{episode.chapter}</h2>
            <p>{episode.hook}</p>
          </div>
          <div className="story-header-actions">
            <button className="story-skip" onClick={onStudy}>
              <SkipForward size={14} /> 跳过剧情
            </button>
            <button className="icon-button" onClick={onClose} aria-label="关闭剧情">
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="story-stage">
          <div className={`story-portrait ${line.speaker}`}>
            {line.speaker === "liu" ? (
              <img src="/assets/liu-kanshan/greet.png" alt="" />
            ) : line.speaker === "player" ? (
              <div className="player-portrait">你</div>
            ) : (
              <BookOpen size={42} />
            )}
          </div>
          <div className="story-copy">
            <div className="story-meta">
              <strong>{line.name}</strong>
              <span>{line.mood}</span>
            </div>
            <p className="story-text">{line.text}</p>
            <div className="story-progress" aria-label={`剧情进度 ${lineIndex + 1} / ${episode.lines.length}`}>
              {episode.lines.map((_, index) => (
                <span key={index} className={index <= lineIndex ? "active" : ""} />
              ))}
            </div>
            <button className="primary-button story-next" onClick={advance}>
              {lastLine ? (completedBefore ? "回到已归档知识" : "进入知识学习") : "继续"}
              {lastLine ? <BookOpen size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
        <footer className="story-footer">
          <span>点击空白处关闭 · Esc 返回地图</span>
          <span>{lineIndex + 1} / {episode.lines.length}</span>
        </footer>
      </section>
    </div>
  );
}
