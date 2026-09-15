import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const workspaceRoot = fileURLToPath(new URL("../../..", import.meta.url));
const rootEnvPath = join(workspaceRoot, ".env");

dotenv.config({ path: rootEnvPath, override: false });

function booleanValue(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function numberValue(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const databasePath = process.env.DATABASE_PATH ?? "./data/game.db";
const zhihuOAuthAppId = process.env.ZHIHU_OAUTH_APP_ID?.trim() ?? "";
const zhihuOAuthAppKey = process.env.ZHIHU_OAUTH_APP_KEY?.trim() ?? "";
const zhihuAccessSecret = process.env.ZHIHU_ACCESS_SECRET?.trim() ?? "";
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY?.trim() ?? "";
const nodeEnv = process.env.NODE_ENV?.trim() || "development";
const isProduction = nodeEnv === "production";
const adminToken = process.env.ADMIN_TOKEN?.trim() || "local-admin";
const allowDevAuth = booleanValue(process.env.ALLOW_DEV_AUTH, !isProduction);
const appOrigin =
  process.env.APP_ORIGIN?.trim() ||
  (isProduction ? "" : "http://localhost:5173");

if (isProduction && !appOrigin) {
  throw new Error("APP_ORIGIN is required when NODE_ENV=production.");
}

if (isProduction && adminToken === "local-admin") {
  throw new Error(
    "Set a strong ADMIN_TOKEN before starting the production server."
  );
}

if (isProduction && allowDevAuth) {
  throw new Error("ALLOW_DEV_AUTH must be false in production.");
}

export const config = {
  nodeEnv,
  isProduction,
  workspaceRoot,
  webDistPath: join(workspaceRoot, "apps", "web", "dist"),
  port: numberValue(process.env.API_PORT, 8787),
  host: process.env.HOST ?? "0.0.0.0",
  appOrigin,
  sessionCookieSecure: booleanValue(process.env.SESSION_COOKIE_SECURE, false),
  allowDevAuth,
  adminToken,
  databasePath: resolve(
    databasePath.startsWith("/") ? databasePath : workspaceRoot,
    databasePath.startsWith("/") ? "." : databasePath
  ),
  sessionDays: 7,
  oauthStateMinutes: 10,
  oauthRequireState: booleanValue(process.env.ZHIHU_REQUIRE_OAUTH_STATE, true),
  cronTimezone: "Asia/Shanghai",
  zhihu: {
    appId: zhihuOAuthAppId,
    appKey: zhihuOAuthAppKey,
    accessSecret: zhihuAccessSecret,
    redirectUri:
      process.env.ZHIHU_OAUTH_REDIRECT_URI?.trim() ||
      "http://localhost:8787/api/auth/zhihu/callback",
    authorizeUrl: "https://openapi.zhihu.com/authorize",
    tokenUrl: "https://openapi.zhihu.com/access_token",
    userUrl: "https://openapi.zhihu.com/user",
    hotListUrl: "https://developer.zhihu.com/api/v1/content/hot_list",
    userApiBase: "https://developer.zhihu.com/api/v1"
  },
  deepSeek: {
    baseUrl: process.env.DEEPSEEK_BASE_URL?.replace(/\/$/, "") ||
      "https://api.deepseek.com",
    apiKey: deepSeekApiKey,
    model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash"
  }
} as const;

export function hasWebBuild() {
  return existsSync(join(config.webDistPath, "index.html"));
}
