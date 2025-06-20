# 🔄 서버 재시작 감지 및 세션 무효화 시스템

## 🎯 **목적**

서버가 재시작되면 모든 클라이언트의 기존 세션을 자동으로 무효화하여 보안을 강화하고, 사용자가 다양한 페이지에 있어도 일관되게 로그아웃 처리합니다.

## 🛡️ **보안 이점**

- **세션 하이재킹 방지**: 서버 재시작 시 모든 기존 세션 무효화
- **데이터 정합성**: 서버 상태와 클라이언트 세션 상태 동기화
- **일관된 사용자 경험**: 모든 탭/페이지에서 동일한 로그아웃 처리

## 🏗️ **시스템 구조**

### **1. 서버 상태 추적 API**
```typescript
// /api/server-status
{
  "success": true,
  "serverStartTime": 1750304386169,  // 서버 시작 시간 (밀리초)
  "currentTime": 1750304386174,      // 현재 시간
  "uptime": 5                        // 가동 시간 (밀리초)
}
```

### **2. 클라이언트 모니터링**
```typescript
// SessionManager에서 30초마다 서버 상태 확인
setInterval(() => {
  this.checkServerStatus();
}, 30000);
```

### **3. 재시작 감지 로직**
```typescript
if (this.state.serverStartTime !== data.serverStartTime) {
  // 서버 재시작 감지!
  this.handleServerRestart();
}
```

## 🔧 **구현 세부사항**

### **1. 서버 측 (`/api/server-status/route.ts`)**
```typescript
// 서버 시작 시간을 모듈 레벨에서 저장
const SERVER_START_TIME = Date.now();

export async function GET() {
  return NextResponse.json({
    success: true,
    serverStartTime: SERVER_START_TIME,
    currentTime: Date.now(),
    uptime: Date.now() - SERVER_START_TIME
  });
}
```

### **2. 클라이언트 측 (`sessionManager.ts`)**

#### **초기화 시 서버 모니터링 시작**
```typescript
initialize(timeoutMinutes: number = 30) {
  // ... 기존 로직
  this.startServerCheck(); // 서버 상태 모니터링 시작
}
```

#### **주기적 서버 상태 확인**
```typescript
private startServerCheck() {
  // 즉시 한 번 확인
  this.checkServerStatus();
  
  // 30초마다 확인
  this.state.serverCheckIntervalId = setInterval(() => {
    this.checkServerStatus();
  }, 30000);
}
```

#### **서버 재시작 처리**
```typescript
private handleServerRestart() {
  // 사용자 알림
  alert('서버가 재시작되었습니다.\n보안을 위해 자동으로 로그아웃됩니다.');
  
  // 강제 로그아웃
  this.forceLogout();
}

private forceLogout() {
  // 모든 세션 데이터 제거
  sessionStorage.clear();
  localStorage.clear();
  
  // 로그인 페이지로 리다이렉트
  window.location.href = '/login';
}
```

## 🧪 **테스트 방법**

### **1. 수동 테스트**
```bash
# 1. 개발 서버 시작
npm run dev

# 2. 브라우저에서 로그인
# http://localhost:3000/login

# 3. 여러 탭으로 다른 페이지 열기
# - 대시보드: http://localhost:3000/dashboard
# - 캠페인: http://localhost:3000/campaigns
# - 고객군: http://localhost:3000/customers

# 4. 서버 재시작 (Ctrl+C 후 npm run dev)

# 5. 확인: 모든 탭에서 30초 내 자동 로그아웃
```

### **2. API 테스트**
```powershell
# 서버 상태 확인
Invoke-WebRequest -Uri "http://localhost:3000/api/server-status" -Method GET

# 응답 예시:
# {
#   "success": true,
#   "serverStartTime": 1750304386169,
#   "currentTime": 1750304386174,
#   "uptime": 5
# }
```

## ⚙️ **설정 옵션**

### **모니터링 주기 변경**
```typescript
// 기본값: 30초
// 더 빠른 감지를 원하면 값을 줄임 (최소 5초 권장)
setInterval(() => {
  this.checkServerStatus();
}, 5000); // 5초마다 확인
```

### **알림 메시지 커스터마이징**
```typescript
private handleServerRestart() {
  alert('시스템 업데이트가 완료되었습니다.\n다시 로그인해주세요.');
  this.forceLogout();
}
```

## 🚨 **주의사항**

### **1. 네트워크 오류 처리**
```typescript
// 일시적 네트워크 오류는 무시
catch (error) {
  console.warn('서버 상태 확인 중 오류:', error);
  // 로그아웃하지 않음 - 재시작이 아닐 수 있음
}
```

### **2. 성능 고려사항**
- **모니터링 주기**: 너무 짧으면 서버 부하 증가
- **타임아웃 설정**: 네트워크 지연 고려 필요
- **오류 처리**: 일시적 오류와 재시작 구분

### **3. 사용자 경험**
- **데이터 손실 방지**: 작업 중인 데이터 임시 저장 고려
- **적절한 알림**: 사용자에게 명확한 안내 제공
- **빠른 리다이렉트**: 혼란 최소화

## 📊 **로그 예시**

### **정상 작동 시**
```
[SessionManager] 서버 시작 시간 등록: 2024-12-18T10:30:00.000Z
[SessionManager] 서버 상태 확인 완료: uptime 30초
[SessionManager] 서버 상태 확인 완료: uptime 60초
```

### **재시작 감지 시**
```
[SessionManager] 🚨 서버 재시작 감지!
[SessionManager] 이전 서버 시작 시간: 2024-12-18T10:30:00.000Z
[SessionManager] 현재 서버 시작 시간: 2024-12-18T10:35:00.000Z
[SessionManager] 서버 재시작으로 인한 강제 로그아웃
```

## 🔄 **작동 시나리오**

### **시나리오 1: 정상 사용**
1. 사용자 로그인 → 서버 시작 시간 저장
2. 30초마다 서버 상태 확인 → 변화 없음
3. 정상적인 세션 관리 계속

### **시나리오 2: 서버 재시작**
1. 관리자가 서버 재시작 실행
2. 클라이언트가 새로운 서버 시작 시간 감지
3. 모든 클라이언트에서 자동 로그아웃
4. 사용자가 다시 로그인

### **시나리오 3: 네트워크 일시 장애**
1. 서버 상태 확인 실패
2. 오류 로그 기록, 로그아웃하지 않음
3. 다음 확인 시 정상 복구

## 🎛️ **운영 가이드**

### **배포 시 고려사항**
1. **점진적 재시작**: 사용자 영향 최소화
2. **사전 공지**: 시스템 점검 알림
3. **모니터링**: 재시작 후 로그인 상태 확인

### **문제 해결**
- **로그아웃이 너무 자주 발생**: 모니터링 주기 조정
- **재시작 감지 실패**: 네트워크 상태 확인
- **성능 문제**: API 응답 시간 모니터링

## ✅ **구현 완료 체크리스트**

- [x] **서버 상태 API** (`/api/server-status`) 구현
- [x] **SessionManager 확장** - 서버 모니터링 기능 추가
- [x] **재시작 감지 로직** - 시작 시간 비교
- [x] **강제 로그아웃** - 모든 세션 데이터 제거
- [x] **사용자 알림** - 명확한 안내 메시지
- [x] **정리 기능** - 인터벌 타이머 정리
- [x] **오류 처리** - 네트워크 오류 대응
- [x] **테스트 완료** - API 및 기능 검증

**🎉 서버 재시작 시 모든 클라이언트 세션 자동 무효화 기능이 완성되었습니다!** 