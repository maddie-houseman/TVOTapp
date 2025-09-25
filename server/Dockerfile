# syntax=docker/dockerfile:1.7

# ---- base image ----
FROM node:20-alpine AS base
WORKDIR /app
# prisma runtime needs openssl; libc6-compat avoids some musl issues
RUN apk add --no-cache openssl libc6-compat

# ---- deps (lockfile install for better cache) ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ---- build (copy source and build) ----
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client and build TypeScript → dist/
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production

# keep node_modules so `npm run migrate` has prisma CLI available
COPY --from=build /app/node_modules ./node_modules
# compiled JS
COPY --from=build /app/dist ./dist
# prisma folder (migrations/schema)
COPY --from=build /app/prisma ./prisma
# package files for npm scripts
COPY package*.json ./

# expose your API port
EXPOSE 8080

# keep original behavior: run migrations, then start server
# expects you have "migrate" and "start" scripts in server/package.json
CMD ["sh", "-lc", "npm run migrate && npm run start"]
