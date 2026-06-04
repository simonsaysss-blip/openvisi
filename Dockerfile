# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy workspace manifests first (layer cache)
COPY package.json package-lock.json ./
COPY packages/core/package.json        ./packages/core/
COPY packages/crawler/package.json     ./packages/crawler/
COPY packages/evaluator/package.json   ./packages/evaluator/
COPY packages/benchmark/package.json   ./packages/benchmark/
COPY packages/report/package.json      ./packages/report/
COPY packages/analyzer/package.json    ./packages/analyzer/
COPY packages/providers/package.json   ./packages/providers/
COPY apps/cli/package.json             ./apps/cli/

RUN npm ci --ignore-scripts

# Copy source and build all workspaces
COPY . .
RUN npm run build

# ── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Only production files
COPY --from=builder /app/node_modules            ./node_modules
COPY --from=builder /app/packages/core/dist      ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /app/packages/crawler/dist   ./packages/crawler/dist
COPY --from=builder /app/packages/crawler/package.json ./packages/crawler/package.json
COPY --from=builder /app/packages/evaluator/dist ./packages/evaluator/dist
COPY --from=builder /app/packages/evaluator/package.json ./packages/evaluator/package.json
COPY --from=builder /app/packages/benchmark/dist ./packages/benchmark/dist
COPY --from=builder /app/packages/benchmark/package.json ./packages/benchmark/package.json
COPY --from=builder /app/packages/report/dist   ./packages/report/dist
COPY --from=builder /app/packages/report/package.json ./packages/report/package.json
COPY --from=builder /app/packages/analyzer/dist  ./packages/analyzer/dist
COPY --from=builder /app/packages/analyzer/package.json ./packages/analyzer/package.json
COPY --from=builder /app/packages/providers/dist ./packages/providers/dist
COPY --from=builder /app/packages/providers/package.json ./packages/providers/package.json
COPY --from=builder /app/apps/cli/dist           ./apps/cli/dist
COPY --from=builder /app/apps/cli/package.json   ./apps/cli/package.json
COPY --from=builder /app/package.json            ./package.json

# Cloud Run HTTP server
COPY infra/server.mjs ./infra/server.mjs

ENV PORT=8080
EXPOSE 8080

CMD ["node", "infra/server.mjs"]
