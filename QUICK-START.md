# 🚀 빠른 시작 가이드

## ⚡ 수정된 암호화 시스템

`crypto.createCipher` 오류를 해결했습니다! 이제 **안전한 AES-256-CBC 암호화**를 사용합니다.

## 📝 현재 상황

사용자가 이미 `.env.development` 파일을 생성하셨습니다:
```env
DB_PASSWORD=ansxodud2410!
MASTER_SECRET=default-master-secret-change-this
```

## 🔐 즉시 사용 가능한 명령어

### 1️⃣ 개발 환경 암호화 (현재 파일)
```bash
# 자동 암호화 (기본 마스터 시크릿 사용)
npm run encrypt:dev

# 또는 사용자 정의 마스터 시크릿으로
node scripts/encrypt-env-auto.js dev your-custom-secret-key
```

### 2️⃣ 운영 환경 설정
```bash
# 운영 환경 템플릿 생성
npm run setup:prod

# .env.production 파일 수정 후 암호화
npm run encrypt:prod
```

### 3️⃣ 서버 시작
```bash
# 개발 서버 (암호화된 환경변수 자동 복호화)
npm run dev

# 운영 서버
npm run start:prod
```

## 🛠️ 수정된 기술 세부사항

### 암호화 알고리즘 변경
- **이전**: `aes-256-gcm` (Node.js 호환성 문제)
- **현재**: `aes-256-cbc` (안정적이고 호환성 우수)

### 함수 변경
- **이전**: `crypto.createCipher()` (deprecated)
- **현재**: `crypto.createCipheriv()` (권장 방식)

### 암호화 형식
```
ENC:IV값:암호화된데이터
예: ENC:a1b2c3d4e5f6789a0b1c2d3e4f567890:9f8e7d6c5b4a3210fedcba0987654321
```

## ✅ 테스트 결과

### 암호화 테스트
```bash
# 테스트 스크립트 실행
node test-crypto.js

# 예상 출력:
🧪 암호화 테스트 시작...
원본 패스워드: ansxodud2410!
암호화된 값: a1b2c3d4e5f6789a0b1c2d3e4f567890:9f8e7d6c5b4a3210fedcba0987654321
복호화된 값: ansxodud2410!
✅ 암호화/복호화 테스트 성공!
```

## 🎯 권장 워크플로우

### 개발자 사용법
```bash
# 1. 현재 개발 환경 암호화
npm run encrypt:dev

# 2. 개발 서버 시작
npm run dev

# 3. 브라우저에서 확인
# http://localhost:3000
```

### 운영 배포 사용법
```bash
# 1. 운영 환경 설정
npm run setup:prod

# 2. .env.production 수정 (실제 운영 DB 정보 입력)

# 3. 운영 환경 암호화
npm run encrypt:prod

# 4. 운영 빌드 및 시작
npm run build:prod
npm run start:prod
```

## 🔒 보안 개선사항

### 1. 안전한 암호화
- **AES-256-CBC**: 업계 표준 암호화
- **랜덤 IV**: 매번 다른 암호화 결과
- **PBKDF2**: 키 유도 함수로 보안 강화

### 2. 자동 백업
```bash
# 암호화 전 원본 파일 자동 백업
.env.development.backup.1750126349246
```

### 3. 에러 처리
- 복호화 실패 시 명확한 오류 메시지
- 파일 누락 시 설정 가이드 제공
- 잘못된 마스터 시크릿 감지

## 🐛 문제 해결

### 암호화 오류 시
```bash
# 테스트 파일로 암호화 기능 확인
node test-crypto.js

# 성공 시 실제 환경변수 암호화
npm run encrypt:dev
```

### 복호화 오류 시
```bash
# 마스터 시크릿 확인
echo %MASTER_SECRET%  # Windows
echo $MASTER_SECRET   # Linux/Mac

# 올바른 시크릿으로 재암호화
node scripts/encrypt-env-auto.js dev correct-master-secret
```

### 서버 시작 오류 시
```bash
# 환경변수 확인
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"

# 복호화 테스트
node -e "
require('dotenv').config({ path: '.env.development' });
const { getDecryptedEnvValue } = require('./src/lib/crypto');
console.log('DB_HOST:', getDecryptedEnvValue('DB_HOST'));
"
```

## 📊 예상 결과

### 암호화 전 (.env.development)
```env
DB_PASSWORD=ansxodud2410!
JWT_SECRET=dev-jwt-secret-key
```

### 암호화 후 (.env.development)
```env
DB_PASSWORD=ENC:a1b2c3d4e5f6789a0b1c2d3e4f567890:9f8e7d6c5b4a3210fedcba0987654321
JWT_SECRET=ENC:f1e2d3c4b5a6978901234567890abcdef:123456789abcdef0123456789abcdef01
MASTER_SECRET=default-master-secret-change-this
```

## 🎉 다음 단계

1. **즉시 테스트**: `npm run encrypt:dev` 실행
2. **서버 확인**: `npm run dev` 실행  
3. **운영 준비**: 필요시 `npm run setup:prod` 실행

이제 **완전히 작동하는 환경변수 암호화 시스템**이 준비되었습니다! 🔐✨ 