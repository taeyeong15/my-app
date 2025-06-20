# 🔐 보안 설정 가이드

## ⚠️ 중요한 보안 수정 사항

이 시스템에서 발견된 심각한 보안 취약점이 수정되었습니다:

### 수정된 보안 문제들:

1. **기본 관리자 계정 제거**
   - 하드코딩된 `admin@company.com` 계정 삭제
   - 모든 기본 계정들 비활성화

2. **localStorage 기반 인증 제거**
   - 클라이언트 사이드 인증을 서버 사이드 세션으로 변경
   - HttpOnly 쿠키 사용으로 XSS 공격 방지

3. **세션 관리 강화**
   - 데이터베이스 기반 세션 저장
   - 30분 자동 만료
   - 로그아웃 시 서버 세션 완전 삭제

## 🚀 첫 설치 후 필수 단계

### 1. 관리자 계정 생성

시스템 첫 설치 후 반드시 관리자 계정을 생성해야 합니다:

#### 방법 1: 회원가입 후 권한 변경
```bash
# 1. 웹사이트에서 회원가입
# 2. 데이터베이스에서 권한 변경
mysql -u [username] -p campaign_db
UPDATE users SET role = 'admin' WHERE email = 'your-admin@company.com';
```

#### 방법 2: 직접 SQL 실행
```sql
-- 비밀번호를 bcrypt로 해시화한 후 삽입
INSERT INTO users (email, password, name, role, is_active) VALUES 
('your-admin@company.com', '$2b$12$[해시된_비밀번호]', '관리자명', 'admin', TRUE);
```

#### 방법 3: Node.js 스크립트 사용
```javascript
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const password = 'your-secure-password';
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log('Hashed password:', hashedPassword);
  // 이 해시를 위의 SQL에 사용
}
```

### 2. 환경 변수 설정

`.env` 파일에 보안 설정 추가:

```bash
# JWT 시크릿 키 (강력한 랜덤 문자열)
JWT_SECRET=your-very-strong-random-secret-key-here

# 데이터베이스 설정
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-strong-db-password
DB_NAME=campaign_db

# 프로덕션 환경 설정
NODE_ENV=production
```

### 3. 데이터베이스 초기화

```bash
# 스키마 생성
mysql -u [username] -p < database/schema.sql

# 초기 데이터 삽입 (보안 버전)
mysql -u [username] -p < database/initial-data.sql
```

## 🔒 보안 체크리스트

### 필수 보안 설정:

- [ ] 기본 관리자 계정 삭제 확인
- [ ] 강력한 JWT_SECRET 설정
- [ ] HTTPS 사용 (프로덕션)
- [ ] 데이터베이스 비밀번호 강화
- [ ] 방화벽 설정
- [ ] 정기적인 보안 업데이트

### 권장 보안 설정:

- [ ] 2FA (이중 인증) 구현
- [ ] 로그인 시도 제한
- [ ] IP 화이트리스트
- [ ] 정기적인 세션 정리
- [ ] 보안 헤더 설정
- [ ] 로그 모니터링

## 🚨 보안 사고 대응

### 만약 무단 접근이 의심된다면:

1. **즉시 조치**:
   ```sql
   -- 모든 세션 삭제
   DELETE FROM sessions;
   
   -- 의심스러운 사용자 비활성화
   UPDATE users SET is_active = FALSE WHERE email = '의심계정@example.com';
   ```

2. **로그 확인**:
   ```sql
   -- 최근 로그인 기록 확인
   SELECT * FROM system_logs WHERE level = 'info' AND message LIKE '%login%' ORDER BY created_at DESC LIMIT 50;
   ```

3. **비밀번호 재설정**:
   - 모든 관리자 계정 비밀번호 변경
   - JWT_SECRET 변경 후 서버 재시작

## 📞 지원

보안 관련 문제가 있으면 즉시 시스템 관리자에게 연락하세요.

---

**⚠️ 경고**: 이 가이드의 모든 단계를 완료하기 전까지는 시스템을 프로덕션 환경에서 사용하지 마세요! 