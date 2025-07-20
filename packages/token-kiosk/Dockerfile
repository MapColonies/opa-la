FROM node:22.17.1-slim AS build

ARG package=token-kiosk

WORKDIR /tmp/buildApp

RUN --mount=type=bind,target=/docker-context \
  cd /docker-context/; \
  find . -name "package*.json" -mindepth 0 -maxdepth 3 -exec cp --parents "{}" /tmp/buildApp/ \;

RUN npm ci
COPY . .
RUN npx lerna run --include-dependencies --scope ${package} build
RUN node scripts/docker-build.mjs -n ${package} -d /tmp/buildRes

FROM node:22.17.1-slim AS build-ui

ARG package=kiosk-ui

WORKDIR /tmp/buildApp

RUN --mount=type=bind,target=/docker-context \
  cd /docker-context/; \
  find . -name "package*.json" -mindepth 0 -maxdepth 3 -exec cp --parents "{}" /tmp/buildApp/ \;

RUN npm ci
COPY . .
RUN npx lerna run --include-dependencies --scope ${package} build

FROM node:22.17.1-alpine3.22 AS production

ARG package=token-kiosk

RUN apk add dumb-init

ENV NODE_ENV=production
ENV SERVER_PORT=8080


WORKDIR /usr/src/app

COPY --chown=node:node --from=build /tmp/buildRes .

RUN npm ci --omit=dev --ignore-scripts

WORKDIR /usr/src/app/packages/${package}
COPY --chown=node:node --from=build-ui /tmp/buildApp/packages/kiosk-ui/dist ./public

USER node
EXPOSE 8080
CMD ["dumb-init", "node", "--max_old_space_size=512", "--import", "./instrumentation.mjs", "./index.js"]
