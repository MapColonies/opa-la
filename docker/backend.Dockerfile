ARG NODE_VERSION=24.13.1

# Base image for all stages
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable


FROM base AS pruner
WORKDIR /app
ARG APP_NAME

RUN pnpm add -g turbo
COPY . .
RUN turbo prune ${APP_NAME} --docker


FROM base AS builder
WORKDIR /app
ARG APP_NAME

COPY --from=pruner /app/out/json/ .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

RUN pnpm turbo build --filter ${APP_NAME}...

RUN pnpm --filter ${APP_NAME} deploy --prod --legacy /prod-app


FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add dumb-init && \
    wget -O /usr/bin/opa https://openpolicyagent.org/downloads/v1.0.1/opa_linux_amd64_static && \
    chmod a+x /usr/bin/opa

ENV NODE_ENV=production

COPY --from=builder /prod-app /app

WORKDIR /app/dist

CMD ["dumb-init", "node", "--max_old_space_size=512", "--import", "./instrumentation.mjs", "./index.js"]
