// 전역 세션 관리자 - 중복 알람 방지
class SessionManager {
  private static instance: SessionManager;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private timeoutMinutes = 30;
  private isLogoutInProgress = false;
  private lastAlertTime = 0;
  private readonly ALERT_COOLDOWN = 60000; // 1분간 중복 알람 방지

  // 싱글톤 패턴
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private constructor() {
    // private constructor for singleton
  }

  // 세션 관리자 초기화 (한 번만 실행)
  public initialize(timeoutMinutes: number = 30): void {
    if (this.isInitialized) {
      console.log('SessionManager already initialized');
      return;
    }

    this.timeoutMinutes = timeoutMinutes;
    this.isInitialized = true;
    this.isLogoutInProgress = false;

    console.log('SessionManager initialized');
    this.setupEventListeners();
    this.startSessionValidation();
    this.resetInactivityTimer();
  }

  // 세션 관리자 정리
  public cleanup(): void {
    if (!this.isInitialized) return;

    this.clearTimers();
    this.removeEventListeners();
    this.isInitialized = false;
    console.log('SessionManager cleaned up');
  }

  // 타이머들 정리
  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // 비활성화 타이머 리셋
  private resetInactivityTimer(): void {
    if (this.isLogoutInProgress) return;

    this.clearTimers();
    
    const INACTIVITY_TIMEOUT = this.timeoutMinutes * 60 * 1000;
    
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, INACTIVITY_TIMEOUT);
  }

  // 비활성화 타임아웃 처리 (중복 방지)
  private handleInactivityTimeout(): void {
    // 이미 로그아웃 진행 중이면 무시
    if (this.isLogoutInProgress) {
      console.log('Logout already in progress, ignoring timeout');
      return;
    }

    // 최근 알람 시간 확인 (중복 알람 방지)
    const now = Date.now();
    if (now - this.lastAlertTime < this.ALERT_COOLDOWN) {
      console.log('Alert cooldown active, ignoring timeout');
      return;
    }

    this.lastAlertTime = now;
    this.isLogoutInProgress = true;

    // 전역 상태로 로그아웃 진행 중임을 표시
    localStorage.setItem('logoutInProgress', 'true');

    console.log('Initiating auto-logout due to inactivity');
    alert(`${this.timeoutMinutes}분 비활성화로 인해 자동 로그아웃됩니다.`);
    
    this.performLogout('비활성화 타임아웃');
  }

  // 로그아웃 실행
  private performLogout(reason: string): void {
    console.log(`세션 정리: ${reason}`);
    
    // 세션 데이터 정리
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('logoutInProgress');
    
    // 사용자 관련 모든 데이터 정리
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('user') || key.includes('auth') || key.includes('session'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 타이머 정리
    this.clearTimers();
    
    // 페이지 리다이렉트
    window.location.href = '/login';
  }

  // 사용자 활동 처리
  private handleUserActivity = (): void => {
    if (this.isLogoutInProgress) return;

    this.updateLastActivity();
    this.resetInactivityTimer();
  };

  // 활동 시간 업데이트
  private updateLastActivity(): void {
    localStorage.setItem('lastActivity', Date.now().toString());
  }

  // 세션 유효성 검사
  private validateSession = async (): Promise<boolean> => {
    try {
      // 로그아웃 진행 중이면 검증 스킵
      if (this.isLogoutInProgress || localStorage.getItem('logoutInProgress') === 'true') {
        return false;
      }

      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        this.performLogout('사용자 정보 없음');
        return false;
      }

      // 세션 시간 초기화
      if (!localStorage.getItem('sessionStartTime') || !localStorage.getItem('lastActivity')) {
        this.setSessionStartTime();
        return true;
      }

      // 세션 만료 확인
      if (this.isSessionExpired()) {
        this.performLogout('세션 시간 만료');
        return false;
      }

      return true;
    } catch (error) {
      console.error('세션 검증 실패:', error);
      this.performLogout('세션 검증 오류');
      return false;
    }
  };

  // 세션 시작 시간 설정
  private setSessionStartTime(): void {
    const startTime = Date.now();
    localStorage.setItem('sessionStartTime', startTime.toString());
    localStorage.setItem('lastActivity', startTime.toString());
  }

  // 세션 만료 확인
  private isSessionExpired(): boolean {
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (!sessionStartTime || !lastActivity) {
      return true;
    }

    const now = Date.now();
    const sessionAge = now - parseInt(sessionStartTime);
    const inactivityTime = now - parseInt(lastActivity);
    const SESSION_EXPIRY_TIME = 8 * 60 * 60 * 1000; // 8시간
    const INACTIVITY_TIMEOUT = this.timeoutMinutes * 60 * 1000;

    return sessionAge > SESSION_EXPIRY_TIME || inactivityTime > INACTIVITY_TIMEOUT;
  }

  // 이벤트 리스너 설정
  private setupEventListeners(): void {
    // 사용자 활동 이벤트 (쓰로틀링 적용)
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          this.handleUserActivity();
          throttleTimeout = null;
        }, 1000);
      }
    };

    // 다른 탭에서의 로그아웃 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' && e.newValue === null) {
        this.isLogoutInProgress = true;
        window.location.href = '/login';
      }
      if (e.key === 'logoutInProgress' && e.newValue === 'true') {
        this.isLogoutInProgress = true;
      }
    };

    // 탭 포커스 변경 감지
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 탭이 활성화될 때 로그아웃 진행 상태 확인
        if (localStorage.getItem('logoutInProgress') === 'true') {
          window.location.href = '/login';
          return;
        }
        this.validateSession();
      } else {
        this.updateLastActivity();
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('mousemove', throttledHandler);
    window.addEventListener('keydown', throttledHandler);
    window.addEventListener('click', throttledHandler);
    window.addEventListener('scroll', throttledHandler);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 이벤트 리스너 참조 저장 (정리용)
    (this as any).throttledHandler = throttledHandler;
    (this as any).handleStorageChange = handleStorageChange;
    (this as any).handleVisibilityChange = handleVisibilityChange;
  }

  // 이벤트 리스너 제거
  private removeEventListeners(): void {
    if ((this as any).throttledHandler) {
      window.removeEventListener('mousemove', (this as any).throttledHandler);
      window.removeEventListener('keydown', (this as any).throttledHandler);
      window.removeEventListener('click', (this as any).throttledHandler);
      window.removeEventListener('scroll', (this as any).throttledHandler);
    }
    if ((this as any).handleStorageChange) {
      window.removeEventListener('storage', (this as any).handleStorageChange);
    }
    if ((this as any).handleVisibilityChange) {
      document.removeEventListener('visibilitychange', (this as any).handleVisibilityChange);
    }
  }

  // 세션 검증 주기적 실행
  private startSessionValidation(): void {
    const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5분마다
    this.sessionCheckInterval = setInterval(this.validateSession, SESSION_CHECK_INTERVAL);
  }

  // 현재 상태 확인 (디버깅용)
  public getStatus(): any {
    return {
      isInitialized: this.isInitialized,
      isLogoutInProgress: this.isLogoutInProgress,
      timeoutMinutes: this.timeoutMinutes,
      hasInactivityTimer: !!this.inactivityTimer,
      hasSessionCheckInterval: !!this.sessionCheckInterval,
      lastAlertTime: this.lastAlertTime
    };
  }
}

// 전역 인스턴스 내보내기
export const sessionManager = SessionManager.getInstance(); 