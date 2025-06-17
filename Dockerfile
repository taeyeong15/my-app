# 마케팅 캠페인 관리 시스템 - Production Dockerfile
# =================================================
# 멀티 스테이지 빌드로 이미지 크기 최적화

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# TypeScript 컴파일 및 빌드
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# 보안을 위한 비루트 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 필요한 패키지 설치
RUN apk add --no-cache curl

# 빌드된 애플리케이션 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 로그 디렉토리 생성 및 권한 설정
RUN mkdir -p logs uploads
RUN chown -R nextjs:nodejs logs uploads

# 환경 설정
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME 0.0.0.0

# 사용자 전환
USER nextjs

# 포트 노출
EXPOSE 3000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 애플리케이션 시작
CMD ["node", "server.js"] 