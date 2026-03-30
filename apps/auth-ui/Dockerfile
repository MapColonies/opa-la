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

ARG APP_NAME

ENV NODE_ENV=production
ENV SERVER_PORT=3000

WORKDIR /app

COPY --chown=node:node --from=builder /prod-app/dist .

RUN npm i -g serve

USER node
EXPOSE 3000
CMD [ "serve", "-s", "." ]
