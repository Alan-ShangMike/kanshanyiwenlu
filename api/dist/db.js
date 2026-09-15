import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createInitialPersonalization, createInitialPlayerState } from "@kanshan/shared";
import { config } from "./config.js";
mkdirSync(dirname(config.databasePath), { recursive: true });
export const db = new DatabaseSync(config.databasePath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    zhihu_id TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    headline TEXT,
    is_development INTEGER NOT NULL DEFAULT 0,
    access_token TEXT,
    token_expires_at INTEGER,
    personalization_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS oauth_states (
    state_hash TEXT PRIMARY KEY,
    browser_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at TEXT
  );

  CREATE TABLE IF NOT EXISTS player_states (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_rifts (
    id TEXT PRIMARY KEY,
    rift_date TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    generated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hot_snapshots (
    id TEXT PRIMARY KEY,
    captured_at TEXT NOT NULL,
    source TEXT NOT NULL,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS knowledge_notes (
    id TEXT PRIMARY KEY,
    author_name TEXT NOT NULL,
    position_json TEXT NOT NULL,
    text TEXT NOT NULL,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS discovery_records (
    hook_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    name TEXT,
    discoverer_name TEXT,
    named_at TEXT
  );
`);
function mapUser(row) {
    return {
        id: row.id,
        zhihuId: row.zhihu_id,
        nickname: row.nickname,
        avatarUrl: row.avatar_url,
        headline: row.headline,
        isDevelopment: Boolean(row.is_development),
        accessToken: row.access_token,
        tokenExpiresAt: row.token_expires_at,
        personalization: JSON.parse(row.personalization_json)
    };
}
export function upsertZhihuUser(input) {
    const now = new Date().toISOString();
    const id = `zhihu:${input.zhihuId}`;
    const personalization = input.personalization ??
        createInitialPersonalization(id, input.isDevelopment);
    db.prepare(`
    INSERT INTO users (
      id, zhihu_id, nickname, avatar_url, headline, is_development,
      access_token, token_expires_at, personalization_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      nickname = excluded.nickname,
      avatar_url = excluded.avatar_url,
      headline = excluded.headline,
      access_token = excluded.access_token,
      token_expires_at = excluded.token_expires_at,
      personalization_json = excluded.personalization_json,
      updated_at = excluded.updated_at
  `).run(id, input.zhihuId, input.nickname, input.avatarUrl, input.headline, input.isDevelopment ? 1 : 0, input.accessToken, input.tokenExpiresAt, JSON.stringify(personalization), now, now);
    const player = getPlayerState(id);
    if (!player) {
        savePlayerState(createInitialPlayerState(id, input.nickname));
    }
    return getUser(id);
}
export function getUser(userId) {
    const row = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(userId);
    return row ? mapUser(row) : null;
}
export function updatePersonalization(userId, personalization) {
    db.prepare("UPDATE users SET personalization_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(personalization), new Date().toISOString(), userId);
    return getUser(userId);
}
export function createSession(userId, tokenHash, expiresAt) {
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(tokenHash, userId, expiresAt, new Date().toISOString());
}
export function getSessionUser(tokenHash) {
    const row = db
        .prepare(`
      SELECT users.*
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `)
        .get(tokenHash, Date.now());
    return row ? mapUser(row) : null;
}
export function deleteSession(tokenHash) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}
export function createOAuthState(stateHash, browserHash, expiresAt) {
    db.prepare("INSERT INTO oauth_states (state_hash, browser_hash, expires_at) VALUES (?, ?, ?)").run(stateHash, browserHash, expiresAt);
}
export function consumeOAuthState(stateHash, browserHash) {
    const row = db
        .prepare(`
      SELECT state_hash, browser_hash, expires_at, used_at
      FROM oauth_states
      WHERE state_hash = ?
    `)
        .get(stateHash);
    if (!row || row.used_at || row.expires_at <= Date.now())
        return false;
    if (row.browser_hash !== browserHash)
        return false;
    const result = db
        .prepare(`
      UPDATE oauth_states
      SET used_at = ?
      WHERE state_hash = ? AND used_at IS NULL
    `)
        .run(new Date().toISOString(), stateHash);
    return result.changes === 1;
}
export function getPlayerState(userId) {
    const row = db
        .prepare("SELECT state_json FROM player_states WHERE user_id = ?")
        .get(userId);
    if (!row)
        return null;
    const player = JSON.parse(row.state_json);
    return {
        ...player,
        discoveredWorldHookIds: player.discoveredWorldHookIds ?? [],
        dailyRiftCompletedIds: player.dailyRiftCompletedIds ?? [],
        collectibleIds: player.collectibleIds ?? [],
        titleIds: player.titleIds ?? [],
        skinIds: player.skinIds ?? [],
        materials: player.materials ?? {},
        achievementProgress: player.achievementProgress ?? {},
        craftedTechniqueIds: player.craftedTechniqueIds ?? [],
        solvedMicroPuzzleIds: player.solvedMicroPuzzleIds ?? [],
        inspectedClueIds: player.inspectedClueIds ?? []
    };
}
export function savePlayerState(player) {
    db.prepare(`
    INSERT INTO player_states (user_id, state_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      state_json = excluded.state_json,
      updated_at = excluded.updated_at
  `).run(player.userId, JSON.stringify(player), new Date().toISOString());
}
export function saveDailyRift(rift) {
    const date = rift.id.replace(/^rift-/, "");
    db.prepare(`
    INSERT INTO daily_rifts (id, rift_date, status, payload_json, generated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(rift_date) DO UPDATE SET
      id = excluded.id,
      status = excluded.status,
      payload_json = excluded.payload_json,
      generated_at = excluded.generated_at
  `).run(rift.id, date, rift.status, JSON.stringify(rift), rift.generatedAt);
}
export function getDailyRift(date) {
    const row = db
        .prepare("SELECT payload_json FROM daily_rifts WHERE rift_date = ?")
        .get(date);
    return row ? JSON.parse(row.payload_json) : null;
}
export function saveHotSnapshot(source, payload) {
    db.prepare("INSERT INTO hot_snapshots (id, captured_at, source, payload_json) VALUES (?, ?, ?, ?)").run(`hot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, new Date().toISOString(), source, JSON.stringify(payload));
}
export function getSetting(key) {
    const row = db
        .prepare("SELECT value FROM settings WHERE key = ?")
        .get(key);
    return row?.value ?? null;
}
export function setSetting(key, value) {
    db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, value, new Date().toISOString());
}
export function listKnowledgeNotes() {
    const rows = db.prepare("SELECT * FROM knowledge_notes ORDER BY created_at DESC LIMIT 100").all();
    return rows.map((row) => ({
        id: row.id,
        authorName: row.author_name,
        position: JSON.parse(row.position_json),
        text: row.text,
        helpfulCount: row.helpful_count,
        createdAt: row.created_at
    }));
}
export function createKnowledgeNote(input) {
    const note = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        authorName: input.authorName,
        position: input.position,
        text: input.text,
        helpfulCount: 0,
        createdAt: new Date().toISOString()
    };
    db.prepare(`
    INSERT INTO knowledge_notes (id, author_name, position_json, text, helpful_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(note.id, note.authorName, JSON.stringify(note.position), note.text, 0, note.createdAt);
    return note;
}
export function listDiscoveryRecords() {
    return db.prepare("SELECT * FROM discovery_records ORDER BY named_at DESC").all().map((row) => ({
        hookId: row.hook_id,
        title: row.title,
        name: row.name,
        discovererName: row.discoverer_name,
        namedAt: row.named_at
    }));
}
export function ensureDiscoveryRecord(hookId, title, discovererName) {
    db.prepare(`
    INSERT INTO discovery_records (hook_id, title, name, discoverer_name, named_at)
    VALUES (?, ?, NULL, ?, NULL)
    ON CONFLICT(hook_id) DO NOTHING
  `).run(hookId, title, discovererName);
}
export function nameDiscovery(hookId, name) {
    const result = db.prepare(`
    UPDATE discovery_records
    SET name = ?, named_at = ?
    WHERE hook_id = ? AND name IS NULL
  `).run(name, new Date().toISOString(), hookId);
    return result.changes === 1;
}
export function getUserPublicProfile(user) {
    return {
        id: user.zhihuId,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
        isDevelopment: user.isDevelopment
    };
}
