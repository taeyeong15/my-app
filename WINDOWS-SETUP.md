# 🪟 Windows 환경 설정 가이드

## 🐛 해결된 문제

Windows PowerShell에서 `NODE_ENV=development` 구문이 작동하지 않는 문제를 해결했습니다.

## ⚡ 즉시 실행 가능한 명령어

### 1단계: 필요 패키지 설치
```powershell
npm install dotenv
```

### 2단계: 개발 환경 암호화 (선택사항)
```powershell
# 자동 암호화 (기본 마스터 시크릿 사용)
npm run encrypt:dev

# 또는 사용자 정의 마스터 시크릿
node scripts/encrypt-env-auto.js dev your-secret-key
```

### 3단계: 개발 서버 시작
```powershell
npm run dev
```

## 🔧 수정된 내용

### 1. package.json 스크립트 수정
**이전 (Windows에서 오류):**
```json
"dev": "NODE_ENV=development next dev"
```

**현재 (Windows 호환):**
```json
"dev": "next dev"
```

### 2. Next.js 자동 환경 감지 구현
- `.env.development` 파일 자동 로딩
- 환경별 설정 자동 적용
- 개발/운영 모드 자동 감지

### 3. 환경변수 우선순위
```
1. .env.development.local (개발용, git 무시)
2. .env.local (모든 환경, git 무시)  
3. .env.development (개발용)
4. .env (기본값)
```

## 📁 현재 파일 구조

```
my-app/
├── .env.development          # 개발 환경 설정 (사용자 생성됨)
├── env.development.template  # 개발 환경 템플릿
├── env.production.template   # 운영 환경 템플릿
├── next.config.js           # 환경 자동 감지 설정
├── next.config.ts           # TypeScript 설정
└── scripts/
    ├── encrypt-env.js       # 대화형 암호화 (원본)
    └── encrypt-env-auto.js  # 자동 암호화 (신규)
```

## 🚀 실행 단계별 가이드

### Step 1: 패키지 설치 확인
```powershell
PS C:\Users\MOON_TAEYOUNG\my-app> npm install dotenv

# 성공 시 다음 단계로
```

### Step 2: 현재 환경 확인
```powershell
PS C:\Users\MOON_TAEYOUNG\my-app> dir .env*

# 출력 예시:
# .env.development
# env.development.template
# env.production.template
```

### Step 3: 개발 서버 시작
```powershell
PS C:\Users\MOON_TAEYOUNG\my-app> npm run dev

# 예상 출력:
# 📄 로딩: .env.development
# 🔧 개발 모드로 실행 중...
# Ready - started server on 0.0.0.0:3000
```

## 🔐 암호화 테스트 (선택사항)

### 현재 .env.development 내용
```env
DB_PASSWORD=ansxodud2410!
MASTER_SECRET=default-master-secret-change-this
```

### 암호화 실행
```powershell
PS C:\Users\MOON_TAEYOUNG\my-app> npm run encrypt:dev

# 예상 출력:
# 🔐 환경변수 자동 암호화 도구
# ==================================================
# 📂 환경: dev
# 📄 파일: .env.development
# 🔑 마스터 시크릿: default-ma...
# 
# 🔄 환경변수 암호화 중...
# ✅ DB_PASSWORD 암호화 완료
# 📁 원본 파일 백업: .env.development.backup.1750126789012
# 
# ✨ 암호화 완료!
# 📊 총 1개의 환경변수가 암호화되었습니다.
```

### 암호화 후 내용
```env
DB_PASSWORD=ENC:a1b2c3d4e5f6789a0b1c2d3e4f567890:9f8e7d6c5b4a3210fedcba0987654321
MASTER_SECRET=default-master-secret-change-this
```

## 🌟 자동 환경 감지 기능

### Next.js가 자동으로 수행하는 작업:

1. **환경 감지**: 개발/운영 모드 자동 인식
2. **파일 로딩**: 해당 환경의 .env 파일 자동 로드
3. **복호화**: 암호화된 환경변수 자동 복호화 (crypto.ts 모듈 사용)
4. **DB 연결**: 환경별 최적화된 설정 적용

### 개발 모드 최적화:
- DB 연결 수: 5개
- 로그 레벨: debug  
- SSL: 비활성화
- 타임아웃: 60초

### 운영 모드 최적화:
- DB 연결 수: 20개
- 로그 레벨: info
- SSL: 활성화
- 타임아웃: 30초

## 🐛 문제 해결

### 문제 1: dotenv 설치 오류
```powershell
# 캐시 정리 후 재시도
npm cache clean --force
npm install dotenv
```

### 문제 2: 서버 시작 실패
```powershell
# 포트 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID 확인 후)
taskkill /F /PID <PID번호>
```

### 문제 3: 환경변수 로딩 실패
```powershell
# 파일 존재 확인
dir .env.development

# 내용 확인
type .env.development
```

## ✅ 성공 확인 방법

### 1. 서버 시작 로그
```
📄 로딩: .env.development
🔧 개발 모드로 실행 중...
Ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 2. 브라우저 접속
```
http://localhost:3000
```

### 3. 환경변수 확인 (콘솔)
```javascript
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
```

## 🎯 다음 단계

1. **즉시 실행**: `npm install dotenv && npm run dev`
2. **암호화 테스트**: `npm run encrypt:dev` (선택사항)
3. **운영 준비**: `npm run setup:prod` (나중에)

이제 Windows 환경에서 완벽하게 작동합니다! 🎉 