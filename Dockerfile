ARG NODE_VERSION=21.4.0

FROM node:${NODE_VERSION}-alpine

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm

WORKDIR /usr/src/app

COPY dist/front dist/front
COPY dist/api/portable.js dist/api/portable.js
COPY dist/api/KeysGenerator.cjs dist/api/KeysGenerator.cjs
COPY prisma prisma

COPY package.json package.json
COPY apps/api/package.json dist/api/package.json

RUN echo $'packages:\n  - "dist/api/"' >> pnpm-workspace.yaml

RUN pnpm install

RUN chown node .
RUN chown -R node:node /usr/src/app/node_modules/.pnpm/*prisma*/

RUN mkdir -p /usr/src/app/dist && \
    chown -R node:node /usr/src/app/dist && \
    chmod -R 700 /usr/src/app/dist

RUN mkdir -p /usr/src/app/datas && \
    chown -R node:node /usr/src/app/datas && \
    chmod -R 700 /usr/src/app/datas

USER node

EXPOSE 3000

CMD sh -c "\
  [ -z \"\$FT_STANDALONE\" ] && pnpm prisma:push; \
  node dist/api/KeysGenerator.cjs && \
  node dist/api/portable.js \
    --host=\${FT_HOST:-0.0.0.0} \
    --port=\${FT_PORT:-3000} \
    \${FT_STANDALONE:+--standalone} \
"