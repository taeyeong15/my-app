'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface PasswordRequest {
  id: number;
  user_id: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export default function AdminPasswordsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<PasswordRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const loggedInUser = localStorage.getItem('currentUser');
        if (!loggedInUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(loggedInUser);
        if (userData.role !== 'admin') {
          alert('관리자 권한이 필요합니다.');
          router.push('/');
          return;
        }

        setUser(userData);
        fetchData();
      } catch (error) {
        console.error('인증 확인 오류:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 비밀번호 재설정 요청 조회
      const requestsResponse = await fetch('/api/admin/password-requests');
      const requestsData = await requestsResponse.json();
      
      // 사용자 목록 조회
      const usersResponse = await fetch('/api/admin/users');
      const usersData = await usersResponse.json();

      if (requestsResponse.ok && usersResponse.ok) {
        setRequests(requestsData.requests || []);
        setUsers(usersData.users || []);
      } else {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('데이터 조회 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/password-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchData(); // 데이터 새로고침
        alert(`요청이 ${status === 'approved' ? '승인' : '거부'}되었습니다.`);
      } else {
        throw new Error(data.error || '상태 업데이트에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('상태 업데이트 오류:', err);
      alert(err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUserId || !newPassword) {
      alert('사용자와 새 비밀번호를 선택해주세요.');
      return;
    }

    if (newPassword.length < 4) {
      alert('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    try {
      setResetting(true);
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('비밀번호가 성공적으로 재설정되었습니다.');
        setSelectedUserId(null);
        setNewPassword('');
      } else {
        throw new Error(data.error || '비밀번호 재설정에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('비밀번호 재설정 오류:', err);
      alert(err.message);
    } finally {
      setResetting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'rejected': return '거부됨';
      case 'pending': return '대기중';
      default: return '알수없음';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout 
      title="사용자 관리" 
      subtitle="마케팅 캠페인을 사용하는 사용자 패스워드를 설정하고 관리할 수 있습니다."
    >
      <div className="p-6">
        {/* 비밀번호 재설정 도구 */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              비밀번호 직접 재설정
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 선택
                </label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">사용자를 선택하세요</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handlePasswordReset}
                  disabled={resetting || !selectedUserId || !newPassword}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resetting ? '처리 중...' : '비밀번호 재설정'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 비밀번호 재설정 요청 목록 */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                비밀번호 재설정 요청
              </h2>
              <button
                onClick={fetchData}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">요청이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">비밀번호 재설정 요청이 있으면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          사용자 ID: {request.user_id}
                          {request.user_name && ` (${request.user_name})`}
                          {request.user_email && ` - ${request.user_email}`}
                        </p>
                      </div>
                      <p className="text-gray-700 mb-3">
                        <strong>사유:</strong> {request.reason}
                      </p>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'approved')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'rejected')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          거부
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 