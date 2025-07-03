'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useToast } from '@/components/Toast';
import { useConfirmModal } from '@/components/ConfirmModal';

interface CustomerGroup {
  id: number;
  name: string;
  description: string;
  estimated_count: number;
  actual_count: number;
  status: string;
  use_yn: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_date: string;
  created_dept: string;
  updated_date?: string;
  updated_dept?: string;
  updated_emp_no?: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function CustomerGroupsPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 검색 조건 상태 (입력 중인 조건)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // 실제 검색에 사용되는 조건 (검색 버튼 클릭 시에만 업데이트)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('all');
  
  // 통계 데이터 상태
  const [statistics, setStatistics] = useState({
    totalGroups: 0,
    activeGroups: 0,
    totalEstimatedCount: 0,
    totalActualCount: 0
  });
  
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Strict Mode 중복 호출 방지를 위한 ref
  const hasInitialized = useRef(false);

  useEffect(() => {
    checkAuth();
    fetchCustomerGroups();
  }, []);

  // sessionStorage에서 사용자 정보 확인 및 DB에서 최신 정보 조회
  const checkAuth = () => {
    try {
      // sessionStorage에서 사용자 정보 확인
      const currentUserStr = sessionStorage.getItem('currentUser');
      
      if (!currentUserStr) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      
      const currentUser = JSON.parse(currentUserStr);
      
      // 기본 사용자 정보 유효성 검사
      if (!currentUser.id || !currentUser.email || !currentUser.name) {
        console.error('사용자 정보가 불완전합니다.');
        sessionStorage.clear();
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        router.push('/login');
        return;
      }
      
      // 현재 사용자 정보 설정
      setUser(currentUser);
      
      // 마지막 활동 시간 업데이트
      sessionStorage.setItem('lastActivity', Date.now().toString());
      
    } catch (error) {
      console.error('인증 확인 오류:', error);
      sessionStorage.clear();
      alert('인증 처리 중 오류가 발생했습니다. 다시 로그인해주세요.');
      router.push('/login');
    }
  };
  
  // 페이징 및 적용된 검색 조건 변경 시 자동 재조회
  useEffect(() => {
    if (!isLoading) { // 초기 로딩이 아닐 때만
      fetchCustomerGroups();
    }
  }, [pagination.page, pagination.limit, appliedSearchTerm, appliedFilterStatus]);

  const fetchCustomerGroups = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(
        `/api/customer-groups?page=${pagination.page}&limit=${pagination.limit}&search=${appliedSearchTerm}&status=${appliedFilterStatus}`
      );
      const data = await response.json();

      if (data.success) {
        setGroups(data.groups || []);
        setStatistics(data.statistics || {
          totalGroups: 0,
          activeGroups: 0,
          totalEstimatedCount: 0,
          totalActualCount: 0
        });
        setPagination({
          ...pagination,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.hasNext,
          hasPrev: data.pagination.hasPrev
        });
      } else {
        throw new Error(data.error || '고객군을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('고객군 조회 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800 border border-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 border border-gray-200',
      active: 'bg-green-100 text-green-800 border border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    
    const labels = {
      ACTIVE: '활성',
      INACTIVE: '비활성',
      active: '활성',
      inactive: '비활성'
    };

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // 활성/비활성 토글 함수
  const handleStatusToggle = async (groupId: number, currentStatus: string, groupName: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? '활성화' : '비활성화';
    const actionIcon = newStatus === 'ACTIVE' ? '✅' : '❌';
    
    const confirmed = await showConfirm(
      `고객군 ${action} 확인`,
      `"${groupName}" 고객군을 ${action}하시겠습니까?\n\n${actionIcon} ${action} 후에는 관련 캠페인에 영향을 줄 수 있습니다.`,
      {
        confirmText: `${actionIcon} ${action}하기`,
        cancelText: '취소',
        type: newStatus === 'ACTIVE' ? 'success' : 'warning'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/customer-groups/${groupId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(`고객군이 성공적으로 ${action}되었습니다! 🎉`, 'success');
        // 데이터 다시 조회
        fetchCustomerGroups();
      } else {
        if (data.details && data.details.activeCampaigns) {
          // 진행 중인 캠페인이 있는 경우 상세 정보 표시
          const campaignList = data.details.activeCampaigns
            .map((campaign: any) => `• ${campaign.name} (${campaign.status})`)
            .join('\n');
          
          showToast(`${data.error}\n\n📋 진행 중인 캠페인:\n${campaignList}`, 'error', 8000);
        } else {
          showToast(data.error || `고객군 ${action}에 실패했습니다.`, 'error');
        }
      }
    } catch (error: any) {
      console.error('고객군 상태 변경 오류:', error);
      showToast(`고객군 ${action} 중 오류가 발생했습니다.\n다시 시도해주세요.`, 'error');
    }
  };

  const handleSearch = () => {
    // 현재 입력된 검색 조건을 적용된 검색 조건으로 설정
    setAppliedSearchTerm(searchTerm);
    setAppliedFilterStatus(filterStatus);
    
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 검색 실행 (useEffect에서 자동으로 호출됨)
  };

  const handleReset = () => {
    // 입력 조건 초기화
    setSearchTerm('');
    setFilterStatus('all');
    
    // 적용된 검색 조건도 초기화
    setAppliedSearchTerm('');
    setAppliedFilterStatus('all');
    
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 리셋 실행 (useEffect에서 자동으로 호출됨)
  };

  const handleDelete = async (groupId: number, groupName: string) => {
    const confirmed = await showConfirm(
      '고객군 삭제 확인',
      `정말로 "${groupName}" 고객군을 삭제하시겠습니까?\n\n⚠️ 삭제된 고객군은 복구할 수 없습니다.\n\n🔍 캠페인 연관성을 확인한 후 삭제가 진행됩니다:\n• 관련 캠페인이 있는 경우 모든 캠페인이 완료 상태여야 삭제 가능합니다\n• 진행 중이거나 대기 중인 캠페인이 있으면 삭제가 거부됩니다`,
      {
        confirmText: '🗑️ 삭제하기',
        cancelText: '취소',
        type: 'danger'
      }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/customer-groups/${groupId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showToast('고객군이 성공적으로 삭제되었습니다! 🗑️', 'success');
        // 현재 페이지에서 데이터 다시 조회
        fetchCustomerGroups();
      } else {
        // API에서 반환하는 상세 에러 메시지 표시
        if (data.details && data.details.activeCampaigns) {
          const campaignList = data.details.activeCampaigns
            .map((campaign: any) => `• ${campaign.name} (${campaign.status})`)
            .join('\n');
          
          showToast(`${data.error}\n\n📋 관련 캠페인:\n${campaignList}`, 'error', 8000);
        } else {
          showToast(data.error || '고객군 삭제에 실패했습니다.', 'error');
        }
      }
    } catch (error: any) {
      console.error('고객군 삭제 오류:', error);
      showToast('고객군 삭제 중 오류가 발생했습니다.\n네트워크를 확인하고 다시 시도해주세요.', 'error');
    }
  };

  // 관리자 권한 확인
  const isAdmin = user?.role === 'admin';

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
      <Layout title="고객군 목록" subtitle="타겟 고객군을 생성하고 관리할 수 있습니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">고객군을 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="고객군 목록" subtitle="타겟 고객군을 생성하고 관리할 수 있습니다.">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">고객군 조회 실패</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchCustomerGroups}
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
      title="고객군 목록" 
      subtitle="타겟 고객군을 생성하고 관리할 수 있습니다."
    >
      <div className="p-6 space-y-6">
        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: '전체 고객군', 
              value: statistics.totalGroups, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '👥'
            },
            { 
              label: '활성 고객군', 
              value: statistics.activeGroups, 
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: '✅'
            },
            { 
              label: '예상 고객 수', 
              value: statistics.totalEstimatedCount.toLocaleString(), 
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              icon: '📊'
            },
            { 
              label: '실제 고객 수', 
              value: statistics.totalActualCount.toLocaleString(), 
              color: 'text-orange-600',
              bg: 'bg-orange-50',
              icon: '🎯'
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
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="고객군명 또는 생성자로 검색..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태 필터
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                검색
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                초기화
              </button>
              <Link
                href="/customers/new"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                새 고객군 만들기
              </Link>
            </div>
          </div>
        </div>

        {/* 고객군 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                고객군 목록 ({pagination.total}개 중 {groups.length}개 표시)
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
                <button
                  onClick={fetchCustomerGroups}
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

          {groups.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">고객군이 없습니다</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? '조건에 맞는 고객군을 찾을 수 없습니다.' 
                  : '새 고객군을 만들어 타겟 마케팅을 시작해보세요.'
                }
              </p>
              <Link
                href="/customers/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 새 고객군 만들기
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객군 정보
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객 수
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성 정보
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      수정 정보
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {group.name}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {group.description}
                          </div>
                          {/* <div className="flex flex-wrap gap-1">
                            {Object.keys(group.criteria).slice(0, 2).map((key, index) => (
                              <span 
                                key={index} 
                                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md border border-blue-200"
                              >
                                {key}
                              </span>
                            ))}
                            {Object.keys(group.criteria).length > 2 && (
                              <span className="text-xs text-gray-400 px-2 py-1">
                                +{Object.keys(group.criteria).length - 2}개 더
                              </span>
                            )}
                          </div> */}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(group.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {/* 예상: {group.estimated_count.toLocaleString()}명 */}
                          {group.estimated_count.toLocaleString()}명
                        </div>
                        {/* <div className="text-xs text-gray-500">
                          실제: {group.actual_count.toLocaleString()}명
                        </div> */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{group.created_by}</div>
                        <div className="text-xs text-gray-500">
                          {group.created_dept} ({group.created_date ? new Date(group.created_date).toLocaleDateString('ko-KR') : '-'})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{group.updated_emp_no || '-'}</div>
                        <div className="text-xs text-gray-500">
                          {group.updated_date ? new Date(group.updated_date).toLocaleDateString('ko-KR') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* 활성/비활성 토글 버튼 (관리자만) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleStatusToggle(group.id, group.status, group.name)}
                              className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                group.status === 'ACTIVE' 
                                  ? 'bg-green-600 focus:ring-green-500' 
                                  : 'bg-gray-300 focus:ring-gray-500'
                              }`}
                              title={`${group.status === 'ACTIVE' ? '비활성화' : '활성화'}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                  group.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                          
                          <button
                            onClick={() => router.push(`/customers/new?id=${group.id}&mode=view`)}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            상세보기
                          </button>
                          
                          <button
                            onClick={() => router.push(`/customers/new?id=${group.id}&mode=edit`)}
                            className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
                          >
                            수정
                          </button>
                          
                          {/* 삭제 버튼 (관리자만) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(group.id, group.name)}
                              className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
        </div>
      </div>
      
      {/* 토스트 및 모달 컴포넌트 */}
      <ToastContainer />
      <ConfirmModalComponent />
    </Layout>
  );
} 