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

ENV NODE_ENV=production

WORKDIR /app/apps/server
RUN bun run openapi:gen && bunx tsc -p tsconfig.build.json

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express

COPY --from=builder --chown=express:nodejs /app/apps/server/dist ./apps/server/dist

COPY --from=builder --chown=express:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=express:nodejs /app/apps/server/node_modules ./apps/server/node_modules

USER express

EXPOSE 4000

WORKDIR /app/apps/server
CMD ["node", "dist/server.js"]
