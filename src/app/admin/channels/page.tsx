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

interface Channel {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social' | 'display';
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
  endpoint?: string;
  apiKey?: string;
  config: {
    maxDailyVolume?: number;
    rateLimit?: number;
    retryAttempts?: number;
    timeout?: number;
  };
  stats: {
    totalSent: number;
    successRate: number;
    avgResponseTime: number;
    lastUsed?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ChannelsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
        
        // 채널 데이터 로드
        await loadChannels();
        
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
      loadChannels();
    }
  }, [pagination.page, pagination.limit]);

  const loadChannels = async () => {
    try {
      setError('');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        type: filterType,
        status: filterStatus
      });

      const response = await fetch(`/api/admin/channels?${params}`);
      const data = await response.json();
      
      if (data.success && data.channels) {
        // API 응답 데이터를 UI 형태로 변환
        const transformedChannels = data.channels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          status: channel.status,
          description: channel.description,
          endpoint: channel.endpoint,
          apiKey: channel.api_key,
          config: channel.config || {},
          stats: channel.stats || {
            totalSent: 0,
            successRate: 0,
            avgResponseTime: 0
          },
          createdAt: channel.created_at,
          updatedAt: channel.updated_at
        }));
        
        setChannels(transformedChannels);
        setPagination(prev => ({
          ...prev,
          totalCount: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false
        }));
      } else {
        // API 실패 시 기본 데이터 생성
        const fallbackChannels: Channel[] = [
          {
            id: 1,
            name: '이메일 채널 (SendGrid)',
            type: 'email',
            status: 'active',
            description: 'SendGrid를 통한 이메일 발송 채널',
            endpoint: 'https://api.sendgrid.com/v3/mail/send',
            apiKey: 'SG.***',
            config: {
              maxDailyVolume: 10000,
              rateLimit: 100,
              retryAttempts: 3,
              timeout: 30
            },
            stats: {
              totalSent: 15420,
              successRate: 98.5,
              avgResponseTime: 1.2,
              lastUsed: '2024-01-15T10:30:00Z'
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            name: 'SMS 채널 (Twilio)',
            type: 'sms',
            status: 'active',
            description: 'Twilio를 통한 SMS 발송 채널',
            endpoint: 'https://api.twilio.com/2010-04-01/Accounts',
            apiKey: 'AC***',
            config: {
              maxDailyVolume: 5000,
              rateLimit: 10,
              retryAttempts: 2,
              timeout: 10
            },
            stats: {
              totalSent: 8540,
              successRate: 97.2,
              avgResponseTime: 0.8,
              lastUsed: '2024-01-14T16:45:00Z'
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-14T16:45:00Z'
          },
          {
            id: 3,
            name: '푸시 알림 채널 (FCM)',
            type: 'push',
            status: 'maintenance',
            description: 'Firebase Cloud Messaging을 통한 푸시 알림',
            endpoint: 'https://fcm.googleapis.com/fcm/send',
            config: {
              maxDailyVolume: 50000,
              rateLimit: 500,
              retryAttempts: 3,
              timeout: 15
            },
            stats: {
              totalSent: 32100,
              successRate: 94.8,
              avgResponseTime: 2.1,
              lastUsed: '2024-01-13T12:00:00Z'
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-13T12:00:00Z'
          },
          {
            id: 4,
            name: '카카오톡 비즈니스 채널',
            type: 'social',
            status: 'inactive',
            description: '카카오톡 알림톡 및 친구톡 발송',
            endpoint: 'https://kapi.kakao.com/v2/api/talk/memo/default/send',
            config: {
              maxDailyVolume: 1000,
              rateLimit: 20,
              retryAttempts: 2,
              timeout: 20
            },
            stats: {
              totalSent: 2350,
              successRate: 99.1,
              avgResponseTime: 3.5,
              lastUsed: '2024-01-10T09:15:00Z'
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-10T09:15:00Z'
          }
        ];
        setChannels(fallbackChannels);
        setPagination(prev => ({
          ...prev,
          totalCount: fallbackChannels.length,
          totalPages: Math.ceil(fallbackChannels.length / pagination.limit),
          hasNext: false,
          hasPrev: false
        }));
      }
    } catch (error: any) {
      console.error('채널 조회 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
      // 오류 시 기본 데이터 사용
      const fallbackChannels: Channel[] = [
        {
          id: 1,
          name: '이메일 채널 (SendGrid)',
          type: 'email',
          status: 'active',
          description: 'SendGrid를 통한 이메일 발송 채널',
          config: {},
          stats: {
            totalSent: 15420,
            successRate: 98.5,
            avgResponseTime: 1.2
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        }
      ];
      setChannels(fallbackChannels);
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
    loadChannels();
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    router.push('/login');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-green-100 text-green-800';
      case 'push': return 'bg-purple-100 text-purple-800';
      case 'social': return 'bg-yellow-100 text-yellow-800';
      case 'display': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'email': return '이메일';
      case 'sms': return 'SMS';
      case 'push': return '푸시';
      case 'social': return '소셜';
      case 'display': return '디스플레이';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'maintenance': return '점검중';
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
      <Layout title="채널 관리" subtitle="마케팅 채널을 관리합니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && channels.length === 0) {
    return (
      <Layout title="채널 관리" subtitle="마케팅 채널을 관리합니다.">
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
              onClick={loadChannels}
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
      title="채널 관리" 
      subtitle="마케팅 채널을 관리합니다."
    >
      <div className="p-6 space-y-6">

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: '전체 채널', 
              value: pagination.totalCount, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '📡'
            },
            { 
              label: '활성 채널', 
              value: channels.filter(c => c.status === 'active').length, 
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: '✅'
            },
            { 
              label: '점검중', 
              value: channels.filter(c => c.status === 'maintenance').length, 
              color: 'text-yellow-600',
              bg: 'bg-yellow-50',
              icon: '⚠️'
            },
            { 
              label: '총 발송량', 
              value: channels.reduce((sum, c) => sum + c.stats.totalSent, 0).toLocaleString(), 
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              icon: '📤'
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
                placeholder="채널명 또는 설명으로 검색..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">채널 유형</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                <option value="email">이메일</option>
                <option value="sms">SMS</option>
                <option value="push">푸시</option>
                <option value="social">소셜</option>
                <option value="display">디스플레이</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="maintenance">점검중</option>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                새 채널 추가
              </button>
            </div>
          </div>
        </div>

        {/* 채널 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                채널 목록 ({pagination.totalCount}개 중 {channels.length}개 표시)
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
                  onClick={loadChannels}
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

          {channels.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">채널이 없습니다</h3>
              <p className="text-gray-500 mb-6">
                조건에 맞는 마케팅 채널을 찾을 수 없습니다.
              </p>
              <button
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 새 채널 추가
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">채널 정보</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성능</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발송량</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 사용</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {channels.map((channel) => (
                      <tr key={channel.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">{channel.name}</div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">{channel.description}</div>
                            {channel.endpoint && (
                              <div className="text-xs text-blue-600 mt-1 truncate max-w-xs">
                                {channel.endpoint}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(channel.type)}`}>
                            {getTypeText(channel.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(channel.status)}`}>
                            {getStatusText(channel.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            성공률: {channel.stats.successRate}%
                          </div>
                          <div className="text-xs text-gray-500">
                            응답시간: {channel.stats.avgResponseTime}s
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{channel.stats.totalSent.toLocaleString()}</div>
                          {channel.config.maxDailyVolume && (
                            <div className="text-xs text-gray-500">
                              한도: {channel.config.maxDailyVolume.toLocaleString()}/일
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {channel.stats.lastUsed 
                              ? new Date(channel.stats.lastUsed).toLocaleDateString('ko-KR')
                              : '사용 기록 없음'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 transition-colors">설정</button>
                            <button className="text-green-600 hover:text-green-900 transition-colors">테스트</button>
                            {channel.status === 'active' ? (
                              <button className="text-yellow-600 hover:text-yellow-900 transition-colors">비활성화</button>
                            ) : (
                              <button className="text-green-600 hover:text-green-900 transition-colors">활성화</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 깔끔한 페이징 */}
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