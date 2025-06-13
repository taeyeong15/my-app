'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Script {
  id: number;
  name: string;
  type: string;
  status: string;
  content: string;
  variables: string[];
  approval_status: 'approved' | 'pending' | 'rejected';
  created_by: string;
  created_at: string;
  updated_at: string;
  description: string;
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterApproval, setFilterApproval] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/scripts');
      const data = await response.json();

      if (response.ok) {
        setScripts(data.data || []);
      } else {
        throw new Error(data.error || '스크립트를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('스크립트 조회 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링 및 검색
  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || script.type === filterType;
    const matchesStatus = filterStatus === 'all' || script.status === filterStatus;
    const matchesApproval = filterApproval === 'all' || script.approval_status === filterApproval;
    
    return matchesSearch && matchesType && matchesStatus && matchesApproval;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      active: '활성',
      inactive: '비활성',
      draft: '초안'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getApprovalBadge = (approval: string) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      approved: '승인',
      pending: '대기',
      rejected: '거절'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[approval as keyof typeof badges]}`}>
        {labels[approval as keyof typeof labels]}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'sms': return '📱';
      case 'push': return '🔔';
      case 'alimtalk': return '💬';
      default: return '📄';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email': return '이메일';
      case 'sms': return 'SMS';
      case 'push': return '푸시';
      case 'alimtalk': return '알림톡';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <Layout title="스크립트 관리" subtitle="마케팅 메시지 템플릿을 생성하고 관리할 수 있습니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">스크립트를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="스크립트 관리" subtitle="마케팅 메시지 템플릿을 생성하고 관리할 수 있습니다.">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트 조회 실패</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchScripts}
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
      title="스크립트 관리" 
      subtitle="마케팅 메시지 템플릿을 생성하고 관리할 수 있습니다."
    >
      <div className="p-6 space-y-6">
        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: '전체 스크립트', 
              value: scripts.length, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '📄'
            },
            { 
              label: '활성 스크립트', 
              value: scripts.filter(s => s.status === 'active').length, 
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: '✅'
            },
            { 
              label: '승인 대기', 
              value: scripts.filter(s => s.approval_status === 'pending').length, 
              color: 'text-yellow-600',
              bg: 'bg-yellow-50',
              icon: '⏳'
            },
            { 
              label: '초안', 
              value: scripts.filter(s => s.status === 'draft').length, 
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              icon: '📝'
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
                placeholder="스크립트명, 내용 또는 생성자로 검색..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                유형 필터
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                <option value="email">이메일</option>
                <option value="sms">SMS</option>
                <option value="push">푸시</option>
                <option value="alimtalk">알림톡</option>
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
                <option value="draft">초안</option>
              </select>
            </div>
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                승인 상태
              </label>
              <select
                value={filterApproval}
                onChange={(e) => setFilterApproval(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">전체</option>
                <option value="approved">승인</option>
                <option value="pending">대기</option>
                <option value="rejected">거절</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchScripts}
                className="inline-flex items-center px-4 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </button>
              <Link
                href="/scripts/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                새 스크립트 만들기
              </Link>
            </div>
          </div>
        </div>

        {/* 스크립트 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                스크립트 목록 ({filteredScripts.length}개)
              </h3>
            </div>
          </div>

          {filteredScripts.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">스크립트가 없습니다</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterApproval !== 'all'
                  ? '조건에 맞는 스크립트를 찾을 수 없습니다.' 
                  : '새 스크립트를 만들어 마케팅 메시지를 시작해보세요.'
                }
              </p>
              <Link
                href="/scripts/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 새 스크립트 만들기
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      스크립트 정보
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      유형
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      승인 상태
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      변수
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
                  {filteredScripts.map((script) => (
                    <tr key={script.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {script.name}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          {script.description || '설명 없음'}
                        </div>
                        <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded max-w-xs truncate">
                          {script.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getTypeIcon(script.type)}</span>
                          <span className="text-sm text-gray-900">{getTypeLabel(script.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(script.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getApprovalBadge(script.approval_status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {script.variables.slice(0, 3).map((variable, index) => (
                            <span 
                              key={index} 
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded border border-blue-200"
                            >
                              {variable}
                            </span>
                          ))}
                          {script.variables.length > 3 && (
                            <span className="text-xs text-gray-400 px-2 py-1">
                              +{script.variables.length - 3}개 더
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{script.created_by}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(script.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/scripts/${script.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            상세보기
                          </Link>
                          <Link
                            href={`/scripts/${script.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                          >
                            수정
                          </Link>
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors">
                            복사
                          </button>
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