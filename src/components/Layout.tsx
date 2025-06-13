'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AutoLogout from '@/components/AutoLogout';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface MenuItem {
  title: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
}

// 메뉴 구조 정의
const menuItems: MenuItem[] = [
  { 
    title: '대시보드', 
    path: '/dashboard',
    icon: '🏠'
  },
  {
    title: '캠페인',
    icon: '🎯',
    children: [
      { title: '캠페인 목록', path: '/campaigns' },
      { title: '캠페인 생성', path: '/campaigns/new?reset=true' },
      { title: '캠페인 승인대기 목록', path: '/campaigns/pending' },
      { title: '캠페인 이력관리', path: '/campaigns/history' },
    ]
  },
  {
    title: '고객군',
    icon: '👥',
    children: [
      { title: '고객군 목록', path: '/customers' },
      { title: '고객군 생성', path: '/customers/new?reset=true' },
    ]
  },
  {
    title: '오퍼',
    icon: '🎁',
    children: [
      { title: '오퍼 목록', path: '/offers' },
      { title: '오퍼 생성', path: '/offers/new?reset=true' },
    ]
  },
  {
    title: '스크립트',
    icon: '📝',
    children: [
      { title: '스크립트 목록', path: '/scripts' },
      { title: '스크립트 생성', path: '/scripts/new?reset=true' },
    ]
  },
  {
    title: '결과분석',
    icon: '📊',
    children: [
      { title: '캠페인별 결과분석', path: '/analytics/campaigns' },
      { title: '오퍼별 결과분석', path: '/analytics/offers' },
      { title: '채널별 결과분석', path: '/analytics/channels' },
      { title: '기간별 결과분석', path: '/analytics/periods' },
    ]
  },
  {
    title: '운영관리',
    icon: '⚙️',
    children: [
      { title: '공지사항 관리', path: '/admin/notices' },
      { title: '채널 관리', path: '/admin/channels' },
      { title: '사용자 관리', path: '/admin/passwords' },
      { title: '시스템 로그', path: '/admin/logs' },
    ]
  },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const loggedInUser = localStorage.getItem('currentUser');
        
        if (!loggedInUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(loggedInUser);
        setUser(userData);

        // 현재 경로에 따라 자동으로 메뉴 열기
        const currentMenu = findMenuForPath(pathname);
        if (currentMenu) {
          setOpenMenus(prev => ({
            ...prev,
            [currentMenu]: true
          }));
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router, pathname]);

  const findMenuForPath = (path: string) => {
    // 쿼리 파라미터 제거하여 기본 경로만 비교
    const cleanPath = path.split('?')[0];
    
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          const childCleanPath = child.path?.split('?')[0];
          if (childCleanPath === cleanPath) {
            return item.title;
          }
        }
      }
    }
    return null;
  };

  const isMenuActive = (menuPath?: string) => {
    if (!menuPath) return false;
    // 쿼리 파라미터 제거하여 기본 경로만 비교
    const cleanMenuPath = menuPath.split('?')[0];
    const cleanPathname = pathname.split('?')[0];
    return cleanPathname === cleanMenuPath;
  };

  const isParentMenuActive = (item: MenuItem) => {
    if (item.children) {
      const cleanPathname = pathname.split('?')[0];
      return item.children.some(child => {
        const childCleanPath = child.path?.split('?')[0];
        return cleanPathname === childCleanPath;
      });
    }
    return false;
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('currentUser');
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      alert('로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  const toggleMenu = (menuTitle: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuTitle]: !prev[menuTitle]
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AutoLogout />
      
      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-full mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">마케팅 캠페인 관리 시스템</h1>
            </div>

            {/* 사용자 정보 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-medium text-sm">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{user.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 레이아웃 */}
      <div className="flex">
        {/* 사이드바 */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm border-r border-gray-200 transition-all duration-300`}>
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <div key={item.title}>
                    {item.children ? (
                      <div>
                        <button
                          onClick={() => toggleMenu(item.title)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                            isParentMenuActive(item)
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-lg mr-3">{item.icon}</span>
                            {!sidebarCollapsed && <span>{item.title}</span>}
                          </div>
                          {!sidebarCollapsed && (
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${openMenus[item.title] ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                        {openMenus[item.title] && !sidebarCollapsed && (
                          <div className="ml-6 mt-2 space-y-1 pl-6 border-l-2 border-gray-100">
                            {item.children.map((child) => (
                              <Link
                                key={child.title}
                                href={child.path || '#'}
                                className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                  isMenuActive(child.path)
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.path || '#'}
                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isMenuActive(item.path)
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg mr-3">{item.icon}</span>
                        {!sidebarCollapsed && <span>{item.title}</span>}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1">
          {title && (
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="max-w-full mx-auto">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
              </div>
            </div>
          )}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 