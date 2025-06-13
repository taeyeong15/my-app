'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface OfferAnalytics {
  id: number;
  offer_id: number;
  period_start: string;
  period_end: string;
  total_usage: number;
  total_discount_amount: number;
  total_order_amount: number;
  conversion_rate: number;
  avg_order_value: number;
  roi: number;
  customer_acquisition: number;
  repeat_usage: number;
  created_at: string;
  updated_at: string;
}

export default function OfferAnalyticsPage() {
  const [offerAnalytics, setOfferAnalytics] = useState<OfferAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    loadOfferAnalytics();
  }, [selectedPeriod]);

  const loadOfferAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/analytics/offers?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      if (data.success) {
        setOfferAnalytics(data.analytics || []);
      } else {
        throw new Error(data.error || '데이터 로드 실패');
      }
    } catch (error) {
      console.error('오퍼 분석 데이터 로드 실패:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const totalUsage = offerAnalytics.reduce((sum, item) => sum + (Number(item.total_usage) || 0), 0);
  const totalDiscountAmount = offerAnalytics.reduce((sum, item) => sum + (Number(item.total_discount_amount) || 0), 0);
  const totalOrderAmount = offerAnalytics.reduce((sum, item) => sum + (Number(item.total_order_amount) || 0), 0);
  const avgConversionRate = offerAnalytics.length > 0 
    ? offerAnalytics.reduce((sum, item) => sum + (Number(item.conversion_rate) || 0), 0) / offerAnalytics.length 
    : 0;

  // 차트 데이터 준비
  const usageChartData = offerAnalytics.map(item => ({
    name: `오퍼 ${item.offer_id}`,
    usage: Number(item.total_usage) || 0,
    conversion: Number(item.conversion_rate) || 0,
    roi: Number(item.roi) || 0
  }));

  const orderAmountData = offerAnalytics.map(item => ({
    name: `오퍼 ${item.offer_id}`,
    discount: Number(item.total_discount_amount) || 0,
    order: Number(item.total_order_amount) || 0
  }));

  if (loading) {
    return (
      <Layout title="오퍼별 결과분석" subtitle="개별 오퍼의 성과를 상세히 분석합니다">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="오퍼별 결과분석" subtitle="개별 오퍼의 성과를 상세히 분석합니다">
      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm text-red-800">{error}</p>
                <button 
                  onClick={loadOfferAnalytics}
                  className="text-sm text-red-600 underline mt-1 hover:text-red-800"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 기간 선택 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">분석 기간</h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체 기간</option>
              <option value="last30days">최근 30일</option>
              <option value="last3months">최근 3개월</option>
              <option value="last6months">최근 6개월</option>
            </select>
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: '총 사용량',
              value: totalUsage.toLocaleString(),
              icon: '🎯',
              color: 'blue'
            },
            {
              title: '총 할인금액',
              value: `₩${(totalDiscountAmount / 1000000).toFixed(1)}M`,
              icon: '💰',
              color: 'green'
            },
            {
              title: '총 주문금액',
              value: `₩${(totalOrderAmount / 1000000).toFixed(1)}M`,
              icon: '📊',
              color: 'purple'
            },
            {
              title: '평균 전환율',
              value: `${avgConversionRate.toFixed(1)}%`,
              icon: '📈',
              color: 'orange'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 오퍼별 사용량 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">오퍼별 사용량</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 오퍼별 전환율 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">오퍼별 전환율</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, '전환율']}
                  />
                  <Line type="monotone" dataKey="conversion" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 할인금액 vs 주문금액 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">할인금액 vs 주문금액</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderAmountData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `₩${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₩${Number(value).toLocaleString()}`, '']}
                  />
                  <Bar dataKey="discount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="order" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 오퍼 상세 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">오퍼별 상세 성과</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    오퍼 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용량
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    할인금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주문금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offerAnalytics.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      오퍼 {item.offer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.period_start).toLocaleDateString()} ~ {new Date(item.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.total_usage) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₩{(Number(item.total_discount_amount) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₩{(Number(item.total_order_amount) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.conversion_rate) || 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.roi) || 0).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 