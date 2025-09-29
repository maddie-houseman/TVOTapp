# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app/server
# prisma runtime needs openssl; libc6-compat avoids some musl issues
RUN apk add --no-cache openssl libc6-compat

# ----- deps: use only lockfiles to cache -----
# (Dockerfile is inside server/, so copy local package files)
COPY package*.json ./
# Don't run postinstall yet (prisma generate) until schema exists
RUN npm ci --legacy-peer-deps --ignore-scripts

# ----- app sources (now prisma/ is available) -----
COPY . .
# Generate Prisma client now that schema is present
RUN npx prisma generate --schema=prisma/schema.prisma
# Build TS → JS
RUN npm run build

# ----- runtime -----
FROM node:20-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production

# Keep node_modules so "npm run migrate" can use prisma CLI
COPY --from=base /app/server/node_modules ./node_modules
COPY --from=base /app/server/prisma       ./prisma
COPY --from=base /app/server/package*.json ./
COPY --from=base /app/server/dist         ./dist

EXPOSE 8080
CMD ["sh","-lc","npm run migrate && npm run start"]
