'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => {
    const checkAuth = () => {
      try {
        const loggedInUser = sessionStorage.getItem('currentUser');
        
        if (!loggedInUser) {
          router.push('/login');
          return;
        }
        
        // 인증 확인 후 데이터 로드
        fetchOffers();
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // 페이징만 자동 재조회 (검색 조건은 검색 버튼으로만)
  useEffect(() => {
    if (!isLoading) { // 초기 로딩이 아닐 때만
      fetchOffers();
    }
  }, [pagination.page, pagination.limit]);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        type: filterType,
        status: filterStatus
      });

      const response = await fetch(`/api/offers?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOffers(data.offers || []);
        setPagination(prev => ({
          ...prev,
          totalCount: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
          hasNext: data.pagination?.hasNext || false,
          hasPrev: data.pagination?.hasPrev || false
        }));
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
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOffers();
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
    switch (type) {
      case 'discount': return '할인';
      case 'coupon': return '쿠폰';
      case 'freebie': return '무료제공';
      case 'point': return '적립금';
      default: return type;
    }
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
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'scheduled': return '예정';
      default: return status;
    }
  };

  const formatValue = (offer: Offer) => {
    if (offer.type === 'freebie') return '무료제공';
    if (offer.value_type === 'percentage') return `${offer.value}%`;
    return `₩${offer.value.toLocaleString()}`;
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
              value: pagination.totalCount, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '🎁'
            },
            { 
              label: '활성 오퍼', 
              value: offers.filter(o => o.status === 'active').length, 
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: '✅'
            },
            { 
              label: '총 사용량', 
              value: offers.reduce((sum, o) => sum + o.usage_count, 0).toLocaleString(), 
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              icon: '📊'
            },
            { 
              label: '예정 오퍼', 
              value: offers.filter(o => o.status === 'scheduled').length, 
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
                <option value="discount">할인</option>
                <option value="coupon">쿠폰</option>
                <option value="freebie">무료제공</option>
                <option value="point">적립금</option>
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
                <option value="scheduled">예정</option>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 transition-colors">수정</button>
                            <button className="text-red-600 hover:text-red-900 transition-colors">삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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