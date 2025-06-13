'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkLoginAndRedirect = () => {
      try {
        const loggedInUser = localStorage.getItem('currentUser');
        if (loggedInUser) {
          // 로그인된 사용자는 dashboard로 리다이렉션
          router.push('/dashboard');
        } else {
          // 로그인되지 않은 사용자는 로그인 페이지로
          router.push('/login');
        }
      } catch (error) {
        console.error('로그인 상태 확인 오류:', error);
        router.push('/login');
      }
    };

    checkLoginAndRedirect();
  }, [router]);

  // 로딩 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">페이지를 준비하고 있습니다...</p>
      </div>
    </div>
  );
}
