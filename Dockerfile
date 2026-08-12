# Build the Vue app once, then let Express serve its immutable output alongside
# the API. One image means frontend and backend can never drift between deploys.
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client ./
RUN npm run build

FROM node:22-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS production
ENV NODE_ENV=production \
    PORT=3000 \
    TOKENS_FILE=/app/data/tokens.json
WORKDIR /app
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server ./server
COPY --from=client-build /app/client/dist ./public
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server/src/index.js"]
