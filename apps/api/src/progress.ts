import type {
  PlayerState,
  ProgressMutation,
  ProgressResult
} from "@kanshan/shared";
import {
  categories,
  fieldClues,
  gates,
  knowledgeCards,
  skills,
  techniques,
  worldHooks,
  elementHarbor
} from "@kanshan/shared";
import {
  getPlayerState,
  ensureDiscoveryRecord,
  savePlayerState
} from "./db.js";
import { recordProgressEvent } from "./achievements.js";
import { getTodaysRift } from "./daily.js";

function requireState(userId: string) {
  const player = getPlayerState(userId);
  if (!player) throw new Error("Player state is missing.");
  return player;
}

function uniquePush(values: string[], value: string) {
  if (!values.includes(value)) values.push(value);
}

function addMaterial(
  player: PlayerState,
  materialId: string,
  amount: number
) {
  player.materials[materialId] =
    (player.materials[materialId] ?? 0) + Math.max(0, amount);
}

function gateForCategory(categoryId: string) {
  return gates.find((gate) => gate.categoryId === categoryId) ?? null;
}

function applyMutation(player: PlayerState, mutation: ProgressMutation) {
  let eventKey: string | null = null;

  if (mutation.type === "read-knowledge") {
    const card = knowledgeCards.find((item) => item.id === mutation.cardId);
    if (!card) throw new Error("Unknown knowledge card.");
    if (!player.readKnowledgeCardIds.includes(card.id)) {
      uniquePush(player.readKnowledgeCardIds, card.id);
      eventKey = "read-knowledge";
    }
  }

  if (mutation.type === "complete-category") {
    const category = categories.find((item) => item.id === mutation.categoryId);
    if (!category) throw new Error("Unknown knowledge category.");
    const available = category.prerequisiteSkillIds.every((skillId) =>
      player.unlockedSkillIds.includes(skillId)
    );
    if (!available) throw new Error("Category prerequisites are not met.");
    const gate = gateForCategory(category.id);
    if (gate && !player.openedGateIds.includes(gate.id)) {
      throw new Error("The category access gate is still closed.");
    }
    if (!player.completedCategoryIds.includes(category.id)) {
      uniquePush(player.completedCategoryIds, category.id);
      uniquePush(player.unlockedSkillIds, category.grantsSkillId);
      addMaterial(
        player,
        category.reward.materialId,
        category.reward.amount
      );
      eventKey = `complete-category:${category.id}`;
    }
  }

  if (mutation.type === "open-gate") {
    const gate = gates.find((item) => item.id === mutation.gateId);
    if (!gate) throw new Error("Unknown access gate.");
    if (
      !gate.requiredSkillIds.every((skillId) =>
        player.unlockedSkillIds.includes(skillId)
      )
    ) {
      throw new Error("Required skill is not unlocked.");
    }
    if (
      !gate.requiredClueIds.every((clueId) =>
        player.inspectedClueIds.includes(clueId)
      )
    ) {
      throw new Error("先观察通路附近的元素样本。");
    }
    if (!player.openedGateIds.includes(gate.id)) {
      uniquePush(player.openedGateIds, gate.id);
      eventKey = `open-gate:${gate.id}`;
    }
  }

  if (mutation.type === "talk-liu") {
    eventKey = "talk-liu";
  }

  if (mutation.type === "complete-daily-rift") {
    const rift = getTodaysRift();
    if (!rift || rift.id !== mutation.riftId) {
      throw new Error("Daily rift is not available.");
    }
    if (!player.dailyRiftCompletedIds.includes(rift.id)) {
      uniquePush(player.dailyRiftCompletedIds, rift.id);
      if (rift.reward.skinId) {
        uniquePush(player.skinIds, rift.reward.skinId);
      }
      if (rift.reward.skillId) {
        const skill = skills.find((item) => item.id === rift.reward.skillId);
        uniquePush(
          player.collectibleIds,
          `技能残页 · ${skill?.name ?? rift.reward.skillId}`
        );
      }
      addMaterial(player, "echo-fragment", 1);
      eventKey = "complete-daily-rift";
    }
  }

  if (mutation.type === "discover-world-hook") {
    const hook = worldHooks.find((item) => item.id === mutation.hookId);
    if (!hook) throw new Error("Unknown world hook.");
    if (
      !hook.requiredSkillIds.every((skillId) =>
        player.unlockedSkillIds.includes(skillId)
      )
    ) {
      throw new Error("Required skill is not unlocked.");
    }
    if (!player.discoveredWorldHookIds.includes(hook.id)) {
      uniquePush(player.discoveredWorldHookIds, hook.id);
      uniquePush(player.collectibleIds, hook.reward.label);
      ensureDiscoveryRecord(hook.id, hook.title, player.displayName);
      eventKey = "discover-world-hook";
    }
  }

  if (mutation.type === "inspect-clue") {
    const clue = fieldClues.find((item) => item.id === mutation.clueId);
    if (!clue) throw new Error("Unknown field clue.");
    if (!player.inspectedClueIds.includes(clue.id)) {
      uniquePush(player.inspectedClueIds, clue.id);
      eventKey = "inspect-clue";
    }
  }

  if (mutation.type === "complete-micro-puzzle") {
    const knownPuzzleIds = [
      "element-symbol-memory",
      "periodic-tile-sort",
      "electron-orbit-link"
    ];
    if (!mutation.microPuzzleId || !knownPuzzleIds.includes(mutation.microPuzzleId)) {
      throw new Error("Unknown map mechanism.");
    }
    if (!player.solvedMicroPuzzleIds.includes(mutation.microPuzzleId)) {
      uniquePush(player.solvedMicroPuzzleIds, mutation.microPuzzleId);
      addMaterial(player, "mechanism-part", 1);
      eventKey = "complete-micro-puzzle";
    }
  }

  if (mutation.type === "craft-technique") {
    const technique = techniques.find((item) => item.id === mutation.techniqueId);
    if (!technique) throw new Error("Unknown technique.");
    const hasComponents = technique.components.every((component) =>
      skills.some(
        (skill) =>
          skill.name === component && player.unlockedSkillIds.includes(skill.id)
      )
    );
    if (!hasComponents) throw new Error("Technique components are not unlocked.");
    uniquePush(player.craftedTechniqueIds, technique.id);
    eventKey = "craft-technique";
  }

  if (mutation.type === "save-position") {
    if (!mutation.position) throw new Error("Position is required.");
    player.position = {
      x: Math.max(0, Math.min(elementHarbor.width - 1, Math.round(mutation.position.x))),
      y: Math.max(0, Math.min(elementHarbor.height - 1, Math.round(mutation.position.y))),
      z: Math.max(0, Math.min(5, Math.round(mutation.position.z)))
    };
  }

  return eventKey;
}

export function applyProgressMutation(
  userId: string,
  mutation: ProgressMutation
): ProgressResult {
  const player = requireState(userId);
  const wasUndiscovered =
    mutation.type === "discover-world-hook" &&
    !player.discoveredWorldHookIds.includes(mutation.hookId ?? "");
  const eventKey = applyMutation(player, mutation);

  const result = eventKey
    ? recordProgressEvent(player, eventKey)
    : { player, awardedAchievementIds: [], message: "进度已保存。" };

  if (wasUndiscovered && mutation.type === "discover-world-hook") {
    const hook = worldHooks.find((item) => item.id === mutation.hookId);
    if (hook && player.discoveredWorldHookIds.includes(hook.id)) {
      result.firstDiscovery = { hookId: hook.id, title: hook.title };
    }
  }

  savePlayerState(result.player);
  return result;
}
