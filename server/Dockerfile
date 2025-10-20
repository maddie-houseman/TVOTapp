# ---------- build stage ----------
FROM node:18-alpine AS build
WORKDIR /app/server

# Prisma on Alpine needs openssl; libc6-compat avoids some musl issues
RUN apk add --no-cache openssl libc6-compat

# Install deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy sources
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client before building TS (types available at build time)
RUN npx prisma generate --schema=prisma/schema.prisma

# Build TS -> JS (to ./dist or ./dist/src depending on tsconfig)
RUN npm run build

# ---------- runtime stage ----------
FROM node:18-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production

# Copy only what we need at runtime
COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/server/prisma ./prisma
COPY --from=build /app/server/package*.json ./
COPY --from=build /app/server/dist ./dist

# Railway sets $PORT; Express should listen on it
EXPOSE $PORT

# Run migrations (or db push) then (optionally) seed, then start the API.
# The "node dist/index.js || node dist/src/index.js" part is robust to either output layout.
CMD sh -lc "npx prisma migrate deploy || npx prisma db push; node prisma/seed.js || true; node dist/index.js || node dist/src/index.js"
