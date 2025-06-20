'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkLoginAndRedirect = () => {
      try {
        // 클라이언트 사이드에서만 sessionStorage 접근
        if (typeof window !== 'undefined') {
          const loggedInUser = sessionStorage.getItem('currentUser');
          
          if (loggedInUser) {
            // 로그인된 사용자는 dashboard로 리다이렉션
            router.replace('/dashboard');
          } else {
            // 로그인되지 않은 사용자는 로그인 페이지로
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('로그인 상태 확인 오류:', error);
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    // 약간의 지연을 두어 깜빡임 방지
    const timer = setTimeout(checkLoginAndRedirect, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  // 빠른 리다이렉트를 위해 최소한의 로딩 화면
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">리다이렉트 중...</p>
        </div>
      </div>
    );
  }

  // 리다이렉트 중이므로 내용을 표시하지 않음
  return null;
}
