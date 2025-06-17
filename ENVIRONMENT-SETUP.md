# 🏗️ 환경별 설정 가이드

## 📋 개요

이 가이드는 개발 환경과 운영 환경을 분리하여 설정하는 방법을 설명합니다.

## 🔐 환경변수 암호화 시스템

### 특징
- **AES-256-GCM** 암호화 알고리즘 사용
- **마스터 시크릿** 기반 키 생성
- **ENC:** 접두사로 암호화된 값 식별
- **자동 복호화** 런타임 시 수행

### 보안 이점
- DB 패스워드, JWT 시크릿 등 민감 정보 보호
- 소스코드 저장소에 평문 저장 방지
- 환경별 다른 마스터 키 사용 가능

## 🛠️ 환경 설정 방법

### 1단계: 개발 환경 설정

```bash
# 개발 환경 설정 파일 생성
npm run setup:dev

# .env.development 파일 편집
# - DB 접속 정보 입력
# - JWT 시크릿 설정
# - SMTP 정보 설정

# 개발 서버 시작
npm run dev
```

### 2단계: 운영 환경 설정

```bash
# 운영 환경 설정 파일 생성
npm run setup:prod

# .env.production 파일 편집
# - 운영 DB 정보 입력
# - 보안 설정 강화
# - SSL/TLS 설정

# 환경변수 암호화
npm run encrypt:env

# 운영 빌드 및 시작
npm run build:prod
npm run start:prod
```

## 📁 환경별 파일 구조

```
my-app/
├── env.development.template    # 개발 환경 템플릿
├── env.production.template     # 운영 환경 템플릿
├── .env.development           # 개발 환경 설정 (gitignore)
├── .env.production            # 운영 환경 설정 (gitignore)
└── scripts/
    └── encrypt-env.js         # 암호화 스크립트
```

## 🔧 환경별 설정 차이점

### 개발 환경 (Development)
- **목적**: 로컬 개발 및 테스트
- **보안**: 중간 수준
- **성능**: 개발 편의성 우선
- **로깅**: 상세한 디버그 정보

```env
NODE_ENV=development
DB_CONNECTION_LIMIT=5
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_ENABLED=false
```

### 운영 환경 (Production)
- **목적**: 실제 서비스 운영
- **보안**: 최고 수준
- **성능**: 최적화 우선
- **로깅**: 필수 정보만

```env
NODE_ENV=production
DB_CONNECTION_LIMIT=20
LOG_LEVEL=info
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_ENABLED=true
```

## 🔐 환경변수 암호화 사용법

### 암호화 대상 키
- `DB_PASSWORD`
- `JWT_SECRET`
- `SMTP_PASSWORD`
- `REDIS_PASSWORD`
- `API_SECRET_KEY`

### 암호화 스크립트 실행

```bash
# 대화형 암호화 도구 실행
npm run encrypt:env

# 환경 선택 (dev/prod)
# 마스터 시크릿 입력
# 자동 백업 생성
# 암호화 완료
```

### 암호화 결과 예시

```env
# 암호화 전
DB_PASSWORD=mypassword123

# 암호화 후
DB_PASSWORD=ENC:a1b2c3d4e5f6:9876543210abcdef:encrypted_data_here
```

## 🚀 서버 시작 명령어

### 개발 서버
```bash
# 일반 개발 모드
npm run dev

# 암호화된 환경변수 사용
npm run dev:encrypted

# 개발 빌드 후 시작
npm run build:dev
npm run start:dev
```

### 운영 서버
```bash
# 운영 빌드
npm run build:prod

# 운영 서버 시작
npm run start:prod

# Docker 운영 배포
npm run docker:prod
```

## ⚡ 환경 감지 로직

애플리케이션은 다음 순서로 환경을 감지합니다:

1. **NODE_ENV** 환경변수 확인
2. **환경별 .env 파일** 로드
3. **암호화된 값 자동 복호화**
4. **환경별 설정 적용**

### 데이터베이스 연결 설정

```typescript
const getDbConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig = {
    host: getDecryptedEnvValue('DB_HOST'),
    user: getDecryptedEnvValue('DB_USER'),
    password: getDecryptedEnvValue('DB_PASSWORD'),
    // 환경별 최적화 설정
    connectionLimit: env === 'production' ? 20 : 5
  };

  if (env === 'production') {
    return {
      ...baseConfig,
      ssl: { rejectUnauthorized: true }
    };
  }

  return baseConfig;
};
```

## 🔒 보안 모범 사례

### 마스터 시크릿 관리
1. **개발/운영 다른 시크릿** 사용
2. **환경변수로 주입** (파일 저장 금지)
3. **정기적 로테이션** 수행
4. **접근 권한 제한**

### 환경별 보안 수준
- **개발**: 로컬 테스트용, 보안 완화
- **운영**: 최고 보안, SSL/TLS 필수, Rate Limiting

### 백업 및 복구
```bash
# 환경설정 백업 (암호화 전 자동 생성)
.env.production.backup.1703123456789

# 수동 백업
cp .env.production .env.production.backup.manual
```

## 🐛 문제 해결

### 복호화 실패 시
```bash
# 마스터 시크릿 확인
echo $MASTER_SECRET

# 환경변수 재암호화
npm run encrypt:env
```

### 환경 감지 오류 시
```bash
# NODE_ENV 확인
echo $NODE_ENV

# 올바른 명령어 사용
npm run start:prod  # 운영
npm run start:dev   # 개발
```

### 데이터베이스 연결 실패 시
```bash
# 환경변수 값 확인 (민감정보 마스킹)
node -e "console.log('DB_HOST:', process.env.DB_HOST)"

# 복호화 테스트
node -e "
const { getDecryptedEnvValue } = require('./src/lib/crypto');
console.log('DB_USER:', getDecryptedEnvValue('DB_USER'));
"
```

## 📝 체크리스트

### 개발 환경 설정
- [ ] `.env.development` 파일 생성
- [ ] DB 접속 정보 입력
- [ ] `npm run dev` 정상 동작 확인

### 운영 환경 설정
- [ ] `.env.production` 파일 생성
- [ ] 운영 DB 정보 입력
- [ ] 환경변수 암호화 완료
- [ ] SSL/TLS 설정 완료
- [ ] `npm run start:prod` 정상 동작 확인
- [ ] 보안 점검 완료

### 보안 검증
- [ ] 민감 정보 암호화 확인
- [ ] 마스터 시크릿 안전 보관
- [ ] .env 파일 gitignore 확인
- [ ] 백업 파일 생성 확인 