import Fastify from "fastify";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import cron from "node-cron";
import { z } from "zod";
import { achievements, elementHarbor, knowledgeCards, skills, techniques } from "@kanshan/shared";
import { config, hasWebBuild } from "./config.js";
import { createKnowledgeNote, getPlayerState, listDiscoveryRecords, listKnowledgeNotes, nameDiscovery, setSetting } from "./db.js";
import { registerAuthRoutes, requireUser } from "./auth.js";
import { getDeepSeekRuntimeConfig, integrationStatus } from "./integrations.js";
import { dailyProgress, getTodaysRift, refreshDailyRift } from "./daily.js";
import { createLiuGuide } from "./guide.js";
import { applyProgressMutation } from "./progress.js";
import { normaliseAdminToken, safeEqual } from "./security.js";
const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL ?? "info",
        redact: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.headers.x-admin-token",
            "res.headers.set-cookie"
        ]
    }
});
await app.register(cookie);
const progressSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("read-knowledge"), cardId: z.string().min(1) }),
    z.object({
        type: z.literal("complete-category"),
        categoryId: z.string().min(1)
    }),
    z.object({ type: z.literal("open-gate"), gateId: z.string().min(1) }),
    z.object({ type: z.literal("talk-liu") }),
    z.object({ type: z.literal("inspect-clue"), clueId: z.string().min(1) }),
    z.object({
        type: z.literal("complete-daily-rift"),
        riftId: z.string().min(1)
    }),
    z.object({
        type: z.literal("discover-world-hook"),
        hookId: z.string().min(1)
    }),
    z.object({
        type: z.literal("complete-micro-puzzle"),
        microPuzzleId: z.string().min(1)
    }),
    z.object({
        type: z.literal("craft-technique"),
        techniqueId: z.string().min(1)
    }),
    z.object({
        type: z.literal("save-position"),
        position: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        })
    })
]);
const guideSchema = z.object({
    message: z.string().trim().min(1).max(240)
});
const settingsSchema = z.object({
    deepSeekBaseUrl: z.string().url().optional(),
    deepSeekModel: z.string().trim().min(1).max(120).optional(),
    deepSeekApiKey: z.string().trim().max(400).optional(),
    zhihuAccessSecret: z.string().trim().max(400).optional()
});
function isAdmin(request) {
    const supplied = request.headers["x-admin-token"];
    return (typeof supplied === "string" &&
        safeEqual(normaliseAdminToken(supplied), config.adminToken));
}
function requireAdmin(request, reply) {
    if (isAdmin(request))
        return true;
    reply.code(401).send({ error: "Admin token required." });
    return false;
}
app.get("/api/health", async () => ({
    ok: true,
    time: new Date().toISOString(),
    integrations: integrationStatus()
}));
await registerAuthRoutes(app);
app.get("/api/bootstrap", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user)
        return;
    const player = getPlayerState(user.id);
    if (!player)
        return reply.code(500).send({ error: "Player state missing." });
    let rift = getTodaysRift();
    if (!rift) {
        rift = (await refreshDailyRift(false)).rift;
    }
    const payload = {
        user: {
            id: user.zhihuId,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl,
            headline: user.headline,
            isDevelopment: user.isDevelopment
        },
        player,
        region: elementHarbor,
        skills,
        knowledgeCards,
        achievements,
        dailyRift: rift,
        personalization: user.personalization,
        techniques,
        notes: listKnowledgeNotes(),
        discoveries: listDiscoveryRecords(),
        integrations: integrationStatus()
    };
    return reply.send(payload);
});
app.post("/api/progress", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user)
        return;
    const parsed = progressSchema.safeParse(request.body);
    if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid progress mutation." });
    }
    try {
        return reply.send(applyProgressMutation(user.id, parsed.data));
    }
    catch (error) {
        return reply.code(400).send({
            error: error instanceof Error ? error.message : "Progress update failed."
        });
    }
});
app.post("/api/guide", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user)
        return;
    const parsed = guideSchema.safeParse(request.body);
    if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid guide request." });
    }
    const player = getPlayerState(user.id);
    if (!player)
        return reply.code(500).send({ error: "Player state missing." });
    return reply.send(await createLiuGuide(player, parsed.data.message));
});
app.post("/api/notes", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user)
        return;
    const parsed = z.object({
        position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        text: z.string().trim().min(4).max(180)
    }).safeParse(request.body);
    if (!parsed.success)
        return reply.code(400).send({ error: "笔记需要 4 到 180 个字。" });
    return reply.send(createKnowledgeNote({
        authorName: user.nickname,
        position: parsed.data.position,
        text: parsed.data.text
    }));
});
app.post("/api/discoveries/:hookId/name", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user)
        return;
    const parsed = z.object({ name: z.string().trim().min(2).max(24) }).safeParse(request.body);
    if (!parsed.success)
        return reply.code(400).send({ error: "名称需要 2 到 24 个字。" });
    if (!nameDiscovery(request.params.hookId, parsed.data.name)) {
        return reply.code(409).send({ error: "这处发现已经被命名了。" });
    }
    return reply.send({ ok: true, name: parsed.data.name, namedBy: user.nickname });
});
app.get("/api/daily/current", async (request, reply) => {
    const user = requireUser(request, reply);
    if (!user)
        return;
    const player = getPlayerState(user.id);
    if (!player)
        return reply.code(500).send({ error: "Player state missing." });
    return reply.send(dailyProgress(player));
});
app.get("/api/admin/status", async (request, reply) => {
    if (!requireAdmin(request, reply))
        return;
    const deepSeek = getDeepSeekRuntimeConfig();
    return reply.send({
        integrations: integrationStatus(),
        schedule: {
            expression: "0 8 * * *",
            timezone: config.cronTimezone,
            description: "每天 08:00 自动刷新每日裂隙"
        },
        currentRift: getTodaysRift(),
        runtime: {
            deepSeekBaseUrl: deepSeek.baseUrl,
            deepSeekModel: deepSeek.model,
            deepSeekKeyConfigured: Boolean(deepSeek.apiKey),
            zhihuAccessSecretConfigured: Boolean(config.zhihu.accessSecret)
        }
    });
});
app.post("/api/admin/daily/refresh", async (request, reply) => {
    if (!requireAdmin(request, reply))
        return;
    const result = await refreshDailyRift(true);
    return reply.send(result);
});
app.put("/api/admin/settings", async (request, reply) => {
    if (!requireAdmin(request, reply))
        return;
    const parsed = settingsSchema.safeParse(request.body);
    if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid runtime settings." });
    }
    if (parsed.data.deepSeekBaseUrl) {
        setSetting("deepseek.baseUrl", parsed.data.deepSeekBaseUrl.replace(/\/$/, ""));
    }
    if (parsed.data.deepSeekModel) {
        setSetting("deepseek.model", parsed.data.deepSeekModel);
    }
    if (parsed.data.deepSeekApiKey) {
        setSetting("deepseek.apiKey", parsed.data.deepSeekApiKey);
    }
    if (parsed.data.zhihuAccessSecret) {
        setSetting("zhihu.accessSecret", parsed.data.zhihuAccessSecret);
    }
    return reply.send({
        ok: true,
        integrations: integrationStatus(),
        note: "密钥只保存在服务端数据库中，不会通过接口返回。"
    });
});
if (hasWebBuild()) {
    await app.register(fastifyStatic, {
        root: config.webDistPath,
        prefix: "/"
    });
    app.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith("/api/")) {
            return reply.code(404).send({ error: "Not found." });
        }
        return reply.sendFile("index.html");
    });
}
else {
    app.get("/", async () => ({
        name: "看山异闻录 API",
        webBuildFound: false,
        message: "请使用 Vite 开发服务器，或先执行 pnpm build。"
    }));
}
cron.schedule("0 8 * * *", () => {
    void refreshDailyRift(true).catch((error) => {
        app.log.error({ err: error }, "Scheduled daily rift refresh failed.");
    });
}, { timezone: config.cronTimezone });
try {
    await refreshDailyRift(false);
    await app.listen({ port: config.port, host: config.host });
    app.log.info({
        port: config.port,
        oauthConfigured: integrationStatus().zhihuOAuthConfigured,
        dailyRefresh: `${config.cronTimezone} 08:00`
    }, "Kanshan Element Harbor API started.");
}
catch (error) {
    app.log.error(error);
    process.exit(1);
}
export { app };
