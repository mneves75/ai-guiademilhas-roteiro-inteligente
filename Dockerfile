# VPS deployment: Node.js + SQLite
# Build: docker build -t app .
# Run:   docker run -p 3000:3000 -v ./data:/app/data app

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
RUN pnpm install --frozen-lockfile

# Build the application (requires next.config.ts: output = 'standalone')
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

ENV DB_PROVIDER=sqlite
ENV SQLITE_PATH=./data/app.db
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DB_PROVIDER=sqlite
ENV SQLITE_PATH=./data/app.db
ENV STORAGE_PROVIDER=local
ENV STORAGE_LOCAL_PATH=./data/uploads
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

# Persistent data volume
VOLUME ["/app/data"]

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
