# syntax=docker/dockerfile:1
# Web image. Build context is the MONOREPO ROOT (set base directory to "." in Coolify).
# VITE_* values are baked at BUILD time — pass them as Coolify build args.

FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app

ARG VITE_API_URL=""
ARG VITE_DEMO_USERNAME=""
ARG VITE_DEMO_PASSWORD=""

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/web apps/web

# Vite reads env from the monorepo root (envDir: "../../"); write it from build args.
RUN printf 'VITE_API_URL=%s\nVITE_DEMO_USERNAME=%s\nVITE_DEMO_PASSWORD=%s\n' \
  "$VITE_API_URL" "$VITE_DEMO_USERNAME" "$VITE_DEMO_PASSWORD" > .env \
  && pnpm --filter @spaceship/shared build \
  && pnpm --filter @spaceship/web build

# ── runtime: static nginx ────────────────────────────────────────────────────
FROM nginx:alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
