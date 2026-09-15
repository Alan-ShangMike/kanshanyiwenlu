# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS build

ARG PNPM_VERSION=11.19.0
ENV PNPM_HOME=/usr/local/share/pnpm \
    PATH="/usr/local/share/pnpm:$PATH" \
    NODE_OPTIONS=--max-old-space-size=1536 \
    CI=1

RUN npm install --global "pnpm@${PNPM_VERSION}"

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build \
 && rm -rf apps/web/src apps/web/public apps/api/src packages/shared/src

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    API_PORT=8787 \
    DATABASE_PATH=/app/data/game.db

WORKDIR /app

COPY --from=build --chown=node:node /app /app

RUN mkdir -p /app/data \
 && chown -R node:node /app/data \
 && rm -rf /tmp/*

USER node

EXPOSE 8787
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/server.js"]
