'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useConfirmModal } from '@/components/ConfirmModal';

interface Script {
  id: number;
  name: string;
  description?: string;
  type: string;
  status: string;
  content: string;
  variables?: any; // JSON 데이터
  subject?: string; // 새로 추가된 제목 필드
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ChannelType {
  type: string;
  label: string;
}

interface CommonCode {
  category: string;
  sub_category: string;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export default function ScriptsPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 검색 조건 상태 (입력 중인 조건)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // 실제 검색에 사용되는 조건 (검색 버튼 클릭 시에만 업데이트)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedFilterType, setAppliedFilterType] = useState('all');
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('all');
  
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // 동적 옵션 데이터
  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
  const [statusOptions, setStatusOptions] = useState<CommonCode[]>([]);
  
  // 복사 모달 관련 상태
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [scriptToCopy, setScriptToCopy] = useState<Script | null>(null);
  const [copyScriptName, setCopyScriptName] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const loggedInUser = sessionStorage.getItem('currentUser');
        
        if (!loggedInUser) {
          router.push('/login');
          return;
        }
        
        const currentUser = JSON.parse(loggedInUser);
        setUser(currentUser);
        
        // 인증 확인 후 데이터 로드
        loadOptionsData();
        fetchScripts();
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // 관리자 권한 확인
  const isAdmin = user?.role === 'admin';

  // 페이징 및 적용된 검색 조건 변경 시 자동 재조회
  useEffect(() => {
    if (!isLoading) { // 초기 로딩이 아닐 때만
      fetchScripts();
    }
  }, [pagination.page, pagination.limit, appliedSearchTerm, appliedFilterType, appliedFilterStatus]);

  // 옵션 데이터 로딩
  const loadOptionsData = async () => {
    try {
      // 병렬로 모든 옵션 데이터 로딩
      const [channelTypesRes, statusRes] = await Promise.all([
        fetch('/api/channels/types'),
        fetch('/api/common-codes?category=SCRIPT&sub_category=STATUS')
      ]);

      // 채널 타입
      if (channelTypesRes.ok) {
        const channelData = await channelTypesRes.json();
        if (channelData.success) {
          setChannelTypes(channelData.data || []);
        }
      }

      // 상태 옵션
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.success) {
          setStatusOptions(statusData.data || []);
        }
      }
    } catch (error) {
      console.error('옵션 데이터 로딩 실패:', error);
    }
  };

  const fetchScripts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: appliedSearchTerm,
        type: appliedFilterType,
        status: appliedFilterStatus
      });

      const response = await fetch(`/api/scripts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setScripts(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false
        }));
      } else {
        throw new Error(data.error || '스크립트를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('스크립트 조회 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setAppliedFilterType(filterType);
    setAppliedFilterStatus(filterStatus);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setAppliedSearchTerm('');
    setAppliedFilterType('all');
    setAppliedFilterStatus('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  };

  // 스크립트 복사 함수
  const handleCopyScript = (script: Script) => {
    setScriptToCopy(script);
    setCopyScriptName(`${script.name} - 복사본`);
    setIsCopyModalOpen(true);
  };

  const executeCopyScript = async () => {
    if (!scriptToCopy || !copyScriptName.trim() || !user) {
      showToast('복사할 스크립트 정보가 올바르지 않습니다.', 'error');
      return;
    }

    try {
      setIsCopying(true);
      
      const response = await fetch(`/api/scripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: scriptToCopy.id,
          newName: copyScriptName.trim(),
          created_by: user.email
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('스크립트가 성공적으로 복사되었습니다.', 'success');
        setIsCopyModalOpen(false);
        setCopyScriptName('');
        setScriptToCopy(null);
        // 목록 새로고침
        fetchScripts();
      } else {
        throw new Error(data.message || '스크립트 복사에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('스크립트 복사 오류:', error);
      showToast(error.message || '스크립트 복사 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const closeCopyModal = () => {
    setIsCopyModalOpen(false);
    setCopyScriptName('');
    setScriptToCopy(null);
  };

  // 활성/비활성 토글 함수
  const handleStatusToggle = async (scriptId: number, currentStatus: string, scriptName: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? '활성화' : '비활성화';
    const actionIcon = newStatus === 'active' ? '✅' : '❌';
    
    const confirmed = await showConfirm(
      `스크립트 ${action} 확인`,
      `"${scriptName}" 스크립트를 ${action}하시겠습니까?\n\n${actionIcon} ${action} 후에는 관련 캠페인에 영향을 줄 수 있습니다.`,
      {
        confirmText: `${actionIcon} ${action}하기`,
        cancelText: '취소',
        type: newStatus === 'active' ? 'success' : 'warning'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(`스크립트가 성공적으로 ${action}되었습니다! 🎉`, 'success');
        // 데이터 다시 조회
        fetchScripts();
      } else {
        showToast(data.error || `스크립트 ${action}에 실패했습니다.`, 'error');
      }
    } catch (error: any) {
      console.error(`스크립트 ${action} 오류:`, error);
      showToast(`스크립트 ${action} 중 오류가 발생했습니다.`, 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800'
    };
    
    // 동적 데이터에서 라벨 찾기
    const statusOption = statusOptions.find(opt => opt.code === status);
    const label = statusOption ? statusOption.name : status;

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${badges[status as keyof typeof badges]}`}>
        {label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'sms': return '📱';
      case 'push': return '🔔';
      case 'alimtalk': return '💬';
      default: return '📄';
    }
  };

  const getTypeLabel = (type: string) => {
    // 동적 데이터에서 라벨 찾기
    const channelType = channelTypes.find(ct => ct.type === type);
    return channelType ? channelType.label : type;
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

  if (isLoading) {
    return (
      <Layout title="스크립트 관리" subtitle="마케팅 메시지 템플릿을 생성하고 관리할 수 있습니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">스크립트를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="스크립트 관리" subtitle="마케팅 메시지 템플릿을 생성하고 관리할 수 있습니다.">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트 조회 실패</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchScripts}
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
      title="스크립트 관리" 
      subtitle="마케팅 메시지 템플릿을 생성하고 관리할 수 있습니다."
    >
      <div className="p-6 space-y-6">
        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              label: '전체 스크립트', 
              value: pagination.total, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '📄'
            },
            { 
              label: '활성', 
              value: scripts.filter(s => s.status === 'active').length, 
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              icon: '🚀'
            },
            { 
              label: '초안', 
              value: scripts.filter(s => s.status === 'draft').length, 
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              icon: '📝'
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
                placeholder="스크립트명, 제목, 내용 또는 생성자로 검색..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">유형</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                {channelTypes.map((channelType) => (
                  <option key={channelType.type} value={channelType.type}>
                    {channelType.label}
                  </option>
                ))}
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
                {statusOptions.map((statusOption) => (
                  <option key={statusOption.code} value={statusOption.code}>
                    {statusOption.name}
                  </option>
                ))}
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
              <Link
                href="/scripts/new"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                새 스크립트 만들기
              </Link>
            </div>
          </div>
        </div>

        {/* 스크립트 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                스크립트 목록 ({pagination.total}개 중 {scripts.length}개 표시)
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
                  onClick={fetchScripts}
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

          {scripts.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트가 없습니다</h3>
              <p className="text-gray-500 mb-6">
                조건에 맞는 스크립트를 찾을 수 없습니다.
              </p>
              <Link
                href="/scripts/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 새 스크립트 만들기
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스크립트 정보</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목/내용</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성 정보</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scripts.map((script) => (
                      <tr key={script.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{script.name}</div>
                            {script.description && (
                              <div className="text-sm text-gray-500">{script.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            {script.subject && (
                              <div className="text-sm font-medium text-gray-900 mb-1">{script.subject}</div>
                            )}
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {script.content}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{getTypeIcon(script.type)}</span>
                            <span className="text-sm text-gray-900">{getTypeLabel(script.type)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(script.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{script.created_by}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(script.created_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {/* 활성/비활성 토글 스위치 (관리자만) */}
                            {isAdmin && (
                              <button
                                onClick={() => handleStatusToggle(script.id, script.status, script.name)}
                                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                  script.status === 'active' 
                                    ? 'bg-green-600 focus:ring-green-500' 
                                    : 'bg-gray-300 focus:ring-gray-500'
                                }`}
                                title={`${script.status === 'active' ? '비활성화' : '활성화'}`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                    script.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            )}
                            
                            {/* 수정 버튼 (관리자만) */}
                            {isAdmin && (
                              <button
                                onClick={() => router.push(`/scripts/new?mode=edit&id=${script.id}`)}
                                className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                수정
                              </button>
                            )}
                            
                            <button 
                              onClick={() => router.push(`/scripts/new?mode=view&id=${script.id}`)}
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                            >
                              상세보기
                            </button>
                            
                            <button 
                              onClick={() => handleCopyScript(script)}
                              className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors"
                            >
                              복사
                            </button>
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
                    <span>총 {pagination.total.toLocaleString()}개</span>
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
      
      {/* 토스트 및 모달 컴포넌트 */}
      <ToastContainer />
      <ConfirmModalComponent />
      
      {/* 스크립트 복사 모달 */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                스크립트 복사
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                "{scriptToCopy?.name}" 스크립트를 복사합니다.
              </p>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                <span className="text-red-500 mr-2">*</span>
                새 스크립트명
              </label>
              <input
                type="text"
                value={copyScriptName}
                onChange={(e) => setCopyScriptName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-3 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 backdrop-blur-sm bg-white/80 hover:border-purple-300"
                placeholder="복사할 스크립트의 새 이름을 입력하세요"
                maxLength={255}
                disabled={isCopying}
              />
              <div className="mt-2 text-sm text-gray-500">
                {copyScriptName.length}/255자
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={closeCopyModal}
                disabled={isCopying}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={executeCopyScript}
                disabled={isCopying || !copyScriptName.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCopying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>복사 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>복사하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 