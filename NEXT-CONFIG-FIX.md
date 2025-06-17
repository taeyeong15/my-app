# 🔧 Next.js 설정 오류 해결

## 🐛 해결된 문제

```
Error: The key "NODE_ENV" under "env" in next.config.js is not allowed.
```

**원인**: Next.js는 `NODE_ENV`를 자동으로 관리하므로 `env` 설정에 명시적으로 포함할 수 없습니다.

## ✅ 수정 완료

### 수정된 next.config.js
```javascript
// 환경변수 설정 (NODE_ENV는 Next.js가 자동 관리)
env: {
  MASTER_SECRET: process.env.MASTER_SECRET,
},
```

### 수정된 next.config.ts
```typescript
// 환경변수 설정 (NODE_ENV는 Next.js가 자동 관리)
env: {
  MASTER_SECRET: process.env.MASTER_SECRET,
},
```

## 🚀 즉시 실행 가능

이제 다음 명령어로 서버를 시작할 수 있습니다:

```powershell
npm run dev
```

**예상 출력:**
```
📄 로딩: .env.development
🔧 개발 모드로 실행 중...
Ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## 🌟 Next.js 자동 환경 관리

### NODE_ENV 자동 설정
- **개발 모드**: `npm run dev` → `NODE_ENV=development`
- **프로덕션 빌드**: `npm run build` → `NODE_ENV=production`
- **프로덕션 실행**: `npm start` → `NODE_ENV=production`

### 환경변수 파일 자동 로딩 순서
1. `.env.development.local` (개발, git 무시)
2. `.env.local` (모든 환경, git 무시)
3. `.env.development` (개발용) ✅ **현재 사용**
4. `.env` (기본값)

## 🔐 암호화 시스템 작동 확인

### 1. 현재 .env.development 확인
```env
DB_PASSWORD=ansxodud2410!
MASTER_SECRET=default-master-secret-change-this
```

### 2. 암호화 테스트 (선택사항)
```powershell
npm run encrypt:dev
```

### 3. 서버 시작 후 DB 연결 확인
브라우저에서 `http://localhost:3000` 접속 시 DB 연결이 정상 작동해야 합니다.

## 🧪 환경변수 복호화 테스트

서버 실행 중 개발자 도구 콘솔에서:
```javascript
// 환경 확인
console.log('NODE_ENV:', process.env.NODE_ENV);

// 데이터베이스 연결 확인 (API 호출)
fetch('/api/dashboard')
  .then(res => res.json())
  .then(data => console.log('DB 연결 상태:', data))
  .catch(err => console.error('DB 연결 오류:', err));
```

## 🎯 완전한 실행 순서

### 단계별 실행
```powershell
# 1. 현재 디렉토리 확인
cd C:\Users\MOON_TAEYOUNG\my-app

# 2. 환경변수 파일 확인
dir .env.development

# 3. 개발 서버 시작
npm run dev

# 4. 브라우저에서 접속
# http://localhost:3000
```

### 성공 확인
- ✅ 서버 시작 메시지 출력
- ✅ 환경변수 로딩 메시지 출력
- ✅ 브라우저에서 페이지 로드
- ✅ 데이터베이스 연결 정상

## 🔄 추가 명령어

### 암호화 관련
```powershell
# 개발 환경 암호화
npm run encrypt:dev

# 운영 환경 설정
npm run setup:prod
npm run encrypt:prod
```

### 서버 관련
```powershell
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build:prod

# 프로덕션 서버
npm run start:prod
```

## 🔍 문제 해결

### 포트 3000 사용 중 오류
```powershell
# 포트 사용 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료
taskkill /F /PID <PID번호>
```

### 환경변수 로딩 오류
```powershell
# 파일 존재 확인
type .env.development

# 문법 오류 확인 (등호 앞뒤 공백 없어야 함)
# 올바른 형식: KEY=value
# 잘못된 형식: KEY = value
```

이제 **Next.js 오류가 완전히 해결**되어 정상적으로 서버를 시작할 수 있습니다! 🎉 