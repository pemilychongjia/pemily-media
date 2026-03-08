# 使用多阶段构建
FROM node:20-alpine AS deps

# 安装必要工具
RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

# 安装 bun
RUN npm install -g bun

# 复制依赖文件
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# 安装依赖
RUN bun install --frozen-lockfile

# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 bun
RUN npm install -g bun

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN bunx prisma generate

# 构建 Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# 运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制数据库和配置
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/db ./db

# 复制必要的 node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/z-ai-web-dev-sdk ./node_modules/z-ai-web-dev-sdk
COPY --from=builder /app/node_modules/canvas ./node_modules/canvas

# 复制环境配置
COPY --from=builder /app/.env ./

# 设置权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
