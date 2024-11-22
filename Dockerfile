ARG NODE_VERSION=21.4.0

FROM node:${NODE_VERSION}-alpine

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

WORKDIR /usr/src/app

COPY . .

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm build:types

RUN chown node .
RUN chown -R node:node /usr/src/app/node_modules/.pnpm/*prisma*/

RUN chown -R node:node /usr/src/app/packages/types && \
    chmod -R 700 /usr/src/app/packages/types

RUN mkdir -p /usr/src/app/dist && \
    chown -R node:node /usr/src/app/dist && \
    chmod -R 700 /usr/src/app/dist


RUN chown -R node:node /usr/src/app/apps/front && \
    chmod -R 700 /usr/src/app/apps/front

RUN mkdir -p /usr/src/app/datas && \
    chown -R node:node /usr/src/app/datas && \
    chmod -R 700 /usr/src/app/datas

USER node

EXPOSE 3000

CMD pnpm prisma:push &&\
    pnpm build &&\
    pnpm run generate-keys && \
    node dist/api/index.js --host=0.0.0.0