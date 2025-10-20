
FROM node:20-alpine AS build
WORKDIR /app/server

RUN apk add --no-cache openssl libc6-compat


COPY package*.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts


COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src


RUN npx prisma generate --schema=prisma/schema.prisma


RUN npm run build


FROM node:20-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production


COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/server/prisma ./prisma
COPY --from=build /app/server/package*.json ./
COPY --from=build /app/server/dist ./dist


EXPOSE $PORT


CMD sh -lc "npx prisma migrate deploy || npx prisma db push; node prisma/seed.js || true; node dist/index.js || node dist/src/index.js"
