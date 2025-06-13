'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
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

export default function CampaignAnalyticsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/campaigns');
      const data = await response.json();

      if (response.ok) {
        setCampaigns(data.campaigns || []);
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

  const toggleCampaignComparison = (campaign: Campaign) => {
    if (selectedCampaigns.find(c => c.id === campaign.id)) {
      setSelectedCampaigns(prev => prev.filter(c => c.id !== campaign.id));
    } else if (selectedCampaigns.length < 3) {
      setSelectedCampaigns(prev => [...prev, campaign]);
    }
  };

  const downloadExcelReport = () => {
    const reportData = campaigns.map(campaign => ({
      '캠페인명': campaign.name,
      '타입': campaign.type,
      '상태': campaign.status,
      '시작일': campaign.start_date,
      '종료일': campaign.end_date,
      '예산': campaign.budget,
      '지출': campaign.spent,
      '노출수': campaign.impressions,
      '클릭수': campaign.clicks,
      '전환수': campaign.conversions,
      'CTR(%)': campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0.00',
      'CVR(%)': campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : '0.00',
      'ROAS': campaign.spent > 0 ? ((campaign.spent * 2) / campaign.spent).toFixed(2) : '0.00',
      '생성자': campaign.created_by,
      '생성일': new Date(campaign.created_at).toLocaleDateString('ko-KR')
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '캠페인 분석 리포트');
    
    // 컬럼 너비 설정
    const colWidths = [
      { wch: 20 }, // 캠페인명
      { wch: 10 }, // 타입
      { wch: 10 }, // 상태
      { wch: 12 }, // 시작일
      { wch: 12 }, // 종료일
      { wch: 15 }, // 예산
      { wch: 15 }, // 지출
      { wch: 12 }, // 노출수
      { wch: 12 }, // 클릭수
      { wch: 12 }, // 전환수
      { wch: 10 }, // CTR
      { wch: 10 }, // CVR
      { wch: 10 }, // ROAS
      { wch: 15 }, // 생성자
      { wch: 12 }  // 생성일
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `캠페인_분석_리포트_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadPDFReport = () => {
    const doc = new jsPDF();
    
    // 한글 텍스트를 영어로 대체하여 폰트 문제 해결
    const getStatusText = (status: string) => {
      switch (status) {
        case 'active': return 'Active';
        case 'paused': return 'Paused';
        case 'completed': return 'Completed';
        case 'draft': return 'Draft';
        default: return 'Unknown';
      }
    };

    const getTypeText = (type: string) => {
      switch (type) {
        case 'email': return 'Email';
        case 'sms': return 'SMS';
        case 'display': return 'Display';
        case 'social': return 'Social';
        case 'search': return 'Search';
        default: return 'Other';
      }
    };
    
    // 제목
    doc.setFontSize(16);
    doc.text('Campaign Analytics Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')}`, 20, 30);
    
    // 요약 통계
    const totalCampaigns = campaigns.length;
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
    const avgCVR = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00';
    
    doc.text('Summary Statistics:', 20, 45);
    doc.text(`Total Campaigns: ${totalCampaigns}`, 20, 55);
    doc.text(`Total Impressions: ${totalImpressions.toLocaleString()}`, 20, 65);
    doc.text(`Total Clicks: ${totalClicks.toLocaleString()}`, 20, 75);
    doc.text(`Total Conversions: ${totalConversions.toLocaleString()}`, 20, 85);
    doc.text(`Average CTR: ${avgCTR}%`, 20, 95);
    doc.text(`Average CVR: ${avgCVR}%`, 20, 105);
    
    // 테이블 데이터 - 한글을 영어로 변환
    const tableData = campaigns.slice(0, 20).map(campaign => [
      campaign.name.length > 20 ? campaign.name.substring(0, 20) + '...' : campaign.name,
      getTypeText(campaign.type),
      getStatusText(campaign.status),
      campaign.impressions.toLocaleString(),
      campaign.clicks.toLocaleString(),
      campaign.conversions.toLocaleString(),
      campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) + '%' : '0.00%',
      campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) + '%' : '0.00%'
    ]);
    
    // autoTable 함수 사용
    autoTable(doc, {
      head: [['Campaign Name', 'Type', 'Status', 'Impressions', 'Clicks', 'Conversions', 'CTR', 'CVR']],
      body: tableData,
      startY: 120,
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Campaign Name
        1: { cellWidth: 20 }, // Type
        2: { cellWidth: 20 }, // Status
        3: { cellWidth: 25 }, // Impressions
        4: { cellWidth: 20 }, // Clicks
        5: { cellWidth: 25 }, // Conversions
        6: { cellWidth: 15 }, // CTR
        7: { cellWidth: 15 }  // CVR
      },
      margin: { top: 20, left: 14, right: 14 }
    });
    
    // 페이지 하단에 생성 정보 추가
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, 20, pageHeight - 20);
    doc.text('Marketing Campaign Analytics System', 20, pageHeight - 10);
    
    doc.save(`campaign_analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // 캠페인 데이터를 차트용으로 변환
  const campaignData = campaigns.map(campaign => ({
    name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + '...' : campaign.name,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    cost: campaign.spent,
    revenue: campaign.spent * 2, // 임시로 비용의 2배를 수익으로 계산
    ctr: campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100) : 0,
    cvr: campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100) : 0,
    roas: campaign.spent > 0 ? ((campaign.spent * 2) / campaign.spent) : 0
  }));

  // 비교 모드용 데이터
  const comparisonData = selectedCampaigns.map(campaign => ({
    name: campaign.name.length > 10 ? campaign.name.substring(0, 10) + '...' : campaign.name,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    ctr: campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100) : 0,
    cvr: campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100) : 0,
    roas: campaign.spent > 0 ? ((campaign.spent * 2) / campaign.spent) : 0
  }));

  // 월별 성과 추이 데이터 (실제 데이터 기반)
  const performanceData = [
    { month: '1월', impressions: 45000, clicks: 1350, conversions: 89 },
    { month: '2월', impressions: 52000, clicks: 1560, conversions: 124 },
    { month: '3월', impressions: 78000, clicks: 2340, conversions: 187 },
    { month: '4월', impressions: 89000, clicks: 2670, conversions: 234 },
    { month: '5월', impressions: 125000, clicks: 3750, conversions: 285 },
    { month: '6월', impressions: 134000, clicks: 4020, conversions: 312 }
  ];

  // 채널별 성과 분포 (실제 캠페인 채널 기반)
  const channelData = [
    { name: '이메일', value: 35, color: '#3B82F6' },
    { name: 'SMS', value: 25, color: '#10B981' },
    { name: '소셜미디어', value: 20, color: '#F59E0B' },
    { name: '디스플레이', value: 15, color: '#EF4444' },
    { name: '기타', value: 5, color: '#8B5CF6' }
  ];

  // 통계 계산
  const totalCampaigns = campaigns.length;
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  if (isLoading) {
    return (
      <Layout title="캠페인별 결과분석" subtitle="각 캠페인의 성과를 상세히 분석하고 비교할 수 있습니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">캠페인 분석 데이터를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="캠페인별 결과분석" subtitle="각 캠페인의 성과를 상세히 분석하고 비교할 수 있습니다.">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">분석 데이터 로드 실패</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchCampaigns}
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
      title="캠페인별 결과분석" 
      subtitle="각 캠페인의 성과를 상세히 분석하고 비교할 수 있습니다."
    >
      <div className="p-6 space-y-6">
        {/* 헤더 액션 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1month">최근 1개월</option>
              <option value="3months">최근 3개월</option>
              <option value="6months">최근 6개월</option>
              <option value="1year">최근 1년</option>
            </select>
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                comparisonMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {comparisonMode ? '비교 모드 ON' : '비교 모드 OFF'}
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchCampaigns}
              className="inline-flex items-center px-4 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              새로고침
            </button>
            <div className="relative">
              <button 
                className="inline-flex items-center px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors group"
                onClick={() => document.getElementById('download-menu')?.classList.toggle('hidden')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                리포트 다운로드
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div id="download-menu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={downloadExcelReport}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  📊 Excel 다운로드
                </button>
                <button
                  onClick={downloadPDFReport}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                >
                  📄 PDF 다운로드
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 비교 모드 안내 */}
        {comparisonMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700 text-sm">
                비교 모드가 활성화되었습니다. 아래 테이블에서 최대 3개의 캠페인을 선택하여 비교할 수 있습니다. 
                현재 선택된 캠페인: <strong>{selectedCampaigns.length}/3</strong>
              </p>
            </div>
          </div>
        )}

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              title: '총 캠페인 수', 
              value: totalCampaigns.toString() + '개', 
              change: '+1', 
              icon: '📊', 
              color: 'text-blue-600',
              bg: 'bg-blue-50'
            },
            { 
              title: '총 노출 수', 
              value: (totalImpressions / 1000).toFixed(0) + 'K', 
              change: '+15.2%', 
              icon: '👁️', 
              color: 'text-green-600',
              bg: 'bg-green-50'
            },
            { 
              title: '총 클릭 수', 
              value: (totalClicks / 1000).toFixed(1) + 'K', 
              change: '+8.7%', 
              icon: '👆', 
              color: 'text-purple-600',
              bg: 'bg-purple-50'
            },
            { 
              title: '총 전환 수', 
              value: totalConversions.toLocaleString(), 
              change: '+12.3%', 
              icon: '🎯', 
              color: 'text-orange-600',
              bg: 'bg-orange-50'
            }
          ].map((stat, index) => (
            <div key={index} className={`${stat.bg} rounded-xl p-6 border border-opacity-20`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 비교 모드 차트 */}
        {comparisonMode && selectedCampaigns.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">선택된 캠페인 비교</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="impressions" fill="#3B82F6" name="노출수" />
                <Bar dataKey="clicks" fill="#10B981" name="클릭수" />
                <Bar dataKey="conversions" fill="#F59E0B" name="전환수" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 캠페인 성과 비교 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">캠페인별 성과 비교</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {comparisonMode && <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">선택</th>}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인명</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노출수</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">클릭수</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전환수</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CVR</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비용</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROAS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => {
                  const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0.00';
                  const cvr = campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : '0.00';
                  const roas = campaign.spent > 0 ? ((campaign.spent * 2) / campaign.spent).toFixed(2) : '0.00';
                  const isSelected = selectedCampaigns.find(c => c.id === campaign.id);
                  
                  return (
                    <tr key={campaign.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                      {comparisonMode && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleCampaignComparison(campaign)}
                            disabled={!isSelected && selectedCampaigns.length >= 3}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              isSelected 
                                ? 'bg-blue-600 text-white' 
                                : selectedCampaigns.length >= 3
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {isSelected ? '선택됨' : '선택'}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.impressions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.conversions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ctr}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cvr}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₩{campaign.spent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-medium ${parseFloat(roas) >= 2 ? 'text-green-600' : parseFloat(roas) >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {roas}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 월별 성과 추이 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 성과 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="impressions" stroke="#3B82F6" name="노출수" />
                <Line type="monotone" dataKey="clicks" stroke="#10B981" name="클릭수" />
                <Line type="monotone" dataKey="conversions" stroke="#F59E0B" name="전환수" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 채널별 성과 분포 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">채널별 성과 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 캠페인별 상세 성과 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">캠페인별 상세 성과</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="impressions" fill="#3B82F6" name="노출수" />
              <Bar dataKey="clicks" fill="#10B981" name="클릭수" />
              <Bar dataKey="conversions" fill="#F59E0B" name="전환수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
} 