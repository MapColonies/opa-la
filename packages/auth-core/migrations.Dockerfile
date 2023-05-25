FROM node:18 as build

ARG package=auth-core

WORKDIR /tmp/buildApp

RUN --mount=type=bind,target=/docker-context \
    cd /docker-context/; \
    find . -name "package*.json" -mindepth 0 -maxdepth 3 -exec cp --parents "{}" /tmp/buildApp/ \;

RUN npm ci
COPY . .
RUN npx lerna run --include-dependencies --scope @map-colonies/${package} build
RUN node scripts/docker-build.mjs -n @map-colonies/${package} -d /tmp/buildRes

FROM node:18-alpine3.16 as production

ARG package=auth-core

WORKDIR /usr/src/app


COPY --chown=node:node --from=build /tmp/buildRes .

RUN npm i typeorm@0.3.12 config@3.3.9 pg@8.10.0
WORKDIR /usr/src/app/packages/${package}
COPY ./packages/${package}/dataSource.migrations.js .
COPY ./packages/${package}/config config/.

USER node
EXPOSE 8080
CMD ["node", "../../node_modules/typeorm/cli.js", "-d", "./dataSource.migrations.js", "migration:run"]