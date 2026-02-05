# VPS deployment: Node.js + SQLite
# Build: docker build -t app .
# Run:   docker run -p 3000:3000 -v ./data:/app/data app

FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Build the application
FROM base AS builder
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

ENV DB_PROVIDER=sqlite
ENV SQLITE_PATH=./data/app.db
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DB_PROVIDER=sqlite
ENV SQLITE_PATH=./data/app.db
ENV STORAGE_PROVIDER=local
ENV STORAGE_LOCAL_PATH=./data/uploads
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules

# Persistent data volume
VOLUME ["/app/data"]

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
