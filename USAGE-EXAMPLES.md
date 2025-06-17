# 🚀 환경변수 암호화 및 환경 분리 사용 예시

## 📖 시나리오별 사용 가이드

### 1️⃣ 개발자 최초 설정 시나리오

```bash
# 1. 개발 환경 설정 파일 생성
npm run setup:dev

# 2. .env.development 파일 수정
# DB_PASSWORD=mydevpassword123
# JWT_SECRET=dev-jwt-secret-key

# 3. 개발 서버 시작 (평문 사용)
npm run dev

# 4. 보안 강화를 위해 암호화 적용
npm run encrypt:env
# 환경 선택: dev
# 마스터 시크릿: my-dev-master-secret

# 5. 암호화된 환경으로 개발 서버 재시작
npm run dev:encrypted
```

### 2️⃣ 운영 배포 시나리오

```bash
# 1. 운영 환경 설정 파일 생성
npm run setup:prod

# 2. .env.production 파일 수정
# DB_HOST=prod-db-server.com
# DB_PASSWORD=super-secure-prod-password
# JWT_SECRET=ultra-secure-jwt-key-for-production

# 3. 운영 환경변수 암호화
npm run encrypt:env
# 환경 선택: prod
# 마스터 시크릿: ultra-secure-master-secret-2024

# 4. 운영 빌드 및 배포
npm run build:prod
npm run start:prod
```

### 3️⃣ Docker 배포 시나리오

```bash
# 1. 운영 환경 암호화 완료 후
# 2. Docker 환경변수로 마스터 시크릿 전달
export MASTER_SECRET=ultra-secure-master-secret-2024

# 3. Docker 빌드 및 실행
npm run docker:build
npm run docker:prod
```

## 🔐 암호화 전후 비교

### 암호화 전 (.env.production)
```env
# 위험: 평문으로 민감 정보 노출
DB_PASSWORD=MySuper$ecureP@ssw0rd123
JWT_SECRET=my-ultra-secret-jwt-key-for-production-2024
SMTP_PASSWORD=email_service_password_123
```

### 암호화 후 (.env.production)
```env
# 안전: 암호화된 형태로 저장
DB_PASSWORD=ENC:a1b2c3d4e5f6789a:9f8e7d6c5b4a3210:4f2e1d0c9b8a7695e4d3c2b1a0f9e8d7c6b5a4930e2d1c0b9a8f7e6d5c4b3a291f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b493
JWT_SECRET=ENC:f9e8d7c6b5a43210:1a2b3c4d5e6f7890:e7d6c5b4a3291f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a392f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6c5b4a392f1e
SMTP_PASSWORD=ENC:3c2b1a0f9e8d7c6b:6f7e8d9c0a1b2e3f:5a4f3e2d1c0b9a8f7e6d5c4b3a291f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a392f1e0d9c8b7a6f5e4d3c2b1a0f9
```

## 🛠️ 개발 vs 운영 설정 차이

### 개발 환경 최적화
```javascript
// src/lib/database.ts에서 자동 적용
const getDbConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      connectionLimit: 5,        // 적은 연결 수
      timeout: 60000,           // 긴 타임아웃
      debug: true,              // 디버그 로그
      ssl: false                // SSL 비활성화
    };
  }
};
```

### 운영 환경 최적화
```javascript
// src/lib/database.ts에서 자동 적용
const getDbConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      connectionLimit: 20,       // 많은 연결 수
      timeout: 30000,           // 짧은 타임아웃
      debug: false,             // 디버그 비활성화
      ssl: { rejectUnauthorized: true }  // SSL 필수
    };
  }
};
```

## 📊 성능 및 보안 비교

| 항목 | 개발 환경 | 운영 환경 |
|------|-----------|-----------|
| DB 연결 수 | 5개 | 20개 |
| 로그 레벨 | debug | info |
| CORS 정책 | 느슨함 | 엄격함 |
| Rate Limiting | 비활성화 | 활성화 |
| SSL/TLS | 선택적 | 필수 |
| 세션 만료 | 24시간 | 1시간 |
| 암호화 | 선택적 | 필수 |

## 🔄 환경 전환 명령어 가이드

### 현재 환경 확인
```bash
# 환경변수 확인
echo $NODE_ENV

# 또는 Node.js로 확인
node -e "console.log('Current ENV:', process.env.NODE_ENV)"
```

### 개발 모드로 전환
```bash
# 환경 설정
set NODE_ENV=development

# 개발 서버 시작
npm run dev
# 또는
npm run start:dev
```

### 운영 모드로 전환
```bash
# 환경 설정
set NODE_ENV=production

# 운영 빌드 후 시작
npm run build:prod
npm run start:prod
```

## 🧪 암호화 테스트 예시

### 1단계: 암호화 스크립트 실행
```bash
C:\Users\MOON_TAEYOUNG\my-app> npm run encrypt:env

🔐 환경변수 암호화 도구
==================================================
환경을 선택하세요 (dev/prod): dev
마스터 시크릿을 입력하세요 (빈 값이면 기본값 사용): my-secret-key

🔄 환경변수 암호화 중...
✅ DB_PASSWORD 암호화 완료
✅ JWT_SECRET 암호화 완료
✅ SMTP_PASSWORD 암호화 완료
📁 원본 파일 백업: .env.development.backup.1703123456789

✨ 암호화 완료!
📊 총 3개의 환경변수가 암호화되었습니다.
📂 파일: .env.development

⚠️  중요: 마스터 시크릿을 안전한 곳에 보관하세요!
   서버 시작 시 MASTER_SECRET 환경변수가 필요합니다.
```

### 2단계: 서버 시작 확인
```bash
C:\Users\MOON_TAEYOUNG\my-app> npm run dev

> my-app@1.0.0 dev
> NODE_ENV=development next dev

✅ 환경변수 복호화 성공
🔓 DB_PASSWORD: ******* (복호화됨)
🔓 JWT_SECRET: ******* (복호화됨)
새 DB 연결 생성: 1
Ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## 🔍 문제 해결 실례

### 문제 1: 복호화 실패
```bash
❌ 오류: 환경변수 DB_PASSWORD 복호화 실패: 데이터 복호화에 실패했습니다

해결방법:
1. 마스터 시크릿 확인
   echo $MASTER_SECRET

2. 올바른 마스터 시크릿으로 재암호화
   npm run encrypt:env
```

### 문제 2: 환경 감지 오류
```bash
❌ 오류: 운영 환경인데 개발 DB에 연결 시도

해결방법:
1. NODE_ENV 확인
   echo $NODE_ENV

2. 올바른 명령어 사용
   npm run start:prod (운영용)
   npm run start:dev (개발용)
```

### 문제 3: 환경변수 파일 없음
```bash
❌ 오류: .env.production 파일을 찾을 수 없습니다.

해결방법:
1. 환경별 설정 파일 생성
   npm run setup:prod

2. 파일 수정 후 암호화
   npm run encrypt:env
```

## 📋 배포 체크리스트

### 개발 환경 체크리스트
- [ ] `npm run setup:dev` 실행
- [ ] `.env.development` 파일 수정 완료
- [ ] DB 접속 정보 정확성 확인
- [ ] `npm run dev` 정상 동작 확인
- [ ] 로그 레벨 debug 확인

### 운영 환경 체크리스트
- [ ] `npm run setup:prod` 실행
- [ ] `.env.production` 파일 수정 완료
- [ ] 운영 DB 접속 정보 입력
- [ ] `npm run encrypt:env` 암호화 완료
- [ ] 마스터 시크릿 안전 보관
- [ ] `npm run build:prod` 빌드 성공
- [ ] `npm run start:prod` 운영 서버 시작 확인
- [ ] SSL/TLS 설정 확인
- [ ] 보안 헤더 적용 확인
- [ ] Rate Limiting 동작 확인

## 🎯 권장 워크플로우

### 신규 개발자 온보딩
```bash
# 1. 저장소 클론
git clone [repository-url]
cd my-app

# 2. 의존성 설치
npm install

# 3. 개발 환경 설정
npm run setup:dev

# 4. 환경변수 설정 (개발팀에서 제공)
# .env.development 파일 수정

# 5. 개발 서버 시작
npm run dev
```

### 운영 배포 워크플로우
```bash
# 1. 코드 검증
npm run lint
npm test

# 2. 운영 환경 설정
npm run setup:prod
# .env.production 파일 수정

# 3. 보안 암호화
npm run encrypt:env

# 4. 운영 빌드
npm run build:prod

# 5. 배포 (Docker 권장)
npm run docker:prod

# 6. 헬스체크
curl https://your-domain.com/api/health
```

이제 환경변수 암호화와 개발/운영 환경 분리가 완전히 구현되었습니다! 🎉 