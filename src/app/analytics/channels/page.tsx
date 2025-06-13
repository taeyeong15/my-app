'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface ChannelAnalytics {
  id: number;
  channel_name: string;
  channel_type: string;
  period_start: string;
  period_end: string;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_converted: number;
  total_unsubscribed: number;
  total_bounced: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  unsubscribe_rate: number;
  bounce_rate: number;
  cost: number;
  revenue: number;
  roi: number;
  avg_response_time: number;
  peak_send_time: string;
  best_day_of_week: string;
  created_at: string;
  updated_at: string;
}

export default function ChannelAnalyticsPage() {
  const [channelAnalytics, setChannelAnalytics] = useState<ChannelAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedChannelType, setSelectedChannelType] = useState('all');

  useEffect(() => {
    loadChannelAnalytics();
  }, [selectedPeriod, selectedChannelType]);

  const loadChannelAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/analytics/channels?period=${selectedPeriod}&type=${selectedChannelType}`);
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      if (data.success) {
        setChannelAnalytics(data.analytics || []);
      } else {
        throw new Error(data.error || '데이터 로드 실패');
      }
    } catch (error) {
      console.error('채널 분석 데이터 로드 실패:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const totalSent = channelAnalytics.reduce((sum, item) => sum + (Number(item.total_sent) || 0), 0);
  const totalDelivered = channelAnalytics.reduce((sum, item) => sum + (Number(item.total_delivered) || 0), 0);
  const totalConverted = channelAnalytics.reduce((sum, item) => sum + (Number(item.total_converted) || 0), 0);
  const totalRevenue = channelAnalytics.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);
  const avgDeliveryRate = channelAnalytics.length > 0 
    ? channelAnalytics.reduce((sum, item) => sum + (Number(item.delivery_rate) || 0), 0) / channelAnalytics.length 
    : 0;

  // 차트 데이터 준비
  const performanceData = channelAnalytics.map(item => ({
    name: item.channel_name,
    sent: Number(item.total_sent) || 0,
    delivered: Number(item.total_delivered) || 0,
    opened: Number(item.total_opened) || 0,
    clicked: Number(item.total_clicked) || 0,
    converted: Number(item.total_converted) || 0
  }));

  const rateData = channelAnalytics.map(item => ({
    name: item.channel_name,
    delivery: Number(item.delivery_rate) || 0,
    open: Number(item.open_rate) || 0,
    click: Number(item.click_rate) || 0,
    conversion: Number(item.conversion_rate) || 0
  }));

  const roiData = channelAnalytics.map(item => ({
    name: item.channel_name,
    cost: Number(item.cost) || 0,
    revenue: Number(item.revenue) || 0,
    roi: Number(item.roi) || 0
  }));

  // 채널 타입별 분포
  const channelTypeData = channelAnalytics.reduce((acc: any[], item) => {
    const existing = acc.find(x => x.name === item.channel_type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: item.channel_type, value: 1 });
    }
    return acc;
  }, []);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

  if (loading) {
    return (
      <Layout title="채널별 결과분석" subtitle="마케팅 채널의 성과를 상세히 분석합니다">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="채널별 결과분석" subtitle="마케팅 채널의 성과를 상세히 분석합니다">
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
                  onClick={loadChannelAnalytics}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">분석 기간</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체 기간</option>
                <option value="last30days">최근 30일</option>
                <option value="last3months">최근 3개월</option>
                <option value="last6months">최근 6개월</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">채널 타입</label>
              <select
                value={selectedChannelType}
                onChange={(e) => setSelectedChannelType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체 채널</option>
                <option value="email">이메일</option>
                <option value="sms">SMS</option>
                <option value="push">푸시</option>
                <option value="kakao">카카오</option>
                <option value="web">웹</option>
                <option value="mobile">모바일</option>
              </select>
            </div>
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: '총 발송량',
              value: totalSent.toLocaleString(),
              icon: '📤',
              color: 'blue'
            },
            {
              title: '총 전달량',
              value: totalDelivered.toLocaleString(),
              icon: '✅',
              color: 'green'
            },
            {
              title: '총 전환량',
              value: totalConverted.toLocaleString(),
              icon: '🎯',
              color: 'purple'
            },
            {
              title: '총 매출',
              value: `₩${(totalRevenue / 1000000).toFixed(1)}M`,
              icon: '💰',
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
          {/* 채널별 성과 비교 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">채널별 성과 비교</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
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
                  <Bar dataKey="sent" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delivered" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 전환율 비교 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">채널별 전환율 비교</h3>
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

          {/* ROI 분석 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">채널별 ROI 분석</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiData}>
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
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'roi' ? `${value}%` : `₩${Number(value).toLocaleString()}`,
                      name === 'cost' ? '비용' : name === 'revenue' ? '매출' : 'ROI'
                    ]}
                  />
                  <Bar dataKey="cost" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 채널 타입 분포 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">채널 타입 분포</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {channelTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center mt-4 flex-wrap gap-4">
              {channelTypeData.map((type, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="text-sm text-gray-600">{type.name} ({type.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 채널 상세 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">채널별 상세 성과</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    채널명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    발송량
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전달율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    오픈율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    클릭율
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
                {channelAnalytics.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.channel_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.channel_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.total_sent) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.delivery_rate) || 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.open_rate) || 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(Number(item.click_rate) || 0).toFixed(1)}%
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