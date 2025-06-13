'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface Notice {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: string;
  is_important: boolean;
  created_at: string;
}

interface BestPractice {
  id: number;
  campaign_name: string;
  campaign_type: string;
  success_metric: string;
  metric_value: number;
  achievement_rate: number;
  target_audience: string;
  key_tactics: string;
  success_factors: string;
  is_featured: number;
  view_count: number;
  like_count: number;
}

interface RecommendedSegment {
  id: number;
  segment_name: string;
  segment_description: string;
  segment_size: number;
  potential_value: number;
  conversion_probability: number;
  recommended_channels: string[];
  engagement_score: number;
  churn_risk: string;
  priority_level: string;
  campaign_suggestions: string;
}

interface KPIMetrics {
  latestDaily: any;
  weeklyTrend: any[];
  monthlyComparison: any[];
}

interface Alert {
  id: number;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  action_url: string;
  created_at: string;
}

interface PendingCampaigns {
  pending_count: number;
}

interface DashboardData {
  notices: Notice[];
  bestPractices: BestPractice[];
  recommendedSegments: RecommendedSegment[];
  kpiMetrics: KPIMetrics;
  alerts: Alert[];
  lastUpdated: string;  
  pendingCampaigns: PendingCampaigns;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllNotices, setShowAllNotices] = useState(false);
  const [showAllBestPractices, setShowAllBestPractices] = useState(false);
  const [showAllSegments, setShowAllSegments] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('대시보드 데이터 로드 실패');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <Layout title="대시보드" subtitle="마케팅 캠페인 현황을 한눈에 확인하세요">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout title="대시보드" subtitle="마케팅 캠페인 현황을 한눈에 확인하세요">
        <div className="text-center py-12">
          <p className="text-gray-500">대시보드 데이터를 불러올 수 없습니다.</p>
        </div>
      </Layout>
    );
  }

  const { notices, bestPractices, recommendedSegments, kpiMetrics, alerts, pendingCampaigns } = dashboardData;
  
  // KPI 데이터 처리
  const latestKPI = kpiMetrics.latestDaily || {};
  const previousKPI = kpiMetrics.monthlyComparison?.[1] || {};
  const weeklyData = kpiMetrics.weeklyTrend || [];
  
  // 변화율 계산 함수
  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return '+0.0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };
  
  // 주요 지표 카드 데이터
  const mainMetrics = [
    {
      title: 'DAU',
      value: (latestKPI.dau || 0).toLocaleString(),
      change: calculateChange(latestKPI.dau || 0, previousKPI.dau || 0),
      icon: '👥',
      color: 'blue'
    },
    {
      title: '전체 전환율',
      value: `${Number(latestKPI.overall_conversion_rate || 0).toFixed(1)}%`,
      change: calculateChange(latestKPI.overall_conversion_rate || 0, previousKPI.overall_conversion_rate || 0),
      icon: '📈',
      color: 'green'
    },
    {
      title: '일일 매출',
      value: `₩${(Number(latestKPI.total_revenue || 0) / 1000000).toFixed(1)}M`,
      change: calculateChange(latestKPI.total_revenue || 0, previousKPI.total_revenue || 0),
      icon: '💰',
      color: 'purple'
    },
    {
      title: '활성 캠페인',
      value: (latestKPI.active_campaigns || 0).toString(),
      change: calculateChange(latestKPI.active_campaigns || 0, previousKPI.active_campaigns || 0),
      icon: '🚀',
      color: 'orange'
    }
  ];

  // 표시할 아이템 수 계산
  const displayedNotices = showAllNotices ? notices : notices.slice(0, 4);
  const displayedBestPractices = showAllBestPractices ? bestPractices : bestPractices.slice(0, 3);
  const displayedSegments = showAllSegments ? recommendedSegments : recommendedSegments.slice(0, 3);
  const displayedAlerts = showAllAlerts ? alerts : alerts.slice(0, 1);

  return (
    <Layout title="대시보드" subtitle="마케팅 성과를 한눈에 확인하세요">
      <div className="p-6 space-y-6">
        
        {/* 알림 배너 */}
        {alerts.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 relative">
            {/* 토글 버튼 - 우측 상단 고정 */}
            {alerts.length > 1 && (
              <div className="absolute top-4 right-8 z-10">
                <button 
                  onClick={() => setShowAllAlerts(!showAllAlerts)}
                  className="px-3 py-1.5 text-sm bg-white text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium rounded-lg border border-blue-200 transition-colors shadow-sm"
                >
                  {showAllAlerts ? '닫기' : `모두 보기 (${alerts.length})`}
                </button>
              </div>
            )}
            
            {/* 알림 리스트 */}
            <div className={`pr-28 ${showAllAlerts && alerts.length > 1 ? 'max-h-80 overflow-y-auto' : ''}`}>
              {displayedAlerts.map((alert, index) => (
                <div key={alert.id} className={`${index > 0 ? 'mt-4 pt-4 border-t border-blue-200' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">실시간 알림</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.severity === 'success' ? 'bg-green-100 text-green-800' :
                          alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          alert.severity === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.created_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 스크롤 힌트 (모두 보기 상태에서 알림이 많을 때만) */}
              {/* {showAllAlerts && alerts.length > 2 && (
                <div className="mt-3 text-center py-2 border-t border-blue-200">
                  <p className="text-xs text-gray-500">↑ 위로 스크롤하여 이전 알림 확인 ↑</p>
                </div>
              )} */}
            </div>
          </div>
        )}

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <p className="text-sm text-green-600 mt-1">{metric.change}</p>
                </div>
                <div className="text-3xl">{metric.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 상단 섹션: 성과 트렌드 + 공지사항 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 성과 트렌드 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">주간 성과 트렌드</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="metric_date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'dau' ? Number(value).toLocaleString() + '명' :
                      name === 'total_conversions' ? Number(value).toLocaleString() + '건' :
                      name === 'total_revenue' ? '₩' + (Number(value) / 1000000).toFixed(1) + 'M' :
                      Number(value).toFixed(1) + '%',
                      name === 'dau' ? 'DAU' :
                      name === 'total_conversions' ? '전환' :
                      name === 'total_revenue' ? '매출' : '전환율'
                    ]}
                  />
                  <Area type="monotone" dataKey="dau" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="total_conversions" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 공지사항 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">공지사항</h3>
              <Link
                href="/admin/notices"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                더보기
              </Link>
            </div>
            <div className="space-y-4">
              {displayedNotices.map((notice) => (
                <div key={notice.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    notice.priority === 'urgent' ? 'bg-red-500' :
                    notice.priority === 'high' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{notice.title}</p>
                      {notice.is_important && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                          중요
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 중간 섹션: 캠페인 우수사례 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">캠페인 우수사례</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedBestPractices.map((practice) => (
              <div key={practice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    practice.campaign_type === 'email' ? 'bg-blue-100 text-blue-800' :
                    practice.campaign_type === 'sms' ? 'bg-green-100 text-green-800' :
                    practice.campaign_type === 'push' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {practice.campaign_type.toUpperCase()}
                  </span>
                  {
                    practice.is_featured === 1 ? <span className="text-yellow-500">⭐</span> : <span className="text-yellow-500"></span>
                  }
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{practice.campaign_name}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{practice.target_audience}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-600">달성률:</span>
                    <span className="font-semibold text-green-600 ml-1">
                      {Number(practice.achievement_rate).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>👁 {practice.view_count}</span>
                    <span>❤️ {practice.like_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 섹션: 추천 고객군 + 빠른 액션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 추천 고객군 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">추천 고객군</h3>
            </div>
            <div className="space-y-4">
              {displayedSegments.map((segment) => (
                <div key={segment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{segment.segment_name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          segment.priority_level === 'urgent' ? 'bg-red-100 text-red-800' :
                          segment.priority_level === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {segment.priority_level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{segment.segment_description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">고객군 크기:</span>
                          <span className="font-semibold ml-1">{segment.segment_size.toLocaleString()}명</span>
                        </div>
                        <div>
                          <span className="text-gray-600">전환 확률:</span>
                          <span className="font-semibold text-green-600 ml-1">
                            {Number(segment.conversion_probability).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">예상 가치:</span>
                          <span className="font-semibold ml-1">
                            ₩{(Number(segment.potential_value) / 1000000).toFixed(0)}M
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">참여도:</span>
                          <span className="font-semibold ml-1">{Number(segment.engagement_score).toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 line-clamp-1">{segment.campaign_suggestions}</p>
                      </div>
                    </div>
                    <Link
                      href="/campaigns/new"
                      className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      캠페인 생성
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">빠른 액션</h3>
            <div className="space-y-3">
              {[
                { icon: '📧', title: '캠페인 생성', subtitle: 'SMS/카카오톡/앱푸시', color: 'blue', href: '/campaigns/new?reset=true' },
                { icon: '👥', title: '고객군 생성', subtitle: '세그먼트 관리', color: 'green', href: '/customers/new' },
                { icon: '🎯', title: '오퍼 생성', subtitle: '할인/쿠폰 관리', color: 'purple', href: '/offers/new' },
                { icon: '📊', title: '성과 분석', subtitle: '상세 리포트', color: 'orange', href: '/analytics/campaigns' },
                { icon: '⚙️', title: '스크립트 생성', subtitle: '채널 메시지 설정', color: 'gray', href: '/scripts/new' },
                { 
                  icon: '📋', 
                  title: '승인 대기', 
                  subtitle: `${pendingCampaigns.pending_count || 0}건 대기중`, 
                  color: 'red', 
                  href: '/campaigns/pending' 
                }
              ].map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="text-2xl mr-3">{action.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {action.title}
                    </p>
                    <p className="text-xs text-gray-500">{action.subtitle}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* 마지막 업데이트 시간 */}
        {/* <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            마지막 업데이트: {new Date(dashboardData.lastUpdated).toLocaleString('ko-KR')}
          </p>
        </div> */}
      </div>
    </Layout>
  );
} 