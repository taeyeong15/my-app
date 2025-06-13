'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/offers');
      const data = await response.json();

      if (response.ok) {
        setOffers(data.offers || []);
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

  const filteredOffers = offers.filter(offer => {
    const matchesType = filterType === 'all' || offer.type === filterType;
    const matchesStatus = filterStatus === 'all' || offer.status === filterStatus;
    const matchesSearch = offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

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
              value: offers.length, 
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
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="오퍼명, 설명 또는 생성자로 검색..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                타입 필터
              </label>
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
                <option value="scheduled">예정</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchOffers}
                className="inline-flex items-center px-4 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </button>
              <Link
                href="/offers/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
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
                오퍼 목록 ({filteredOffers.length}개)
              </h3>
            </div>
          </div>

          {filteredOffers.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">오퍼가 없습니다</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                  ? '조건에 맞는 오퍼를 찾을 수 없습니다.' 
                  : '새 오퍼를 만들어 마케팅 캠페인을 시작해보세요.'
                }
              </p>
              <Link
                href="/offers/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 새 오퍼 만들기
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      오퍼 정보
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      타입 / 혜택
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용 현황
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      기간
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성 정보
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOffers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {offer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {offer.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(offer.type)}`}>
                            {getTypeText(offer.type)}
                          </span>
                          <div className="text-sm font-medium text-gray-900">
                            {formatValue(offer)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                          {getStatusText(offer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {offer.usage_count.toLocaleString()} / {offer.max_usage > 0 ? offer.max_usage.toLocaleString() : '무제한'}
                        </div>
                        {offer.max_usage > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min((offer.usage_count / offer.max_usage) * 100, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(offer.start_date).toLocaleDateString('ko-KR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          ~ {new Date(offer.end_date).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{offer.created_by}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(offer.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/offers/${offer.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            상세보기
                          </Link>
                          <Link
                            href={`/offers/${offer.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                          >
                            수정
                          </Link>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors">
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 