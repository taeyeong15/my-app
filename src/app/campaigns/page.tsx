'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';

interface Campaign {
  id: number;
  name: string;
  type: string;
  type_name: string;
  status: string;
  status_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_by: string;
  created_at: string;
  description: string;
  target_audience: string;
  channels: string[];
}

interface CommonCode {
  category: string;
  sub_category: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ChannelOption {
  code: string;
  name: string;
}

interface StatusCounts {
  totalCamp: number;
  runningCamp: number;
  approvalCamp: number;
  completedCamp: number;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [statusCodes, setStatusCodes] = useState<CommonCode[]>([]);
  const [typeCodes, setTypeCodes] = useState<CommonCode[]>([]);
  const [channelOptions, setChannelOptions] = useState<ChannelOption[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    totalCamp: 0,
    runningCamp: 0,
    approvalCamp: 0,
    completedCamp: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // 검색 조건 상태 (입력 중인 조건)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pageSize, setPageSize] = useState(5);
  
  // 실제 검색에 사용되는 조건 (검색 버튼 클릭 시에만 업데이트)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('all');
  const [appliedFilterType, setAppliedFilterType] = useState('all');
  const [appliedFilterChannel, setAppliedFilterChannel] = useState('all');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Strict Mode 중복 호출 방지를 위한 ref
  const hasInitialized = useRef(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const loggedInUser = sessionStorage.getItem('currentUser');
        
        if (!loggedInUser) {
          router.push('/login');
          return;
        }
        
        // 인증 확인 후 데이터 로드
        fetchData();
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
      fetchCampaigns();
    }
  }, [pagination.page, pageSize, appliedSearchTerm, appliedFilterStatus, appliedFilterType, appliedFilterChannel, appliedStartDate, appliedEndDate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 공통코드와 채널 정보를 병렬로 조회
      const [statusCodesRes, typeCodesRes, channelOptionsRes] = await Promise.all([
        fetch('/api/common-codes?category=CAMPAIGN&sub_category=STATUS'),
        fetch('/api/common-codes?category=CAMPAIGN&sub_category=TYPE'),
        fetch('/api/channels/simple')
      ]);

      const statusCodesData = await statusCodesRes.json();
      const typeCodesData = await typeCodesRes.json();
      const channelOptionsData = await channelOptionsRes.json();

      if (statusCodesRes.ok) {
        setStatusCodes(statusCodesData.data || []);
      }
      
      if (typeCodesRes.ok) {
        setTypeCodes(typeCodesData.data || []);
      }

      if (channelOptionsRes.ok) {
        setChannelOptions(channelOptionsData.channels || []);
      }

      // 캠페인 데이터 조회 (fetchCampaigns에서 setIsLoading(false) 처리)
      await fetchCampaigns();
      
    } catch (err: any) {
      console.error('데이터 조회 오류:', err);
      setError(err.message);
      setIsLoading(false); // 공통코드 조회 실패 시에만 여기서 로딩 해제
    }
  };

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pageSize.toString(),
        search: appliedSearchTerm,
        status: appliedFilterStatus,
        type: appliedFilterType,
        channel: appliedFilterChannel,
        start_date: appliedStartDate,
        end_date: appliedEndDate
      });

      const response = await fetch(`/api/campaigns?${params}`);
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data || []);
        setPagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          totalCount: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.page < data.pagination.totalPages,
          hasPrev: data.pagination.page > 1
        });
        setStatusCounts(data.statusCounts || { 
          totalCamp: 0,
          runningCamp: 0,
          approvalCamp: 0,
          completedCamp: 0
        });
        setError(''); // 성공 시 에러 초기화
      } else {
        throw new Error(data.error || '캠페인을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('캠페인 조회 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    // 현재 입력된 검색 조건을 적용된 검색 조건으로 설정
    setAppliedSearchTerm(searchTerm);
    setAppliedFilterStatus(filterStatus);
    setAppliedFilterType(filterType);
    setAppliedFilterChannel(filterChannel);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 검색 실행 (useEffect에서 자동으로 호출됨)
  };

  const handleReset = () => {
    // 입력 조건 초기화
    setSearchTerm('');
    setFilterStatus('all');
    setFilterType('all');
    setFilterChannel('all');
    setStartDate('');
    setEndDate('');
    
    // 적용된 검색 조건도 초기화
    setAppliedSearchTerm('');
    setAppliedFilterStatus('all');
    setAppliedFilterType('all');
    setAppliedFilterChannel('all');
    setAppliedStartDate('');
    setAppliedEndDate('');
    
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 리셋 실행 (useEffect에서 자동으로 호출됨)
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPagination(prev => ({ ...prev, page: 1, limit: newSize }));
  };

  const getStatusBadge = (status: string, statusName: string) => {
    const badges = {
      RUNNING: 'bg-green-100 text-green-800 border border-green-200',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      COMPLETED: 'bg-blue-100 text-blue-800 border border-blue-200',
      PAUSED: 'bg-gray-100 text-gray-800 border border-gray-200',
      PLANNING: 'bg-purple-100 text-purple-800 border border-purple-200',
      APPROVED: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      REJECTED: 'bg-red-100 text-red-800 border border-red-200',
      SCHEDULED: 'bg-orange-100 text-orange-800 border border-orange-200',
      EDITING: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
      DESIGN_COMPLETE: 'bg-teal-100 text-teal-800 border border-teal-200'
    };

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {statusName || status}
      </span>
    );
  };

  // 상태별 캠페인 수 계산 (API에서 받은 전체 기준 데이터 사용)
  const getStatusCount = (statusCode: string) => {
    return statusCounts[statusCode as keyof StatusCounts] || 0;
  };

  // 액션 버튼 표시 조건 확인
  const canEdit = (status: string) => {
    return ['PLANNING', 'REJECTED', 'PAUSED', 'EDITING', 'DRAFT', 'EDITING'].includes(status);
  };

  const canApprove = (status: string) => {
    return status === 'PENDING_APPROVAL';
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
      <Layout title="캠페인 목록" subtitle="마케팅 캠페인을 생성하고 관리할 수 있습니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">캠페인을 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="캠페인 목록" subtitle="마케팅 캠페인을 생성하고 관리할 수 있습니다.">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">캠페인 조회 실패</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
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
      title="캠페인 목록" 
      subtitle="마케팅 캠페인을 생성하고 관리할 수 있습니다."
    >
      <div className="p-6 space-y-6">
        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: '전체 캠페인', 
              value: pagination.totalCount, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '📊'
            },
            { 
              label: '진행중', 
              value: getStatusCount('RUNNING'), 
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: '🎯'
            },
            { 
              label: '승인대기', 
              value: getStatusCount('PENDING_APPROVAL'), 
              color: 'text-yellow-600',
              bg: 'bg-yellow-50',
              icon: '⏳'
            },
            { 
              label: '완료', 
              value: getStatusCount('COMPLETED'), 
              color: 'text-gray-600',
              bg: 'bg-gray-50',
              icon: '✅'
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

        {/* 확장된 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {/* 첫 번째 행: 검색어, 상태, 유형 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="캠페인명, 담당자, 설명으로 검색..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">전체</option>
                  {statusCodes.map(status => (
                    <option key={status.code} value={status.code}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">캠페인 유형</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">전체</option>
                  {typeCodes.map(type => (
                    <option key={type.code} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 두 번째 행: 날짜, 채널 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">채널</label>
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">전체</option>
                  {channelOptions.map(channel => (
                    <option key={channel.code} value={channel.code}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-wrap gap-3">
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
                href="/campaigns/new"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                새 캠페인 만들기
              </Link>
            </div>
          </div>
        </div>

        {/* 캠페인 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                캠페인 목록 ({pagination.totalCount}개 중 {campaigns.length}개 표시)
              </h3>
              <div className="flex items-center space-x-3">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5개씩</option>
                  <option value={10}>10개씩</option>
                  <option value={50}>50개씩</option>
                  <option value={100}>100개씩</option>
                </select>
                <button
                  onClick={fetchCampaigns}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">캠페인이 없습니다</h3>
              <p className="text-gray-500 mb-6">
                조건에 맞는 캠페인을 찾을 수 없습니다.
              </p>
              <Link
                href="/campaigns/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 새 캠페인 만들기
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        캠페인 정보
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        기간
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        예산/집행
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        성과
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        담당자
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
                              {campaign.name}
                            </div>
                            <div className="text-sm text-gray-500 mb-1">
                              {campaign.type_name || campaign.type}
                            </div>
                            <div className="text-xs text-gray-400 max-w-xs truncate">
                              {campaign.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(campaign.status, campaign.status_name)}
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
                          <div className="text-sm font-semibold text-gray-900">
                            ₩{Math.round(campaign.budget).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            ₩{Math.round(campaign.spent).toLocaleString()} 집행
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>노출: {campaign.impressions.toLocaleString()}</div>
                            <div>클릭: {campaign.clicks.toLocaleString()}</div>
                            <div>전환: {campaign.conversions}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{campaign.created_by}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/campaigns/new?id=${campaign.id}&mode=view`}
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                            >
                              상세보기
                            </Link>
                            {canEdit(campaign.status) && (
                              <Link
                                href={`/campaigns/new?id=${campaign.id}&mode=edit`}
                                className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
                              >
                                수정
                              </Link>
                            )}
                            {canApprove(campaign.status) && (
                              <Link
                                href="/campaigns/pending"
                                className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                              >
                                승인
                              </Link>
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