# syntax=docker/dockerfile:1.7

# ── 1. all dependencies (for building) ────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

# ── 2. compile TypeScript ─────────────────────────────────────────────
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ── 3. production dependencies only ───────────────────────────────────
# node:22-slim is glibc-based, which sharp's prebuilt binaries expect (do not switch to alpine).
FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts

# ── 4. runtime ────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
ENV NODE_ENV=production \
    HEALTH_FILE=/tmp/noxly-healthy
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node assets ./assets
COPY --chown=node:node config ./config
COPY --chown=node:node scripts/healthcheck.mjs ./healthcheck.mjs

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "healthcheck.mjs"]

CMD ["node", "dist/main.js"]
