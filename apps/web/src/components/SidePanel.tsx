import { BookOpen, Check, Feather, FlaskConical, LockKeyhole, Sparkles, Trophy, X } from "lucide-react";
import type { BootstrapPayload } from "@kanshan/shared";
import { useState } from "react";
import { api } from "../api";

export type PanelTab = "journal" | "achievements" | "workbench";

interface SidePanelProps {
  tab: PanelTab;
  payload: BootstrapPayload;
  onChangeTab: (tab: PanelTab) => void;
  onClose: () => void;
  onPlayerChange: (player: BootstrapPayload["player"]) => void;
  onNoteAdded: (note: BootstrapPayload["notes"][number]) => void;
  onDiscoveryNamed: (hookId: string, name: string, discovererName: string) => void;
}

export function SidePanel({
  tab,
  payload,
  onChangeTab,
  onClose,
  onPlayerChange,
  onNoteAdded,
  onDiscoveryNamed
}: SidePanelProps) {
  const player = payload.player;
  const unlocked = new Set(player.unlockedSkillIds);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});

  async function saveNote() {
    if (note.trim().length < 4 || busy) return;
    setBusy(true);
    try {
      const created = await api.createNote(player.position, note);
      onNoteAdded(created);
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  async function nameDiscovery(hookId: string) {
    const name = nameDrafts[hookId]?.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const result = await api.nameDiscovery(hookId, name);
      onDiscoveryNamed(hookId, result.name, result.namedBy);
      setNameDrafts((current) => ({ ...current, [hookId]: "" }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside
        className="side-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="探索记录"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="drawer-header">
          <div>
            <span className="eyebrow">周期庭院档案室</span>
            <h2>异闻录</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={19} />
          </button>
        </header>

        <div className="segmented-control">
          <button
            className={tab === "journal" ? "active" : ""}
            onClick={() => onChangeTab("journal")}
          >
            <BookOpen size={16} />
            知识卷宗
          </button>
          <button
            className={tab === "achievements" ? "active" : ""}
            onClick={() => onChangeTab("achievements")}
          >
            <Trophy size={16} />
            成就
          </button>
          <button
            className={tab === "workbench" ? "active" : ""}
            onClick={() => onChangeTab("workbench")}
          >
            <FlaskConical size={16} />
            构式与笔记
          </button>
        </div>

        <div className="drawer-body">
          {tab === "journal" ? (
            <div className="journal-list">
              {payload.region.categories.map((category, index) => {
                const completed = player.completedCategoryIds.includes(category.id);
                const gate = payload.region.gates.find(
                  (item) => item.categoryId === category.id
                );
                const prerequisitesMet = category.prerequisiteSkillIds.every(
                  (skillId) => unlocked.has(skillId)
                );
                const gateOpened = !gate || player.openedGateIds.includes(gate.id);
                const available = prerequisitesMet && gateOpened;
                const card = payload.knowledgeCards.find(
                  (item) => item.id === category.knowledgeCardId
                );
                const hidden = category.hidden && !prerequisitesMet;
                return (
                  <article
                    className={`journal-entry ${completed ? "completed" : ""} ${
                      hidden ? "hidden-entry" : ""
                    }`}
                    key={category.id}
                  >
                    <div
                      className="journal-index"
                      style={{ "--entry-color": category.color } as React.CSSProperties}
                    >
                      {completed ? <Check size={15} /> : String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="journal-entry-main">
                      <div className="journal-entry-title">
                        <div>
                          <span>{category.subtitle}</span>
                          <h3>{hidden ? "尚未显现的区域" : category.name}</h3>
                        </div>
                        <span className={`status-pill ${completed ? "done" : ""}`}>
                          {completed
                            ? "已归档"
                            : available
                              ? "可探索"
                              : prerequisitesMet
                                ? "通路未开"
                                : "未解锁"}
                        </span>
                      </div>
                      <p>
                        {hidden
                          ? "此路口已被折叠。404 NOT FOUND——这片区域还没被知识照亮。"
                          : prerequisitesMet && !gateOpened && gate
                            ? `知识条件已经满足，但“${gate.label}”仍封着前往这里的通路。`
                          : category.description}
                      </p>
                      {!hidden && card ? (
                        <div className="knowledge-reference">
                          <BookOpen size={14} />
                          <span>{card.title}</span>
                          {player.readKnowledgeCardIds.includes(card.id) ? (
                            <small>已读</small>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : tab === "achievements" ? (
            <div className="achievement-grid">
              {payload.achievements.map((achievement) => {
                const unlockedAchievement = player.achievementIds.includes(
                  achievement.id
                );
                const progress = Math.min(
                  player.achievementProgress[achievement.id] ?? 0,
                  achievement.targetCount
                );
                const hidden = achievement.hidden && !unlockedAchievement;
                return (
                  <article
                    className={`achievement-card ${
                      unlockedAchievement ? "unlocked" : ""
                    }`}
                    key={achievement.id}
                  >
                    <div className="achievement-icon">
                      {hidden ? (
                        <LockKeyhole size={18} />
                      ) : unlockedAchievement ? (
                        <Trophy size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )}
                    </div>
                    <div>
                      <h3>{hidden ? "尚未命名" : achievement.name}</h3>
                      <p>
                        {hidden
                          ? "继续探索后，这条记录才会显露。"
                          : achievement.description}
                      </p>
                      <div className="achievement-progress">
                        <span
                          style={{
                            width: `${(progress / achievement.targetCount) * 100}%`
                          }}
                        />
                      </div>
                      <small>
                        {unlockedAchievement
                          ? `奖励：${achievement.reward.label}`
                          : `${progress} / ${achievement.targetCount}`}
                      </small>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="workbench-list">
              <section className="workbench-section">
                <div className="workbench-heading">
                  <div>
                    <span className="eyebrow">知识组合编辑器</span>
                    <h3>把理解写成招式</h3>
                  </div>
                  <Sparkles size={18} />
                </div>
                <p className="workbench-intro">
                  已学技能可以组成稳定的知识构式。规则由游戏预先验证，刘看山只负责解释它们在世界里的用法。
                </p>
                <div className="technique-list">
                  {payload.techniques.map((technique) => {
                    const unlockedTechnique = player.craftedTechniqueIds.includes(technique.id);
                    const ready = technique.components.every((component) =>
                      payload.skills.some((skill) => skill.name === component && unlocked.has(skill.id))
                    );
                    return (
                      <article className={`technique-card ${unlockedTechnique ? "crafted" : ""}`} key={technique.id}>
                        <span className="technique-mark" style={{ background: technique.color }} />
                        <div>
                          <h4>{technique.name}</h4>
                          <p>{technique.description}</p>
                          <small>{technique.components.join(" + ")} · {technique.useHint}</small>
                        </div>
                        <button
                          className="icon-button"
                          disabled={!ready || unlockedTechnique || busy}
                          title={unlockedTechnique ? "已写入构式" : ready ? "写入构式" : "先学会组成技能"}
                          aria-label={unlockedTechnique ? `${technique.name}已写入` : `写入${technique.name}`}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              const result = await api.progress({ type: "craft-technique", techniqueId: technique.id });
                              onPlayerChange(result.player);
                              onClose();
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          {unlockedTechnique ? <Check size={16} /> : <FlaskConical size={16} />}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="workbench-section note-section">
                <div className="workbench-heading">
                  <div>
                    <span className="eyebrow">异步知识笔记</span>
                    <h3>给后来者留一句话</h3>
                  </div>
                  <Feather size={18} />
                </div>
                <p className="workbench-intro">笔记会落在你当前所在的位置，帮助下一位探索者少走一点弯路。</p>
                <textarea
                  value={note}
                  maxLength={180}
                  placeholder="例如：第 1 族元素的最外层通常有 1 个价电子。"
                  onChange={(event) => setNote(event.target.value)}
                />
                <button className="secondary-button" disabled={busy || note.trim().length < 4} onClick={() => void saveNote()}>
                  <Feather size={15} /> 发布在当前位置
                </button>
                <div className="note-feed">
                  {payload.notes.slice(0, 5).map((item) => (
                    <article key={item.id}>
                      <p>{item.text}</p>
                      <small>{item.authorName} · {item.position.x},{item.position.y}</small>
                    </article>
                  ))}
                  {!payload.notes.length ? <span className="muted">这里还没有同行笔记。</span> : null}
                </div>
              </section>

              <section className="workbench-section">
                <div className="workbench-heading">
                  <div>
                    <span className="eyebrow">发现榜</span>
                    <h3>给首次发现留下名字</h3>
                  </div>
                  <Trophy size={18} />
                </div>
                <p className="workbench-intro">第一位发现者可以为隐藏线索留下一个名字。命名后它会成为周期庭院的公共记录。</p>
                <div className="discovery-list">
                  {payload.discoveries.map((discovery) => (
                    <article key={discovery.hookId}>
                      <div>
                        <strong>{discovery.name ?? discovery.title}</strong>
                        <small>{discovery.name ? `发现者：${discovery.discovererName ?? "未知"}` : "等待发现者命名"}</small>
                      </div>
                      {!discovery.name && discovery.discovererName === payload.user.nickname ? (
                        <div className="discovery-name-form">
                          <input
                            value={nameDrafts[discovery.hookId] ?? ""}
                            maxLength={24}
                            placeholder="起个名字"
                            onChange={(event) => setNameDrafts((current) => ({ ...current, [discovery.hookId]: event.target.value }))}
                          />
                          <button className="icon-button" disabled={busy || !nameDrafts[discovery.hookId]?.trim()} onClick={() => void nameDiscovery(discovery.hookId)} aria-label="确认命名">
                            <Check size={15} />
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                  {!payload.discoveries.length ? <span className="muted">先去地图发现一处隐藏线索。</span> : null}
                </div>
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
