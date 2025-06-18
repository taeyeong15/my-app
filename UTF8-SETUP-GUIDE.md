# UTF-8 인코딩 설정 가이드

## 🎯 목적
프로젝트 전체에서 UTF-8 인코딩을 통일하여 한글 깨짐 문제를 방지합니다.

## 📋 현재 UTF-8 설정 현황

### ✅ 완료된 설정

#### 1. 데이터베이스 (MySQL)
```sql
-- 데이터베이스 레벨
CREATE DATABASE campaign_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 테이블 레벨
CREATE TABLE users (
    ...
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 2. MySQL 연결 설정
```typescript
// src/lib/database.ts
const baseConfig = {
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  timezone: '+00:00',
  // ... 기타 설정
};
```

#### 3. Next.js 설정
```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Type',
          value: 'text/html; charset=utf-8',
        },
        // ... 기타 헤더
      ],
    },
  ];
}
```

#### 4. PowerShell 프로파일
```powershell
# Microsoft.PowerShell_profile.ps1
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
```

#### 5. 환경변수
```bash
# .env.development
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
DB_TIMEZONE=+00:00
```

## 🛠️ 개발 환경 설정

### Windows PowerShell 설정
1. PowerShell 프로파일 위치: `$PROFILE`
2. 자동 UTF-8 설정이 적용됨
3. 새 PowerShell 세션에서 자동으로 UTF-8 인코딩 사용

### VS Code 설정 (권장)
```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "files.defaultLanguage": "typescript"
}
```

## 🔍 문제 해결

### 한글이 깨지는 경우
1. **PowerShell 콘솔**: 새 세션 시작 또는 프로파일 재로드
2. **데이터베이스**: 테이블 charset 확인
3. **파일 인코딩**: UTF-8로 저장되었는지 확인

### 확인 명령어
```powershell
# PowerShell 인코딩 확인
[Console]::OutputEncoding.EncodingName

# 데이터베이스 charset 확인
SHOW CREATE DATABASE campaign_db;
SHOW CREATE TABLE users;
```

## 📝 주의사항
- 기존 데이터가 있는 경우 charset 변경 시 데이터 백업 필수
- 환경변수 암호화 시 UTF-8 인코딩 유지
- 파일 편집 시 UTF-8 인코딩으로 저장 확인

## 🎉 완료
모든 설정이 UTF-8로 통일되어 한글 깨짐 문제가 해결되었습니다! 