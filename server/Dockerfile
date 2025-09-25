# syntax=docker/dockerfile:1.7

# ---- base image ----
FROM node:20-alpine AS base
# work inside /app/server so relative paths are stable
WORKDIR /app/server
# prisma runtime needs openssl; libc6-compat avoids some musl issues
RUN apk add --no-cache openssl libc6-compat

# ---- deps (lockfile step) ----
# copy only package files to leverage caching
COPY server/package*.json ./
# IMPORTANT: don't run postinstall (which would call `prisma generate`)
# before schema exists; we’ll generate later
RUN npm ci --legacy-peer-deps --ignore-scripts

# ---- build ----
# now copy the rest of the source including prisma/
COPY server ./
# generate Prisma client now that schema is present
RUN npx prisma generate --schema=prisma/schema.prisma
# build your TypeScript
RUN npm run build

# ---- runtime ----
# We keep node_modules so that `npm run migrate` can find the prisma CLI
FROM node:20-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production

# bring in everything we need from build
# - built JS
# - node_modules (contains prisma CLI because we didn’t omit dev deps)
# - prisma folder (migrations/schema)
# - package files (for npm scripts)
COPY --from=base /app/server/node_modules ./node_modules
COPY --from=base /app/server/prisma       ./prisma
COPY --from=base /app/server/package*.json ./
COPY --from=base /app/server/dist         ./dist

EXPOSE 8080
# Keep your original behavior: run migrations on start, then start server
CMD ["sh","-lc","npm run migrate && npm run start"]
