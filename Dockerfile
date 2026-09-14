# syntax=docker/dockerfile:1

# ---------- deps: full install (dev deps included so tsx can run the worker) ----------
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- builder: build Next.js + WSS server ----------
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_MIXPANEL_TOKEN
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG BUILD_ENCRYPTION_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_MIXPANEL_TOKEN=$NEXT_PUBLIC_MIXPANEL_TOKEN \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    DATABASE_URL=postgres://academy_user:placeholder@postgres:5432/academy_app \
    ENCRYPTION_KEY=$BUILD_ENCRYPTION_KEY \
    NODE_ENV=production

RUN pnpm prisma generate
RUN pnpm build

# ---------- runner ----------
FROM node:22-alpine AS runner
RUN corepack enable && apk add --no-cache tini
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Full source tree so tsx can transpile worker/whatsapp.ts (with @/ path aliases)
COPY . .

EXPOSE 3000 3001

ENTRYPOINT ["/sbin/tini", "--"]