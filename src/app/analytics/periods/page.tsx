'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface PeriodAnalytics {
  id: number;
  period_name: string;
  period_type: string;
  period_start: string;
  period_end: string;
  total_campaigns: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_converted: number;
  total_cost: number;
  total_revenue: number;
  avg_delivery_rate: number;
  avg_open_rate: number;
  avg_click_rate: number;
  avg_conversion_rate: number;
  roi: number;
  customer_acquisition: number;
  customer_retention_rate: number;
  top_performing_channel: string;
  top_performing_campaign: string;
  budget_utilization: number;
  created_at: string;
  updated_at: string;
}

export default function PeriodAnalyticsPage() {
  const [periodAnalytics, setPeriodAnalytics] = useState<PeriodAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriodType, setSelectedPeriodType] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    loadPeriodAnalytics();
  }, [selectedPeriodType, selectedYear]);

  const loadPeriodAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/analytics/periods?type=${selectedPeriodType}&year=${selectedYear}`);
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      if (data.success) {
        setPeriodAnalytics(data.analytics || []);
      } else {
        throw new Error(data.error || '데이터 로드 실패');
      }
    } catch (error) {
      console.error('기간 분석 데이터 로드 실패:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const totalCampaigns = periodAnalytics.reduce((sum, item) => sum + (Number(item.total_campaigns) || 0), 0);
  const totalSent = periodAnalytics.reduce((sum, item) => sum + (Number(item.total_sent) || 0), 0);
  const totalRevenue = periodAnalytics.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0);
  const avgROI = periodAnalytics.length > 0 
    ? periodAnalytics.reduce((sum, item) => sum + (Number(item.roi) || 0), 0) / periodAnalytics.length 
    : 0;

  // 차트 데이터 준비
  const performanceData = periodAnalytics.map(item => ({
    name: item.period_name,
    campaigns: Number(item.total_campaigns) || 0,
    sent: Number(item.total_sent) || 0,
    delivered: Number(item.total_delivered) || 0,
    converted: Number(item.total_converted) || 0,
    revenue: Number(item.total_revenue) || 0
  }));

  const rateData = periodAnalytics.map(item => ({
    name: item.period_name,
    delivery: Number(item.avg_delivery_rate) || 0,
    open: Number(item.avg_open_rate) || 0,
    click: Number(item.avg_click_rate) || 0,
    conversion: Number(item.avg_conversion_rate) || 0
  }));

  const financialData = periodAnalytics.map(item => ({
    name: item.period_name,
    cost: Number(item.total_cost) || 0,
    revenue: Number(item.total_revenue) || 0,
    roi: Number(item.roi) || 0
  }));

  if (loading) {
    return (
      <Layout title="기간별 결과분석" subtitle="시간대별 마케팅 성과를 상세히 분석합니다">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="기간별 결과분석" subtitle="시간대별 마케팅 성과를 상세히 분석합니다">
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
                  onClick={loadPeriodAnalytics}
                  className="text-sm text-red-600 underline mt-1 hover:text-red-800"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기간 타입</label>
              <select
                value={selectedPeriodType}
                onChange={(e) => setSelectedPeriodType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체 타입</option>
                <option value="monthly">월별</option>
                <option value="quarterly">분기별</option>
                <option value="yearly">연도별</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">연도</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체 연도</option>
                <option value="2024">2024년</option>
                <option value="2023">2023년</option>
                <option value="2022">2022년</option>
              </select>
            </div>
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: '총 캠페인',
              value: totalCampaigns.toLocaleString(),
              icon: '📊',
              color: 'blue'
            },
            {
              title: '총 발송량',
              value: totalSent.toLocaleString(),
              icon: '📤',
              color: 'green'
            },
            {
              title: '총 매출',
              value: `₩${(totalRevenue / 1000000).toFixed(1)}M`,
              icon: '💰',
              color: 'purple'
            },
            {
              title: '평균 ROI',
              value: `${avgROI.toFixed(1)}%`,
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
          {/* 기간별 성과 추이 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">기간별 성과 추이</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
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
                  <Area type="monotone" dataKey="campaigns" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="sent" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="converted" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 전환율 추이 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">전환율 추이</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rateData}>
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
                    formatter={(value) => [`${value}%`, '']}
                  />
                  <Line type="monotone" dataKey="delivery" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="open" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="click" stroke="#F59E0B" strokeWidth={2} />
                  <Line type="monotone" dataKey="conversion" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 매출 및 비용 추이 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">매출 및 비용 추이</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
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
                  <Bar dataKey="cost" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ROI 추이 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">ROI 추이</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialData}>
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
                    formatter={(value) => [`${value}%`, 'ROI']}
                  />
                  <Line type="monotone" dataKey="roi" stroke="#8B5CF6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 기간별 상세 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">기간별 상세 성과</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    캠페인 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    발송량
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환량
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    매출
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
                {periodAnalytics.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.period_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.period_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.total_campaigns) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.total_sent) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.total_converted) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₩{(Number(item.total_revenue) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.avg_conversion_rate) || 0).toFixed(1)}%
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