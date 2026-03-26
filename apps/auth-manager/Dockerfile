ARG NODE_VERSION=24.13.1

# Base image for all stages
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable


FROM base AS pruner
WORKDIR /app

RUN pnpm add -g turbo
COPY . .
RUN turbo prune auth-manager --docker


FROM base AS builder
WORKDIR /app/out/full

COPY --from=pruner /app/out/json/ .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

RUN pnpm turbo build

RUN pnpm --filter auth-manager deploy --prod --legacy /prod-app


FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add dumb-init

COPY --from=builder /prod-app /app

WORKDIR /app/dist

CMD ["dumb-init", "node", "--max_old_space_size=512", "--import", "./instrumentation.mjs", "./index.js"]
