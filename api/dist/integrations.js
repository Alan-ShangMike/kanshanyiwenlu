import { config } from "./config.js";
import { getSetting } from "./db.js";
function effectiveValue(key, fallback) {
    return getSetting(key)?.trim() || fallback;
}
export function getDeepSeekRuntimeConfig() {
    return {
        baseUrl: effectiveValue("deepseek.baseUrl", config.deepSeek.baseUrl),
        model: effectiveValue("deepseek.model", config.deepSeek.model),
        apiKey: effectiveValue("deepseek.apiKey", config.deepSeek.apiKey)
    };
}
export function getZhihuAccessSecret() {
    return effectiveValue("zhihu.accessSecret", config.zhihu.accessSecret);
}
export function integrationStatus() {
    const deepSeek = getDeepSeekRuntimeConfig();
    return {
        zhihuOAuthConfigured: Boolean(config.zhihu.appId && config.zhihu.appKey && config.zhihu.redirectUri),
        zhihuOpenPlatformConfigured: Boolean(getZhihuAccessSecret()),
        deepSeekConfigured: Boolean(deepSeek.apiKey)
    };
}
async function fetchJson(input, init, timeoutMs = 10_000) {
    const response = await fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs)
    });
    const text = await response.text();
    let json = null;
    try {
        json = JSON.parse(text);
    }
    catch {
        json = null;
    }
    return { response, text, json };
}
export async function exchangeZhihuCode(code) {
    if (!config.zhihu.appId || !config.zhihu.appKey) {
        throw new Error("Zhihu OAuth credentials are not configured.");
    }
    const body = new URLSearchParams({
        app_id: config.zhihu.appId,
        app_key: config.zhihu.appKey,
        grant_type: "authorization_code",
        redirect_uri: config.zhihu.redirectUri,
        code
    });
    const { response, json } = await fetchJson(config.zhihu.tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json"
        },
        body
    });
    const payload = json;
    if (!response.ok || !payload?.access_token) {
        throw new Error(payload?.message || "Zhihu token exchange failed.");
    }
    return {
        accessToken: payload.access_token,
        tokenType: payload.token_type ?? "Bearer",
        expiresIn: payload.expires_in ?? 3600
    };
}
export async function fetchZhihuUser(accessToken) {
    const { response, text, json } = await fetchJson(config.zhihu.userUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json"
        }
    });
    const payload = json;
    // uid can exceed Number.MAX_SAFE_INTEGER. Read the raw token first so the
    // platform identifier never passes through a lossy JSON number conversion.
    const rawUid = text.match(/"uid"\s*:\s*(\d+)/)?.[1];
    const zhihuId = rawUid ?? String(payload?.uid ?? payload?.hash_id ?? "");
    if (!response.ok || !zhihuId || !payload?.fullname) {
        throw new Error("Zhihu user profile response was incomplete.");
    }
    return {
        id: zhihuId,
        nickname: payload.fullname,
        avatarUrl: payload.avatar_path || null,
        headline: payload.headline || null,
        isDevelopment: false
    };
}
export async function syncZhihuPersonalization(accessToken, profile) {
    const accessSecret = getZhihuAccessSecret();
    if (!accessSecret) {
        return {
            enabled: true,
            syncedAt: new Date().toISOString(),
            interests: profile.headline ? [profile.headline] : [],
            recentTitles: [],
            followeeNames: [],
            source: "profile-only"
        };
    }
    const headers = {
        Authorization: `Bearer ${accessSecret}`,
        "X-OAuth-Token": accessToken,
        "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
        Accept: "application/json"
    };
    async function requestItems(path) {
        try {
            const { response, json } = await fetchJson(`${config.zhihu.userApiBase}${path}`, { headers }, 8_000);
            if (!response.ok)
                return [];
            const payload = json;
            return Array.isArray(payload?.Data?.Items) ? payload.Data.Items : [];
        }
        catch {
            return [];
        }
    }
    const [contents, followees, collections] = await Promise.all([
        requestItems("/user/contents?ContentType=all&Limit=12"),
        requestItems("/user/followees?Limit=12"),
        requestItems("/user/collections?Limit=12")
    ]);
    const recentTitles = contents
        .map((item) => item.Title?.trim())
        .filter((value) => Boolean(value))
        .slice(0, 6);
    const followeeNames = followees
        .map((item) => item.Fullname?.trim())
        .filter((value) => Boolean(value))
        .slice(0, 6);
    const collectionTitles = collections
        .map((item) => item.Title?.trim())
        .filter((value) => Boolean(value))
        .slice(0, 6);
    const interests = [
        ...new Set([profile.headline, ...recentTitles, ...collectionTitles]
            .filter((value) => Boolean(value))
            .map((value) => value.slice(0, 32)))
    ].slice(0, 8);
    return {
        enabled: true,
        syncedAt: new Date().toISOString(),
        interests,
        recentTitles,
        followeeNames,
        source: "zhihu-open-platform"
    };
}
export async function fetchZhihuHotTopics() {
    const accessSecret = getZhihuAccessSecret();
    if (!accessSecret) {
        throw new Error("Zhihu Access Secret is not configured.");
    }
    const { response, json } = await fetchJson(`${config.zhihu.hotListUrl}?Limit=30`, {
        headers: {
            Authorization: `Bearer ${accessSecret}`,
            "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
            "Content-Type": "application/json",
            Accept: "application/json"
        }
    }, 12_000);
    const payload = json;
    if (!response.ok || payload?.Code !== 0 || !Array.isArray(payload.Data?.Items)) {
        throw new Error(payload?.Message || "Zhihu hot list request failed.");
    }
    return payload.Data.Items.flatMap((item) => {
        const title = item.Title?.trim();
        const url = item.Url?.trim();
        if (!title || !url)
            return [];
        return [
            {
                title,
                url,
                summary: item.Summary?.trim() || "该热榜条目暂未返回摘要。",
                keyPoints: Array.isArray(item.KeyPoints)
                    ? item.KeyPoints
                        .filter((point) => typeof point === "string")
                        .map((point) => point.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                    : undefined,
                authorName: item.AuthorName?.trim() || null,
                authorUrl: item.AuthorUrl?.trim() || null,
                thumbnailUrl: item.ThumbnailUrl?.trim() || undefined
            }
        ];
    });
}
export async function requestDeepSeekJson(systemPrompt, userPayload) {
    const runtime = getDeepSeekRuntimeConfig();
    if (!runtime.apiKey)
        return null;
    const { response, json } = await fetchJson(`${runtime.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${runtime.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify({
            model: runtime.model,
            temperature: 0.65,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: JSON.stringify(userPayload) },
                {
                    role: "user",
                    content: "只返回一个 JSON 对象，不要使用 Markdown 代码块，不要添加说明文字。"
                }
            ]
        })
    }, 25_000);
    const payload = json;
    if (!response.ok) {
        throw new Error(payload?.error?.message || "DeepSeek request failed.");
    }
    const content = payload?.choices?.[0]?.message?.content;
    if (!content)
        return null;
    try {
        return JSON.parse(content);
    }
    catch {
        const match = content.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
    }
}
export async function requestDeepSeekText(systemPrompt, userPrompt) {
    const runtime = getDeepSeekRuntimeConfig();
    if (!runtime.apiKey)
        return null;
    const { response, json } = await fetchJson(`${runtime.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${runtime.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify({
            model: runtime.model,
            temperature: 0.72,
            max_tokens: 220,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        })
    }, 20_000);
    const payload = json;
    if (!response.ok) {
        throw new Error(payload?.error?.message || "DeepSeek request failed.");
    }
    return payload?.choices?.[0]?.message?.content?.trim() || null;
}
