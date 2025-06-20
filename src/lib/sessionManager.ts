'use client';

interface SessionState {
  isActive: boolean;
  lastActivity: number;
  timeoutMinutes: number;
  timeoutId?: NodeJS.Timeout;
  warningTimeoutId?: NodeJS.Timeout;
  forceLogoutTimeoutId?: NodeJS.Timeout; // 경고 후 강제 로그아웃 타이머
  isWarningShown: boolean; // 경고가 표시되었는지 여부
  serverStartTime?: number; // 서버 시작 시간 추적
  serverCheckIntervalId?: NodeJS.Timeout; // 서버 상태 체크 인터벌
}

class SessionManager {
  private state: SessionState = {
    isActive: false,
    lastActivity: 0,
    timeoutMinutes: 30,
    isWarningShown: false
  };

  private activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  initialize(timeoutMinutes: number = 30) {
    if (this.state.isActive) {
      console.log('SessionManager already initialized');
      return;
    }

    this.state.timeoutMinutes = timeoutMinutes;
    this.state.isActive = true;
    this.state.lastActivity = Date.now();
    this.state.isWarningShown = false; // 초기화 시 경고 상태 리셋

    // localStorage에 세션 시작 시간 저장
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sessionStartTime', this.state.lastActivity.toString());
      sessionStorage.setItem('lastActivity', this.state.lastActivity.toString());
    }

    this.setupEventListeners();
    this.resetTimer();
    this.startServerCheck(); // 서버 상태 모니터링 시작

    console.log(`SessionManager initialized with ${timeoutMinutes} minutes timeout`);
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity.bind(this), true);
    });

    // 페이지 visibility 변경 감지
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleActivity = () => {
    if (!this.state.isActive) return;

    const now = Date.now();
    this.state.lastActivity = now;

    // localStorage 업데이트
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastActivity', now.toString());
    }

    this.resetTimer();
  };

  private handleVisibilityChange = () => {
    if (!document.hidden && this.state.isActive) {
      // 페이지가 다시 보이게 될 때 세션 유효성 검사
      this.checkSessionValidity();
    }
  };

  private checkSessionValidity() {
    if (typeof window === 'undefined') return;

    const currentUser = sessionStorage.getItem('currentUser');
    const lastActivity = sessionStorage.getItem('lastActivity');

    if (!currentUser || !lastActivity) {
      this.logout();
      return;
    }

    const lastActivityTime = parseInt(lastActivity);
    const now = Date.now();
    const elapsedMinutes = (now - lastActivityTime) / (1000 * 60);

    if (elapsedMinutes > this.state.timeoutMinutes) {
      console.log('Session expired due to inactivity');
      this.logout();
    } else {
      // 세션이 유효하면 타이머 재설정
      this.state.lastActivity = now;
      this.resetTimer();
    }
  }

  private resetTimer() {
    // 기존 타이머 정리
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId);
    }
    if (this.state.warningTimeoutId) {
      clearTimeout(this.state.warningTimeoutId);
    }
    if (this.state.forceLogoutTimeoutId) {
      clearTimeout(this.state.forceLogoutTimeoutId);
    }

    // 경고가 이미 표시되었고 사용자가 "계속 사용"을 선택한 경우
    // 추가 연장 없이 기존 세션 시간만 사용
    if (this.state.isWarningShown) {
      console.log('경고 후 상태 - 추가 연장 없음');
      return;
    }

    const timeoutMs = this.state.timeoutMinutes * 60 * 1000;
    const warningMs = (this.state.timeoutMinutes - 5) * 60 * 1000; // 5분 전 경고

    // 경고 타이머 설정 (5분 전)
    if (warningMs > 0) {
      this.state.warningTimeoutId = setTimeout(() => {
        this.showWarning();
      }, warningMs);
    }

    // 로그아웃 타이머 설정
    this.state.timeoutId = setTimeout(() => {
      console.log('Session timeout - logging out');
      this.logout();
    }, timeoutMs);
  }

  private showWarning() {
    if (typeof window === 'undefined') return;

    this.state.isWarningShown = true;
    const remainingMinutes = 5;
    
    const userResponse = confirm(
      `${remainingMinutes}분 후 자동으로 로그아웃됩니다.\n` +
      '계속 사용하시겠습니까?\n\n' +
      '⚠️ 주의: "확인"을 클릭해도 5분 후에는 강제로 로그아웃됩니다.'
    );

    if (userResponse) {
      // 사용자가 계속 사용하겠다고 선택 - 하지만 5분 후 강제 로그아웃
      console.log('사용자가 계속 사용 선택 - 5분 후 강제 로그아웃 예정');
      
      // 5분 후 강제 로그아웃 타이머 설정
      this.state.forceLogoutTimeoutId = setTimeout(() => {
        console.log('경고 후 5분 경과 - 강제 로그아웃');
        alert('세션이 만료되어 자동으로 로그아웃됩니다.');
        this.logout();
      }, 5 * 60 * 1000); // 5분
      
    } else {
      // 사용자가 로그아웃을 선택
      this.logout();
    }
  }

  private logout() {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('sessionStartTime');
      sessionStorage.removeItem('lastActivity');

      // 페이지 리로드로 로그인 페이지로 이동
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  }

  getStatus() {
    return {
      isActive: this.state.isActive,
      lastActivity: new Date(this.state.lastActivity),
      timeoutMinutes: this.state.timeoutMinutes,
      remainingTime: this.getRemainingTime()
    };
  }

  private getRemainingTime() {
    if (!this.state.isActive) return 0;

    const now = Date.now();
    const elapsed = now - this.state.lastActivity;
    const timeout = this.state.timeoutMinutes * 60 * 1000;
    
    return Math.max(0, timeout - elapsed);
  }

  cleanup() {
    if (!this.state.isActive) return;

    this.state.isActive = false;

    // 타이머 정리
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId);
    }
    if (this.state.warningTimeoutId) {
      clearTimeout(this.state.warningTimeoutId);
    }
    if (this.state.forceLogoutTimeoutId) {
      clearTimeout(this.state.forceLogoutTimeoutId);
    }
    if (this.state.serverCheckIntervalId) {
      clearInterval(this.state.serverCheckIntervalId);
    }

    // 이벤트 리스너 제거
    if (typeof window !== 'undefined') {
      this.activityEvents.forEach(event => {
        document.removeEventListener(event, this.handleActivity, true);
      });
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    console.log('SessionManager cleaned up');
  }

  /**
   * 서버 상태 모니터링 시작
   * 주기적으로 서버 시작 시간을 확인하여 재시작 감지
   * 개발 모드에서는 비활성화 (Hot Reload로 인한 오탐지 방지)
   */
  private startServerCheck() {
    if (typeof window === 'undefined') return;

    // 개발 모드에서는 서버 재시작 감지 비활성화
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 모드: 서버 재시작 감지 비활성화');
      return;
    }

    // 첫 번째 서버 상태 확인
    this.checkServerStatus();

    // 30초마다 서버 상태 확인
    this.state.serverCheckIntervalId = setInterval(() => {
      this.checkServerStatus();
    }, 30000);
  }

  /**
   * 서버 상태 확인
   */
  private async checkServerStatus() {
    if (!this.state.isActive || typeof window === 'undefined') return;

    try {
      const response = await fetch('/api/server-status', {
        method: 'GET',
        cache: 'no-cache'
      });

      if (!response.ok) {
        console.warn('서버 상태 확인 실패:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.serverStartTime) {
        if (this.state.serverStartTime === undefined) {
          // 첫 번째 확인 - 서버 시작 시간 저장
          this.state.serverStartTime = data.serverStartTime;
          sessionStorage.setItem('serverStartTime', data.serverStartTime.toString());
          console.log('서버 시작 시간 등록:', new Date(data.serverStartTime));
        } else if (this.state.serverStartTime !== data.serverStartTime) {
          // 서버 재시작 감지!
          console.log('🚨 서버 재시작 감지!');
          console.log('이전 서버 시작 시간:', new Date(this.state.serverStartTime));
          console.log('현재 서버 시작 시간:', new Date(data.serverStartTime));
          
          this.handleServerRestart();
        }
      }
    } catch (error) {
      console.warn('서버 상태 확인 중 오류:', error);
      // 네트워크 오류는 무시 (서버가 일시적으로 응답하지 않을 수 있음)
    }
  }

  /**
   * 서버 재시작 처리
   */
  private handleServerRestart() {
    if (typeof window === 'undefined') return;

    try {
      // 사용자에게 알림
      alert('서버가 재시작되었습니다.\n보안을 위해 자동으로 로그아웃됩니다.');
      
      // 강제 로그아웃
      this.forceLogout();
    } catch (error) {
      console.error('서버 재시작 처리 오류:', error);
      // 오류가 발생해도 강제 로그아웃 실행
      window.location.href = '/login';
    }
  }

  /**
   * 강제 로그아웃 (서버 재시작 시)
   */
  private forceLogout() {
    if (typeof window === 'undefined') return;

    try {
      // 모든 세션 데이터 제거
      sessionStorage.clear();
      localStorage.clear();
      
      console.log('서버 재시작으로 인한 강제 로그아웃');
      
      // 즉시 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    } catch (error) {
      console.error('강제 로그아웃 오류:', error);
      // 최후의 수단
      window.location.reload();
    }
  }
}

// 싱글톤 인스턴스
export const sessionManager = new SessionManager(); 