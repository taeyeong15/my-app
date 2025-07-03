'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useToast } from '@/components/Toast';
import { useConfirmModal } from '@/components/ConfirmModal';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface PendingCampaign {
  id: number;
  campaign_id: number;
  campaign_name: string;
  campaign_type: string;
  type_label: string;
  requester: string;
  request_date: string;
  budget: number;
  target_audience: string;
  description: string;
  start_date: string;
  end_date: string;
  approval_status: string;
  priority: string;
  priority_label: string;
  approver?: string;
  approval_date?: string;
  rejection_reason?: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CommonCode {
  category: string;
  sub_category: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

export default function PendingCampaignsPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<PendingCampaign[]>([]);
  const [priorityCodes, setPriorityCodes] = useState<CommonCode[]>([]);
  const [filterPriority, setFilterPriority] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedFilterPriority, setAppliedFilterPriority] = useState('all');
  const [appliedDateRange, setAppliedDateRange] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [statistics, setStatistics] = useState({
    totalPending: 0,
    urgentCount: 0,
    highCount: 0,
    normalCount: 0,
    lowCount: 0,
    avgWaitingDays: 0
  });

  // 반려 모달 상태 추가
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedInUser = sessionStorage.getItem('currentUser');
        
        if (!loggedInUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(loggedInUser);
        setUser(userData);
        
        // 우선순위 코드 로드
        await loadPriorityCodes();
        
        await loadCampaigns();
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // 페이징 및 적용된 검색 조건 변경 시 자동 재조회
  useEffect(() => {
    if (user && !isLoading) { // 초기 로딩이 아닐 때만
      loadCampaigns();
    }
  }, [pagination.page, pagination.limit, appliedSearchTerm, appliedFilterPriority, appliedDateRange]);

  const loadPriorityCodes = async () => {
    try {
      const response = await fetch('/api/common-codes?category=CAMPAIGN&sub_category=PRIORITY');
      const data = await response.json();
      
      if (response.ok) {
        setPriorityCodes(data.codes || []);
      } else {
        console.error('우선순위 코드 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('우선순위 코드 조회 오류:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: appliedSearchTerm,
        priority: appliedFilterPriority
      });

      const response = await fetch(`/api/pending-campaigns?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.data || []);
        setPagination({
          ...pagination,
          totalCount: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.page < data.pagination.totalPages,
          hasPrev: data.pagination.page > 1
        });
        if (data.statistics) {
          setStatistics(data.statistics);
        }
      } else {
        throw new Error(data.error || '승인대기 캠페인을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('승인대기 캠페인 조회 오류:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApprove = async (campaignId: number, campaignName: string) => {
    const confirmed = await showConfirm(
      '캠페인 승인 확인',
      `"${campaignName}" 캠페인을 승인하시겠습니까?\n\n✅ 승인 후에는 캠페인이 활성화되어 진행됩니다.\n\n📌 승인 처리 후:\n• 캠페인 상태가 '승인됨'으로 변경됩니다\n• 캠페인 담당자에게 알림이 전송됩니다\n• 승인 이력이 기록됩니다`,
      {
        confirmText: '✅ 승인하기',
        cancelText: '취소',
        type: 'success'
      }
    );
    
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      const response = await fetch('/api/pending-campaigns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: campaignId,
          status: 'APPROVED', // API에서 기대하는 파라미터명 사용
          approver_id: user?.id, // 사용자 ID 전송
          approval_comment: '승인 처리됨'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        showToast('캠페인이 성공적으로 승인되었습니다! 🎉', 'success');
        await loadCampaigns();
      } else {
        showToast(data.error || '승인 처리에 실패했습니다.', 'error');
      }
    } catch (error: any) {
      console.error('승인 처리 오류:', error);
      showToast('승인 처리 중 오류가 발생했습니다.\n네트워크를 확인하고 다시 시도해주세요.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (campaignId: number) => {
    setSelectedCampaignId(campaignId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      showToast('반려 사유를 입력해주세요.', 'warning');
      return;
    }

    if (rejectReason.trim().length < 10) {
      showToast('반려 사유를 최소 10자 이상 입력해주세요.', 'warning');
      return;
    }

    if (!selectedCampaignId) return;

    try {
      setIsProcessing(true);
      const response = await fetch('/api/pending-campaigns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedCampaignId,
          status: 'REJECTED', // API에서 기대하는 파라미터명 사용
          approver_id: user?.id, // 사용자 ID 전송
          approval_comment: rejectReason
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        showToast('캠페인이 성공적으로 반려되었습니다. 📝', 'success');
        setShowRejectModal(false);
        setSelectedCampaignId(null);
        setRejectReason('');
        await loadCampaigns();
      } else {
        showToast(data.error || '반려 처리에 실패했습니다.', 'error');
      }
    } catch (error: any) {
      console.error('반려 처리 오류:', error);
      showToast('반려 처리 중 오류가 발생했습니다.\n네트워크를 확인하고 다시 시도해주세요.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setSelectedCampaignId(null);
    setRejectReason('');
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  };

  const handleSearch = () => {
    // 현재 입력된 검색 조건을 적용된 검색 조건으로 설정
    setAppliedSearchTerm(searchTerm);
    setAppliedFilterPriority(filterPriority);
    setAppliedDateRange(dateRange);
    
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 검색 실행 (useEffect에서 자동으로 호출됨)
  };

  const handleReset = () => {
    // 입력 조건 초기화
    setSearchTerm('');
    setFilterPriority('all');
    setDateRange('all');
    
    // 적용된 검색 조건도 초기화
    setAppliedSearchTerm('');
    setAppliedFilterPriority('all');
    setAppliedDateRange('all');
    
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 리셋 실행 (useEffect에서 자동으로 호출됨)
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
      <Layout title="캠페인 승인대기 목록" subtitle="승인이 필요한 캠페인을 관리합니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">승인대기 캠페인을 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="캠페인 승인대기 목록" subtitle="승인이 필요한 캠페인을 관리합니다.">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-red-900">데이터를 불러올 수 없습니다</h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <div className="mt-6">
              <button
                onClick={loadCampaigns}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="캠페인 승인대기 목록" 
      subtitle="승인이 필요한 캠페인을 관리합니다."
    >
      <div className="p-6 space-y-6">
        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">전체 대기</p>
                <p className="text-2xl font-bold text-yellow-900">{statistics.totalPending}</p>
              </div>
              <div className="text-2xl">⏳</div>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">긴급</p>
                <p className="text-2xl font-bold text-red-900">{statistics.urgentCount}</p>
              </div>
              <div className="text-2xl">🚨</div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">높음</p>
                <p className="text-2xl font-bold text-orange-900">{statistics.highCount}</p>
              </div>
              <div className="text-2xl">⚡</div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">평균 대기일</p>
                <p className="text-2xl font-bold text-blue-900">{statistics.avgWaitingDays}일</p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </div>
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
                placeholder="캠페인명 또는 요청자로 검색..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위 필터
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                {priorityCodes.map((priority) => (
                  <option key={priority.code} value={priority.code}>
                    {priority.name}
                  </option>
                ))}
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
            </div>
          </div>
        </div>

        {/* 캠페인 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                승인대기 목록 ({pagination.totalCount}개 중 {campaigns.length}개 표시)
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
                  onClick={loadCampaigns}
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

          {campaigns.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">승인 대기 중인 캠페인이 없습니다</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterPriority !== 'all' 
                  ? '조건에 맞는 캠페인을 찾을 수 없습니다.' 
                  : '현재 승인이 필요한 캠페인이 없습니다.'
                }
              </p>
              <Link
                href="/campaigns"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                캠페인 목록으로 돌아가기
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      캠페인 정보
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요청자
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      예산
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      기간
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요청일
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {campaign.campaign_name}
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            {campaign.type_label} • {campaign.target_audience}
                          </div>
                          <div className="text-xs text-gray-400 max-w-xs truncate">
                            {campaign.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(campaign.priority)}`}>
                          {campaign.priority_label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{campaign.requester}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {campaign.budget?.toLocaleString() || '0'}원
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(campaign.start_date).toLocaleDateString('ko-KR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          ~ {new Date(campaign.end_date).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(campaign.request_date).toLocaleDateString('ko-KR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(campaign.request_date).toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/campaigns/new?id=${campaign.campaign_id}&mode=view`}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            상세보기
                          </Link>
                          <button
                            onClick={() => handleApprove(campaign.id, campaign.campaign_name)}
                            disabled={isProcessing}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? '처리중...' : '승인'}
                          </button>
                          <button
                            onClick={() => handleReject(campaign.id)}
                            disabled={isProcessing}
                            className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? '처리중...' : '반려'}
                          </button>
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
        </div>
      </div>

      {/* 반려 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">캠페인 반려</h3>
              <p className="text-sm text-gray-600 mt-1">반려 사유를 입력해주세요.</p>
            </div>
            
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                반려 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="반려 사유를 상세히 입력해주세요..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                최소 10자 이상 입력해주세요. (현재: {rejectReason.length}자)
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleRejectCancel}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={isProcessing || rejectReason.trim().length < 10}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '처리 중...' : '반려 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 토스트 및 모달 컴포넌트 */}
      <ToastContainer />
      <ConfirmModalComponent />
    </Layout>
  );
} 