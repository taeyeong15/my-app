'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AutoLogoutProps {
  timeoutMinutes?: number;
}

export default function AutoLogout({ timeoutMinutes = 30 }: AutoLogoutProps) {
  const router = useRouter();

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = timeoutMinutes * 60 * 1000;
    const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5분마다 세션 체크

    // 세션 유효성 검사
    const validateSession = async () => {
      try {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
          clearSession('사용자 정보 없음');
          return false;
        }

        // 세션 시간이 설정되지 않은 경우 새로 설정 (로그인 직후)
        if (!localStorage.getItem('sessionStartTime') || !localStorage.getItem('lastActivity')) {
          setSessionStartTime();
          return true;
        }

        // 로컬 세션 만료 확인
        if (isSessionExpired()) {
          clearSession('세션 시간 만료');
          return false;
        }

        const userData = JSON.parse(currentUser);
        
        // 서버에서 세션 유효성 확인
        const response = await fetch('/api/auth/validate-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userData.id, email: userData.email }),
        });

        if (!response.ok) {
          clearSession('서버 세션 만료');
          return false;
        }

        return true;
      } catch (error) {
        console.error('세션 검증 실패:', error);
        clearSession('세션 검증 오류');
        return false;
      }
    };

    // 브라우저 탭 포커스 이벤트 처리
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 탭이 다시 활성화되었을 때 세션 검증
        localStorage.removeItem('browserClosing');
        validateSession();
      } else {
        // 탭이 숨겨질 때 활동 시간 업데이트
        updateLastActivity();
      }
    };

    // 세션 시작 시간 설정
    const setSessionStartTime = () => {
      const startTime = Date.now();
      localStorage.setItem('sessionStartTime', startTime.toString());
      localStorage.setItem('lastActivity', startTime.toString());
    };

    // 세션 만료 확인
    const isSessionExpired = () => {
      const sessionStartTime = localStorage.getItem('sessionStartTime');
      const lastActivity = localStorage.getItem('lastActivity');
      
      if (!sessionStartTime || !lastActivity) {
        return true;
      }

      const now = Date.now();
      const sessionAge = now - parseInt(sessionStartTime);
      const inactivityTime = now - parseInt(lastActivity);
      const SESSION_EXPIRY_TIME = 8 * 60 * 60 * 1000; // 8시간

      return sessionAge > SESSION_EXPIRY_TIME || inactivityTime > INACTIVITY_TIMEOUT;
    };

    // 활동 시간 업데이트
    const updateLastActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // 세션 완전 정리
    const clearSession = (reason: string) => {
      console.log(`세션 정리: ${reason}`);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('sessionStartTime');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('sessionToken');
      
      // 추가 보안: 모든 localStorage 항목 중 사용자 관련 항목 정리
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('user') || key.includes('auth') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      router.push('/login');
    };

    // 페이지 언로드 시 처리 (강화된 버전)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      updateLastActivity();
      
      // 브라우저 종료 감지를 위한 플래그 설정
      localStorage.setItem('browserClosing', 'true');
      
      // 일정 시간 후에도 플래그가 남아있으면 브라우저가 종료된 것으로 간주
      setTimeout(() => {
        const isClosing = localStorage.getItem('browserClosing');
        if (isClosing === 'true') {
          clearSession('브라우저 종료 감지');
        }
      }, 1000);
    };

    // 페이지 로드 시 처리
    const handlePageLoad = () => {
      // 브라우저 종료 플래그 제거 (정상적인 페이지 로드)
      localStorage.removeItem('browserClosing');
      
      // 세션 시작 시간이 없으면 설정
      if (!localStorage.getItem('sessionStartTime')) {
        setSessionStartTime();
      }
    };

    // 스토리지 이벤트 처리 (다른 탭에서 로그아웃 시)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' && e.newValue === null) {
        router.push('/login');
      }
    };

    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      inactivityTimer = setTimeout(() => {
        alert(`${timeoutMinutes}분 비활성화로 인해 자동 로그아웃됩니다.`);
        localStorage.removeItem('currentUser');
        router.push('/login');
      }, INACTIVITY_TIMEOUT);
    };

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // 사용자 활동 이벤트 리스너 등록 (쓰로틀링 적용)
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleUserActivity();
          throttleTimeout = null;
        }, 1000);
      }
    };

    // 정기적인 세션 검증
    const sessionCheckInterval = setInterval(validateSession, SESSION_CHECK_INTERVAL);

    // 이벤트 리스너 등록
    window.addEventListener('mousemove', throttledHandler);
    window.addEventListener('keydown', throttledHandler);
    window.addEventListener('click', throttledHandler);
    window.addEventListener('scroll', throttledHandler);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 초기 세션 검증 및 타이머 설정
    validateSession().then(isValid => {
      if (isValid) {
        resetInactivityTimer();
      }
    });

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
      window.removeEventListener('mousemove', throttledHandler);
      window.removeEventListener('keydown', throttledHandler);
      window.removeEventListener('click', throttledHandler);
      window.removeEventListener('scroll', throttledHandler);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timeoutMinutes, router]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
} 