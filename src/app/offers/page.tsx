'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useConfirmModal } from '@/components/ConfirmModal';

interface CommonCode {
  code: string;
  name: string;
}

interface Offer {
  id: number;
  name: string;
  type: 'discount' | 'coupon' | 'freebie' | 'point';
  description: string;
  value: number;
  value_type: 'amount' | 'percentage';
  status: 'active' | 'inactive' | 'scheduled';
  start_date: string;
  end_date: string;
  max_usage: number;
  usage_count: number;
  terms_conditions: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Statistics {
  totalOffers: number;
  activeOffers: number;
  scheduledOffers: number;
  totalUsage: number;
}

export default function OffersPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [typeOptions, setTypeOptions] = useState<CommonCode[]>([]);
  const [statusOptions, setStatusOptions] = useState<CommonCode[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalOffers: 0,
    activeOffers: 0,
    scheduledOffers: 0,
    totalUsage: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // 실제 검색에 사용되는 조건 (검색 버튼 클릭 시에만 업데이트)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedFilterType, setAppliedFilterType] = useState('all');
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('all');

  // 사용자 권한 확인 함수
  const checkUserPermission = () => {
    try {
      const loggedInUser = sessionStorage.getItem('currentUser');
      if (!loggedInUser) {
        return false;
      }

      const userData = JSON.parse(loggedInUser);
      setCurrentUser(userData);
      
      // sessionStorage에서 직접 role 확인
      const userRole = userData.role;
      setIsAdmin(userRole === 'admin');
      return true;
    } catch (error) {
      console.error('사용자 권한 확인 실패:', error);
      return false;
    }
  };

  // 옵션 데이터 로드 함수
  const loadOptionsData = async () => {
    try {
      const [typeResponse, statusResponse] = await Promise.all([
        fetch('/api/common-codes?category=OFFER&sub_category=TYPE'),
        fetch('/api/common-codes?category=OFFER&sub_category=STATUS')
      ]);

      if (typeResponse.ok) {
        const typeData = await typeResponse.json();
        setTypeOptions(typeData.data || []);
      }

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatusOptions(statusData.data || []);
      }
    } catch (error) {
      console.error('옵션 데이터 로드 실패:', error);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      try {
        const hasPermission = checkUserPermission();
        
        if (!hasPermission) {
          router.push('/login');
          return;
        }
        
        // 인증 확인 후 데이터 로드
        loadOptionsData();
        fetchOffers();
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // 페이징 및 적용된 검색 조건 변경 시 자동 재조회
  useEffect(() => {
    if (!isLoading) { // 초기 로딩이 아닐 때만
      fetchOffers();
    }
  }, [pagination.page, pagination.limit, appliedSearchTerm, appliedFilterType, appliedFilterStatus]);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: appliedSearchTerm,
        type: appliedFilterType,
        status: appliedFilterStatus
      });

      const response = await fetch(`/api/offers?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOffers(data.offers || []);
        setStatistics(data.statistics || {
          totalOffers: 0,
          activeOffers: 0,
          scheduledOffers: 0,
          totalUsage: 0
        });
        setPagination(prev => ({
          ...prev,
          totalCount: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false
        }));
        setError(''); // 성공 시 에러 초기화
      } else {
        throw new Error(data.error || '오퍼를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('오퍼 조회 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    // 현재 입력된 검색 조건을 적용된 검색 조건으로 설정
    setAppliedSearchTerm(searchTerm);
    setAppliedFilterType(filterType);
    setAppliedFilterStatus(filterStatus);
    
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 검색 실행 (useEffect에서 자동으로 호출됨)
  };

  const handleReset = () => {
    // 입력 조건 초기화
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    
    // 적용된 검색 조건도 초기화
    setAppliedSearchTerm('');
    setAppliedFilterType('all');
    setAppliedFilterStatus('all');
    
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 리셋 실행 (useEffect에서 자동으로 호출됨)
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  };

  const handleDelete = async (offerId: number, offerName: string) => {
    const confirmed = await showConfirm(
      '오퍼 삭제 확인',
      `정말로 "${offerName}" 오퍼를 삭제하시겠습니까?\n\n⚠️ 삭제된 오퍼는 복구할 수 없습니다.\n\n🔍 캠페인 연관성을 확인한 후 삭제가 진행됩니다:\n• 관련 캠페인이 있는 경우 모든 캠페인이 완료 상태여야 삭제 가능합니다\n• 진행 중이거나 대기 중인 캠페인이 있으면 삭제가 거부됩니다`,
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
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message || '오퍼가 성공적으로 삭제되었습니다.', 'success');
        // 삭제 성공 시 목록 새로고침
        fetchOffers();
      } else {
        // API에서 상세한 에러 메시지를 제공하므로 그대로 표시
        showToast(data.error || '오퍼 삭제에 실패했습니다.', 'error', 8000);
      }
    } catch (error) {
      console.error('오퍼 삭제 오류:', error);
      showToast('오퍼 삭제 중 네트워크 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.', 'error');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discount': return 'bg-red-100 text-red-800';
      case 'coupon': return 'bg-blue-100 text-blue-800';
      case 'freebie': return 'bg-green-100 text-green-800';
      case 'point': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    const typeOption = typeOptions.find(option => option.code === type);
    return typeOption ? typeOption.name : type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusOption = statusOptions.find(option => option.code === status);
    return statusOption ? statusOption.name : status;
  };

  const formatValue = (offer: Offer) => {
    if (offer.type === 'freebie') return getTypeText('freebie');
    if (offer.value_type === 'percentage') return `${offer.value}%`;
    return `₩${offer.value.toLocaleString()}`;
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
      <Layout title="오퍼 관리" subtitle="마케팅 캠페인에 사용할 다양한 오퍼를 생성하고 관리할 수 있습니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">오퍼를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="오퍼 관리" subtitle="마케팅 캠페인에 사용할 다양한 오퍼를 생성하고 관리할 수 있습니다.">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">오퍼 조회 실패</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchOffers}
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
      title="오퍼 관리" 
      subtitle="마케팅 캠페인에 사용할 다양한 오퍼를 생성하고 관리할 수 있습니다."
    >
      <div className="p-6 space-y-6">
        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: '전체 오퍼', 
              value: statistics.totalOffers, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '🎁'
            },
            { 
              label: '활성 오퍼', 
              value: statistics.activeOffers, 
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: '✅'
            },
            { 
              label: '총 사용량', 
              value: statistics.totalUsage.toLocaleString(), 
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              icon: '📊'
            },
            { 
              label: '예정 오퍼', 
              value: statistics.scheduledOffers, 
              color: 'text-orange-600',
              bg: 'bg-orange-50',
              icon: '📅'
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
                placeholder="오퍼명, 설명 또는 생성자로 검색..."
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
                {typeOptions.map(option => (
                  <option key={option.code} value={option.code}>{option.name}</option>
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
                {statusOptions.map(option => (
                  <option key={option.code} value={option.code}>{option.name}</option>
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
                href="/offers/new"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                새 오퍼 만들기
              </Link>
            </div>
          </div>
        </div>

        {/* 오퍼 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                오퍼 목록 ({pagination.totalCount}개 중 {offers.length}개 표시)
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
                  onClick={fetchOffers}
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

          {offers.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">오퍼가 없습니다</h3>
              <p className="text-gray-500 mb-6">
                조건에 맞는 오퍼를 찾을 수 없습니다.
              </p>
              <Link
                href="/offers/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 새 오퍼 만들기
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">오퍼 정보</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">할인 정보</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용량</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성자</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {offers.map((offer) => (
                      <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">{offer.name}</div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">{offer.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(offer.type)}`}>
                            {getTypeText(offer.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                            {getStatusText(offer.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{formatValue(offer)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {offer.usage_count.toLocaleString()} / {offer.max_usage ? offer.max_usage.toLocaleString() : '무제한'}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ 
                                width: offer.max_usage ? `${Math.min((offer.usage_count / offer.max_usage) * 100, 100)}%` : '0%' 
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(offer.start_date).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            ~ {new Date(offer.end_date).toLocaleDateString('ko-KR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{offer.created_by}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/offers/new?id=${offer.id}&mode=view`}
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                            >
                              상세보기
                            </Link>
                            {isAdmin && (
                              <>
                                <Link
                                  href={`/offers/new?id=${offer.id}&mode=edit`}
                                  className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
                                >
                                  수정
                                </Link>
                                <button 
                                  onClick={() => handleDelete(offer.id, offer.name)}
                                  className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                                >
                                  삭제
                                </button>
                              </>
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
      
      {/* 토스트 및 모달 컴포넌트 */}
      <ToastContainer />
      <ConfirmModalComponent />
    </Layout>
  );
} 