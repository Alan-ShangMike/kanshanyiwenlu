export type PuzzleKind =
  | "atomic-identity"
  | "periodic-placement"
  | "electron-shells"
  | "family-sort"
  | "bond-builder"
  | "isotope-balance";

export type AchievementKind =
  | "one-shot"
  | "cumulative"
  | "collection"
  | "challenge"
  | "secret";

export type WorldHookKind =
  | "unfinished-object"
  | "memory-echo"
  | "rare-phenomenon";

export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

export interface KnowledgeSource {
  provider: "zhihu";
  title: string;
  url: string | null;
  authorName: string | null;
  authorUrl: string | null;
  status: "linked" | "pending";
}

export interface KnowledgeCard {
  id: string;
  categoryId: string;
  title: string;
  question: string;
  summary: string;
  keyPoints: string[];
  source: KnowledgeSource;
}

export interface SkillDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  traversalHint: string;
  color: string;
}

export interface AccessGateDefinition {
  id: string;
  categoryId: string;
  position: GridPosition;
  requiredSkillIds: string[];
  requiredClueIds: string[];
  label: string;
  blockedMessage: string;
  clearedMessage: string;
}

export interface FieldClueDefinition {
  id: string;
  categoryId: string;
  position: GridPosition;
  label: string;
  title: string;
  reading: string;
  observation: string;
  conclusion: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  position: GridPosition;
  prerequisiteSkillIds: string[];
  puzzleKind: PuzzleKind;
  grantsSkillId: string;
  knowledgeCardId: string;
  color: string;
  hidden: boolean;
  reward: {
    materialId: string;
    label: string;
    amount: number;
  };
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  kind: AchievementKind;
  hidden: boolean;
  eventKey: string;
  targetCount: number;
  reward: {
    kind: "title" | "skin" | "skill-variant" | "collectible";
    label: string;
  };
}

export interface RegionDefinition {
  id: string;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  categories: CategoryDefinition[];
  gates: AccessGateDefinition[];
  fieldClues: FieldClueDefinition[];
  worldHooks: WorldHookDefinition[];
}

export interface WorldHookDefinition {
  id: string;
  kind: WorldHookKind;
  title: string;
  label: string;
  description: string;
  position: GridPosition;
  requiredSkillIds: string[];
  hint: string;
  reward: {
    collectibleId: string;
    label: string;
  };
}

export interface PlayerState {
  userId: string;
  displayName: string;
  position: GridPosition;
  unlockedSkillIds: string[];
  completedCategoryIds: string[];
  openedGateIds: string[];
  readKnowledgeCardIds: string[];
  achievementIds: string[];
  achievementProgress: Record<string, number>;
  collectibleIds: string[];
  titleIds: string[];
  skinIds: string[];
  materials: Record<string, number>;
  personalizationEnabled: boolean;
  dailyRiftCompletedIds: string[];
  discoveredWorldHookIds: string[];
  craftedTechniqueIds: string[];
  solvedMicroPuzzleIds: string[];
  inspectedClueIds: string[];
}

export interface TechniqueDefinition {
  id: string;
  name: string;
  components: string[];
  description: string;
  useHint: string;
  color: string;
}

export interface KnowledgeNote {
  id: string;
  authorName: string;
  position: GridPosition;
  text: string;
  helpfulCount: number;
  createdAt: string;
}

export interface DiscoveryRecord {
  hookId: string;
  title: string;
  name: string | null;
  discovererName: string | null;
  namedAt: string | null;
}

export interface ZhihuUser {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  headline: string | null;
  isDevelopment: boolean;
}

export interface DailyRift {
  id: string;
  generatedAt: string;
  status: "draft" | "published" | "failed";
  title: string;
  premise: string;
  objective: string;
  sourceTopic: {
    title: string;
    url: string;
    summary: string;
    authorName: string | null;
    authorUrl: string | null;
    keyPoints: string[];
    thumbnailUrl?: string;
  };
  mechanics: string[];
  reward: {
    achievementId: string;
    skillId?: string;
    skinId?: string;
  };
  puzzle: {
    kind: "logic-order" | "resource-route" | "evidence-match";
    prompt: string;
    options: string[];
    correctAnswer: string;
  };
}

export interface BootstrapPayload {
  user: ZhihuUser;
  player: PlayerState;
  region: RegionDefinition;
  skills: SkillDefinition[];
  knowledgeCards: KnowledgeCard[];
  achievements: AchievementDefinition[];
  dailyRift: DailyRift | null;
  personalization: PersonalizationSnapshot;
  techniques: TechniqueDefinition[];
  notes: KnowledgeNote[];
  discoveries: DiscoveryRecord[];
  integrations: {
    zhihuOAuthConfigured: boolean;
    zhihuOpenPlatformConfigured: boolean;
    deepSeekConfigured: boolean;
  };
}

export interface PersonalizationSnapshot {
  enabled: boolean;
  syncedAt: string | null;
  interests: string[];
  recentTitles: string[];
  followeeNames: string[];
  source: "zhihu-open-platform" | "profile-only" | "development";
}

export interface ProgressMutation {
  type:
    | "read-knowledge"
    | "complete-category"
    | "open-gate"
    | "talk-liu"
    | "complete-daily-rift"
    | "discover-world-hook"
    | "inspect-clue"
    | "complete-micro-puzzle"
    | "craft-technique"
    | "save-position";
  categoryId?: string;
  cardId?: string;
  gateId?: string;
  riftId?: string;
  hookId?: string;
  clueId?: string;
  microPuzzleId?: string;
  techniqueId?: string;
  position?: GridPosition;
}

export interface ProgressResult {
  player: PlayerState;
  awardedAchievementIds: string[];
  message: string;
  firstDiscovery?: {
    hookId: string;
    title: string;
  };
}

export interface LiuGuideResponse {
  speaker: "刘看山";
  text: string;
  source: "deepseek" | "local";
  suggestions: string[];
}
