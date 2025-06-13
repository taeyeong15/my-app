'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Channel {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social' | 'display' | 'kakao';
  status: 'active' | 'inactive' | 'error';
  description: string;
  config: {
    endpoint?: string;
    apiKey?: string;
    template?: string;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  lastUsed: string;
  createdBy: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface SystemLog {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  meta?: string | object;
  created_at: string;
}

export default function ChannelsPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedInUser = localStorage.getItem('currentUser');
        if (!loggedInUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(loggedInUser);
        if (userData.role !== 'admin') {
          alert('관리자 권한이 필요합니다.');
          router.push('/dashboard');
          return;
        }

        setUser(userData);
        await loadChannels();
        fetchLogs();
      } catch (error) {
        console.error('인증 확인 오류:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const loadChannels = async () => {
    try {
      setError('');
      setLoading(true);
      
      const response = await fetch('/api/admin/channels');
      const data = await response.json();
      
      if (data.success && data.channels) {
        // API 응답 데이터를 UI 형태로 변환
        const transformedChannels = data.channels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          status: channel.status,
          description: channel.description,
          // config: JSON.parse(channel.config || '{}'),
          config: channel.config,
          stats: {
            sent: Math.floor(Math.random() * 100000) + 10000,
            delivered: Math.floor(Math.random() * 95000) + 9500,
            opened: Math.floor(Math.random() * 40000) + 3000,
            clicked: Math.floor(Math.random() * 8000) + 500
          },
          lastUsed: new Date(channel.updated_at || channel.created_at).toLocaleDateString('ko-KR'),
          createdBy: channel.created_by || '시스템'
        }));
        
        setChannels(transformedChannels);
      } else {
        // API 실패 시 기본 데이터 생성
        const fallbackChannels: Channel[] = [
          {
            id: 1,
            name: '이메일 마케팅',
            type: 'email',
            status: 'active',
            description: '이메일을 통한 마케팅 캠페인 발송',
            config: {
              endpoint: 'smtp.company.com',
              template: 'marketing_template_v2'
            },
            stats: {
              sent: 125000,
              delivered: 123500,
              opened: 45200,
              clicked: 8750
            },
            lastUsed: '2024-01-15',
            createdBy: '마케팅팀'
          },
          {
            id: 2,
            name: 'SMS 알림',
            type: 'sms',
            status: 'active',
            description: 'SMS를 통한 즉시 알림 및 프로모션',
            config: {
              endpoint: 'api.sms-provider.com',
              apiKey: 'hidden'
            },
            stats: {
              sent: 45000,
              delivered: 44800,
              opened: 44800,
              clicked: 3200
            },
            lastUsed: '2024-01-14',
            createdBy: '고객관리팀'
          },
          {
            id: 3,
            name: '카카오톡 비즈니스',
            type: 'kakao',
            status: 'active',
            description: '카카오톡 알림톡 및 친구톡 발송',
            config: {
              endpoint: 'api.kakao.com',
              template: 'business_template'
            },
            stats: {
              sent: 32000,
              delivered: 31800,
              opened: 28500,
              clicked: 5600
            },
            lastUsed: '2024-01-13',
            createdBy: '디지털팀'
          },
          {
            id: 4,
            name: '푸시 알림',
            type: 'push',
            status: 'inactive',
            description: '모바일 앱 푸시 알림',
            config: {
              endpoint: 'fcm.googleapis.com',
              apiKey: 'hidden'
            },
            stats: {
              sent: 15000,
              delivered: 12000,
              opened: 8500,
              clicked: 1200
            },
            lastUsed: '2024-01-05',
            createdBy: '앱개발팀'
          },
          {
            id: 5,
            name: '소셜 미디어 광고',
            type: 'social',
            status: 'error',
            description: '페이스북/인스타그램 광고',
            config: {
              endpoint: 'graph.facebook.com',
              apiKey: 'expired'
            },
            stats: {
              sent: 0,
              delivered: 0,
              opened: 0,
              clicked: 0
            },
            lastUsed: '2024-01-01',
            createdBy: '소셜팀'
          }
        ];
        setChannels(fallbackChannels);
      }
    } catch (error: any) {
      console.error('채널 조회 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
      // 오류 시 기본 데이터 사용
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/logs');
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs || []);
      } else {
        throw new Error(data.error || '로그를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('로그 조회 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-green-100 text-green-800';
      case 'push': return 'bg-purple-100 text-purple-800';
      case 'social': return 'bg-pink-100 text-pink-800';
      case 'display': return 'bg-orange-100 text-orange-800';
      case 'kakao': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'email': return '이메일';
      case 'sms': return 'SMS';
      case 'push': return '푸시 알림';
      case 'social': return '소셜 미디어';
      case 'display': return '디스플레이';
      case 'kakao': return '카카오톡';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'error': return '오류';
      default: return status;
    }
  };

  const handleStatusChange = (channelId: number, newStatus: 'active' | 'inactive') => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId ? { ...channel, status: newStatus } : channel
    ));
  };

  const filteredChannels = channels.filter(channel => {
    const matchesType = filterType === 'all' || channel.type === filterType;
    const matchesStatus = filterStatus === 'all' || channel.status === filterStatus;
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <Layout 
      title="채널 관리" 
      subtitle="마케팅 캠페인에 사용되는 다양한 채널을 설정하고 관리할 수 있습니다."
    >
      <div className="p-6">
        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { 
              title: '총 채널 수', 
              value: channels.length, 
              change: '+1', 
              icon: '📡', 
              color: 'blue' 
            },
            { 
              title: '활성 채널', 
              value: channels.filter(c => c.status === 'active').length, 
              change: '+2', 
              icon: '✅', 
              color: 'green' 
            },
            { 
              title: '총 발송 수', 
              value: `${(channels.reduce((sum, c) => sum + c.stats.sent, 0) / 1000).toFixed(0)}K`, 
              change: '+15.2%', 
              icon: '📤', 
              color: 'purple' 
            },
            { 
              title: '전체 전달률', 
              value: `${((channels.reduce((sum, c) => sum + c.stats.delivered, 0) / channels.reduce((sum, c) => sum + c.stats.sent, 0)) * 100).toFixed(1)}%`, 
              change: '+2.1%', 
              icon: '🎯', 
              color: 'orange' 
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="채널명 또는 설명으로 검색..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">채널 유형</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                <option value="email">이메일</option>
                <option value="sms">SMS</option>
                <option value="push">푸시 알림</option>
                <option value="social">소셜 미디어</option>
                <option value="kakao">카카오톡</option>
                <option value="display">디스플레이</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="error">오류</option>
              </select>
            </div>
          </div>
        </div>

        {/* 채널 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              채널 목록 ({filteredChannels.length}개)
            </h3>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              새 채널 추가
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">채널명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성과 지표</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전달률</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 사용</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChannels.map((channel) => {
                  const deliveryRate = channel.stats.sent > 0 ? (channel.stats.delivered / channel.stats.sent * 100) : 0;
                  const openRate = channel.stats.delivered > 0 ? (channel.stats.opened / channel.stats.delivered * 100) : 0;
                  const clickRate = channel.stats.opened > 0 ? (channel.stats.clicked / channel.stats.opened * 100) : 0;

                  return (
                    <tr key={channel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{channel.name}</div>
                        <div className="text-sm text-gray-500">{channel.description}</div>
                        <div className="text-xs text-gray-400 mt-1">담당: {channel.createdBy}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(channel.type)}`}>
                          {getTypeText(channel.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(channel.status)}`}>
                          {getStatusText(channel.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div>발송: {channel.stats.sent.toLocaleString()}</div>
                          <div>전달: {channel.stats.delivered.toLocaleString()}</div>
                          <div>열람: {channel.stats.opened.toLocaleString()}</div>
                          <div>클릭: {channel.stats.clicked.toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 w-12">전달</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(deliveryRate, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900 ml-2 w-12">{deliveryRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 w-12">열람</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(openRate, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900 ml-2 w-12">{openRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 w-12">클릭</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(clickRate, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900 ml-2 w-12">{clickRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(channel.lastUsed).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <button className="text-blue-600 hover:text-blue-900 text-left">설정</button>
                          <button className="text-green-600 hover:text-green-900 text-left">테스트</button>
                          {channel.status === 'active' && (
                            <button 
                              onClick={() => handleStatusChange(channel.id, 'inactive')}
                              className="text-yellow-600 hover:text-yellow-900 text-left"
                            >
                              비활성화
                            </button>
                          )}
                          {channel.status === 'inactive' && (
                            <button 
                              onClick={() => handleStatusChange(channel.id, 'active')}
                              className="text-green-600 hover:text-green-900 text-left"
                            >
                              활성화
                            </button>
                          )}
                          {channel.status === 'error' && (
                            <button className="text-orange-600 hover:text-orange-900 text-left">
                              복구
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredChannels.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">채널이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">새 채널을 추가하여 캠페인을 시작해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 