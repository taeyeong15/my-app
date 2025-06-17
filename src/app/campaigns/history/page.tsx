'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

interface CampaignHistory {
  id: number;
  campaign_id: number;
  campaign_name: string;
  action_type: string;
  action_label: string;
  action_by: string;
  action_date: string;
  previous_status?: string;
  new_status?: string;
  comments?: string;
  changes?: object;
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
  totalHistory: number;
  approvedCount: number;
  updatedCount: number;
  todayActivity: number;
}

interface CommonCode {
  category: string;
  sub_category: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

export default function CampaignHistoryPage() {
  const [history, setHistory] = useState<CampaignHistory[]>([]);
  const [actionTypeCodes, setActionTypeCodes] = useState<CommonCode[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalHistory: 0,
    approvedCount: 0,
    updatedCount: 0,
    todayActivity: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    loadActionTypeCodes();
    loadHistory();
  }, []);

  // 페이징만 자동 재조회 (검색 조건은 검색 버튼으로만)
  useEffect(() => {
    if (!isLoading) { // 초기 로딩이 아닐 때만
      loadHistory();
    }
  }, [pagination.page, pagination.limit]);

  const loadActionTypeCodes = async () => {
    try {
      const response = await fetch('/api/common-codes?category=CAMPAIGN&sub_category=ACTION_TYPE');
      const data = await response.json();
      
      if (response.ok) {
        setActionTypeCodes(data.codes || []);
      } else {
        console.error('액션타입 코드 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('액션타입 코드 조회 오류:', error);
    }
  };

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        action_type: filterStatus,
        search: searchTerm,
        date_range: dateRange
      });

      const response = await fetch(`/api/campaign-history?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data || []);
        setStatistics(data.statistics || {
          totalHistory: 0,
          approvedCount: 0,
          updatedCount: 0,
          todayActivity: 0
        });
        setPagination({
          ...pagination,
          totalCount: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.page < data.pagination.totalPages,
          hasPrev: data.pagination.page > 1
        });
      } else {
        throw new Error(data.error || '캠페인 이력을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('캠페인 이력 조회 오류:', error);
      setError(error.message);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'started': return 'bg-emerald-100 text-emerald-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearch = () => {
    // 검색 시에는 명시적으로 1페이지로 설정하여 호출
    const params = new URLSearchParams({
      page: "1",
      limit: pagination.limit.toString(),
      action_type: filterStatus,
      search: searchTerm,
      date_range: dateRange
    });

    setIsLoading(true);
    setError('');
    
    fetch(`/api/campaign-history?${params}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setHistory(data.data || []);
          setStatistics(data.statistics || {
            totalHistory: 0,
            approvedCount: 0,
            updatedCount: 0,
            todayActivity: 0
          });
          setPagination({
            page: 1,
            limit: pagination.limit,
            totalCount: data.pagination.total,
            totalPages: data.pagination.totalPages,
            hasNext: 1 < data.pagination.totalPages,
            hasPrev: false
          });
        } else {
          throw new Error(data.error || '캠페인 이력을 불러오는데 실패했습니다.');
        }
      })
      .catch(error => {
        console.error('캠페인 이력 조회 오류:', error);
        setError(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setDateRange('all');
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 리셋 후 즉시 데이터 조회 (1페이지, 기본 조건)
    setTimeout(() => {
      const params = new URLSearchParams({
        page: "1",
        limit: pagination.limit.toString(),
        action_type: "all",
        search: "",
        date_range: "all"
      });

      setIsLoading(true);
      setError('');
      
      fetch(`/api/campaign-history?${params}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setHistory(data.data || []);
            setStatistics(data.statistics || {
              totalHistory: 0,
              approvedCount: 0,
              updatedCount: 0,
              todayActivity: 0
            });
            setPagination({
              page: 1,
              limit: pagination.limit,
              totalCount: data.pagination.total,
              totalPages: data.pagination.totalPages,
              hasNext: 1 < data.pagination.totalPages,
              hasPrev: false
            });
          } else {
            throw new Error(data.error || '캠페인 이력을 불러오는데 실패했습니다.');
          }
        })
        .catch(error => {
          console.error('리셋 후 데이터 조회 중 오류:', error);
          setError(error.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 100);
  };

  if (isLoading) {
    return (
      <Layout title="캠페인 이력관리" subtitle="모든 캠페인의 변경 이력과 활동을 추적하고 관리할 수 있습니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">캠페인 이력을 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="캠페인 이력관리" subtitle="모든 캠페인의 변경 이력과 활동을 추적하고 관리할 수 있습니다.">
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
                onClick={loadHistory}
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
      title="캠페인 이력관리" 
      subtitle="모든 캠페인의 변경 이력과 활동을 추적하고 관리할 수 있습니다."
    >
      <div className="p-6 space-y-6">
        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">전체 이력</p>
                <p className="text-2xl font-bold text-blue-900">{statistics.totalHistory}</p>
              </div>
              <div className="text-2xl">📋</div>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">승인된 캠페인</p>
                <p className="text-2xl font-bold text-green-900">
                  {statistics.approvedCount}
                </p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">수정된 캠페인</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {statistics.updatedCount}
                </p>
              </div>
              <div className="text-2xl">✏️</div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">오늘 활동</p>
                <p className="text-2xl font-bold text-purple-900">
                  {statistics.todayActivity}
                </p>
              </div>
              <div className="text-2xl">🔥</div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="캠페인명, 액션 또는 수행자로 검색..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">액션 타입</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                {actionTypeCodes.map((actionType) => (
                  <option key={actionType.code} value={actionType.code}>
                    {actionType.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                <option value="today">오늘</option>
                <option value="week">최근 7일</option>
                <option value="month">최근 30일</option>
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
          </div>
        </div>

        {/* 이력 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                캠페인 이력 ({pagination.totalCount}개 중 {history.length}개 표시)
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
                  onClick={handleSearch}
                  className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  새로고침
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  초기화
                </button>
              </div>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">이력이 없습니다</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? '조건에 맞는 이력을 찾을 수 없습니다.' 
                  : '캠페인 활동 이력이 생성되면 여기에 표시됩니다.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태 변경</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수행자</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.campaign_name || `캠페인 #${item.campaign_id}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {item.campaign_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.action_type)}`}>
                          {item.action_label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.previous_status && item.new_status ? (
                            <>
                              <span className="text-gray-500">{item.previous_status}</span>
                              <span className="mx-2">→</span>
                              <span className="font-medium">{item.new_status}</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.action_by}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(item.action_date).toLocaleString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {item.comments || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
        </div>
      </div>
    </Layout>
  );
} 