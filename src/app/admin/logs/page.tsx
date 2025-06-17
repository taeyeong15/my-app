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

interface SystemLog {
  id: number;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  category: 'system' | 'user' | 'campaign' | 'security' | 'api';
  message: string;
  details?: string;
  userId?: number;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function LogsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedInUser = localStorage.getItem('currentUser');
        
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
        
        // 로그 데이터 로드
        await loadLogs();
        
        setIsLoading(false);
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // 페이징만 자동 재조회 (검색 조건은 검색 버튼으로만)
  useEffect(() => {
    if (user && !isLoading) { // 초기 로딩이 아닐 때만
      loadLogs();
    }
  }, [pagination.page, pagination.limit]);

  const loadLogs = async () => {
    try {
      setError('');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        level: filterLevel,
        category: filterCategory
      });

      const response = await fetch(`/api/admin/logs?${params}`);
      const data = await response.json();
      
      if (data.success && data.logs) {
        // API 응답 데이터를 UI 형태로 변환
        const transformedLogs = data.logs.map((log: any) => ({
          id: log.id,
          timestamp: log.timestamp,
          level: log.level,
          category: log.category,
          message: log.message,
          details: log.details,
          userId: log.user_id,
          userName: log.user_name,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          metadata: log.metadata,
          createdAt: log.created_at
        }));
        
        setLogs(transformedLogs);
        setPagination(prev => ({
          ...prev,
          totalCount: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false
        }));
      } else {
        // API 실패 시 기본 데이터 생성
        const fallbackLogs: SystemLog[] = [
          {
            id: 1,
            timestamp: '2024-01-15T10:30:25.123Z',
            level: 'info',
            category: 'user',
            message: '사용자 로그인 성공',
            details: '관리자 계정으로 로그인',
            userId: 1,
            userName: '시스템 관리자',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            metadata: { sessionId: 'sess_abc123', loginMethod: 'password' },
            createdAt: '2024-01-15T10:30:25.123Z'
          },
          {
            id: 2,
            timestamp: '2024-01-15T10:25:18.456Z',
            level: 'warn',
            category: 'security',
            message: '잘못된 비밀번호 시도',
            details: '계정: test@example.com에서 3회 연속 실패',
            ipAddress: '203.0.113.5',
            userAgent: 'curl/7.68.0',
            metadata: { attemptCount: 3, blocked: false },
            createdAt: '2024-01-15T10:25:18.456Z'
          },
          {
            id: 3,
            timestamp: '2024-01-15T10:15:42.789Z',
            level: 'error',
            category: 'campaign',
            message: '캠페인 발송 실패',
            details: 'Campaign ID 123: SMTP 연결 오류',
            userId: 2,
            userName: '마케팅 매니저',
            ipAddress: '192.168.1.105',
            metadata: { campaignId: 123, errorCode: 'SMTP_CONN_FAILED', retryCount: 2 },
            createdAt: '2024-01-15T10:15:42.789Z'
          },
          {
            id: 4,
            timestamp: '2024-01-15T10:10:15.321Z',
            level: 'info',
            category: 'system',
            message: '시스템 백업 완료',
            details: '데이터베이스 백업이 성공적으로 완료됨',
            metadata: { backupSize: '2.3GB', duration: '5m 23s', location: '/backup/db_20240115.sql' },
            createdAt: '2024-01-15T10:10:15.321Z'
          },
          {
            id: 5,
            timestamp: '2024-01-15T09:45:33.654Z',
            level: 'debug',
            category: 'api',
            message: 'API 요청 처리',
            details: 'GET /api/campaigns - 200 OK',
            userId: 3,
            userName: '일반 사용자',
            ipAddress: '192.168.1.110',
            userAgent: 'PostmanRuntime/7.32.2',
            metadata: { endpoint: '/api/campaigns', method: 'GET', responseTime: '125ms', statusCode: 200 },
            createdAt: '2024-01-15T09:45:33.654Z'
          }
        ];
        setLogs(fallbackLogs);
        setPagination(prev => ({
          ...prev,
          totalCount: fallbackLogs.length,
          totalPages: Math.ceil(fallbackLogs.length / pagination.limit),
          hasNext: false,
          hasPrev: false
        }));
      }
    } catch (error: any) {
      console.error('로그 조회 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
      // 오류 시 기본 데이터 사용
      const fallbackLogs: SystemLog[] = [
        {
          id: 1,
          timestamp: '2024-01-15T10:30:25.123Z',
          level: 'info',
          category: 'system',
          message: '시스템 로그 조회 오류',
          details: '데이터베이스 연결 실패',
          createdAt: '2024-01-15T10:30:25.123Z'
        }
      ];
      setLogs(fallbackLogs);
      setPagination(prev => ({
        ...prev,
        totalCount: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }));
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadLogs();
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterLevel('all');
    setFilterCategory('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return 'bg-gray-100 text-gray-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'fatal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'debug': return '디버그';
      case 'info': return '정보';
      case 'warn': return '경고';
      case 'error': return '오류';
      case 'fatal': return '치명적';
      default: return level;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      case 'campaign': return 'bg-purple-100 text-purple-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'api': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'system': return '시스템';
      case 'user': return '사용자';
      case 'campaign': return '캠페인';
      case 'security': return '보안';
      case 'api': return 'API';
      default: return category;
    }
  };

  if (!user && isLoading) {
    return (
      <Layout title="시스템 로그" subtitle="시스템 로그를 조회합니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && logs.length === 0) {
    return (
      <Layout title="시스템 로그" subtitle="시스템 로그를 조회합니다.">
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
              onClick={loadLogs}
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
      title="시스템 로그" 
      subtitle="시스템 로그를 조회합니다."
    >
      <div className="p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">시스템 로그</h1>
            <p className="mt-1 text-sm text-gray-600">
              환영합니다, {user?.name}님! 시스템 로그를 조회하세요.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: '전체 로그', 
              value: pagination.totalCount, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '📄'
            },
            { 
              label: '오류 로그', 
              value: logs.filter(l => l.level === 'error' || l.level === 'fatal').length, 
              color: 'text-red-600',
              bg: 'bg-red-50',
              icon: '🚨'
            },
            { 
              label: '경고 로그', 
              value: logs.filter(l => l.level === 'warn').length, 
              color: 'text-yellow-600',
              bg: 'bg-yellow-50',
              icon: '⚠️'
            },
            { 
              label: '보안 로그', 
              value: logs.filter(l => l.category === 'security').length, 
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              icon: '🔒'
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

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="메시지 또는 사용자명으로 검색..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">로그 레벨</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                <option value="debug">디버그</option>
                <option value="info">정보</option>
                <option value="warn">경고</option>
                <option value="error">오류</option>
                <option value="fatal">치명적</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                <option value="system">시스템</option>
                <option value="user">사용자</option>
                <option value="campaign">캠페인</option>
                <option value="security">보안</option>
                <option value="api">API</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                검색
              </button>
              <button
                onClick={handleReset}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                초기화
              </button>
            </div>
            <div className="flex items-end">
              <button
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                로그 내보내기
              </button>
            </div>
          </div>
        </div>

        {/* 로그 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                시스템 로그 ({pagination.totalCount}개 중 {logs.length}개 표시)
              </h3>
              <div className="flex items-center space-x-3">
                <select
                  value={pagination.limit}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5개씩</option>
                  <option value={10}>10개씩</option>
                  <option value={50}>50개씩</option>
                  <option value={100}>100개씩</option>
                </select>
                <button
                  onClick={loadLogs}
                  className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  새로고침
                </button>
              </div>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">로그가 없습니다</h3>
              <p className="text-gray-500 mb-6">
                조건에 맞는 시스템 로그를 찾을 수 없습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getLevelColor(log.level)}`}>
                            {getLevelText(log.level)}
                          </span>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(log.category)}`}>
                            {getCategoryText(log.category)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">{log.message}</h4>
                          {log.details && (
                            <p className="text-sm text-gray-600">{log.details}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          {log.userName && (
                            <span>사용자: {log.userName}</span>
                          )}
                          {log.ipAddress && (
                            <span>IP: {log.ipAddress}</span>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <span>추가 정보: {Object.keys(log.metadata).length}개 항목</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors">
                          상세보기
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이징 */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className={`px-3 py-1 rounded-md ${
                      pagination.hasPrev
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    이전
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-md ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className={`px-3 py-1 rounded-md ${
                      pagination.hasNext
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    다음
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
} 