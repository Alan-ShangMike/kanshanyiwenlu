import { achievements } from "@kanshan/shared";
function eventMatches(definition, eventKey) {
    if (definition.eventKey.includes(":")) {
        return definition.eventKey === eventKey;
    }
    return (eventKey === definition.eventKey ||
        eventKey.startsWith(`${definition.eventKey}:`));
}
function applyReward(player, achievement) {
    const { reward } = achievement;
    if (reward.kind === "title" && !player.titleIds.includes(reward.label)) {
        player.titleIds.push(reward.label);
    }
    if (reward.kind === "skin" && !player.skinIds.includes(reward.label)) {
        player.skinIds.push(reward.label);
    }
    if (reward.kind === "collectible" &&
        !player.collectibleIds.includes(reward.label)) {
        player.collectibleIds.push(reward.label);
    }
    if (reward.kind === "skill-variant" &&
        !player.collectibleIds.includes(reward.label)) {
        player.collectibleIds.push(reward.label);
    }
}
export function recordProgressEvent(player, eventKey) {
    const awardedAchievementIds = [];
    for (const achievement of achievements) {
        if (!eventMatches(achievement, eventKey))
            continue;
        const current = player.achievementProgress[achievement.id] ?? 0;
        const nextCount = current + 1;
        player.achievementProgress[achievement.id] = nextCount;
        if (nextCount >= achievement.targetCount &&
            !player.achievementIds.includes(achievement.id)) {
            player.achievementIds.push(achievement.id);
            applyReward(player, achievement);
            awardedAchievementIds.push(achievement.id);
        }
    }
    return {
        player,
        awardedAchievementIds,
        message: awardedAchievementIds.length
            ? "新的探索记录已写入异闻录。"
            : "探索记录已更新。"
    };
}
export function describeAchievement(achievementId) {
    return achievements.find((item) => item.id === achievementId)?.name ?? "新成就";
}
