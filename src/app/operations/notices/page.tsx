'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';

interface Notice {
  id: number;
  title: string;
  content: string;
  type: 'notice' | 'event' | 'maintenance' | 'update';
  status: 'published' | 'draft' | 'archived';
  priority: 'high' | 'normal' | 'low';
  views: number;
  is_pinned: boolean;
  start_date: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      try {
        const loggedInUser = sessionStorage.getItem('currentUser');
        
        if (!loggedInUser) {
          router.push('/login');
          return;
        }
        
        // 인증 확인 후 데이터 로드
        fetchNotices();
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notices');
      const data = await response.json();

      if (response.ok) {
        setNotices(data.notices || []);
      } else {
        throw new Error(data.error || '공지사항을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('공지사항 조회 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      notice: 'bg-blue-100 text-blue-800 border border-blue-200',
      event: 'bg-green-100 text-green-800 border border-green-200',
      maintenance: 'bg-orange-100 text-orange-800 border border-orange-200',
      update: 'bg-purple-100 text-purple-800 border border-purple-200'
    };
    
    const labels = {
      notice: '공지',
      event: '이벤트',
      maintenance: '점검',
      update: '업데이트'
    };

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${badges[type as keyof typeof badges]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      published: 'bg-green-100 text-green-800 border border-green-200',
      draft: 'bg-gray-100 text-gray-800 border border-gray-200',
      archived: 'bg-red-100 text-red-800 border border-red-200'
    };
    
    const labels = {
      published: '게시중',
      draft: '임시저장',
      archived: '보관'
    };

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') {
      return <span className="text-red-500 font-bold">🔥</span>;
    }
    return null;
  };

  const filteredNotices = notices.filter(notice => {
    const matchesType = filterType === 'all' || notice.type === filterType;
    const matchesStatus = filterStatus === 'all' || notice.status === filterStatus;
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <Layout title="공지사항 관리" subtitle="시스템 공지사항을 생성하고 관리할 수 있습니다.">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">공지사항을 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="공지사항 관리" subtitle="시스템 공지사항을 생성하고 관리할 수 있습니다.">
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">공지사항 조회 실패</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchNotices}
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
      title="공지사항 관리" 
      subtitle="시스템 공지사항을 생성하고 관리할 수 있습니다."
    >
      <div className="p-6 space-y-6">
        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: '전체 공지사항', 
              value: notices.length, 
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: '📢'
            },
            { 
              label: '게시중', 
              value: notices.filter(n => n.status === 'published').length, 
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: '✅'
            },
            { 
              label: '중요 공지', 
              value: notices.filter(n => n.priority === 'high').length, 
              color: 'text-red-600',
              bg: 'bg-red-50',
              icon: '🔥'
            },
            { 
              label: '총 조회수', 
              value: notices.reduce((sum, n) => sum + n.views, 0).toLocaleString(), 
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              icon: '👀'
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
                placeholder="제목 또는 작성자로 검색..."
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
                <option value="notice">공지</option>
                <option value="event">이벤트</option>
                <option value="maintenance">점검</option>
                <option value="update">업데이트</option>
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
                <option value="published">게시중</option>
                <option value="draft">임시저장</option>
                <option value="archived">보관</option>
              </select>
            </div>
            <div className="lg:w-auto">
              <Link
                href="/operations/notices/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                새 공지사항 작성
              </Link>
            </div>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                공지사항 목록 ({filteredNotices.length}개)
              </h3>
              <button
                onClick={fetchNotices}
                className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
              </button>
            </div>
          </div>

          {filteredNotices.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">공지사항이 없습니다</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? '조건에 맞는 공지사항을 찾을 수 없습니다.' 
                  : '새 공지사항을 작성해보세요.'
                }
              </p>
              <Link
                href="/operations/notices/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 새 공지사항 작성
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      유형
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      게시기간
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      조회수
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성자
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {notice.is_pinned && <span className="text-red-500">📌</span>}
                              {getPriorityIcon(notice.priority)}
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {notice.title}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 max-w-md truncate">
                              {notice.content}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(notice.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(notice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(notice.start_date).toLocaleDateString('ko-KR')}
                        </div>
                        {notice.end_date && (
                          <div className="text-xs text-gray-500">
                            ~ {new Date(notice.end_date).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {notice.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{notice.created_by}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(notice.updated_at).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/operations/notices/${notice.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            상세보기
                          </Link>
                          <Link
                            href={`/operations/notices/${notice.id}/edit`}
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