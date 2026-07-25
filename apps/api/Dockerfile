# Build context MUST be the repo root (pnpm workspace + packages resolve there).
# In Coolify: Base Directory = /  ·  Dockerfile Location = /apps/api/Dockerfile

# ---- Build stage ------------------------------------------------------------
FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
# Prisma's query + migration engines need openssl.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# Workspace manifests first, for dependency-layer caching. All workspace members
# must be present for a frozen install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# Source, then build in dependency order (shared -> db generates Prisma client -> api).
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
RUN pnpm --filter @spaceship/shared build \
  && pnpm --filter @spaceship/db build \
  && pnpm --filter @spaceship/api build

# Strip dev dependencies to shrink the tree copied into the runtime image.
# The Prisma CLI + engines are prod deps (see packages/db), so `migrate deploy`
# still works at runtime.
RUN pnpm prune --prod

# ---- Runtime stage ----------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=build /app /app

COPY apps/api/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /app/apps/api
EXPOSE 3000
# DATABASE_URL, OPENAI_API_KEY, JWT_SECRET, APP_USERNAME, APP_PASSWORD, FE_ORIGIN
# are injected as environment variables by Coolify.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
