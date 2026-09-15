import {
  BookOpen,
  ChevronRight,
  Compass,
  Puzzle,
  Sparkles,
  X
} from "lucide-react";

interface PlaybookOverlayProps {
  onClose: () => void;
}

export function PlaybookOverlay({ onClose }: PlaybookOverlayProps) {
  return (
    <div className="playbook-layer" role="presentation" onMouseDown={onClose}>
      <section className="playbook-panel" role="dialog" aria-modal="true" aria-labelledby="playbook-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button playbook-close" onClick={onClose} aria-label="关闭玩法说明">
          <X size={18} />
        </button>
        <span className="eyebrow">序章 · 周期庭院</span>
        <h2 id="playbook-title">先观察，再把规律变成道路</h2>
        <p className="playbook-lead">
          这座庭院不是只有对话。W A S D 按镜头方向走，可斜向八向。先跟着金光柱走到发光原子旁，按住扫描原子核，再把符号放回身份门。刘看山会给方向，但每一步由你操作。
        </p>

        <div className="playbook-loop">
          <div><span><Compass size={19} /></span><strong>1. 按住扫描</strong><small>靠近发光原子后按住 E，仪器会一枚一枚点亮金色质子。外层蓝点是电子，不要算进去。</small></div>
          <ChevronRight size={18} />
          <div><span><BookOpen size={19} /></span><strong>2. 把样本插入身份门</strong><small>符号会拿在手上。走到门前，把 H、C、O 点进门上的 1、6、8，不必等三个凑齐。</small></div>
          <ChevronRight size={18} />
          <div><span><Puzzle size={19} /></span><strong>3. 点出规律再操作</strong><small>在卷宗图上点出那条能用的规律，再把符号、电子或化学键放到对应位置。</small></div>
          <ChevronRight size={18} />
          <div><span><Sparkles size={19} /></span><strong>4. 用规律继续探索</strong><small>每个区域会奖励一项能力，用它打开高台、温室和隐藏穹室。</small></div>
        </div>

        <div className="playbook-now">
          <span className="prompt-key">E</span>
          <div><strong>现在只做第一步</strong><p>关闭此页，跟着金光柱找码头上三颗发光的原子。按住 E 扫描金色质子，数完后按 E 拿起符号；走到身份门，把样本点进 1、6、8。</p></div>
        </div>
        <button className="primary-button wide" onClick={onClose}>出发，观察第一个样本</button>
      </section>
    </div>
  );
}
