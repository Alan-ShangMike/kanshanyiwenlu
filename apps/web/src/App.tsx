import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  Crosshair,
  FlaskConical,
  Heart,
  LoaderCircle,
  Puzzle,
  Settings2,
  Sparkles,
  Trophy,
  UserRound,
  X
} from "lucide-react";
import type {
  BootstrapPayload,
  CategoryDefinition,
  DailyRift,
  GridPosition,
  ProgressMutation,
  ProgressResult,
  SkillDefinition
} from "@kanshan/shared";
import { api, ApiError, type MeResponse } from "./api";
import { AdminModal } from "./components/AdminModal";
import { DailyRiftModal } from "./components/DailyRiftModal";
import { GameCanvas, type FieldScanState, type QuestHint, type SeekGuide, type WorldInteraction } from "./components/GameCanvas";
import { FieldClueOverlay, FieldScanHud } from "./components/FieldClueOverlay";
import { GateOverlay, IdentitySocketRow } from "./components/GateOverlay";
import { HookOverlay } from "./components/HookOverlay";
import { KnowledgeModal } from "./components/KnowledgeModal";
import { LiuDialogue } from "./components/LiuDialogue";
import { LoginScreen } from "./components/LoginScreen";
import { PuzzleModal } from "./components/PuzzleModal";
import { PlaybookOverlay } from "./components/PlaybookOverlay";
import { FlyingSample, HeldCursor, IDENTITY_SOCKETS, SampleChip, identityComplete, prefersReducedMotion, tryPlaceIdentity } from "./components/puzzleKit";
import { SidePanel, type PanelTab } from "./components/SidePanel";
import { StoryEpisode } from "./components/StoryEpisode";

interface ToastItem {
  id: string;
  title: string;
  detail?: string;
  tone: "default" | "success" | "error";
}

interface RewardState {
  eyebrow: string;
  title: string;
  description: string;
  skill?: SkillDefinition;
  items: string[];
}

const SAMPLE_ATOMS = [
  { id: "atom-hydrogen", symbol: "H", name: "氢", protons: 1 },
  { id: "atom-carbon", symbol: "C", name: "碳", protons: 6 },
  { id: "atom-oxygen", symbol: "O", name: "氧", protons: 8 }
] as const;

const QUEST_LESSONS = [
  { step: 1, label: "走到氢，按住 E" },
  { step: 2, label: "再数碳 6、氧 8" },
  { step: 3, label: "放入身份门 1 6 8" },
  { step: 4, label: "打开原子论坛" }
] as const;

function questHintFor(payload: BootstrapPayload | null): QuestHint | null {
  if (!payload) return null;
  const firstGate = payload.region.gates.find((gate) => gate.categoryId === "atomic-forum");
  const nextClue = payload.region.fieldClues.find((clue) => !payload.player.inspectedClueIds.includes(clue.id));
  if (nextClue) return { kind: "field-clue", id: nextClue.id };
  if (firstGate && !payload.player.openedGateIds.includes(firstGate.id)) {
    return { kind: "gate", id: firstGate.id };
  }
  if (!payload.player.completedCategoryIds.includes("atomic-forum")) {
    return { kind: "category", id: "atomic-forum" };
  }
  const unlocked = new Set(payload.player.unlockedSkillIds);
  const next = payload.region.categories.find(
    (category) =>
      !payload.player.completedCategoryIds.includes(category.id) &&
      category.prerequisiteSkillIds.every((skillId) => unlocked.has(skillId))
  );
  if (next) {
    const gate = payload.region.gates.find((item) => item.categoryId === next.id);
    if (gate && !payload.player.openedGateIds.includes(gate.id)) return { kind: "gate", id: gate.id };
    return { kind: "category", id: next.id };
  }
  return null;
}

function questGuideLabel(hint: QuestHint | null) {
  if (!hint) return "当前目标";
  if (hint.kind === "field-clue") {
    if (hint.id === "atom-hydrogen") return "氢原子";
    if (hint.id === "atom-carbon") return "碳原子";
    if (hint.id === "atom-oxygen") return "氧原子";
    return "发光原子";
  }
  if (hint.kind === "gate") return hint.id === "gate-atomic-forum" ? "身份门" : "通路机关";
  if (hint.kind === "category") return hint.id === "atomic-forum" ? "原子论坛" : "下一处读经台";
  if (hint.kind === "micro-puzzle") return "现场机关";
  if (hint.kind === "world-hook") return "隐藏结构";
  if (hint.kind === "liu") return "刘看山";
  if (hint.kind === "rift") return "今日裂隙";
  return "当前目标";
}

function guideReturnSeed(hint: QuestHint | null, reason: string) {
  return `${reason}点一键返航，我带你去${questGuideLabel(hint)}。以上。`;
}

function getAuthErrorMessage() {
  const error = new URLSearchParams(window.location.search).get("auth_error");
  if (!error) return null;
  const messages: Record<string, string> = {
    authorization_denied: "你在知乎授权页取消了登录。",
    missing_code: "知乎没有返回授权码，请重新登录。",
    missing_state: "登录会话已失效，请从当前浏览器重新发起登录。",
    invalid_state: "登录校验没有通过，请重新发起知乎登录。",
    oauth_failed: "知乎登录暂时失败，请稍后重试。"
  };
  return messages[error] ?? "知乎登录没有完成，请重试。";
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <main className="loading-screen">
      <div className="loading-mark">
        <FlaskConical size={28} />
      </div>
      <LoaderCircle className="spin" size={22} />
      <p>{label}</p>
    </main>
  );
}

function RewardModal({
  reward,
  onClose
}: {
  reward: RewardState;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop reward-backdrop" onMouseDown={onClose}>
      <section
        className="reward-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button reward-close" onClick={onClose} aria-label="关闭">
          <X size={19} />
        </button>
        <div className="reward-emblem">
          <Sparkles size={28} />
        </div>
        <span className="eyebrow">{reward.eyebrow}</span>
        <h2 id="reward-title">{reward.title}</h2>
        <p>{reward.description}</p>

        {reward.skill ? (
          <div
            className="unlocked-skill"
            style={{ "--skill-color": reward.skill.color } as React.CSSProperties}
          >
            <div className="skill-sigil">
              <FlaskConical size={22} />
            </div>
            <div>
              <span>获得能力</span>
              <strong>{reward.skill.name}</strong>
              <small>{reward.skill.traversalHint}</small>
            </div>
          </div>
        ) : null}

        {reward.items.length ? (
          <div className="reward-items">
            {reward.items.map((item) => (
              <span key={item}>
                <Check size={14} />
                {item}
              </span>
            ))}
          </div>
        ) : null}

        <button className="primary-button wide" onClick={onClose}>
          收下并继续探索
        </button>
      </section>
    </div>
  );
}

export function App() {
  const [session, setSession] = useState<MeResponse | null>(null);
  const [payload, setPayload] = useState<BootstrapPayload | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [storyCategoryId, setStoryCategoryId] = useState<string | null>(null);
  const [puzzleCategoryId, setPuzzleCategoryId] = useState<string | null>(null);
  const [microPuzzleId, setMicroPuzzleId] = useState<string | null>(null);
  const [fieldClueId, setFieldClueId] = useState<string | null>(null);
  const [hookId, setHookId] = useState<string | null>(null);
  const [gateId, setGateId] = useState<string | null>(null);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [dialogueSeed, setDialogueSeed] = useState<string | null>(null);
  const [dialogueKey, setDialogueKey] = useState(0);
  const [guideToken, setGuideToken] = useState(0);
  const [panelTab, setPanelTab] = useState<PanelTab | null>(null);
  const [riftOpen, setRiftOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [voteOpen, setVoteOpen] = useState(false);
  const [objectiveFresh, setObjectiveFresh] = useState(false);
  const [nearby, setNearby] = useState<WorldInteraction | null>(null);
  const [seekGuide, setSeekGuide] = useState<SeekGuide | null>(null);
  const [fieldScan, setFieldScan] = useState<FieldScanState | null>(null);
  const [hudScanHold, setHudScanHold] = useState(false);
  const [heldSample, setHeldSample] = useState<string | null>(null);
  const [identitySlots, setIdentitySlots] = useState<Record<string, string>>({});
  const [flyingSample, setFlyingSample] = useState<{
    symbol: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);
  const [justCollectedId, setJustCollectedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [reward, setReward] = useState<RewardState | null>(null);
  const openingGateRef = useRef(false);
  const recordingClueRef = useRef<string | null>(null);
  const placeIdentityRef = useRef<(socketId: string, incoming?: string) => boolean>(() => false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (voteOpen) return setVoteOpen(false);
      if (playbookOpen) return setPlaybookOpen(false);
      if (adminOpen) return setAdminOpen(false);
      if (profileOpen) return setProfileOpen(false);
      if (riftOpen) return setRiftOpen(false);
      if (reward) return setReward(null);
      if (microPuzzleId) return setMicroPuzzleId(null);
      if (puzzleCategoryId) return setPuzzleCategoryId(null);
      if (activeCategoryId) return setActiveCategoryId(null);
      if (storyCategoryId) return setStoryCategoryId(null);
      if (fieldClueId) return setFieldClueId(null);
      if (hookId) return setHookId(null);
      if (gateId) return setGateId(null);
      if (dialogueOpen) return setDialogueOpen(false);
      if (panelTab) return setPanelTab(null);
      if (heldSample) return setHeldSample(null);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeCategoryId, adminOpen, dialogueOpen, fieldClueId, gateId, heldSample, hookId, microPuzzleId, panelTab, playbookOpen, profileOpen, puzzleCategoryId, reward, riftOpen, storyCategoryId, voteOpen]);

  function pushToast(
    title: string,
    options: { detail?: string; tone?: ToastItem["tone"] } = {}
  ) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [
      ...current,
      {
        id,
        title,
        detail: options.detail,
        tone: options.tone ?? "default"
      }
    ]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }

  useEffect(() => {
    let active = true;
    api
      .me()
      .then((result) => {
        if (active) setSession(result);
      })
      .catch((error) => {
        if (active) {
          setSession({
            authenticated: false,
            allowDevAuth: true,
            integrations: {
              zhihuOAuthConfigured: false,
              zhihuOpenPlatformConfigured: false,
              deepSeekConfigured: false
            }
          });
          setBootError(
            error instanceof Error ? error.message : "无法连接本地服务。"
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.authenticated) return;
    let active = true;
    setBootError(null);
    api
      .bootstrap()
      .then((result) => {
        if (active) setPayload(result);
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          setSession((current) =>
            current ? { ...current, authenticated: false, user: undefined } : current
          );
          return;
        }
        setBootError(error instanceof Error ? error.message : "游戏数据加载失败。");
      });
    return () => {
      active = false;
    };
  }, [session?.authenticated]);

  useEffect(() => {
    if (!justCollectedId) return;
    const timer = window.setTimeout(() => setJustCollectedId(null), 980);
    return () => window.clearTimeout(timer);
  }, [justCollectedId]);

  useEffect(() => {
    function handleHotkey(event: KeyboardEvent) {
      if (event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (
        playbookOpen ||
        voteOpen ||
        adminOpen ||
        profileOpen ||
        riftOpen ||
        reward ||
        microPuzzleId ||
        puzzleCategoryId ||
        activeCategoryId ||
        storyCategoryId ||
        fieldClueId ||
        hookId ||
        dialogueOpen ||
        panelTab
      ) {
        return;
      }
      const nearIdentity =
        nearby?.kind === "gate" &&
        nearby.id === "gate-atomic-forum" &&
        !nearby.opened &&
        !nearby.locked;
      const canInsert = Boolean(heldSample && (gateId === "gate-atomic-forum" || nearIdentity));
      if (canInsert && (event.key === "1" || event.key === "6" || event.key === "8")) {
        event.preventDefault();
        placeIdentityRef.current(event.key);
        return;
      }
      const map: Record<string, string> = { "1": "H", "2": "C", "3": "O" };
      const symbol = map[event.key];
      if (!symbol) return;
      const collected = payload?.player.inspectedClueIds ?? [];
      const sample = SAMPLE_ATOMS.find((item) => item.symbol === symbol);
      if (!sample || !collected.includes(sample.id)) return;
      if (Object.values(identitySlots).includes(symbol)) return;
      event.preventDefault();
      setHeldSample((current) => (current === symbol ? null : symbol));
    }
    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [
    activeCategoryId,
    adminOpen,
    dialogueOpen,
    fieldClueId,
    hookId,
    gateId,
    heldSample,
    identitySlots,
    microPuzzleId,
    nearby,
    panelTab,
    payload,
    playbookOpen,
    profileOpen,
    puzzleCategoryId,
    reward,
    riftOpen,
    storyCategoryId,
    voteOpen
  ]);

  useEffect(() => {
    if (!fieldScan) setHudScanHold(false);
  }, [fieldScan]);

  const runProgress = useCallback(async (mutation: ProgressMutation) => {
    const result = await api.progress(mutation);
    setPayload((current) => {
      if (!current) return current;
      if (!result.firstDiscovery) {
        return { ...current, player: result.player };
      }
      const existing = current.discoveries.some(
        (item) => item.hookId === result.firstDiscovery?.hookId
      );
      return {
        ...current,
        player: result.player,
        discoveries: existing
          ? current.discoveries
          : [
              ...current.discoveries,
              {
                hookId: result.firstDiscovery.hookId,
                title: result.firstDiscovery.title,
                name: null,
                discovererName: current.user.nickname,
                namedAt: null
              }
            ]
      };
    });
    return result;
  }, []);

  const handleDevLogin = async () => {
    setLoginBusy(true);
    setBootError(null);
    try {
      await api.devLogin();
      const nextSession = await api.me();
      setSession(nextSession);
    } catch (error) {
      setBootError(error instanceof Error ? error.message : "演示登录失败。");
    } finally {
      setLoginBusy(false);
    }
  };

  const showDialogue = useCallback((seed: string | null = null) => {
    setDialogueSeed(seed);
    setDialogueKey((current) => current + 1);
    setDialogueOpen(true);
  }, []);

  const startQuestGuide = useCallback(() => {
    setDialogueOpen(false);
    setGuideToken((current) => current + 1);
  }, []);

  const handleSavePosition = useCallback((position: GridPosition) => {
    void api
      .progress({ type: "save-position", position })
      .then((result) => {
        setPayload((current) =>
          current ? { ...current, player: result.player } : current
        );
      })
      .catch(() => {
        // Position persistence is best-effort while the player is exploring.
      });
  }, []);

  const handleInteraction = useCallback(
    async (interaction: WorldInteraction) => {
      if (!payload) return;
      if (
        storyCategoryId ||
        activeCategoryId ||
        puzzleCategoryId ||
        microPuzzleId ||
        fieldClueId ||
        hookId ||
        gateId ||
        dialogueOpen ||
        panelTab ||
        riftOpen ||
        adminOpen ||
        reward
      ) {
        return;
      }
      if (interaction.kind === "field-clue") {
        if (!interaction.inspected) {
          const hint = questHintFor(payload);
          if (hint?.kind === "field-clue" && hint.id && hint.id !== interaction.id) {
            showDialogue(guideReturnSeed(hint, `${interaction.label}还没轮到。先按氢、碳、氧的顺序数质子。`));
          }
          return;
        }
        setFieldClueId(interaction.id);
        return;
      }
      if (interaction.kind === "micro-puzzle") {
        if (interaction.locked) {
          showDialogue(guideReturnSeed(questHintFor(payload), "这个机关还在等待能力。先把当前的规律走完。"));
          return;
        }
        if (interaction.solved) {
          pushToast("机关已经校准", {
            detail: "你可以继续寻找还没有亮起的地图机关。"
          });
          return;
        }
        setMicroPuzzleId(interaction.id);
        return;
      }
      if (interaction.kind === "category") {
        const category = payload.region.categories.find(
          (item) => item.id === interaction.id
        );
        if (!category) return;
        if (interaction.locked) {
          showDialogue(
            category.hidden
              ? "404 NOT FOUND——这片区域还没被知识照亮。先把前面的规律变成能力，路口才会展开。"
              : `这处区域还没有向你打开。${category.description} 我会把进入条件留在卷宗里，但具体怎么走由你决定。`
          );
          return;
        }
        const alreadyRead = payload.player.readKnowledgeCardIds.includes(category.knowledgeCardId);
        if (alreadyRead && !interaction.completed) {
          setPuzzleCategoryId(category.id);
          return;
        }
        if (alreadyRead) {
          setActiveCategoryId(category.id);
          return;
        }
        const cluesComplete = SAMPLE_ATOMS.every((sample) =>
          payload.player.inspectedClueIds.includes(sample.id)
        );
        if (category.id === "atomic-forum" && cluesComplete) {
          setActiveCategoryId(category.id);
          return;
        }
        setStoryCategoryId(category.id);
        return;
      }

      if (interaction.kind === "gate") {
        const gate = payload.region.gates.find((item) => item.id === interaction.id);
        if (!gate) return;
        if (interaction.locked) {
          showDialogue(gate.blockedMessage);
          return;
        }
        if (!interaction.opened) {
          if (interaction.id === "gate-atomic-forum") {
            if (heldSample) {
              const socket = IDENTITY_SOCKETS.find((item) => item.answer === heldSample);
              if (socket && !identitySlots[socket.id]) {
                placeIdentityRef.current(socket.id);
              }
              return;
            }
            const hint = questHintFor(payload);
            const collected = SAMPLE_ATOMS.filter((sample) => payload.player.inspectedClueIds.includes(sample.id)).length;
            if (collected >= SAMPLE_ATOMS.length) {
              showDialogue("三个符号都在样本袋里了。点袋子拿起 H、C 或 O，再放进门上的 1、6、8。也可以一键返航，我帮你站到门前。以上。");
              return;
            }
            showDialogue(guideReturnSeed(hint, "身份门还在等质子数。先把氢、碳、氧按顺序数完。"));
            return;
          }
          setGateId(gate.id);
          return;
        }
        showDialogue(gate.clearedMessage);
        return;
      }

      if (interaction.kind === "rift") {
        setRiftOpen(true);
        return;
      }

      if (interaction.kind === "world-hook") {
        const hook = payload.region.worldHooks.find(
          (item) => item.id === interaction.id
        );
        if (!hook) return;
        if (interaction.locked) {
          showDialogue(`${hook.title}还没有回应。${hook.hint}`);
          return;
        }
        if (interaction.discovered) {
          showDialogue(`${hook.title}已经收进异闻录。${hook.description}`);
          return;
        }
        setHookId(hook.id);
        return;
      }

      showDialogue(null);
      try {
        await runProgress({ type: "talk-liu" });
      } catch {
        // The conversation can still continue if the event write fails.
      }
    },
    [activeCategoryId, adminOpen, dialogueOpen, fieldClueId, gateId, heldSample, hookId, identitySlots, microPuzzleId, panelTab, payload, puzzleCategoryId, reward, riftOpen, runProgress, showDialogue, storyCategoryId]
  );

  const storyCategory = useMemo(
    () =>
      payload?.region.categories.find(
        (category) => category.id === storyCategoryId
      ) ?? null,
    [payload, storyCategoryId]
  );
  const activeCategory = useMemo(
    () =>
      payload?.region.categories.find(
        (category) => category.id === activeCategoryId
      ) ?? null,
    [activeCategoryId, payload]
  );
  const puzzleCategory = useMemo(
    () =>
      payload?.region.categories.find(
        (category) => category.id === puzzleCategoryId
      ) ?? null,
    [payload, puzzleCategoryId]
  );

  const activeKnowledgeCard = useMemo(() => {
    if (!activeCategory || !payload) return null;
    return (
      payload.knowledgeCards.find(
        (card) => card.id === activeCategory.knowledgeCardId
      ) ?? null
    );
  }, [activeCategory, payload]);

  const puzzleKnowledgeCard = useMemo(() => {
    if (!puzzleCategory || !payload) return null;
    return (
      payload.knowledgeCards.find(
        (card) => card.id === puzzleCategory.knowledgeCardId
      ) ?? null
    );
  }, [payload, puzzleCategory]);

  const microPuzzle = useMemo(() => {
    if (!microPuzzleId) return null;
    const definitions = {
      "element-symbol-memory": {
        title: "元素符号记忆台",
        kind: "symbol-memory" as const,
        label: "按原子序数点亮元素"
      },
      "periodic-tile-sort": {
        title: "周期坐标拼台",
        kind: "tile-sort" as const,
        label: "排序元素坐标砖"
      },
      "electron-orbit-link": {
        title: "电子轨道连线",
        kind: "orbit-link" as const,
        label: "连接电子层轨道"
      }
    } as const;
    return definitions[microPuzzleId as keyof typeof definitions] ?? null;
  }, [microPuzzleId]);

  const activeFieldClue = useMemo(
    () => payload?.region.fieldClues.find((clue) => clue.id === fieldClueId) ?? null,
    [fieldClueId, payload]
  );
  const activeHook = useMemo(
    () => payload?.region.worldHooks.find((hook) => hook.id === hookId) ?? null,
    [hookId, payload]
  );
  const activeGate = useMemo(
    () => payload?.region.gates.find((gate) => gate.id === gateId) ?? null,
    [gateId, payload]
  );

  const renderKey = useMemo(() => {
    if (!payload) return "loading";
    return `${payload.region.id}|${payload.dailyRift?.id ?? "no-rift"}`;
  }, [payload?.region.id, payload?.dailyRift?.id]);

  const objective = useMemo(() => {
    if (!payload) return { title: "", detail: "", showPips: false };
    const inspected = new Set(payload.player.inspectedClueIds);
    const collected = SAMPLE_ATOMS.filter((sample) => inspected.has(sample.id));
    const missing = SAMPLE_ATOMS.find((sample) => !inspected.has(sample.id));
    const firstGate = payload.region.gates.find((gate) => gate.categoryId === "atomic-forum");
    const gateOpen = Boolean(firstGate && payload.player.openedGateIds.includes(firstGate.id));
    const socketForHeld = IDENTITY_SOCKETS.find((item) => item.answer === heldSample);
    if (collected.length < SAMPLE_ATOMS.length || (firstGate && !gateOpen && !identityComplete(identitySlots))) {
      return {
        title:
          collected.length === 0
            ? "先问是不是：这是氢吗？"
            : heldSample
              ? `把 ${heldSample} 放入 ${socketForHeld?.id ?? "门格"}`
              : identityComplete(identitySlots)
                ? "打开身份门"
                : collected.length < SAMPLE_ATOMS.length
                  ? "先问是不是，再问为什么"
                  : "校准身份门",
        detail:
          collected.length === 0
            ? "跟着地上金色脚印走。金光柱下就是氢原子。走到跟前按住 E，只数 1 枚金色质子。"
            : heldSample
              ? `金光柱指向身份门。点门上的 ${socketForHeld?.id ?? "1 / 6 / 8"}，或按对应数字键放入 ${heldSample}。`
              : collected.length < SAMPLE_ATOMS.length
                ? `已有 ${collected.map((item) => item.symbol).join("、")}。继续走向下一根金光柱，或点样本袋拿起后去门上点 1、6、8。`
                : "把 H、C、O 分别放到门上的 1、6、8。",
        showPips: true
      };
    }
    if (firstGate && !gateOpen) {
      return {
        title: "校准身份门",
        detail: "把 H、C、O 放到门上的 1、6、8",
        showPips: true
      };
    }
    if (payload.player.completedCategoryIds.length >= payload.region.categories.length) {
      return { title: "庭院已归档", detail: "去发现同位素穹室与今日裂隙。", showPips: false };
    }
    const unlocked = new Set(payload.player.unlockedSkillIds);
    const next = payload.region.categories.find(
      (category) =>
        !payload.player.completedCategoryIds.includes(category.id) &&
        category.prerequisiteSkillIds.every((skillId) => unlocked.has(skillId)) &&
        (!payload.region.gates.find((gate) => gate.categoryId === category.id) ||
          payload.player.openedGateIds.includes(
            payload.region.gates.find((gate) => gate.categoryId === category.id)
              ?.id ?? ""
          ))
    );
    if (next) {
      return { title: next.name, detail: "学习知识并解开机关，获得新的地图能力。", showPips: false };
    }
    const readyGate = payload.region.gates.find(
      (gate) =>
        !payload.player.openedGateIds.includes(gate.id) &&
        gate.requiredSkillIds.every((skillId) => unlocked.has(skillId))
    );
    return {
      title: readyGate ? readyGate.label : "继续探索",
      detail: readyGate ? "附近还有一条被能力封住的通路。" : "继续在周期庭院寻找尚未归档的知识区域。",
      showPips: false
    };
  }, [heldSample, identitySlots, payload]);

  useEffect(() => {
    if (!objective.title) return;
    setObjectiveFresh(true);
    const timer = window.setTimeout(() => setObjectiveFresh(false), 2400);
    return () => window.clearTimeout(timer);
  }, [objective.title, objective.detail]);

  const collectedSymbols = useMemo(() => {
    if (!payload) return [] as string[];
    return SAMPLE_ATOMS
      .filter((sample) => payload.player.inspectedClueIds.includes(sample.id))
      .map((sample) => sample.symbol);
  }, [payload]);

  const questHint = useMemo<QuestHint | null>(() => questHintFor(payload), [payload]);


  const questCoach = useMemo(() => {
    if (!payload) return null;
    const inspected = new Set(payload.player.inspectedClueIds);
    const hasH = inspected.has("atom-hydrogen");
    const hasC = inspected.has("atom-carbon");
    const hasO = inspected.has("atom-oxygen");
    const firstGate = payload.region.gates.find((gate) => gate.categoryId === "atomic-forum");
    const gateOpen = Boolean(firstGate && payload.player.openedGateIds.includes(firstGate.id));
    const forumDone = payload.player.completedCategoryIds.includes("atomic-forum");
    if (!hasH) {
      return {
        step: 1,
        total: 4,
        title: "跟着金色脚印去氢原子",
        body: "从脚下金色箭头出发，走到氢原子灯笼跟前。大号 E 出现后再按住，只数 1 枚金色质子。外层蓝点是电子，不要算进去。",
        key: "W A S D",
        keyHint: "跟着脚印走"
      };
    }
    if (!hasC || !hasO) {
      return {
        step: 2,
        total: 4,
        title: !hasC ? "下一根金光是碳" : "最后一颗是氧",
        body: !hasC
          ? "继续跟着金色脚印。碳原子核有 6 枚金色质子，外层蓝点是电子，不要算进去。"
          : "氧原子还亮着金光和书页。按住 E 数清 8 个质子，再拿起符号。",
        key: "E",
        keyHint: "按住扫描"
      };
    }
    if (!gateOpen) {
      const socket = heldSample === "H" ? "1" : heldSample === "C" ? "6" : heldSample === "O" ? "8" : null;
      return {
        step: 3,
        total: 4,
        title: "把 H / C / O 放进身份门",
        body: heldSample && socket
          ? `正在拿着 ${heldSample}。跟着金光走到身份门，点门上的 ${socket}，或按 ${socket}。质子数就是它的名字。`
          : "点样本袋拿起 H、C、O，再放到身份门的 1、6、8 上。质子数就是元素不会弄丢的名字。",
        key: socket ?? "1 2 3",
        keyHint: socket ? `放入 ${heldSample}` : "拿起符号"
      };
    }
    if (!forumDone) {
      return {
        step: 4,
        total: 4,
        title: "进入原子论坛",
        body: "走进无名原子庭，打开读经台，点出这条规律：质子数就是元素的身份。",
        key: "E",
        keyHint: "打开读经台"
      };
    }
    return {
      step: 4,
      total: 4,
      title: "继续用化学走路",
      body: "原子视野已经打开。跟着下一根金光柱，把刚学会的规律用在下一段路上。",
      key: "E",
      keyHint: "继续探索"
    };
  }, [heldSample, payload]);

  function interactionHint(interaction: WorldInteraction) {
    switch (interaction.kind) {
      case "field-clue":
        return interaction.inspected ? "样本已在袋中 · 可再次观察" : "按住 E 扫描质子，数完后按 E 或点符号拿起";
      case "gate":
        return interaction.locked
          ? "条件未满足 · 先完成前置学习"
          : interaction.opened
            ? "通路已开 · 继续向前探索"
            : interaction.id === "gate-atomic-forum"
              ? heldSample
                ? `点门上的 ${heldSample === "H" ? "1" : heldSample === "C" ? "6" : "8"}，放入 ${heldSample}`
                : collectedSymbols.length
                  ? "点样本袋拿起符号，再点门上的 1、6、8。也可继续扫描。"
                  : "门上已有 1、6、8。先按住 E 扫描发光原子，再回来插入。"
              : "验证规律，打开下一段道路";
      case "category":
        return interaction.locked
          ? (interaction.id === "isotope-vault" ? "404 NOT FOUND——这片区域还没被知识照亮。" : "需要前置能力 · 先探索别处")
          : interaction.completed ? "已完成 · 可再次回顾知识" : "先点出现场规律，再亲手操作";
      case "micro-puzzle":
        return interaction.locked ? "需要能力 · 稍后回来" : interaction.solved ? "已破解 · 留下了一份探索记录" : "现场练习 · 亲手解开元素规律";
      case "world-hook":
        return interaction.locked ? "此路口已被折叠。" : interaction.discovered ? "已收录 · 查看异闻录" : "解开机关，验证刚学到的规律";
      case "liu":
        return "可以问路，也可以自己决定下一站";
      case "rift":
        return "今日限定 · 用知识处理一条新异闻";
    }
  }

  function interactionKindLabel(interaction: WorldInteraction) {
    switch (interaction.kind) {
      case "field-clue":
        return "原子样本";
      case "category":
        return "读经台";
      case "gate":
        return interaction.id === "gate-atomic-forum" ? "身份门" : "通路机关";
      case "micro-puzzle":
        return "现场机关";
      case "world-hook":
        return "隐藏结构";
      case "liu":
        return "同行者";
      case "rift":
        return "今日裂隙";
    }
  }

  const recordFieldClue = async (clueId?: string) => {
    const id = clueId ?? activeFieldClue?.id;
    if (!id || !payload) return;
    const clue = payload.region.fieldClues.find((item) => item.id === id);
    if (!clue) return;
    const sample = SAMPLE_ATOMS.find((item) => item.id === id);
    if (payload.player.inspectedClueIds.includes(id)) {
      if (sample && !Object.values(identitySlots).includes(sample.symbol)) {
        setHeldSample(sample.symbol);
      }
      setFieldClueId(null);
      return;
    }
    if (recordingClueRef.current === id) return;
    recordingClueRef.current = id;
    const previousHeld = heldSample;
    if (sample) {
      setHeldSample(sample.symbol);
      setJustCollectedId(sample.id);
    }
    try {
      const instrument = document.querySelector(".field-scan-hud .mini-orrery, .clue-instrument");
      const fromRect = instrument?.getBoundingClientRect();
      const from = fromRect
        ? { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 }
        : null;
      const result = await runProgress({ type: "inspect-clue", clueId: id });
      const clues = payload.region.fieldClues;
      const count = clues.filter((item) => result.player.inspectedClueIds.includes(item.id)).length;
      setFieldClueId(null);
      setFieldScan(null);
      if (sample && from && !prefersReducedMotion()) {
        window.requestAnimationFrame(() => {
          const chip = document.querySelector(`.sample-chip[data-symbol="${sample.symbol}"]`);
          const toRect = chip?.getBoundingClientRect();
          if (!toRect) return;
          setFlyingSample({
            symbol: sample.symbol,
            from,
            to: { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 }
          });
        });
      }
      const socket = IDENTITY_SOCKETS.find((item) => item.answer === sample?.symbol);
      pushToast(count === clues.length ? "样本袋已经装满" : `${sample?.symbol ?? "样本"} 已拿在手上`, {
        detail: count === clues.length
          ? "去身份门，把 H、C、O 点进门上的 1、6、8。"
          : `走到身份门，把 ${sample?.symbol ?? "样本"} 点进 ${socket?.id ?? "对应"} 格。也可以继续扫描。（${count} / ${clues.length}）`,
        tone: "success"
      });
    } catch (error) {
      setHeldSample(previousHeld);
      setJustCollectedId(null);
      pushToast("调查记录失败", {
        detail: error instanceof Error ? error.message : "稍后再试。",
        tone: "error"
      });
    } finally {
      if (recordingClueRef.current === id) recordingClueRef.current = null;
    }
  };

  const discoverHook = async () => {
    if (!activeHook || !payload) return;
    try {
      const result = await runProgress({
        type: "discover-world-hook",
        hookId: activeHook.id
      });
      setHookId(null);
      pushToast("隐藏结构已收录", {
        detail: `${activeHook.title} · ${activeHook.reward.label}`,
        tone: "success"
      });
      for (const achievementId of result.awardedAchievementIds) {
        const achievement = payload.achievements.find((item) => item.id === achievementId);
        if (achievement) {
          pushToast("获得成就", {
            detail: achievement.name,
            tone: "success"
          });
        }
      }
    } catch (error) {
      pushToast("结构没有回应", {
        detail: error instanceof Error ? error.message : "稍后再试。",
        tone: "error"
      });
    }
  };

  function placeIdentity(socketId: string, incoming?: string) {
    if (!payload) return false;
    const result = tryPlaceIdentity(socketId, incoming ?? heldSample, collectedSymbols, identitySlots);
    if (!result.ok) {
      pushToast(result.reason, { tone: result.shake ? "error" : "default" });
      return false;
    }
    setIdentitySlots((current) => ({ ...current, [socketId]: result.socket.answer }));
    setHeldSample(null);
    pushToast(`${result.socket.name} 对上了 ${result.socket.protons}`, {
      detail:
        result.remaining === 0
          ? "三个原子序数都对上了，身份门会打开。"
          : `还可以继续扫描，或放入下一个样本。还差 ${result.remaining} 格。`,
      tone: "success"
    });
    return true;
  }
  placeIdentityRef.current = placeIdentity;

  const openSpecificGate = async (id: string) => {
    if (!payload || openingGateRef.current) return;
    const gate = payload.region.gates.find((item) => item.id === id);
    if (!gate || payload.player.openedGateIds.includes(gate.id)) return;
    openingGateRef.current = true;
    try {
      const result = await runProgress({
        type: "open-gate",
        gateId: gate.id
      });
      setGateId(null);
      setHeldSample(null);
      pushToast("通路已打开", {
        detail: gate.clearedMessage,
        tone: "success"
      });
      for (const achievementId of result.awardedAchievementIds) {
        const achievement = payload.achievements.find((item) => item.id === achievementId);
        if (achievement) {
          pushToast("获得成就", {
            detail: achievement.name,
            tone: "success"
          });
        }
      }
    } catch (error) {
      pushToast("机关没有响应", {
        detail: error instanceof Error ? error.message : "稍后再试。",
        tone: "error"
      });
    } finally {
      openingGateRef.current = false;
    }
  };

  const openGate = async () => {
    const id = activeGate?.id ?? (nearby?.kind === "gate" ? nearby.id : "gate-atomic-forum");
    if (id) await openSpecificGate(id);
  };

  useEffect(() => {
    if (!payload) return;
    if (payload.player.openedGateIds.includes("gate-atomic-forum") && Object.keys(identitySlots).length === 0) {
      setIdentitySlots({ "1": "H", "6": "C", "8": "O" });
    }
  }, [identitySlots, payload]);

  useEffect(() => {
    if (!payload || !identityComplete(identitySlots)) return;
    const firstGate = payload.region.gates.find((gate) => gate.categoryId === "atomic-forum");
    if (!firstGate || payload.player.openedGateIds.includes(firstGate.id)) return;
    void openSpecificGate(firstGate.id);
  }, [identitySlots, payload]);

  const activeRift = payload?.dailyRift ?? null;
  const activeRiftCompleted = Boolean(
    activeRift && payload?.player.dailyRiftCompletedIds.includes(activeRift.id)
  );

  const enterPuzzle = async () => {
    if (!activeCategory || !activeKnowledgeCard) return;
    if (!payload?.player.readKnowledgeCardIds.includes(activeKnowledgeCard.id)) {
      try {
        await runProgress({
          type: "read-knowledge",
          cardId: activeKnowledgeCard.id
        });
      } catch (error) {
        pushToast("卷宗没有写入", {
          detail: error instanceof Error ? error.message : "稍后再试。",
          tone: "error"
        });
        return;
      }
    }
    setActiveCategoryId(null);
    setPuzzleCategoryId(activeCategory.id);
  };

  const solveCategory = async () => {
    if (!puzzleCategory || !payload) return;
    try {
      const result = await runProgress({
        type: "complete-category",
        categoryId: puzzleCategory.id
      });
      const skill = payload.skills.find(
        (item) => item.id === puzzleCategory.grantsSkillId
      );
      const achievementItems = result.awardedAchievementIds.flatMap((id) => {
        const achievement = payload.achievements.find((item) => item.id === id);
        return achievement ? [achievement.name] : [];
      });
      const materialReward = `${puzzleCategory.reward.label} × ${puzzleCategory.reward.amount}`;
      setPuzzleCategoryId(null);
      setReward({
        eyebrow: `${puzzleCategory.name} · 已完成`,
        title: skill?.name ?? "新的能力已经写入同行记录",
        description: skill?.description ?? "你让一段城市机制重新开始运作。",
        skill,
        items: [materialReward, ...achievementItems]
      });
    } catch (error) {
      pushToast("机关拒绝了这次操作", {
        detail: error instanceof Error ? error.message : "检查前置条件后再试。",
        tone: "error"
      });
    }
  };

  const solveMicroPuzzle = async () => {
    if (!microPuzzleId || !payload) return;
    try {
      await runProgress({
        type: "complete-micro-puzzle",
        microPuzzleId
      });
      setMicroPuzzleId(null);
      pushToast("现场机关已破解", {
        detail: "获得机关零件 × 1。它是探索奖励，不会取代主线知识能力。",
        tone: "success"
      });
    } catch (error) {
      pushToast("机关记录失败", {
        detail: error instanceof Error ? error.message : "稍后再试。",
        tone: "error"
      });
    }
  };

  const solveRift = async () => {
    if (!activeRift) return;
    try {
      const result = await runProgress({
        type: "complete-daily-rift",
        riftId: activeRift.id
      });
      const achievementItems = result.awardedAchievementIds.flatMap((id) => {
        const achievement = payload?.achievements.find((item) => item.id === id);
        return achievement ? [achievement.name] : [];
      });
      const riftSkill = activeRift.reward.skillId
        ? payload?.skills.find((skill) => skill.id === activeRift.reward.skillId)
        : null;
      setRiftOpen(false);
      setReward({
        eyebrow: "每日临时地图 · 回声稳定",
        title: activeRift.title,
        description: "今天的线索已经被编入你的异闻录，裂隙没有修改主线进度。",
        items: [
          activeRift.reward.skinId
            ? `外观：${activeRift.reward.skinId}`
            : "限定收藏",
          riftSkill ? `技能残页：${riftSkill.name}` : "逐日纪念材料",
          ...achievementItems
        ]
      });
    } catch (error) {
      pushToast("裂隙没有关闭", {
        detail: error instanceof Error ? error.message : "稍后再试。",
        tone: "error"
      });
    }
  };

  if (!session) {
    return <LoadingScreen label="正在确认你的同行身份" />;
  }

  if (!session.authenticated) {
    return (
      <>
        <LoginScreen
          allowDevAuth={session.allowDevAuth}
          zhihuOAuthConfigured={session.integrations.zhihuOAuthConfigured}
          busy={loginBusy}
          error={bootError ?? getAuthErrorMessage()}
          onDevLogin={() => void handleDevLogin()}
        />
        <div className="mobile-gate">
          <FlaskConical size={34} />
          <h1>请在桌面端进入周期庭院</h1>
          <p>当前 2.5D 地图与解谜交互优先适配桌面浏览器。</p>
        </div>
      </>
    );
  }

  const showQuestHud = Boolean(
    payload &&
      !playbookOpen &&
      !voteOpen &&
      !storyCategoryId &&
      !activeCategoryId &&
      !puzzleCategoryId &&
      !microPuzzleId &&
      !fieldClueId &&
      !hookId &&
      !gateId &&
      !dialogueOpen &&
      !panelTab &&
      !riftOpen &&
      !adminOpen &&
      !profileOpen &&
      !reward
  );
  const isExactQuestNearby = Boolean(
    nearby &&
      questHint &&
      nearby.kind === questHint.kind &&
      (!questHint.id || ("id" in nearby && nearby.id === questHint.id))
  );
  const isQuestNearby = Boolean(
    isExactQuestNearby ||
      (nearby?.kind === "field-clue" && !nearby.inspected) ||
      nearby?.kind === "gate"
  );
  const scanningAtom = Boolean(nearby?.kind === "field-clue" && !nearby.inspected);

  const identityGateNearby =
    nearby?.kind === "gate" &&
    nearby.id === "gate-atomic-forum" &&
    !nearby.opened &&
    !nearby.locked;
  const showWorldInsert = Boolean(
    identityGateNearby &&
      !gateId &&
      !fieldClueId &&
      !playbookOpen &&
      !dialogueOpen &&
      !reward &&
      !storyCategoryId &&
      !activeCategoryId &&
      !puzzleCategoryId &&
      !microPuzzleId &&
      !hookId &&
      !panelTab
  );
  const showQuestNow = Boolean(showQuestHud && questCoach && !showWorldInsert);
  const showSkillDock = Boolean(payload && payload.player.unlockedSkillIds.length > 0);
  const starterGuide = Boolean(questCoach && questCoach.step === 1);
  const tuckSatchel = Boolean(starterGuide && collectedSymbols.length === 0 && !heldSample);

  if (!payload) {
    return bootError ? (
      <main className="error-screen">
        <h1>周期庭院暂时没有回应</h1>
        <p>{bootError}</p>
        <button className="primary-button" onClick={() => window.location.reload()}>
          重新连接
        </button>
      </main>
    ) : (
      <LoadingScreen label="正在为你生成周期庭院" />
    );
  }

  return (
    <>
      <main className={`game-shell ${showWorldInsert ? "has-world-insert" : ""} ${showQuestHud ? "has-quest-hud" : ""} ${scanningAtom ? "has-scan-hud" : ""} ${showQuestNow ? "has-quest-now" : ""} ${questCoach && questCoach.step <= 2 ? "is-guided" : ""} ${starterGuide ? "is-starter" : ""} ${showSkillDock ? "has-skills" : "no-skills"}`}>
          <svg width="0" height="0" className="glass-filter" aria-hidden="true" focusable="false">
            <filter id="hud-liquid-glass" x="-12%" y="-12%" width="124%" height="124%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="3" result="n">
                <animate attributeName="baseFrequency" dur="18s" values="0.012 0.018;0.018 0.012;0.012 0.018" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
            </filter>
          </svg>
          <GameCanvas
            region={payload.region}
            player={payload.player}
            completedMicroPuzzleIds={payload.player.solvedMicroPuzzleIds}
            dailyRift={activeRift}
          renderKey={renderKey}
          inputBlocked={Boolean(storyCategoryId || activeCategoryId || puzzleCategoryId || microPuzzleId || fieldClueId || hookId || gateId || dialogueOpen || panelTab || riftOpen || adminOpen || profileOpen || playbookOpen || reward || voteOpen)}
          questHint={questHint}
          guideToken={guideToken}
          heldSymbol={heldSample}
          placedSymbols={identitySlots}
          hudScanHold={hudScanHold}
          onInteract={(interaction) => void handleInteraction(interaction)}
          onPlaceIdentity={(socketId) => placeIdentity(socketId)}
          onPickupClue={(id) => void recordFieldClue(id)}
          onFieldScan={setFieldScan}
          onSeekUpdate={setSeekGuide}
          onSavePosition={handleSavePosition}
          onNearbyChange={setNearby}
        />

        <div className="atmosphere-vignette" aria-hidden="true" />

        <header className="game-topbar">
          <div className="game-brand glass-panel">
            <span className="brand-mark small">
              <svg className="brand-orbit" viewBox="0 0 40 40" aria-hidden="true">
                <ellipse pathLength="1" cx="20" cy="20" rx="17" ry="10.5" fill="none" stroke="rgba(90,168,160,0.88)" strokeWidth="1.15" />
                <ellipse pathLength="1" cx="20" cy="20" rx="10.5" ry="17" fill="none" stroke="rgba(226,177,74,0.72)" strokeWidth="1" transform="rotate(52 20 20)" />
                <circle className="brand-electron" cx="20" cy="9.5" r="2.05" fill="#5aa8a0" />
              </svg>
              <FlaskConical size={17} />
            </span>
            <div>
              <strong>看山异闻录</strong>
              <span>周期庭院</span>
            </div>
          </div>

          {showQuestNow ? null : (
            <div className={`objective-ribbon glass-panel ${objectiveFresh ? "is-fresh" : ""} ${questCoach && questCoach.step <= 2 ? "is-lead" : ""}`}>
              <span className="objective-pulse" />
              <div className="objective-copy">
                <small>{questCoach ? `当前任务 · 步骤 ${questCoach.step} / ${questCoach.total}` : "当前任务"}</small>
                <strong>{questCoach?.title ?? objective.title}</strong>
                <p>{questCoach?.body ?? objective.detail}</p>
              </div>
              {objective.showPips ? (
                <div className="quest-pips" aria-label="氢碳氧样本进度">
                  {SAMPLE_ATOMS.map((sample) => {
                    const filled = payload.player.inspectedClueIds.includes(sample.id);
                    const placed = Object.values(identitySlots).includes(sample.symbol);
                    return (
                      <span
                        key={sample.id}
                        className={`quest-pip ${filled ? "is-filled" : ""} ${placed ? "is-placed" : ""}`}
                      >
                        {sample.symbol}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}

          <nav className="top-actions glass-panel" aria-label="游戏功能">
            <button
              className="top-action"
              onClick={() => setVoteOpen(true)}
              aria-label="下次一定"
              title="下次一定"
            >
              <Heart size={18} />
            </button>
            <button
              className="top-action"
              onClick={() => setPlaybookOpen(true)}
              aria-label="玩法说明"
              title="玩法说明"
            >
              <Puzzle size={18} />
            </button>
            <button
              className="top-action"
              onClick={() => setRiftOpen(true)}
              aria-label="今日裂隙"
              title="今日裂隙"
            >
              <CalendarDays size={18} />
              {!activeRiftCompleted ? <span className="notification-dot" /> : null}
            </button>
            <button
              className="top-action"
              onClick={() => setPanelTab("journal")}
              aria-label="知识卷宗"
              title="知识卷宗"
            >
              <BookOpen size={18} />
            </button>
            <button
              className="top-action"
              onClick={() => setPanelTab("achievements")}
              aria-label="成就"
              title="成就"
            >
              <Trophy size={18} />
              <span className="action-count">
                {payload.player.achievementIds.length}
              </span>
            </button>
            <button
              className="top-action"
              onClick={() => setProfileOpen((current) => !current)}
              aria-label="探索者资料"
              title="探索者资料"
            >
              {payload.user.avatarUrl ? (
                <img src={payload.user.avatarUrl} alt="" />
              ) : (
                <UserRound size={18} />
              )}
            </button>
            <button
              className="top-action"
              onClick={() => setAdminOpen(true)}
              aria-label="本地管理台"
              title="本地管理台"
            >
              <Settings2 size={18} />
            </button>
          </nav>
        </header>

        {showSkillDock ? (
        <aside className="skill-dock glass-panel is-live">
          <div className="dock-label">
            <Sparkles size={14} />
            能力
          </div>
          <div className="skill-list">
            {payload.skills.map((skill) => {
              const unlocked = payload.player.unlockedSkillIds.includes(skill.id);
              return (
                <div
                  className={`skill-chip ${unlocked ? "unlocked" : ""}`}
                  key={skill.id}
                  style={{ "--skill-color": skill.color } as React.CSSProperties}
                  title={unlocked ? skill.traversalHint : "尚未习得"}
                >
                  <span />
                  <div>
                    <strong>{unlocked ? skill.name : "未知能力"}</strong>
                    <small>{unlocked ? skill.shortName : "等待知识归档"}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
        ) : null}


        {showWorldInsert ? (
          <div className="world-insert-dock glass-panel">
            <div className="world-insert-head">
              <span className="prompt-key">168</span>
              <div>
                <small>身份门 · 按质子数放入</small>
                <strong>
                  {heldSample
                    ? `把 ${heldSample} 放进 ${heldSample === "H" ? "1" : heldSample === "C" ? "6" : "8"}`
                    : "点样本袋拿起符号，再点门上的 1、6、8"}
                </strong>
              </div>
              <button type="button" className="text-button" onClick={() => setGateId("gate-atomic-forum")}>
                预览
              </button>
            </div>
            <IdentitySocketRow
              compact
              collectedSymbols={collectedSymbols}
              heldSymbol={heldSample}
              placed={identitySlots}
              onHold={setHeldSample}
              onPlace={(socketId, symbol) => placeIdentity(socketId, symbol)}
            />
          </div>
        ) : nearby?.kind === "field-clue" && !nearby.inspected ? (
          <FieldScanHud
            clueId={nearby.id}
            marked={fieldScan?.id === nearby.id ? fieldScan.marked : 0}
            total={fieldScan?.id === nearby.id ? fieldScan.total : SAMPLE_ATOMS.find((item) => item.id === nearby.id)?.protons ?? 1}
            complete={fieldScan?.id === nearby.id ? fieldScan.complete : false}
            holding={Boolean(hudScanHold || (fieldScan?.id === nearby.id && fieldScan.holding))}
            onHoldChange={setHudScanHold}
            onPickup={() => void recordFieldClue(nearby.id)}
          />
        ) : nearby ? (
          <button
            type="button"
            className={`interaction-prompt glass-panel ${isQuestNearby ? "is-quest" : ""}`}
            onClick={() => void handleInteraction(nearby)}
          >
            <span className="quest-glow" aria-hidden="true" />
            <span className="prompt-key">E</span>
            <span>
              <small>{isExactQuestNearby ? "就是这里" : "可互动"}</small>
              <strong>
                {nearby.kind === "gate" && heldSample
                  ? `把 ${heldSample} 放入门格`
                  : nearby.kind === "category"
                    ? "按 E 打开读经台，点出质子规律"
                    : nearby.kind === "field-clue"
                      ? "按住 E 数金色质子"
                      : nearby.kind === "liu"
                        ? "按 E 问路"
                        : "按 E 互动"}
              </strong>
              <em>{nearby.label} · {interactionHint(nearby)}</em>
            </span>
            <Crosshair size={18} />
            <span className="prompt-hint">点击或按 E</span>
          </button>
        ) : null}

        {showQuestNow && questCoach ? (
          <div className={`quest-now glass-panel ${questCoach.step <= 2 ? "is-lead" : ""} ${questCoach.step === 1 ? "is-starter" : ""}`} aria-live="polite">
            <span className="quest-glow" aria-hidden="true" />
            {seekGuide && !seekGuide.nearby ? (
              <span className="seek-compass" aria-hidden="true">
                <span className="seek-compass-needle" style={{ transform: `rotate(${seekGuide.angle}deg)` }}>
                  <span className="seek-chevron" />
                </span>
              </span>
            ) : (
              <span className="seek-compass is-static" aria-hidden="true">
                <FlaskConical size={26} />
              </span>
            )}
            <div className="quest-now-copy">
              <small>现在 · 步骤 {questCoach.step} / {questCoach.total}</small>
              <strong>
                {seekGuide && !seekGuide.nearby
                  ? `跟着金色箭头走到${seekGuide.label}`
                  : seekGuide?.nearby
                    ? nearby?.kind === "gate"
                      ? "就是这里，把符号放入门格"
                      : nearby?.kind === "category"
                        ? "就是这里，按 E 打开读经台"
                        : "就是这里，按住 E 扫描"
                    : questCoach.title}
              </strong>
              <p>
                {seekGuide && !seekGuide.nearby
                  ? `${seekGuide.action} · 还有 ${seekGuide.distance} 格`
                  : questCoach.body}
              </p>
            </div>
            <div className="quest-now-keys">
              {(seekGuide?.nearby ? "E" : questCoach.key).split(" ").map((item) => (
                <kbd key={item}>{item}</kbd>
              ))}
              <span>{seekGuide?.nearby ? (nearby?.kind === "field-clue" ? "按住扫描" : "按 E 互动") : questCoach.keyHint}</span>
            </div>
            {objective.showPips ? (
              <div className="quest-pips is-coach" aria-label="氢碳氧样本进度">
                {SAMPLE_ATOMS.map((sample) => {
                  const filled = payload.player.inspectedClueIds.includes(sample.id);
                  const placed = Object.values(identitySlots).includes(sample.symbol);
                  const current = questHint?.kind === "field-clue" && questHint.id === sample.id;
                  return (
                    <span
                      key={sample.id}
                      className={`quest-pip ${filled ? "is-filled" : ""} ${placed ? "is-placed" : ""} ${current ? "is-now" : ""}`}
                    >
                      {sample.symbol}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={`control-strip glass-panel ${questCoach?.step === 1 ? "is-coaching" : ""}`} aria-label="操作提示">
          <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 镜头八向移动</span>
          <span><kbd>E</kbd> {nearby?.kind === "field-clue" && !nearby.inspected ? "按住扫描" : "互动"}</span>
          {heldSample ? (
            <span><kbd>1</kbd><kbd>6</kbd><kbd>8</kbd> 放入门格</span>
          ) : (
            <span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> 拿起 H C O</span>
          )}
          <span><kbd>Esc</kbd> 放下 / 退出</span>
        </div>

        {profileOpen ? (
          <section className="profile-card">
            <button
              className="icon-button"
              onClick={() => setProfileOpen(false)}
              aria-label="关闭资料"
            >
              <X size={16} />
            </button>
            <div className="profile-heading">
              {payload.user.avatarUrl ? (
                <img src={payload.user.avatarUrl} alt="" />
              ) : (
                <span>
                  <UserRound size={22} />
                </span>
              )}
              <div>
                <strong>{payload.user.nickname}</strong>
                <small>
                  {payload.user.isDevelopment ? "本机演示身份" : "知乎探索者"}
                </small>
              </div>
            </div>
            <p>
              {payload.user.headline ??
                "周期庭院会依据你的知乎兴趣信号，为每日裂隙增加更贴近你的线索。"}
            </p>
            <div className="profile-tags">
              {payload.personalization.interests.slice(0, 5).map((interest) => (
                <span key={interest}>{interest}</span>
              ))}
              {!payload.personalization.interests.length ? (
                <span>个性化信号待同步</span>
              ) : null}
            </div>
            <button
              className="text-button"
              onClick={async () => {
                await api.logout();
                window.location.reload();
              }}
            >
              退出当前身份
            </button>
          </section>
        ) : null}

        <div className="toast-stack" aria-live="polite">
          {toasts.map((toast) => (
            <div className={`toast ${toast.tone}`} key={toast.id}>
              <span className="toast-dot" />
              <div>
                <strong>{toast.title}</strong>
                {toast.detail ? <p>{toast.detail}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </main>

      <aside className={`satchel-dock glass-panel ${tuckSatchel ? "is-tucked" : ""} ${gateId || showWorldInsert ? "is-raised" : ""} ${heldSample ? "is-holding" : ""}`}>
        <div className="dock-label">
          <FlaskConical size={14} />
          样本袋
        </div>
        <div className="sample-row">
          {SAMPLE_ATOMS.map((sample, index) => (
            <SampleChip
              key={sample.id}
              symbol={sample.symbol}
              name={sample.name}
              filled={payload.player.inspectedClueIds.includes(sample.id)}
              selected={heldSample === sample.symbol}
              justFilled={justCollectedId === sample.id}
              used={Object.values(identitySlots).includes(sample.symbol)}
              hotkey={String(index + 1)}
              onPick={(symbol) => setHeldSample((current) => current === symbol ? null : symbol)}
            />
          ))}
        </div>
        <p className="satchel-hint">
          {heldSample
            ? `正在拿着 ${heldSample} · 点门上的 1、6、8`
            : collectedSymbols.length === SAMPLE_ATOMS.length
              ? "把 H、C、O 点到身份门的 1、6、8 上"
              : collectedSymbols.length
                ? `已采集 ${collectedSymbols.join("、")} · 可继续扫描，或先去插入`
                : "按住 E 扫描发光原子，符号会掉进这里"}
        </p>
      </aside>

      {heldSample && !flyingSample && !fieldClueId && !playbookOpen ? (
        <HeldCursor symbol={heldSample} />
      ) : null}
      {flyingSample ? (
        <FlyingSample
          symbol={flyingSample.symbol}
          from={flyingSample.from}
          to={flyingSample.to}
          onDone={() => setFlyingSample(null)}
        />
      ) : null}

      {activeCategory && activeKnowledgeCard ? (
        <KnowledgeModal
          category={activeCategory}
          card={activeKnowledgeCard}
          alreadyRead={payload.player.readKnowledgeCardIds.includes(
            activeKnowledgeCard.id
          )}
          onClose={() => setActiveCategoryId(null)}
          onEnterPuzzle={() => void enterPuzzle()}
        />
      ) : null}

      {storyCategory ? (
        <StoryEpisode
          category={storyCategory}
          player={payload.player}
          onClose={() => setStoryCategoryId(null)}
          onStudy={() => {
            setStoryCategoryId(null);
            setActiveCategoryId(storyCategory.id);
          }}
        />
      ) : null}

      {activeFieldClue ? (
        <FieldClueOverlay
          key={activeFieldClue.id}
          clue={activeFieldClue}
          inspectedCount={payload.player.inspectedClueIds.length}
          totalCount={payload.region.fieldClues.length}
          alreadyInspected={payload.player.inspectedClueIds.includes(activeFieldClue.id)}
          onClose={() => setFieldClueId(null)}
          onRecord={() => void recordFieldClue()}
        />
      ) : null}

      {activeHook ? (
        <HookOverlay
          hook={activeHook}
          onClose={() => setHookId(null)}
          onSolved={() => void discoverHook()}
        />
      ) : null}

      {activeGate ? (
        <GateOverlay
          gate={activeGate}
          collectedSymbols={collectedSymbols}
          heldSymbol={heldSample}
          placedSymbols={identitySlots}
          onHold={setHeldSample}
          onPlace={(socketId, symbol) => placeIdentity(socketId, symbol)}
          onClose={() => setGateId(null)}
          onOpened={() => void openGate()}
        />
      ) : null}

      {puzzleCategory && puzzleKnowledgeCard ? (
        <PuzzleModal
          category={puzzleCategory}
          card={puzzleKnowledgeCard}
          onClose={() => setPuzzleCategoryId(null)}
          onSolved={() => void solveCategory()}
        />
      ) : null}

      {microPuzzle ? (
        <PuzzleModal
          mode="micro"
          microPuzzleKind={microPuzzle.kind}
          microTitle={microPuzzle.title}
          category={payload.region.categories[0]!}
          card={payload.knowledgeCards[0]!}
          onClose={() => setMicroPuzzleId(null)}
          onSolved={solveMicroPuzzle}
        />
      ) : null}

      {dialogueOpen ? (
        <LiuDialogue
          key={dialogueKey}
          player={payload.player}
          seed={dialogueSeed}
          guideLabel={questGuideLabel(questHint)}
          onGuide={startQuestGuide}
          onClose={() => setDialogueOpen(false)}
        />
      ) : null}

      {panelTab ? (
        <SidePanel
          tab={panelTab}
          payload={payload}
          onChangeTab={setPanelTab}
          onClose={() => setPanelTab(null)}
          onPlayerChange={(player) => setPayload((current) => current ? { ...current, player } : current)}
          onNoteAdded={(note) => setPayload((current) => current ? { ...current, notes: [note, ...current.notes] } : current)}
          onDiscoveryNamed={(hookId, name, discovererName) =>
            setPayload((current) => current ? {
              ...current,
              discoveries: current.discoveries.map((item) => item.hookId === hookId ? { ...item, name, discovererName, namedAt: new Date().toISOString() } : item)
            } : current)
          }
        />
      ) : null}

      {riftOpen && activeRift ? (
        <DailyRiftModal
          rift={activeRift}
          completed={activeRiftCompleted}
          onClose={() => setRiftOpen(false)}
          onSolved={() => void solveRift()}
        />
      ) : null}

      {adminOpen ? (
        <AdminModal
          onClose={() => setAdminOpen(false)}
          onRiftUpdated={(rift) =>
            setPayload((current) =>
              current ? { ...current, dailyRift: rift } : current
            )
          }
        />
      ) : null}

      {reward ? (
        <RewardModal reward={reward} onClose={() => setReward(null)} />
      ) : null}

      {voteOpen ? (
        <div className="vote-layer" role="presentation" onMouseDown={() => setVoteOpen(false)}>
          <section className="vote-panel glass-panel" role="dialog" aria-modal="true" aria-labelledby="vote-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">知游江湖</span>
            <h2 id="vote-title">下次一定</h2>
            <p>这局先玩到这里也可以。收藏比赞多，投一票我们下次一定把同位素穹室点亮。</p>
            <div className="vote-actions">
              <button
                className="primary-button"
                onClick={() => {
                  setVoteOpen(false);
                  pushToast("收藏比赞多", { detail: "票已记下。以上。", tone: "success" });
                }}
              >
                下次一定（投票）
              </button>
              <button className="text-button" onClick={() => setVoteOpen(false)}>我再玩会儿</button>
            </div>
          </section>
        </div>
      ) : null}

      {playbookOpen ? (
        <PlaybookOverlay
          onClose={() => {
            window.localStorage.setItem("kanshan-playbook-seen", "1");
            setPlaybookOpen(false);
          }}
        />
      ) : null}

      <div className="mobile-gate">
        <FlaskConical size={34} />
        <h1>请在桌面端进入周期庭院</h1>
        <p>当前 2.5D 地图与解谜交互优先适配桌面浏览器。</p>
      </div>
    </>
  );
}
