'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface ManageUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  department?: string;
  lastLogin?: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminPasswordsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<ManageUser[]>([]); // 전체 사용자 데이터
  const [displayUsers, setDisplayUsers] = useState<ManageUser[]>([]); // 현재 페이지에 표시할 사용자
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // 더미 데이터 생성 함수
  const generateDummyUsers = (): ManageUser[] => {
    const roles: ('admin' | 'manager' | 'user' | 'viewer')[] = ['admin', 'manager', 'user', 'viewer'];
    const statuses: ('active' | 'inactive' | 'pending' | 'suspended')[] = ['active', 'inactive', 'pending', 'suspended'];
    const departments = ['IT', '마케팅', '영업', '기획', '고객지원', '운영', '재무', '인사', '개발', '디자인'];
    const names = [
      '김철수', '이영희', '박민수', '최지영', '정우진', '강미나', '조현우', '윤서연', '임성호', '한지원',
      '오준석', '송미경', '신동훈', '배수진', '홍길동', '문정아', '유재석', '김태희', '이승기', '박보영',
      '최민식', '전지현', '송강호', '김혜수', '한석규', '고현정', '설경구', '김윤석', '유아인', '이병헌'
    ];

    const users: ManageUser[] = [];
    
    for (let i = 1; i <= 47; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      
      users.push({
        id: i,
        email: `user${i}@company.com`,
        name: `${name} ${i}`,
        role,
        status,
        department,
        lastLogin: status === 'active' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        loginCount: Math.floor(Math.random() * 1000),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        permissions: role === 'admin' ? ['all'] : ['campaigns', 'customers']
      });
    }
    
    return users;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedInUser = sessionStorage.getItem('currentUser');
        
        if (!loggedInUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(loggedInUser);
        
        // 관리자만 접근 가능
        if (userData.role !== 'admin') {
          alert('관리자만 접근할 수 있습니다.');
          router.push('/dashboard');
          return;
        }

        setUser(userData);
        
        // 더미 데이터 생성
        const dummyUsers = generateDummyUsers();
        setAllUsers(dummyUsers);
        
        // 페이징 정보 설정
        const totalCount = dummyUsers.length;
        const totalPages = Math.ceil(totalCount / pagination.limit);
        
        setPagination(prev => ({
          ...prev,
          totalCount,
          totalPages,
          hasNext: prev.page < totalPages,
          hasPrev: prev.page > 1
        }));
        
        setIsLoading(false);
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // 페이징 변경 시 표시할 사용자 업데이트
  useEffect(() => {
    if (allUsers.length > 0) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const usersForCurrentPage = allUsers.slice(startIndex, endIndex);
      
      setDisplayUsers(usersForCurrentPage);
      
      // 페이징 정보 업데이트
      setPagination(prev => ({
        ...prev,
        hasNext: pagination.page < prev.totalPages,
        hasPrev: pagination.page > 1
      }));
    }
  }, [allUsers, pagination.page, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    const totalPages = Math.ceil(allUsers.length / newSize);
    setPagination(prev => ({ 
      ...prev, 
      limit: newSize, 
      page: 1,
      totalPages,
      hasNext: 1 < totalPages,
      hasPrev: false
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'manager': return '매니저';
      case 'user': return '사용자';
      case 'viewer': return '조회자';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'pending': return '대기중';
      case 'suspended': return '정지';
      default: return status;
    }
  };

  // 페이지 번호 범위 계산 (최대 10개 페이지 번호만 표시)
  const getPageRange = () => {
    const maxVisible = 10;
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (!user && isLoading) {
    return (
      <Layout title="사용자 관리" subtitle="시스템 사용자를 관리합니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && displayUsers.length === 0) {
    return (
      <Layout title="사용자 관리" subtitle="시스템 사용자를 관리합니다.">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 조회 실패</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
      </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="사용자 관리" 
      subtitle="마케팅 캠페인을 사용하는 사용자 패스워드를 설정하고 관리할 수 있습니다."
    >
      <div className="p-6 space-y-6">
        {/* 액션 버튼 */}
        <div className="flex items-center justify-end">
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              새 사용자 추가
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2" />
              </svg>
              비밀번호 재설정
            </button>
          </div>
        </div>

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: '전체 사용자', 
              value: allUsers.length, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '👥'
            },
            { 
              label: '활성 사용자', 
              value: allUsers.filter(u => u.status === 'active').length, 
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: '✅'
            },
            { 
              label: '대기 중', 
              value: allUsers.filter(u => u.status === 'pending').length, 
              color: 'text-yellow-600',
              bg: 'bg-yellow-50',
              icon: '⏳'
            },
            { 
              label: '비활성', 
              value: allUsers.filter(u => u.status === 'inactive').length, 
              color: 'text-gray-600',
              bg: 'bg-gray-50',
              icon: '💤'
            }
          ].map((stat, index) => (
            <div key={index} className={`${stat.bg} rounded-xl p-6 border border-opacity-20`}>
              <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                사용자 목록 ({pagination.totalCount}개 중 {displayUsers.length}개 표시)
              </h3>
              <div className="flex items-center space-x-3">
                <select
                  value={pagination.limit}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5개씩</option>
                  <option value={10}>10개씩</option>
                  <option value={20}>20개씩</option>
                  <option value={50}>50개씩</option>
                </select>
                <span className="text-sm text-gray-600">
                  페이지 {pagination.page} / {pagination.totalPages}
                </span>
            </div>
          </div>
        </div>

          {displayUsers.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">사용자가 없습니다</h3>
              <p className="text-gray-500 mb-6">
                등록된 사용자가 없습니다.
              </p>
              <button
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 새 사용자 추가
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자 정보</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부서</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활동</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleText(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {getStatusText(user.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.department || '미지정'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            로그인 {user.loginCount}회
          </div>
                          <div className="text-xs text-gray-500">
                            {user.lastLogin 
                              ? `최근: ${new Date(user.lastLogin).toLocaleDateString('ko-KR')}`
                              : '로그인 기록 없음'
                            }
        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors">편집</button>
                            <button className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors">권한</button>
                            <button className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors">비밀번호</button>
                            {user.status === 'active' ? (
                              <button className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors">비활성화</button>
                            ) : user.status === 'pending' ? (
                              <button className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors">승인</button>
                            ) : (
                              <button className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors">활성화</button>
                            )}
                </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이징 */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0">
                  {/* 왼쪽: 간단한 정보 */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{pagination.page}</span>
                    <span className="mx-1 text-gray-400">/</span>
                    <span>{pagination.totalPages}페이지</span>
                    <span className="mx-3 text-gray-400">•</span>
                    <span>총 {pagination.totalCount.toLocaleString()}개</span>
            </div>

                                     {/* 가운데: 페이지 네비게이션 */}
                   {pagination.totalPages > 1 && (
                     <div className="flex items-center space-x-2 sm:mx-8">
                      {/* 처음/이전 버튼 */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.page === 1}
                                                     className={`p-2 rounded-lg transition-all duration-200 ${
                             pagination.page === 1
                               ? 'text-gray-300 cursor-not-allowed'
                               : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'
                           }`}
                          title="첫 페이지"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={!pagination.hasPrev}
                                                     className={`p-2 rounded-lg transition-all duration-200 ${
                             !pagination.hasPrev
                               ? 'text-gray-300 cursor-not-allowed'
                               : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'
                           }`}
                          title="이전 페이지"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
                        </button>
                      </div>

                      {/* 페이지 번호들 */}
                      <div className="flex items-center space-x-1">
                        {getPageRange().map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                                                         className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all duration-200 ${
                               pageNum === pagination.page
                                 ? 'bg-blue-600 text-white shadow-md'
                                 : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                             }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      {/* 다음/마지막 버튼 */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={!pagination.hasNext}
                                                     className={`p-2 rounded-lg transition-all duration-200 ${
                             !pagination.hasNext
                               ? 'text-gray-300 cursor-not-allowed'
                               : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'
                           }`}
                          title="다음 페이지"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.page === pagination.totalPages}
                                                     className={`p-2 rounded-lg transition-all duration-200 ${
                             pagination.page === pagination.totalPages
                               ? 'text-gray-300 cursor-not-allowed'
                               : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'
                           }`}
                          title="마지막 페이지"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      </div>
                    )}

                                     {/* 오른쪽: 페이지 점프 (간단하게) */}
                   {pagination.totalPages > 10 && (
                     <div className="flex items-center space-x-2 sm:ml-8">
                      <span className="text-xs text-gray-500">이동:</span>
                      <select
                        value={pagination.page}
                        onChange={(e) => handlePageChange(Number(e.target.value))}
                                                 className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <option key={pageNum} value={pageNum}>
                            {pageNum}
                          </option>
                        ))}
                      </select>
                  </div>
                  )}
                </div>
            </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
} 