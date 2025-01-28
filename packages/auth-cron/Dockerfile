FROM node:20 as build

ARG package=auth-cron

WORKDIR /tmp/buildApp

RUN --mount=type=bind,target=/docker-context \
    cd /docker-context/; \
    find . -name "package*.json" -mindepth 0 -maxdepth 3 -exec cp --parents "{}" /tmp/buildApp/ \;

RUN npm ci
COPY . .
RUN npx lerna run --include-dependencies --scope ${package} build
RUN node scripts/docker-build.mjs -n ${package} -d /tmp/buildRes

FROM node:20.3.1-alpine3.17 as production

ARG package=auth-cron

RUN apk add dumb-init && \
    wget -O /usr/bin/opa https://openpolicyagent.org/downloads/v1.0.1/opa_linux_amd64_static && \
    chmod a+x /usr/bin/opa

ENV NODE_ENV=production
ENV SERVER_PORT=8080

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /tmp/buildRes .

RUN npm ci --omit=dev

WORKDIR /usr/src/app/packages/${package}

USER node
EXPOSE 8080
CMD ["dumb-init", "node", "--max_old_space_size=512", "--import", "./instrumentation.mjs", "./index.js"]
