FROM node:20.19.1-slim as build

ARG package=auth-ui

WORKDIR /tmp/buildApp

RUN --mount=type=bind,target=/docker-context \
    cd /docker-context/; \
    find . -name "package*.json" -mindepth 0 -maxdepth 3 -exec cp --parents "{}" /tmp/buildApp/ \;

RUN npm install
COPY . .
RUN npx lerna run --include-dependencies --scope ${package} build
RUN node scripts/docker-build.mjs -n ${package} -d /tmp/buildRes

FROM node:20.19.1-alpine3.21 as production

ARG package=auth-ui

ENV NODE_ENV=production
ENV SERVER_PORT=3000

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /tmp/buildRes .

RUN npm i -g serve

WORKDIR /usr/src/app/packages/${package}

USER node
EXPOSE 3000
CMD [ "serve", "-s", "." ]
