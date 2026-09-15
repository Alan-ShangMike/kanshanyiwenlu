import type {
  BootstrapPayload,
  LiuGuideResponse,
  ProgressMutation,
  ProgressResult
} from "@kanshan/shared";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  if (!response.ok) {
    throw new ApiError(payload?.error || "请求失败。", response.status);
  }
  return payload as T;
}

export interface MeResponse {
  authenticated: boolean;
  allowDevAuth: boolean;
  integrations: {
    zhihuOAuthConfigured: boolean;
    zhihuOpenPlatformConfigured: boolean;
    deepSeekConfigured: boolean;
  };
  user?: BootstrapPayload["user"];
}

export interface AdminStatus {
  integrations: MeResponse["integrations"];
  schedule: {
    expression: string;
    timezone: string;
    description: string;
  };
  currentRift: BootstrapPayload["dailyRift"];
  runtime: {
    deepSeekBaseUrl: string;
    deepSeekModel: string;
    deepSeekKeyConfigured: boolean;
    zhihuAccessSecretConfigured: boolean;
  };
}

export const api = {
  me: () => request<MeResponse>("/api/auth/me"),
  devLogin: () =>
    request<{ user: BootstrapPayload["user"] }>("/api/auth/dev", {
      method: "POST"
    }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  bootstrap: () => request<BootstrapPayload>("/api/bootstrap"),
  progress: (mutation: ProgressMutation) =>
    request<ProgressResult>("/api/progress", {
      method: "POST",
      body: JSON.stringify(mutation)
    }),
  createNote: (position: { x: number; y: number; z: number }, text: string) =>
    request<BootstrapPayload["notes"][number]>("/api/notes", {
      method: "POST",
      body: JSON.stringify({ position, text })
    }),
  nameDiscovery: (hookId: string, name: string) =>
    request<{ ok: true; name: string; namedBy: string }>(
      `/api/discoveries/${encodeURIComponent(hookId)}/name`,
      { method: "POST", body: JSON.stringify({ name }) }
    ),
  guide: (message: string) =>
    request<LiuGuideResponse>("/api/guide", {
      method: "POST",
      body: JSON.stringify({ message })
    }),
  adminStatus: (token: string) =>
    request<AdminStatus>("/api/admin/status", {
      headers: { "X-Admin-Token": token }
    }),
  refreshDaily: (token: string) =>
    request<{
      rift: NonNullable<BootstrapPayload["dailyRift"]>;
      source: "zhihu" | "demo";
      warning: string | null;
    }>("/api/admin/daily/refresh", {
      method: "POST",
      headers: { "X-Admin-Token": token }
    }),
  updateSettings: (
    token: string,
    settings: {
      deepSeekBaseUrl?: string;
      deepSeekModel?: string;
    }
  ) =>
    request<{ ok: true; note: string }>("/api/admin/settings", {
      method: "PUT",
      headers: { "X-Admin-Token": token },
      body: JSON.stringify(settings)
    })
};
