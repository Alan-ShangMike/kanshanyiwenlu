import { categories, knowledgeCards, skills } from "@kanshan/shared";
import { getTodaysRift } from "./daily.js";
import { requestDeepSeekText } from "./integrations.js";
function nextCategory(player) {
    const unlocked = new Set(player.unlockedSkillIds);
    return (categories.find((category) => !player.completedCategoryIds.includes(category.id) &&
        category.prerequisiteSkillIds.every((skillId) => unlocked.has(skillId))) ?? null);
}
function localGuide(player, message) {
    const completed = player.completedCategoryIds.length;
    const next = nextCategory(player);
    const latestSkill = skills.find((skill) => player.unlockedSkillIds.includes(skill.id));
    const card = next
        ? knowledgeCards.find((item) => item.id === next.knowledgeCardId)
        : null;
    if (/热榜|异闻|裂隙|每日/.test(message)) {
        const rift = getTodaysRift();
        return {
            speaker: "刘看山",
            source: "local",
            text: rift
                ? `今天的裂隙叫“${rift.title}”。它只借用热点的线索，不把别人的回答直接搬进游戏。你想先去看看，还是继续主线？`
                : "今天还没有生成裂隙。后台会在八点刷新，也可以手动酿造一次。别担心，我会在入口等你。",
            suggestions: ["带我去裂隙", "继续主线", "它和普通关卡有什么不同？"]
        };
    }
    if (/跳过|捷径|已经会/.test(message)) {
        return {
            speaker: "刘看山",
            source: "local",
            text: "可以少走重复的路，但别让“跳过”替你吞掉判断。正式版本会把掌握挑战和普通通关分开记录，奖励也不同。",
            suggestions: ["我想继续探索", "先给我一个提示", "热榜裂隙在哪里？"]
        };
    }
    if (!next) {
        return {
            speaker: "刘看山",
            source: "local",
            text: "周期庭院的元素规律都醒了，但远处还有一格没有署名。今天的裂隙会先陪你，下一块地图的线索已经留在日志里。",
            suggestions: ["给我看日志", "再去检查一遍周期庭院", "今天的热榜是什么？"]
        };
    }
    const skillText = latestSkill
        ? `你现在会“${latestSkill.name}”，记得留意能改变地形的地方。`
        : "先从眼前的异常开始，别急着一次读懂整座港口。";
    return {
        speaker: "刘看山",
        source: "local",
        text: `${skillText} 下一站像是“${next.name}”：${next.description}${card ? ` 我会把《${card.title}》放进卷宗，读完后自己决定怎么破局。` : ""}`,
        suggestions: ["为什么先来这里？", "给我一个不剧透的提示", "热榜裂隙在哪里？"]
    };
}
export async function createLiuGuide(player, message) {
    const fallback = localGuide(player, message);
    const visited = player.completedCategoryIds
        .map((id) => categories.find((item) => item.id === id)?.name)
        .filter(Boolean);
    const readCards = player.readKnowledgeCardIds
        .map((id) => knowledgeCards.find((item) => item.id === id)?.title)
        .filter(Boolean);
    try {
        const generated = await requestDeepSeekText([
            "你是《看山异闻录》里的刘看山：幽默、开朗、温和，不装全知。",
            "你引导玩家自由探索，但不替玩家做选择，不泄露谜题答案。",
            "回复必须使用简体中文，最多100字，可以有一点点俏皮。",
            "只引用提供的游戏状态，不编造知乎作者、原文、数据或知识结论。",
            "如果玩家要求跳过，说明可以跳过重复内容，但掌握挑战和普通通关会记录不同奖励。"
        ].join("\n"), JSON.stringify({
            playerMessage: message,
            unlockedSkills: player.unlockedSkillIds,
            completedCategories: visited,
            readCards,
            localHint: fallback.text
        }));
        if (!generated)
            return fallback;
        return {
            ...fallback,
            text: generated.slice(0, 180),
            source: "deepseek"
        };
    }
    catch {
        return fallback;
    }
}
