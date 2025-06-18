'use client';

import { useEffect } from 'react';
import { sessionManager } from '@/lib/sessionManager';

interface AutoLogoutProps {
  timeoutMinutes?: number;
}

export default function AutoLogout({ timeoutMinutes = 30 }: AutoLogoutProps) {
  useEffect(() => {
    // 전역 세션 관리자 초기화 (한 번만 실행됨)
    sessionManager.initialize(timeoutMinutes);

    // 컴포넌트 언마운트 시 정리 (선택적)
    return () => {
      // 주의: 여기서 cleanup을 호출하면 다른 컴포넌트에서도 영향을 받을 수 있음
      // 실제 앱 종료 시에만 cleanup을 호출하는 것이 좋음
      // sessionManager.cleanup();
    };
  }, [timeoutMinutes]);

  // 디버깅용 - 개발 모드에서만 실행
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const checkStatus = () => {
        console.log('SessionManager Status:', sessionManager.getStatus());
      };
      
      // 10초마다 상태 확인 (개발 모드)
      const statusInterval = setInterval(checkStatus, 10000);
      
      return () => clearInterval(statusInterval);
    }
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
} 