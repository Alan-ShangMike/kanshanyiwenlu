import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ServerCog,
  X
} from "lucide-react";
import type { DailyRift } from "@kanshan/shared";
import { api, ApiError, type AdminStatus } from "../api";

interface AdminModalProps {
  onClose: () => void;
  onRiftUpdated: (rift: DailyRift) => void;
}

const tokenStorageKey = "kanshan-admin-token";

export function AdminModal({ onClose, onRiftUpdated }: AdminModalProps) {
  const [token, setToken] = useState(
    () => window.localStorage.getItem(tokenStorageKey) ?? "local-admin"
  );
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState<"status" | "refresh" | "save" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    if (!token.trim()) return;
    setBusy("status");
    setError(null);
    try {
      const next = await api.adminStatus(token.trim());
      setStatus(next);
      setBaseUrl(next.runtime.deepSeekBaseUrl);
      setModel(next.runtime.deepSeekModel);
      window.localStorage.setItem(tokenStorageKey, token.trim());
      setMessage("后台状态已刷新。");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "无法读取后台状态。");
    } finally {
      setBusy(null);
    }
  }

  async function refreshRift() {
    setBusy("refresh");
    setError(null);
    try {
      const result = await api.refreshDaily(token.trim());
      onRiftUpdated(result.rift);
      setMessage(result.warning ?? "今日裂隙已手动刷新。");
      setStatus((current) =>
        current ? { ...current, currentRift: result.rift } : current
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "刷新每日裂隙失败。");
    } finally {
      setBusy(null);
    }
  }

  async function saveSettings() {
    setBusy("save");
    setError(null);
    try {
      const result = await api.updateSettings(token.trim(), {
        deepSeekBaseUrl: baseUrl.trim() || undefined,
        deepSeekModel: model.trim() || undefined
      });
      setMessage(result.note);
      await loadStatus();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "保存后台设置失败。");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">本地演示控制台</span>
            <h2 id="admin-title">每日裂隙与集成</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>

        <div className="admin-body">
          <section className="admin-section">
            <div className="admin-section-heading">
              <KeyRound size={17} />
              <div>
                <h3>后台访问</h3>
                <p>令牌只保存在服务器判断，不会出现在页面状态接口中。</p>
              </div>
            </div>
            <div className="field-row">
              <label>
                管理令牌
                <input
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="ADMIN_TOKEN"
                />
              </label>
              <button
                className="secondary-button"
                disabled={busy !== null}
                onClick={() => void loadStatus()}
              >
                {busy === "status" ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <ServerCog size={15} />
                )}
                读取状态
              </button>
            </div>
          </section>

          <section className="admin-section">
            <div className="admin-section-heading">
              <CalendarClock size={17} />
              <div>
                <h3>每日地图</h3>
                <p>
                  {status
                    ? `${status.schedule.timezone} · ${status.schedule.description}`
                    : "读取状态后可查看定时任务与当天地图。"}
                </p>
              </div>
            </div>
            <div className="admin-status-grid">
              <div>
                <span>知乎登录</span>
                <strong>
                  {status?.integrations.zhihuOAuthConfigured ? "已配置" : "待配置"}
                </strong>
              </div>
              <div>
                <span>知乎开放接口</span>
                <strong>
                  {status?.integrations.zhihuOpenPlatformConfigured
                    ? "已配置"
                    : "待配置"}
                </strong>
              </div>
              <div>
                <span>DeepSeek</span>
                <strong>
                  {status?.integrations.deepSeekConfigured ? "已配置" : "待配置"}
                </strong>
              </div>
            </div>
            <button
              className="secondary-button wide"
              disabled={!status || busy !== null}
              onClick={() => void refreshRift()}
            >
              {busy === "refresh" ? (
                <LoaderCircle className="spin" size={15} />
              ) : (
                <RefreshCw size={15} />
              )}
              手动生成今日裂隙
            </button>
          </section>

          <section className="admin-section">
            <div className="admin-section-heading">
              <KeyRound size={17} />
              <div>
                <h3>运行时集成</h3>
                <p>密钥只由服务端环境变量配置，页面只能查看是否已接通，不能填写或改写。</p>
              </div>
            </div>
            <div className="admin-status-grid">
              <div>
                <span>DeepSeek Key</span>
                <strong>
                  {status?.runtime.deepSeekKeyConfigured ? "已配置" : "未配置"}
                </strong>
              </div>
              <div>
                <span>知乎 Access Secret</span>
                <strong>
                  {status?.runtime.zhihuAccessSecretConfigured ? "已配置" : "未配置"}
                </strong>
              </div>
            </div>
            <div className="field-grid">
              <label>
                OpenAI 兼容地址
                <input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="https://api.deepseek.com"
                />
              </label>
              <label>
                模型名
                <input
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="deepseek-v4-flash"
                />
              </label>
            </div>
            <button
              className="primary-button wide"
              disabled={!status || busy !== null}
              onClick={() => void saveSettings()}
            >
              {busy === "save" ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              保存服务端设置
            </button>
          </section>

          {message ? <p className="admin-message">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
