import type {
  AccessGateDefinition,
  AchievementDefinition,
  CategoryDefinition,
  FieldClueDefinition,
  KnowledgeCard,
  PersonalizationSnapshot,
  PlayerState,
  RegionDefinition,
  SkillDefinition,
  TechniqueDefinition
} from "./types.js";

export const skills: SkillDefinition[] = [
  {
    id: "atomic-sight", name: "原子视野", shortName: "核视",
    description: "看见物质隐藏的质子数，并由此确认元素身份。",
    traversalHint: "能读懂无名元素碑，也能唤醒标有原子序数的旧机关。", color: "#f0c65a"
  },
  {
    id: "periodic-step", name: "周期步", shortName: "周期",
    description: "沿周期与族的规律，在相似元素之间建立移动路径。",
    traversalHint: "能让同族石柱排成阶梯，通往庭院的高层。", color: "#58b9a8"
  },
  {
    id: "valence-link", name: "价电子牵引", shortName: "价引",
    description: "观察最外层电子，并移动一枚电子来改变机关状态。",
    traversalHint: "能接通电子轨道、旋转悬空平台，也能触发成键装置。", color: "#63a8d8"
  },
  {
    id: "family-resonance", name: "族性共鸣", shortName: "族鸣",
    description: "辨认同族元素共享的价电子特征，让一整组设施共同响应。",
    traversalHint: "能同时唤醒同族元素柱，打开温室与隐蔽支路。", color: "#df7f63"
  },
  {
    id: "bond-weave", name: "化学键编织", shortName: "键织",
    description: "根据元素趋向得失或共享电子的方式，编织稳定连接。",
    traversalHint: "能在互补元素之间架起键桥，并修复断裂的分子结构。", color: "#d77ca7"
  },
  {
    id: "isotope-echo", name: "同位回声", shortName: "同位",
    description: "辨认质子数相同但中子数不同的原子留下的细微回声。",
    traversalHint: "隐藏能力，可让同一元素的不同同位素短暂互换位置。", color: "#9a8fda"
  }
];

export const techniques: TechniqueDefinition[] = [
  {
    id: "coordinate-scan", name: "坐标扫描式", components: ["原子视野", "周期步"],
    description: "先确认原子序数，再沿周期表坐标推断陌生元素的邻居。",
    useHint: "能显出无名元素碑周围本应存在的道路。", color: "#62bba0"
  },
  {
    id: "valence-compass", name: "价层罗盘式", components: ["周期步", "价电子牵引"],
    description: "用所在族的位置预测价电子数量，再以电子轨迹校验。",
    useHint: "靠近元素机关时，会提示最可能的成键方向。", color: "#69aeda"
  },
  {
    id: "stable-bridge", name: "稳定键桥式", components: ["族性共鸣", "化学键编织"],
    description: "先判断元素家族，再选择转移或共享电子来构成稳定连接。",
    useHint: "能在隐藏区域维持更长时间的键桥。", color: "#d77ca7"
  }
];

const pendingZhihuSource = {
  provider: "zhihu" as const,
  title: "待接入知乎开放平台后填充对应回答",
  url: null,
  authorName: null,
  authorUrl: null,
  status: "pending" as const
};

export const knowledgeCards: KnowledgeCard[] = [
  {
    id: "kc-atomic-number", categoryId: "atomic-forum", title: "质子数是元素不会弄丢的名字",
    question: "一颗原子究竟凭什么被称为氢、碳或氧？",
    summary: "原子核中的质子数称为原子序数，它决定元素身份。中子数改变会形成同位素，电子数改变会形成离子，但只要质子数不变，元素种类就不变。",
    keyPoints: ["氢有 1 个质子，碳有 6 个质子，氧有 8 个质子。", "中性原子的电子数等于质子数。", "辨认元素时应先看质子数，而不是质量数或外观。"],
    source: pendingZhihuSource
  },
  {
    id: "kc-periodic-coordinates", categoryId: "periodic-gallery", title: "周期表是一张元素行为地图",
    question: "为什么元素在周期表上的位置能够预测性质？",
    summary: "周期表按原子序数递增排列。横行是周期，通常对应电子层数；纵列是族，主族元素在同族中往往具有相同的价电子数，因此表现出相似的化学性质。",
    keyPoints: ["钠位于第 3 周期第 1 族，最外层有 1 个电子。", "氯位于第 3 周期第 17 族，最外层有 7 个电子。", "同周期元素从左到右原子序数依次增加。"],
    source: pendingZhihuSource
  },
  {
    id: "kc-electron-shells", categoryId: "electron-observatory", title: "最外层电子决定许多化学选择",
    question: "电子排布怎样影响元素的反应倾向？",
    summary: "电子分层占据原子核外空间。对常见主族元素，最外层电子也叫价电子，它们最直接参与化学反应。原子常通过得失或共享电子，形成更稳定的外层结构。",
    keyPoints: ["钠的常见电子层排布可写作 2-8-1。", "氯的常见电子层排布可写作 2-8-7。", "内层电子通常不直接参与简单成键。"],
    source: pendingZhihuSource
  },
  {
    id: "kc-element-families", categoryId: "family-greenhouse", title: "同族元素像性格相近的远亲",
    question: "碱金属、卤素和稀有气体分别有什么共同特征？",
    summary: "同族主族元素有相似的价电子结构。第 1 族碱金属容易失去 1 个电子，第 17 族卤素容易得到 1 个电子，第 18 族稀有气体的最外层通常已经稳定，因此较少参与反应。",
    keyPoints: ["锂、钠、钾属于第 1 族，反应性总体随族向下增强。", "氟、氯、溴属于第 17 族，都是典型非金属。", "氦、氖、氩属于第 18 族，常温下化学性质较稳定。"],
    source: pendingZhihuSource
  },
  {
    id: "kc-chemical-bonds", categoryId: "bond-workshop", title: "化学键把原子关系变成物质",
    question: "原子为什么会转移或共享电子？",
    summary: "原子通过电子转移形成带相反电荷的离子，并以静电作用形成离子键；也可以共享电子对形成共价键。选择哪种方式与参与元素的价电子结构和电负性差异有关。",
    keyPoints: ["钠倾向失去 1 个电子，氯倾向得到 1 个电子，可形成 NaCl。", "两个氢原子可以共享一对电子形成 H2。", "模型中的八电子规则很有用，但存在例外，不能机械套用。"],
    source: pendingZhihuSource
  },
  {
    id: "kc-isotopes", categoryId: "isotope-vault", title: "同一种元素也可以有不同重量",
    question: "质子数相同的原子，为什么质量数可能不同？",
    summary: "同位素具有相同质子数和不同中子数，因此元素身份相同而质量数不同。例如碳-12 与碳-14 都有 6 个质子，但分别有 6 与 8 个中子。",
    keyPoints: ["质量数等于质子数与中子数之和。", "同位素的化学性质通常相近，但核稳定性可能不同。", "碳-14 可用于测定一定范围内含碳样品的年代。"],
    source: pendingZhihuSource
  }
];

export const categories: CategoryDefinition[] = [
  {
    id: "atomic-forum", name: "无名原子庭", subtitle: "元素身份与原子序数",
    description: "三颗原子失去了元素符号。读出它们的质子数，为庭院找回名字。",
    position: { x: 8, y: 30, z: 0 }, prerequisiteSkillIds: [], puzzleKind: "atomic-identity",
    grantsSkillId: "atomic-sight", knowledgeCardId: "kc-atomic-number", color: "#e6bd55", hidden: false,
    reward: { materialId: "identity-shard", label: "元素名牌", amount: 3 }
  },
  {
    id: "periodic-gallery", name: "周期坐标廊", subtitle: "周期、族与元素位置",
    description: "散落的元素方砖正在寻找自己的行与列。这里通向左侧的家族温室。",
    position: { x: 20, y: 22, z: 0 }, prerequisiteSkillIds: ["atomic-sight"], puzzleKind: "periodic-placement",
    grantsSkillId: "periodic-step", knowledgeCardId: "kc-periodic-coordinates", color: "#55b4a3", hidden: false,
    reward: { materialId: "coordinate-tile", label: "周期坐标片", amount: 2 }
  },
  {
    id: "electron-observatory", name: "电子云台", subtitle: "电子层与价电子",
    description: "高台上的电子轨道仍在旋转。正确排布电子，就能让悬空阶梯重新对齐。",
    position: { x: 27, y: 18, z: 0 }, prerequisiteSkillIds: ["atomic-sight"], puzzleKind: "electron-shells",
    grantsSkillId: "valence-link", knowledgeCardId: "kc-electron-shells", color: "#61a9d5", hidden: false,
    reward: { materialId: "electron-bead", label: "价电子珠", amount: 2 }
  },
  {
    id: "family-greenhouse", name: "元素家族温室", subtitle: "元素族与共同性质",
    description: "三座温室混进了错误的访客。按元素家族重新分组，温室会长出新的路。",
    position: { x: 34, y: 17, z: 0 }, prerequisiteSkillIds: ["periodic-step"], puzzleKind: "family-sort",
    grantsSkillId: "family-resonance", knowledgeCardId: "kc-element-families", color: "#dc8063", hidden: false,
    reward: { materialId: "family-seed", label: "族性种子", amount: 3 }
  },
  {
    id: "bond-workshop", name: "成键工坊", subtitle: "电子转移与共享",
    description: "断桥不是由木石搭成，而要在合适的原子之间建立稳定连接。",
    position: { x: 38, y: 11, z: 1 }, prerequisiteSkillIds: ["valence-link"], puzzleKind: "bond-builder",
    grantsSkillId: "bond-weave", knowledgeCardId: "kc-chemical-bonds", color: "#cf78a0", hidden: false,
    reward: { materialId: "bond-thread", label: "共价丝", amount: 2 }
  },
  {
    id: "isotope-vault", name: "同位素穹室", subtitle: "同位素与质量数",
    description: "周期庭院最高处有一间没有写在地图上的穹室，里面回响着两种重量的碳。",
    position: { x: 41, y: 4, z: 4 }, prerequisiteSkillIds: ["family-resonance", "bond-weave"], puzzleKind: "isotope-balance",
    grantsSkillId: "isotope-echo", knowledgeCardId: "kc-isotopes", color: "#9589d2", hidden: true,
    reward: { materialId: "isotope-prism", label: "同位棱镜", amount: 1 }
  }
];

export const gates: AccessGateDefinition[] = [
  {
    id: "gate-atomic-forum", categoryId: "atomic-forum", position: { x: 15, y: 25, z: 0 }, requiredSkillIds: [],
    requiredClueIds: ["atom-hydrogen", "atom-carbon", "atom-oxygen"], label: "身份校验门",
    blockedMessage: "门上有三个空白元素格。先观察庭院里的氢、碳、氧原子样本。",
    clearedMessage: "三个原子序数依次亮起，无名原子庭恢复开放。"
  },
  {
    id: "gate-periodic-gallery", categoryId: "periodic-gallery", position: { x: 18, y: 24, z: 0 },
    requiredSkillIds: ["atomic-sight"], requiredClueIds: [], label: "原子序数阶",
    blockedMessage: "台阶只显示质子数。先在无名原子庭获得原子视野。",
    clearedMessage: "原子序数从小到大排成阶梯，周期坐标廊已经可达。"
  },
  {
    id: "gate-electron-observatory", categoryId: "electron-observatory", position: { x: 25, y: 20, z: 0 },
    requiredSkillIds: ["atomic-sight"], requiredClueIds: [], label: "核电荷升降台",
    blockedMessage: "升降台需要确认中心原子的身份。先学会读取质子数。",
    clearedMessage: "原子核被正确识别，升降台载着你驶向电子云台。"
  },
  {
    id: "gate-family-greenhouse", categoryId: "family-greenhouse", position: { x: 33, y: 17, z: 0 },
    requiredSkillIds: ["periodic-step"], requiredClueIds: [], label: "同族藤门",
    blockedMessage: "藤门上的元素上下排列，却缺少连接规律。周期坐标廊里藏着答案。",
    clearedMessage: "同族元素依次响应，藤门向家族温室展开。"
  },
  {
    id: "gate-bond-workshop", categoryId: "bond-workshop", position: { x: 37, y: 13, z: 1 },
    requiredSkillIds: ["valence-link"], requiredClueIds: [], label: "价层断桥",
    blockedMessage: "桥面缺少一枚最外层电子。电子云台能教你怎样移动它。",
    clearedMessage: "价电子沿轨道滑入空位，通往成键工坊的桥重新对齐。"
  },
  {
    id: "gate-isotope-vault", categoryId: "isotope-vault", position: { x: 40, y: 6, z: 4 },
    requiredSkillIds: ["family-resonance", "bond-weave"], requiredClueIds: [], label: "双重碳门",
    blockedMessage: "两枚碳符号重量不同。你需要同时唤醒元素家族并编织稳定键桥。",
    clearedMessage: "两枚碳以相同身份、不同重量共鸣，同位素穹室显现。"
  }
];

export const fieldClues: FieldClueDefinition[] = [
  {
    id: "atom-hydrogen", categoryId: "atomic-forum", position: { x: 8, y: 24, z: 0 },
    label: "氢原子样本", title: "样本 H", reading: "1 个质子",
    observation: "透明原子球的中心只有一枚带正电的质子，外层有一枚电子在缓慢绕行。",
    conclusion: "质子数为 1，因此它是氢；中性状态下也有 1 个电子。"
  },
  {
    id: "atom-carbon", categoryId: "atomic-forum", position: { x: 11, y: 24, z: 0 },
    label: "碳原子样本", title: "样本 C", reading: "6 个质子",
    observation: "第二颗原子球有两层电子轨道，原子核标出 6 枚质子，外层留下 4 个明亮节点。",
    conclusion: "质子数为 6，因此它是碳；4 个价电子让它能形成多样的共价键。"
  },
  {
    id: "atom-oxygen", categoryId: "atomic-forum", position: { x: 14, y: 24, z: 0 },
    label: "氧原子样本", title: "样本 O", reading: "8 个质子",
    observation: "第三颗原子球同样有两层轨道，原子核标出 8 枚质子，最外层有 6 枚电子。",
    conclusion: "质子数为 8，因此它是氧；它通常还需要 2 个电子达到稳定外层。"
  }
];

export const worldHooks = [
  {
    id: "blank-element-tile", kind: "unfinished-object" as const, title: "周期表上被擦掉的一格", label: "空白元素格",
    description: "石格没有符号，只留下原子序数 10。原子视野让隐藏的 Ne 重新浮现。",
    position: { x: 16, y: 14, z: 0 }, requiredSkillIds: ["atomic-sight"], hint: "读取原子序数，再想想 10 号元素是谁。",
    reward: { collectibleId: "neon-tile", label: "霓虹元素格" }
  },
  {
    id: "noble-gas-pavilion", kind: "rare-phenomenon" as const, title: "不愿成键的安静凉亭", label: "稀有气体亭",
    description: "氦、氖、氩安静地亮着。族性共鸣证明，不参与反应有时也是一种稳定。",
    position: { x: 28, y: 25, z: 0 }, requiredSkillIds: ["family-resonance"], hint: "带着族性共鸣观察第 18 族的三盏灯。",
    reward: { collectibleId: "noble-lantern", label: "氖光静默灯" }
  },
  {
    id: "water-molecule-arch", kind: "unfinished-object" as const, title: "少了一条键的水分子拱门", label: "H2O 拱门",
    description: "氧位于中央，两颗氢停在两侧。补全第二条共价键后，拱门投下一道彩色影子。",
    position: { x: 35, y: 22, z: 0 }, requiredSkillIds: ["bond-weave"], hint: "氧需要形成两条键，两颗氢各提供一枚电子参与共享。",
    reward: { collectibleId: "water-arch", label: "弯曲水分子模型" }
  },
  {
    id: "carbon-fourteen-echo", kind: "memory-echo" as const, title: "比碳-12 多出来的两声回响", label: "碳-14 回声",
    description: "两枚额外中子让回声慢了半拍，但原子核中的 6 枚质子始终没有改变。",
    position: { x: 40, y: 10, z: 1 }, requiredSkillIds: ["isotope-echo"], hint: "不要数总粒子，先确认它们共有的质子数。",
    reward: { collectibleId: "carbon-echo", label: "碳年代回声片" }
  }
];

export const achievements: AchievementDefinition[] = [
  { id: "curiosity-cartographer", name: "首答", description: "发现一个地图上的隐藏知识点。", kind: "secret", hidden: false, eventKey: "discover-world-hook", targetCount: 1, reward: { kind: "title", label: "元素测绘员" } },
  { id: "liu-first-contact", name: "看山只负责指路", description: "第一次与刘看山完成对话。", kind: "one-shot", hidden: false, eventKey: "talk-liu", targetCount: 1, reward: { kind: "title", label: "周期庭院来客" } },
  { id: "source-seeker", name: "答案要有出处", description: "阅读第一张知识卡。", kind: "one-shot", hidden: false, eventKey: "read-knowledge", targetCount: 1, reward: { kind: "collectible", label: "元素观察手册" } },
  { id: "atomic-certified", name: "元素点名员", description: "完成无名原子庭并获得原子视野。", kind: "one-shot", hidden: false, eventKey: "complete-category:atomic-forum", targetCount: 1, reward: { kind: "skin", label: "原子观测镜" } },
  { id: "periodic-certified", name: "会走路的周期表", description: "在周期坐标廊正确放置元素。", kind: "one-shot", hidden: false, eventKey: "complete-category:periodic-gallery", targetCount: 1, reward: { kind: "skill-variant", label: "周期步·回程" } },
  { id: "electron-certified", name: "最外层观察员", description: "完成钠的电子层排布。", kind: "one-shot", hidden: false, eventKey: "complete-category:electron-observatory", targetCount: 1, reward: { kind: "collectible", label: "蓝色电子珠" } },
  { id: "family-certified", name: "这几位是一家", description: "辨认三组元素家族。", kind: "one-shot", hidden: false, eventKey: "complete-category:family-greenhouse", targetCount: 1, reward: { kind: "skin", label: "家族温室披肩" } },
  { id: "bond-certified", name: "关系稳定", description: "完成一次电子转移和一次电子共享。", kind: "one-shot", hidden: false, eventKey: "complete-category:bond-workshop", targetCount: 1, reward: { kind: "skill-variant", label: "键桥·双线" } },
  { id: "hidden-scholar", name: "同名不同重", description: "找到同位素穹室并辨认碳-12 与碳-14。", kind: "secret", hidden: true, eventKey: "complete-category:isotope-vault", targetCount: 1, reward: { kind: "collectible", label: "同位素棱镜" } },
  { id: "garden-graduate", name: "收藏比赞多", description: "完成地图中的六个元素知识区域。", kind: "collection", hidden: false, eventKey: "complete-category", targetCount: 6, reward: { kind: "title", label: "元素关系研究员" } },
  { id: "daily-rift-solver", name: "今日异闻处理员", description: "完成一期每日临时地图。", kind: "cumulative", hidden: false, eventKey: "complete-daily-rift", targetCount: 1, reward: { kind: "collectible", label: "热点回声样本" } }
];

export const elementHarbor: RegionDefinition = {
  id: "periodic-garden", name: "周期庭院", subtitle: "一座按照元素规律生长的知识园",
  width: 44, height: 32, categories, gates, fieldClues, worldHooks
};

export function createInitialPlayerState(userId: string, displayName: string): PlayerState {
  return {
    userId, displayName, position: { x: 5, y: 28, z: 1.05 }, unlockedSkillIds: [], completedCategoryIds: [],
    openedGateIds: [], readKnowledgeCardIds: [], achievementIds: [], achievementProgress: {}, collectibleIds: [],
    titleIds: [], skinIds: [], materials: { "garden-token": 4 }, personalizationEnabled: true,
    dailyRiftCompletedIds: [], discoveredWorldHookIds: [], craftedTechniqueIds: [], solvedMicroPuzzleIds: [], inspectedClueIds: []
  };
}

export function createInitialPersonalization(_userId: string, isDevelopment: boolean): PersonalizationSnapshot {
  return {
    enabled: true, syncedAt: new Date().toISOString(), interests: isDevelopment ? ["化学", "元素", "叙事解谜"] : [],
    recentTitles: [], followeeNames: [], source: isDevelopment ? "development" : "profile-only"
  };
}
