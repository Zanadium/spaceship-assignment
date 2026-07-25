# syntax=docker/dockerfile:1
# API image. Build context is the MONOREPO ROOT (set base directory to "." in Coolify).

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
# Prisma's query engine needs openssl at build and runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ── build ────────────────────────────────────────────────────────────────────
FROM base AS build
# Manifests first for better install-layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

# Sources.
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api

# Build order: shared -> db (generates Prisma client) -> api.
RUN pnpm --filter @spaceship/shared build \
  && pnpm --filter @spaceship/db build \
  && pnpm --filter @spaceship/api build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3000
# DATABASE_URL, OPENAI_API_KEY, JWT_SECRET, APP_USERNAME, APP_PASSWORD, FE_ORIGIN
# are injected as environment variables by Coolify.
CMD ["node", "dist/main.js"]
