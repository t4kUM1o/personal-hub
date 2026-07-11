# ---- deps: 依存関係のインストールのみ (レイヤーキャッシュを効かせる) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- builder: Prisma Client生成 + Next.jsビルド ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runner: 本番実行用の最小イメージ ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 非rootユーザーで実行 (セキュリティ要件)
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# アップロード画像の保存先。Docker Volumeでマウントされるため、
# 非rootユーザー(nextjs)が書き込めるよう先に権限を用意しておく
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
