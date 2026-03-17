# syntax=docker/dockerfile:1
# Build context: repo root
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json* .npmrc* ./
COPY apps/ ./apps/
COPY packages/ ./packages/

RUN bun install

FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app .

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

WORKDIR /app/apps/web
RUN bun run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
