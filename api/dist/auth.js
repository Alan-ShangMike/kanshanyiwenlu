import { config } from "./config.js";
import { consumeOAuthState, createOAuthState, createSession, deleteSession, getSessionUser, getUser, getUserPublicProfile, updatePersonalization, upsertZhihuUser } from "./db.js";
import { hashToken, randomToken } from "./security.js";
import { exchangeZhihuCode, fetchZhihuUser, integrationStatus, syncZhihuPersonalization } from "./integrations.js";
const sessionCookieName = "kh_session";
const oauthBrowserCookieName = "kh_oauth_browser";
function sessionCookieOptions(maxAge) {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: config.sessionCookieSecure,
        path: "/",
        maxAge
    };
}
export function getAuthenticatedUser(request) {
    const token = request.cookies[sessionCookieName];
    if (!token)
        return null;
    return getSessionUser(hashToken(token));
}
export function requireUser(request, reply) {
    const user = getAuthenticatedUser(request);
    if (!user) {
        void reply.code(401).send({ error: "Authentication required." });
        return null;
    }
    return user;
}
function establishSession(reply, userId) {
    const token = randomToken();
    const maxAge = config.sessionDays * 24 * 60 * 60;
    createSession(userId, hashToken(token), Date.now() + maxAge * 1000);
    reply.setCookie(sessionCookieName, token, sessionCookieOptions(maxAge));
}
function redirectToApp(reply, query) {
    return reply.redirect(`${config.appOrigin}/?${query}`);
}
export async function registerAuthRoutes(app) {
    app.get("/api/auth/me", async (request, reply) => {
        const user = getAuthenticatedUser(request);
        if (!user) {
            return reply.send({
                authenticated: false,
                integrations: integrationStatus(),
                allowDevAuth: config.allowDevAuth
            });
        }
        return reply.send({
            authenticated: true,
            user: getUserPublicProfile(user),
            integrations: integrationStatus(),
            allowDevAuth: config.allowDevAuth
        });
    });
    app.post("/api/auth/dev", async (request, reply) => {
        if (!config.allowDevAuth) {
            return reply.code(403).send({ error: "Development login is disabled." });
        }
        const user = upsertZhihuUser({
            zhihuId: "dev-local-player",
            nickname: "本地探索者",
            avatarUrl: null,
            headline: "正在本地调试周期庭院",
            isDevelopment: true,
            accessToken: null,
            tokenExpiresAt: null
        });
        if (!user) {
            return reply.code(500).send({ error: "Could not create development user." });
        }
        establishSession(reply, user.id);
        return reply.send({ user: getUserPublicProfile(user) });
    });
    app.post("/api/auth/logout", async (request, reply) => {
        const token = request.cookies[sessionCookieName];
        if (token)
            deleteSession(hashToken(token));
        reply.clearCookie(sessionCookieName, { path: "/" });
        return reply.send({ ok: true });
    });
    app.get("/api/auth/zhihu/start", async (_request, reply) => {
        if (!integrationStatus().zhihuOAuthConfigured) {
            return reply.code(412).send({
                error: "Zhihu OAuth is not configured.",
                callbackUrl: config.zhihu.redirectUri
            });
        }
        const state = randomToken(24);
        const browserToken = _request.cookies[oauthBrowserCookieName] ?? randomToken(24);
        createOAuthState(hashToken(state), hashToken(browserToken), Date.now() + config.oauthStateMinutes * 60 * 1000);
        reply.setCookie(oauthBrowserCookieName, browserToken, sessionCookieOptions(config.oauthStateMinutes * 60));
        const authorizeUrl = new URL(config.zhihu.authorizeUrl);
        authorizeUrl.searchParams.set("redirect_uri", config.zhihu.redirectUri);
        authorizeUrl.searchParams.set("app_id", config.zhihu.appId);
        authorizeUrl.searchParams.set("response_type", "code");
        authorizeUrl.searchParams.set("state", state);
        return reply.redirect(authorizeUrl.toString());
    });
    app.get("/api/auth/zhihu/callback", async (request, reply) => {
        try {
            if (request.query.error) {
                return redirectToApp(reply, "auth_error=authorization_denied");
            }
            const code = request.query.authorization_code ?? request.query.code;
            const state = request.query.state;
            if (!code)
                return redirectToApp(reply, "auth_error=missing_code");
            if (config.oauthRequireState) {
                const browserToken = request.cookies[oauthBrowserCookieName];
                if (!state || !browserToken) {
                    return redirectToApp(reply, "auth_error=missing_state");
                }
                const consumed = consumeOAuthState(hashToken(state), hashToken(browserToken));
                if (!consumed) {
                    return redirectToApp(reply, "auth_error=invalid_state");
                }
            }
            const token = await exchangeZhihuCode(code);
            const profile = await fetchZhihuUser(token.accessToken);
            const userId = `zhihu:${profile.id}`;
            const existing = getUser(userId);
            let personalization;
            try {
                personalization = await syncZhihuPersonalization(token.accessToken, profile);
            }
            catch {
                personalization =
                    existing?.personalization ?? {
                        enabled: true,
                        syncedAt: null,
                        interests: profile.headline ? [profile.headline] : [],
                        recentTitles: [],
                        followeeNames: [],
                        source: "profile-only"
                    };
            }
            const user = upsertZhihuUser({
                zhihuId: profile.id,
                nickname: profile.nickname,
                avatarUrl: profile.avatarUrl,
                headline: profile.headline,
                isDevelopment: false,
                accessToken: token.accessToken,
                tokenExpiresAt: Date.now() + token.expiresIn * 1000,
                personalization
            });
            if (!user)
                throw new Error("Could not create user session.");
            updatePersonalization(user.id, personalization);
            establishSession(reply, user.id);
            reply.clearCookie(oauthBrowserCookieName, { path: "/" });
            return redirectToApp(reply, "auth=success");
        }
        catch {
            return redirectToApp(reply, "auth_error=oauth_failed");
        }
    });
}
