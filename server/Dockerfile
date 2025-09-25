# syntax=docker/dockerfile:1.7

# ---- base image ----
# Use Node 20 on Alpine (matches your earlier intent and satisfies Vite/Router engines if you use this pattern elsewhere)
FROM node:20-alpine AS base
WORKDIR /app/server

# prisma runtime needs openssl; libc6-compat avoids some musl issues
RUN apk add --no-cache openssl libc6-compat

# ---- deps + build (keeps dev deps so prisma CLI is available later for migrations) ----
FROM base AS build

# Install only from lockfiles first for better layer caching
COPY server/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy the rest of the server source and build
COPY server ./

# Generate Prisma client and build TypeScript to dist/
RUN npx prisma generate && npm run build

# ---- runtime ----
# We keep node_modules from build so that `npm run migrate` has the prisma CLI available.
# (This matches your original "migrate on start" behaviour.)
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/server

# Copy runtime assets
# - node_modules (includes dev deps so prisma CLI works for migrate)
# - compiled JS
# - prisma folder (migrations/schema)
# - package.json files (for npm scripts)
COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/prisma ./prisma
COPY server/package*.json ./

# Expose your API port
EXPOSE 8080

# Keep your original behaviour: run migrations, then start the server
# (expects you have "migrate" and "start" scripts in server/package.json)
CMD ["sh", "-lc", "npm run migrate && npm run start"]
