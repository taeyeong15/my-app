'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface Notice {
  id: number;
  title: string;
  content: string;
  type: 'important' | 'update' | 'maintenance' | 'general';
  status: 'draft' | 'published' | 'archived';
  publishDate: string;
  expiryDate?: string;
  views: number;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export default function NoticesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
        
        // 관리자만 접근 가능
        if (userData.role !== 'admin') {
          alert('관리자만 접근할 수 있습니다.');
          router.push('/dashboard');
          return;
        }

        setUser(userData);
        
        // 공지사항 데이터 로드
        await loadNotices();
        
        setIsLoading(false);
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const loadNotices = async () => {
    try {
      setError('');
      const response = await fetch('/api/admin/notices');
      const data = await response.json();
      
      if (data.success && data.notices) {
        // API 응답 데이터를 UI 형태로 변환
        const transformedNotices = data.notices.map((notice: any) => ({
          id: notice.id,
          title: notice.title,
          content: notice.content,
          type: notice.type,
          status: notice.status,
          publishDate: notice.publish_date,
          expiryDate: notice.expiry_date,
          views: notice.views || 0,
          author: notice.author,
          createdAt: notice.created_at,
          updatedAt: notice.updated_at
        }));
        
        setNotices(transformedNotices);
      } else {
        // API 실패 시 기본 데이터 생성
        const fallbackNotices: Notice[] = [
          {
            id: 1,
            title: '2024년 마케팅 캠페인 가이드라인 업데이트',
            content: '효율적인 캠페인 운영을 위한 새로운 가이드라인이 업데이트 되었습니다. 모든 마케팅 담당자는 반드시 숙지하시기 바랍니다.',
            type: 'important',
            status: 'published',
            publishDate: '2024-01-15',
            expiryDate: '2024-12-31',
            views: 1247,
            author: '관리자',
            createdAt: '2024-01-14',
            updatedAt: '2024-01-15'
          },
          {
            id: 2,
            title: '대시보드 기능 개선 안내',
            content: '실시간 데이터 분석 기능이 추가되었습니다. 새로운 차트와 리포트 기능을 활용해보세요.',
            type: 'update',
            status: 'published',
            publishDate: '2024-01-12',
            views: 856,
            author: '개발팀',
            createdAt: '2024-01-11',
            updatedAt: '2024-01-12'
          },
          {
            id: 3,
            title: '정기 시스템 점검 안내',
            content: '매월 둘째 주 일요일 오전 2시-4시 정기 점검이 진행됩니다.',
            type: 'maintenance',
            status: 'published',
            publishDate: '2024-01-08',
            views: 234,
            author: '운영팀',
            createdAt: '2024-01-07',
            updatedAt: '2024-01-08'
          },
          {
            id: 4,
            title: '신규 고객 세분화 기능 출시 예정',
            content: '더욱 정교한 고객 타겟팅을 위한 새로운 세분화 기능이 곧 출시됩니다.',
            type: 'general',
            status: 'draft',
            publishDate: '2024-01-20',
            views: 0,
            author: '기획팀',
            createdAt: '2024-01-10',
            updatedAt: '2024-01-10'
          }
        ];
        setNotices(fallbackNotices);
      }
    } catch (error: any) {
      console.error('공지사항 조회 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
      // 오류 시 기본 데이터 사용
      const fallbackNotices: Notice[] = [
        {
          id: 1,
          title: '2024년 마케팅 캠페인 가이드라인 업데이트',
          content: '효율적인 캠페인 운영을 위한 새로운 가이드라인이 업데이트 되었습니다.',
          type: 'important',
          status: 'published',
          publishDate: '2024-01-15',
          views: 1247,
          author: '관리자',
          createdAt: '2024-01-14',
          updatedAt: '2024-01-15'
        }
      ];
      setNotices(fallbackNotices);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'important': return 'bg-red-100 text-red-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'important': return '중요';
      case 'update': return '업데이트';
      case 'maintenance': return '점검';
      case 'general': return '일반';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '게시중';
      case 'draft': return '임시저장';
      case 'archived': return '보관됨';
      default: return status;
    }
  };

  const filteredNotices = notices.filter(notice => {
    const matchesType = filterType === 'all' || notice.type === filterType;
    const matchesStatus = filterStatus === 'all' || notice.status === filterStatus;
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout 
      title="공지사항 관리" 
      subtitle="마케팅 캠페인에 사용되는 공지사항을 설정하고 관리할 수 있습니다."
    >
      <div className="p-6">
        {/* 헤더 액션 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            새 공지사항 작성
          </button>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="제목, 내용 또는 작성자로 검색..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">유형</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                <option value="important">중요</option>
                <option value="update">업데이트</option>
                <option value="maintenance">점검</option>
                <option value="general">일반</option>
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
                <option value="published">게시중</option>
                <option value="draft">임시저장</option>
                <option value="archived">보관됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              공지사항 목록 ({filteredNotices.length}개)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">게시일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{notice.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2 max-w-md">
                        {notice.content}
                      </div>
                      {notice.expiryDate && (
                        <div className="text-xs text-orange-600 mt-1">
                          만료일: {notice.expiryDate}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notice.type)}`}>
                        {getTypeText(notice.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notice.status)}`}>
                        {getStatusText(notice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{notice.publishDate}</div>
                      <div className="text-gray-500 text-xs">수정: {notice.updatedAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notice.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notice.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">수정</button>
                        <button className="text-green-600 hover:text-green-900">복사</button>
                        {notice.status === 'draft' && (
                          <button className="text-purple-600 hover:text-purple-900">게시</button>
                        )}
                        {notice.status === 'published' && (
                          <button className="text-yellow-600 hover:text-yellow-900">보관</button>
                        )}
                        <button className="text-red-600 hover:text-red-900">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredNotices.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-13h5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">공지사항이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">새 공지사항을 작성해보세요.</p>
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  첫 공지사항 작성
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 