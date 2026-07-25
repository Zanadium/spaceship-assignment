# Build context MUST be the repo root (pnpm workspace + packages resolve there).
# In Coolify: Base Directory = /  ·  Dockerfile Location = /apps/web/Dockerfile
#
# IMPORTANT: VITE_* values are baked into the static bundle at BUILD time — they
# are NOT runtime env vars. Pass them as Coolify build arguments, e.g.
#   VITE_API_URL       = https://api.your-domain.com/api   (include the /api suffix)
#   VITE_DEMO_USERNAME = reviewer
#   VITE_DEMO_PASSWORD = <demo password>

# ---- Build stage ------------------------------------------------------------
FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

ARG VITE_API_URL=""
ARG VITE_DEMO_USERNAME=""
ARG VITE_DEMO_PASSWORD=""

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# The web app only needs @spaceship/web and @spaceship/shared.
RUN pnpm install --frozen-lockfile --filter @spaceship/web...

COPY packages/shared packages/shared
COPY apps/web apps/web

# Vite reads env from the monorepo root (envDir: "../../"); write it from build args.
RUN printf 'VITE_API_URL=%s\nVITE_DEMO_USERNAME=%s\nVITE_DEMO_PASSWORD=%s\n' \
  "$VITE_API_URL" "$VITE_DEMO_USERNAME" "$VITE_DEMO_PASSWORD" > .env \
  && pnpm --filter @spaceship/shared build \
  && pnpm --filter @spaceship/web build

# ---- Runtime stage: static files via nginx ----------------------------------
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
