FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --legacy-peer-deps --ignore-scripts
COPY server ./server
RUN cd server && npx prisma generate && npm run build
EXPOSE 8080
CMD ["sh","-lc","cd server && npm run migrate && npm run start"]
# ---- build server ----
FROM node:20-alpine AS server-build
WORKDIR /app

# only copy server deps first for better caching
COPY server/package*.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# copy the rest and build
COPY server .
RUN npx prisma generate
RUN npm run build

# ---- runtime (if you need a smaller final image) ----
FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=server-build /app ./
# if you only need the built output, copy just /app/dist and node_modules as needed
CMD ["node", "dist/index.js"]
