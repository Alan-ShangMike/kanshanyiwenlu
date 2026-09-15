import {
  ArrowRight,
  BookOpenCheck,
  FlaskConical,
  LoaderCircle,
  ShieldCheck
} from "lucide-react";

interface LoginScreenProps {
  allowDevAuth: boolean;
  zhihuOAuthConfigured: boolean;
  busy: boolean;
  error: string | null;
  onDevLogin: () => void;
}

export function LoginScreen({
  allowDevAuth,
  zhihuOAuthConfigured,
  busy,
  error,
  onDevLogin
}: LoginScreenProps) {
  return (
    <main className="login-screen">
      <div className="login-map-grid" aria-hidden="true" />
      <section className="login-copy">
        <div className="brand-lockup">
          <span className="brand-mark">
            <FlaskConical size={22} />
          </span>
          <span>看山异闻录</span>
        </div>
        <span className="eyebrow">知乎知识冒险 · 周期庭院序章</span>
        <h1>
          城市正在，
          <br />
          按化学规律醒过来。
        </h1>
        <p className="login-lead">
          和刘看山一起进入一座按照元素规律生长的周期庭院。先观察、再学习，最后把
          质子数、周期表和电子层变成真正能改变路线的能力。
        </p>

        <div className="login-points">
          <div>
            <BookOpenCheck size={18} />
            <span>固定主线由知识问答与叙事解谜构成</span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>登录后自动接入个性化内容与每日临时裂隙</span>
          </div>
        </div>

        <div className="login-actions">
          {zhihuOAuthConfigured ? (
            <a className="primary-button large" href="/api/auth/zhihu/start">
              使用知乎账号进入
              <ArrowRight size={17} />
            </a>
          ) : (
            <button className="primary-button large" disabled>
              知乎登录等待配置
              <ArrowRight size={17} />
            </button>
          )}

          {allowDevAuth ? (
            <button
              className="secondary-button large"
              disabled={busy}
              onClick={onDevLogin}
            >
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <FlaskConical size={17} />
              )}
              使用本机演示身份
            </button>
          ) : null}
        </div>

        <p className="login-note">
          {zhihuOAuthConfigured
            ? "登录成功后会同步你的公开兴趣信号，个性化内容默认开启。"
            : "真实知乎凭据尚未注入。当前仅启用本机演示身份，不冒充真实知乎登录。"}
        </p>
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <aside className="login-character" aria-label="刘看山">
        <div className="character-orbit orbit-one" />
        <div className="character-orbit orbit-two" />
        <div className="character-caption">
          <span>引路人</span>
          <strong>刘看山</strong>
          <small>“先看，再想，最后才动手。”</small>
        </div>
        <img src="/assets/liu-kanshan/greet.gif" alt="刘看山在海港入口打招呼" />
      </aside>
    </main>
  );
}
