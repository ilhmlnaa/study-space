# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1: deps
# Install all dependencies (including dev) for the build.
# ============================================================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Enable corepack so we can use the locked pnpm version
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 2: builder
# Generate Prisma client and build the Next.js app.
# ============================================================
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma client
RUN pnpm prisma generate

# Build with webpack (Excalidraw + Radix UI compatibility)
RUN pnpm build

# Prune dev dependencies for the runtime image
RUN pnpm prune --prod

# ============================================================
# Stage 3: runner
# Lean runtime image. Custom Socket.IO server is run via tsx.
# ============================================================
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy production node_modules (pruned) + Prisma engines
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy build output and public assets
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy server entry, app sources required at runtime, prisma schema, and config
COPY --from=builder --chown=nextjs:nodejs /app/server.ts ./server.ts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

# tsx is part of devDependencies; we install just what's needed at runtime.
# Using node + tsx loader keeps the custom server (Socket.IO) working.
CMD ["node", "--import", "tsx", "server.ts"]
