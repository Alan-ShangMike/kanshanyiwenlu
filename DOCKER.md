# 复制到服务器后用 Docker 启动

2 核 2G 的轻量服务器可以直接这样交：把项目拷上去，再 `docker compose up`。
默认开演示登录，评委不用配知乎账号也能进游戏。

## 1. 本机打包拷贝

不要把 `node_modules`、数据库和压缩包一并传上去。

```bash
cd "/Users/alan/Documents/ChatGPT/知乎黑客松开发"
rsync -avz --progress \
  --exclude node_modules \
  --exclude .git \
  --exclude .pnpm-store \
  --exclude dist \
  --exclude data \
  --exclude .DS_Store \
  --exclude '*.log' \
  --exclude apps/web/public/assets/art.zip \
  --exclude docs/art-pack \
  --exclude docs/art-pack.zip \
  ./ root@你的服务器IP:/opt/kanshan/
```

如果还没有装 `rsync`，也可以先打 tar 再上传：

```bash
tar --exclude node_modules --exclude .git --exclude .pnpm-store \
    --exclude dist --exclude data --exclude .DS_Store \
    --exclude apps/web/public/assets/art.zip \
    -czf kanshan-docker.tgz .
scp kanshan-docker.tgz root@你的服务器IP:/opt/
```

## 2. 服务器只做一次的准备

Debian / Ubuntu：

```bash
ssh root@你的服务器IP
apt update
apt install -y curl rsync ca-certificates

# 2G 内存务必加 swap，否则 docker compose build 很容易被杀掉
if ! swapon --show | grep -q swap; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

curl -fsSL https://get.docker.com | sh
docker --version
docker compose version
```

系统里如果开了 ufw，也放行 80：

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw enable
```

腾讯云轻量控制台「防火墙」默认已放行 `80`。没有域名就不要开 `443`，也先不要用 `8787`。

## 3. 配置并启动

```bash
mkdir -p /opt/kanshan
cd /opt/kanshan
# 若用的是 tar： tar -xzf /opt/kanshan-docker.tgz -C /opt/kanshan

cp .env.hackathon.example .env
nano .env
```

腾讯云轻量默认只放行 `22` 和 `80`，所以演示走 80，不要用 8787。

```dotenv
APP_PORT=80
APP_ORIGIN=http://你的服务器IP
```

然后构建并后台运行：

```bash
mkdir -p data
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

打开：

- 游戏：`http://你的服务器IP`
- 健康检查：`http://你的服务器IP/api/health`

第一次构建会把 3D 模型和前端打进镜像，2G 机器大概 8 到 15 分钟。
看到 `Kanshan Element Harbor API started` 就可以把链接交给评委。
登录页选「使用本机演示身份」。

## 4. 常用命令

```bash
cd /opt/kanshan
docker compose ps
docker compose logs -n 100 app
docker compose restart app
docker compose down
```

更新代码后再构建：

```bash
# 本机再 rsync 一次，然后在服务器：
cd /opt/kanshan
docker compose up -d --build
```

存档在服务器的 `./data/game.db`。

## 5. 以后有域名再上 HTTPS

```bash
cp .env.production.example .env
# 填写 DOMAIN、APP_ORIGIN、ADMIN_TOKEN、知乎和模型密钥
docker compose -f compose.prod.yaml up -d --build
```

那份配置会关闭演示登录，并由 Caddy 申请证书。黑客松演示不要用这个。
