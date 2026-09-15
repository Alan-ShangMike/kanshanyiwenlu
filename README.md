# 看山异闻录

一个面向知乎黑客松的桌面端知识冒险游戏原型。玩家从元素港开始，在
2.5D 地图中自由探索，通过阅读知乎式知识卷宗、完成叙事解谜和区域机关，
获得可以继续改变世界的能力。刘看山负责引导，但不替玩家做选择。

当前版本已经包含可运行的主线 Demo：

- 知乎登录适配层与本机演示身份。
- 元素港地图、五个知识区域和一个隐藏区域。
- 知识卡阅读、五种解谜机关、技能与材料奖励。
- 成就、知识卷宗、角色资料与奖励反馈。
- 每日 `08:00 Asia/Shanghai` 自动生成的“回声裂隙”。
- 后台手动刷新每日地图，以及 DeepSeek、知乎密钥的运行时配置。
- DeepSeek 不可用时自动回退到本地刘看山引导和规则模板。

## 目录

```text
apps/api                 Fastify API、SQLite、认证、定时任务
apps/web                 React + Phaser 游戏客户端
packages/shared          地图、知识卡、技能、成就等共享定义
deploy/Caddyfile         生产环境 HTTPS 反向代理
docs/PRODUCT.md          完整产品与玩法方案
```

## 提交部署（复制到服务器 + Docker）

评委演示走这条。把项目拷到 2 核 2G 服务器后执行 `docker compose up`。
完整命令见 [DOCKER.md](DOCKER.md)。

```bash
# 本机
rsync -avz --progress \
  --exclude node_modules --exclude .git --exclude .pnpm-store \
  --exclude dist --exclude data --exclude .DS_Store \
  --exclude apps/web/public/assets/art.zip \
  ./ root@你的服务器IP:/opt/kanshan/

# 服务器
cd /opt/kanshan
cp .env.hackathon.example .env
# 把 APP_PORT=80，APP_ORIGIN=http://你的服务器IP
mkdir -p data
docker compose up -d --build
```

游戏地址：`http://你的服务器IP`。登录用「本机演示身份」。
腾讯云轻量默认只开 80，不要用 8787。

有域名再改用 `docker compose -f compose.prod.yaml up -d --build`。

## 本机开发

要求 Node.js 24 或更高版本，并使用 Corepack 启用仓库声明的 pnpm。

```bash
corepack enable
pnpm install
pnpm dev
```

开发地址：

- 游戏客户端：`http://localhost:5173`
- API：`http://127.0.0.1:8787`
- 健康检查：`http://127.0.0.1:8787/api/health`

默认本机管理令牌是 `local-admin`，只允许开发环境使用。进入游戏后选择
“使用本机演示身份”，右上角的设置按钮可以打开本地控制台。

生产构建：

```bash
pnpm typecheck
pnpm build
pnpm start
```

构建后的 API 会同时托管 `apps/web/dist`。

## 环境变量

以 `.env.example` 为开发模板，生产环境使用
`.env.production.example`。关键配置如下：

| 变量 | 作用 |
| --- | --- |
| `APP_ORIGIN` | 浏览器访问游戏的公开地址 |
| `ADMIN_TOKEN` | 管理后台令牌，生产环境禁止使用默认值 |
| `DATABASE_PATH` | SQLite 数据库路径 |
| `ALLOW_DEV_AUTH` | 是否允许本机演示登录；正式生产必须为 `false` |
| `HACKATHON_DEMO` | 黑客松演示模式，允许 Docker 里使用演示登录 |
| `SESSION_COOKIE_SECURE` | HTTPS 生产环境必须为 `true` |
| `ZHIHU_OAUTH_APP_ID` | 知乎 OAuth App ID |
| `ZHIHU_OAUTH_APP_KEY` | 知乎 OAuth App Key |
| `ZHIHU_OAUTH_REDIRECT_URI` | 知乎 OAuth 回调地址 |
| `ZHIHU_ACCESS_SECRET` | 知乎开放平台访问密钥 |
| `DEEPSEEK_BASE_URL` | OpenAI 兼容接口地址 |
| `DEEPSEEK_API_KEY` | 模型 API Key |
| `DEEPSEEK_MODEL` | 默认 `deepseek-v4-flash` |

生成生产管理令牌：

```bash
openssl rand -hex 32
```

## 接入知乎

真实接入需要向知乎开放平台申请 OAuth 与内容接口权限。仓库不会代替平台
审核，也不会模拟未授权的真实登录。

1. 在知乎开放平台创建应用，取得 App ID、App Key 和 Access Secret。
2. 将回调地址设置为
   `https://你的域名/api/auth/zhihu/callback`。
3. 在服务器 `.env` 中填写三个 OAuth 变量和
   `ZHIHU_OAUTH_REDIRECT_URI`。
4. 重启应用，登录页会出现“使用知乎账号进入”。
5. 登录后客户端会自动同步公开画像信号，并开启个性化。

当前适配器读取 `authorization_code` / `code`、`uid`、`fullname`、
`avatar_path` 和 `headline` 等常见字段。取得正式凭据后，需要以知乎当时
提供的开发文档为准核对授权地址、Token 地址、用户资料字段和热榜字段。
每日地图只保存摘要、关键观点、原文链接和作者信息，不复制完整回答。

热榜和个性化内容使用的是服务端密钥，不能放进浏览器环境变量。后台在
“本地管理台”里保存的密钥会写入服务器 SQLite，读取接口只返回是否已配置，
不会返回明文。

## 接入 DeepSeek

控制台和每日地图生成使用 OpenAI 兼容的
`POST /chat/completions` 协议。

```dotenv
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_MODEL=deepseek-v4-flash
```

也可以在游戏的本地管理台里覆盖地址、模型和密钥。模型只负责生成结构化
每日地图和不超过 100 字的刘看山引导；模型失败时不会阻断主线，系统会使用
本地模板。

## 购买和搭建海外 VPS

黑客松 Demo 建议先选香港、新加坡或日本节点，目标配置是 2 vCPU、2 GB
内存、40 GB SSD、Ubuntu 24.04 LTS。可选常见供应商包括 Vultr、
DigitalOcean、Hetzner、阿里云国际和腾讯云国际。中国大陆直连通常优先
香港或新加坡，但实际延迟需要购买前用供应商测试地址验证。

如果域名解析到中国大陆服务器，通常需要备案。香港或海外节点不需要大陆
ICP 备案。此处不依赖 Cloudflare，域名可以直接使用供应商或注册商的 DNS。

基本步骤：

1. 购买 VPS，系统选择 Ubuntu 24.04 LTS，并保存 SSH 密钥。
2. 在域名 DNS 添加 A 记录，例如 `game.example.com -> 服务器公网 IP`。
3. 云防火墙和系统防火墙只开放 SSH、80 和 443；不要向公网开放 8787。
4. 登录服务器并更新系统：

```bash
ssh root@服务器IP
apt update
apt upgrade -y
apt install -y git curl ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

5. 按 Docker 官方文档安装 Docker Engine 和 Compose 插件：

```bash
curl -fsSL https://get.docker.com | sh
docker --version
docker compose version
```

6. 上传或克隆项目，创建生产配置：

```bash
cd /opt
git clone 你的仓库地址 kanshan
cd kanshan
cp .env.production.example .env
openssl rand -hex 32
```

把生成值写入 `ADMIN_TOKEN`，然后填写域名、邮箱、知乎和 DeepSeek 凭据。
黑客松演示不要走这份配置，请看上面的「提交部署」。

7. 启动完整服务：

```bash
docker compose -f compose.prod.yaml up -d --build
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs -f app caddy
```

当 DNS 已生效且 80/443 已开放，Caddy 会自动申请和续期 HTTPS 证书。
更新代码时执行：

```bash
git pull
docker compose -f compose.prod.yaml up -d --build
```

SQLite 数据保存在宿主机 `./data`。备份时停止写入并复制数据库：

```bash
docker compose -f compose.prod.yaml stop app
cp data/game.db "data/game-$(date +%F).db"
docker compose -f compose.prod.yaml start app
```

生产环境启动时会拒绝默认管理令牌、空 `APP_ORIGIN` 和开启状态的本机
演示登录。API Key、OAuth Token 和 SQLite 文件都位于服务器，务必限制 SSH
权限并定期升级系统和镜像。

## 当前边界

- 真实知乎 OAuth、热榜和个性化同步必须等正式凭据后联调。
- 主线知识卡目前是经过压缩的演示内容，来源显示为待接入，不会伪造作者。
- 地图已有高低差与技能门槛，但尚未实现物理碰撞；门槛由交互和进度控制。
- 材料已经进入玩家状态，交易与制作还没有落地。
- 跳过、掌握认证和区域间钩子已写入产品方案，尚未全部进入当前 Demo。
- 移动端当前只显示桌面端提示，符合桌面端优先的交互决定。

更完整的玩法和后续路线见 [docs/PRODUCT.md](docs/PRODUCT.md)。
