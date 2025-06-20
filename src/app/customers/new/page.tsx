'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { useToast } from '@/components/Toast';

// 공통코드 인터페이스 추가
interface CommonCode {
  category: string;
  sub_category: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

interface CustomerSegmentForm {
  name: string;
  description: string;
  criteria: {
    // 나이
    age: { min: string; max: string };
    // 성별
    gender: { value: string };
    // 혼인 여부
    marriage_status: { value: string };
    // 회원등급
    member_grade: { value: string };
    // 마케팅 동의 여부
    marketing_agree_yn: { value: string };
    // 외국인 여부
    foreigner_yn: { value: string };
    // 회원상태
    member_status: { value: string };
    // 주소 (시/도)
    address: { value: string };
    // 기념일 유형
    anniversary_type: { value: string };
    // 이메일 도메인
    email_domain: { value: string };
    // SMS 동의 여부
    sms_agree_yn: { value: string };
    // EMAIL 동의 여부
    email_agree_yn: { value: string };
    // 카카오톡 동의 여부
    kakao_agree_yn: { value: string };
    // APP PUSH 동의 여부
    app_push_agree_yn: { value: string };
  };
  tags: string[];
}

interface CustomerGroup {
  id: number;
  name: string;
  description: string;
  estimated_count: number;
  actual_count: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_date: string;
  created_dept: string;
  updated_date?: string;
  updated_dept?: string;
  updated_emp_no?: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  emp_no?: string;
}

function CustomerSegmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('id');
  const mode = searchParams.get('mode') || 'create';
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // 공통코드 상태 추가
  const [commonCodes, setCommonCodes] = useState<{
    gender: CommonCode[];
    marriageStatus: CommonCode[];
    memberGrade: CommonCode[];
    marketingAgree: CommonCode[];
    foreigner: CommonCode[];
    memberStatus: CommonCode[];
    address: CommonCode[];
    anniversaryType: CommonCode[];
    emailDomain: CommonCode[];
    smsAgree: CommonCode[];
    emailAgree: CommonCode[];
    kakaoAgree: CommonCode[];
    appPushAgree: CommonCode[];
  }>({
    gender: [],
    marriageStatus: [],
    memberGrade: [],
    marketingAgree: [],
    foreigner: [],
    memberStatus: [],
    address: [],
    anniversaryType: [],
    emailDomain: [],
    smsAgree: [],
    emailAgree: [],
    kakaoAgree: [],
    appPushAgree: []
  });
  
  const [formData, setFormData] = useState<CustomerSegmentForm>({
    name: '',
    description: '',
    criteria: {
      age: { min: '', max: '' },
      gender: { value: '' },
      marriage_status: { value: '' },
      member_grade: { value: '' },
      marketing_agree_yn: { value: '' },
      foreigner_yn: { value: '' },
      member_status: { value: '' },
      sms_agree_yn: { value: '' },
      email_agree_yn: { value: '' },
      kakao_agree_yn: { value: '' },
      app_push_agree_yn: { value: '' },
      address: { value: '' },
      anniversary_type: { value: '' },
      email_domain: { value: '' },
    },
    tags: []
  });

  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    checkAuth();
    loadCommonCodes();
    if (groupId && mode !== 'create') {
      fetchCustomerGroup();
    } else {
      setIsLoading(false);
    }
  }, [groupId, mode]);

  // 공통코드 로드 함수 추가
  const loadCommonCodes = async () => {
    try {
      const response = await fetch('/api/common-codes?category=CUSTOMER');
      if (response.ok) {
        const data = await response.json();
        const codes = data.codes as CommonCode[];
        
        // 카테고리별로 분류
        setCommonCodes({
          gender: codes.filter(c => c.sub_category === 'GENDER'),
          marriageStatus: codes.filter(c => c.sub_category === 'MARRIAGE_STATUS'),
          memberGrade: codes.filter(c => c.sub_category === 'MEMBER_GRADE'),
          marketingAgree: codes.filter(c => c.sub_category === 'MARKETING_AGREE'),
          foreigner: codes.filter(c => c.sub_category === 'FOREIGNER'),
          memberStatus: codes.filter(c => c.sub_category === 'MEMBER_STATUS'),
          address: codes.filter(c => c.sub_category === 'ADDRESS'),
          anniversaryType: codes.filter(c => c.sub_category === 'ANNIVERSARY_TYPE'),
          emailDomain: codes.filter(c => c.sub_category === 'EMAIL_DOMAIN'),
          smsAgree: codes.filter(c => c.sub_category === 'SMS_AGREE'),
          emailAgree: codes.filter(c => c.sub_category === 'EMAIL_AGREE'),
          kakaoAgree: codes.filter(c => c.sub_category === 'KAKAO_AGREE'),
          appPushAgree: codes.filter(c => c.sub_category === 'APP_PUSH_AGREE')
        });
      } else {
        console.error('공통코드 로드 실패:', response.statusText);
      }
    } catch (error) {
      console.error('공통코드 로드 중 오류:', error);
    }
  };

  const checkAuth = () => {
    const loggedInUser = sessionStorage.getItem('currentUser');
    if (!loggedInUser) {
      router.push('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(loggedInUser);
      setCurrentUser(userData);
    } catch (error) {
      console.error('사용자 정보 파싱 실패:', error);
      router.push('/login');
    }
  };

  const fetchCustomerGroup = async () => {
    if (!groupId) return;
    
    try {
      const response = await fetch(`/api/customer-groups/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        const group = data.customerGroup;
        
        // 권한 확인
        if (!checkEditPermission(group)) {
          showToast('이 고객군을 편집할 권한이 없습니다.', 'error');
          router.push('/customers');
          return;
        }
        
        // 폼 데이터 설정
        setFormData({
          name: group.name || '',
          description: group.description || '',
          criteria: {
            age: { min: '', max: '' },
            gender: { value: '' },
            marriage_status: { value: '' },
            member_grade: { value: '' },
            marketing_agree_yn: { value: '' },
            foreigner_yn: { value: '' },
            member_status: { value: '' },
            sms_agree_yn: { value: '' },
            email_agree_yn: { value: '' },
            kakao_agree_yn: { value: '' },
            app_push_agree_yn: { value: '' },
            address: { value: '' },
            anniversary_type: { value: '' },
            email_domain: { value: '' },
          },
          tags: []
        });
      } else {
        throw new Error('고객군 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('고객군 조회 실패:', error);
      showToast('고객군 정보를 불러오는데 실패했습니다.', 'error');
      router.push('/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const checkEditPermission = (group: CustomerGroup) => {
    // sessionStorage에서 직접 사용자 정보를 가져와서 권한 확인
    const loggedInUser = sessionStorage.getItem('currentUser');
    if (!loggedInUser) {
      console.log('로그인된 사용자 정보가 없습니다.');
      return false;
    }
    
    try {
      const userData = JSON.parse(loggedInUser);
      console.log('권한 확인 - 현재 사용자:', userData);
      console.log('권한 확인 - 고객군 정보:', group);
      
      // 관리자는 모든 고객군 편집 가능
      if (userData.role === 'admin') {
        console.log('관리자 권한으로 편집 허용');
        return true;
      }
      
      // 생성자 본인만 편집 가능
      const canEdit = group.created_by === userData.email;
      console.log('편집 권한 결과:', canEdit, '(생성자:', group.created_by, ', 현재 사용자:', userData.email, ')');
      return canEdit;
    } catch (error) {
      console.error('권한 확인 중 에러:', error);
      return false;
    }
  };

  const getPageTitle = () => {
    if (mode === 'view') return '고객군 상세보기';
    if (mode === 'edit') return '고객군 수정';
    return '고객군 생성';
  };

  const getPageSubtitle = () => {
    if (mode === 'view') return '고객군의 상세 정보를 확인할 수 있습니다.';
    if (mode === 'edit') return '기존 고객군의 정보를 수정할 수 있습니다.';
    return '새로운 고객군을 생성하고 조건을 설정하세요.';
  };

  const isFieldDisabled = () => {
    return mode === 'view';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCriteriaChange = (criteriaType: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criteriaType]: {
          ...prev.criteria[criteriaType as keyof typeof prev.criteria],
          [field]: value
        }
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('고객군명을 입력해주세요.', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = mode === 'edit' && groupId 
        ? `/api/customer-groups/${groupId}` 
        : '/api/customer-groups';
      
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          criteria: formData.criteria,
          tags: formData.tags
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showToast(
          mode === 'edit' ? '고객군이 성공적으로 수정되었습니다.' : '고객군이 성공적으로 생성되었습니다.', 
          'success'
        );
        router.push('/customers');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '요청 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('고객군 저장 실패:', error);
      showToast(
        error instanceof Error ? error.message : '고객군 저장에 실패했습니다.', 
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-400 animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="mt-6 text-lg text-gray-700 font-medium">고객군 정보를 불러오는 중...</p>
          <p className="mt-2 text-sm text-gray-500">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <Layout title={getPageTitle()} subtitle={getPageSubtitle()}>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* 기본 정보 */}
          <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-lg border border-indigo-100/50 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📋</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">기본 정보</h3>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">필수 항목</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                  <span className="text-red-500 mr-1">*</span>
                  고객군명
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled()}
                  required
                  className={`w-full px-4 py-3 border-2 ${formData.name ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                    isFieldDisabled() ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-indigo-300'
                  }`}
                  placeholder="예: VIP 고객군, 신규 가입자 등"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  고객군 설명
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled()}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none ${
                    isFieldDisabled() ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-indigo-300'
                  }`}
                  placeholder="고객군의 특성과 목적을 설명해주세요..."
                />
              </div>
            </div>
          </div>

          {/* 조건 설정 */}
          <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-lg border border-emerald-100/50 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🎯</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">조건 설정</h3>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">선택사항</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 나이 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-blue-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">📅</span>
                  </div>
                  <span className="font-bold text-gray-900">나이 조건</span>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">최소 나이</label>
                      <input
                        type="number"
                        value={formData.criteria.age.min}
                        onChange={(e) => handleCriteriaChange('age', 'min', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="20"
                        min="0"
                        max="150"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">최대 나이</label>
                      <input
                        type="number"
                        value={formData.criteria.age.max}
                        onChange={(e) => handleCriteriaChange('age', 'max', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="40"
                        min="0"
                        max="150"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 성별 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-purple-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-bold">👥</span>
                  </div>
                  <span className="font-bold text-gray-900">성별 조건</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="gender"
                      value=""
                      checked={formData.criteria.gender.value === ''}
                      onChange={(e) => handleCriteriaChange('gender', 'value', e.target.value)}
                      disabled={isFieldDisabled()}
                      className="mr-3 text-purple-600"
                    />
                    <span className="text-sm">전체</span>
                  </label>
                  {commonCodes.gender.map((code) => (
                    <label key={code.code} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="gender"
                        value={code.code}
                        checked={formData.criteria.gender.value === code.code}
                        onChange={(e) => handleCriteriaChange('gender', 'value', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="mr-3 text-purple-600"
                      />
                      <span className="text-sm">{code.code === 'M' ? '👨' : '👩'} {code.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 혼인 상태 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-green-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm font-bold">💑</span>
                  </div>
                  <span className="font-bold text-gray-900">혼인 상태</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="marriage_status"
                      value=""
                      checked={formData.criteria.marriage_status.value === ''}
                      onChange={(e) => handleCriteriaChange('marriage_status', 'value', e.target.value)}
                      disabled={isFieldDisabled()}
                      className="mr-3 text-green-600"
                    />
                    <span className="text-sm">전체</span>
                  </label>
                  {commonCodes.marriageStatus.map((code) => (
                    <label key={code.code} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="marriage_status"
                        value={code.code}
                        checked={formData.criteria.marriage_status.value === code.code}
                        onChange={(e) => handleCriteriaChange('marriage_status', 'value', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="mr-3 text-green-600"
                      />
                      <span className="text-sm">{code.code === 'Y' ? '💍' : '🙋'} {code.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 회원 등급 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-yellow-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-sm font-bold">⭐</span>
                  </div>
                  <span className="font-bold text-gray-900">회원 등급</span>
                </div>
                
                <div>
                  <select
                    value={formData.criteria.member_grade.value}
                    onChange={(e) => handleCriteriaChange('member_grade', 'value', e.target.value)}
                    disabled={isFieldDisabled()}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  >
                    <option value="">전체 등급</option>
                    {commonCodes.memberGrade.map((code) => (
                      <option key={code.code} value={code.code}>
                        {code.code === 'VIP' ? '💎' : code.code === 'GOLD' ? '🥇' : code.code === 'SILVER' ? '🥈' : '🥉'} {code.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 마케팅 동의 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-pink-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <span className="text-pink-600 text-sm font-bold">📢</span>
                  </div>
                  <span className="font-bold text-gray-900">마케팅 동의</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-pink-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="marketing_agree_yn"
                      value=""
                      checked={formData.criteria.marketing_agree_yn.value === ''}
                      onChange={(e) => handleCriteriaChange('marketing_agree_yn', 'value', e.target.value)}
                      disabled={isFieldDisabled()}
                      className="mr-3 text-pink-600"
                    />
                    <span className="text-sm">전체</span>
                  </label>
                  {commonCodes.marketingAgree.map((code) => (
                    <label key={code.code} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-pink-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="marketing_agree_yn"
                        value={code.code}
                        checked={formData.criteria.marketing_agree_yn.value === code.code}
                        onChange={(e) => handleCriteriaChange('marketing_agree_yn', 'value', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="mr-3 text-pink-600"
                      />
                      <span className="text-sm">{code.code === 'Y' ? '✅' : '❌'} {code.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 외국인 여부 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-indigo-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 text-sm font-bold">🌍</span>
                  </div>
                  <span className="font-bold text-gray-900">외국인 여부</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="foreigner_yn"
                      value=""
                      checked={formData.criteria.foreigner_yn.value === ''}
                      onChange={(e) => handleCriteriaChange('foreigner_yn', 'value', e.target.value)}
                      disabled={isFieldDisabled()}
                      className="mr-3 text-indigo-600"
                    />
                    <span className="text-sm">전체</span>
                  </label>
                  {commonCodes.foreigner.map((code) => (
                    <label key={code.code} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="foreigner_yn"
                        value={code.code}
                        checked={formData.criteria.foreigner_yn.value === code.code}
                        onChange={(e) => handleCriteriaChange('foreigner_yn', 'value', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="mr-3 text-indigo-600"
                      />
                      <span className="text-sm">{code.code === 'Y' ? '🌏' : '🇰🇷'} {code.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 주소 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-cyan-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <span className="text-cyan-600 text-sm font-bold">📍</span>
                  </div>
                  <span className="font-bold text-gray-900">주소 (시/도)</span>
                </div>
                
                <div>
                  <select
                    value={formData.criteria.address.value}
                    onChange={(e) => handleCriteriaChange('address', 'value', e.target.value)}
                    disabled={isFieldDisabled()}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  >
                    <option value="">전체 지역</option>
                    {commonCodes.address.map((code) => (
                      <option key={code.code} value={code.code}>
                        {code.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 기념일 유형 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-rose-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <span className="text-rose-600 text-sm font-bold">🎉</span>
                  </div>
                  <span className="font-bold text-gray-900">기념일 유형</span>
                </div>
                
                <div>
                  <select
                    value={formData.criteria.anniversary_type.value}
                    onChange={(e) => handleCriteriaChange('anniversary_type', 'value', e.target.value)}
                    disabled={isFieldDisabled()}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                  >
                    <option value="">전체 기념일</option>
                    {commonCodes.anniversaryType.map((code) => (
                      <option key={code.code} value={code.code}>
                        {code.code === 'BIRTHDAY' ? '🎂' : 
                         code.code === 'WEDDING' ? '💒' : 
                         code.code === 'JOIN' ? '🎊' : 
                         code.code === 'FIRST_PURCHASE' ? '🛍️' : '🎁'} {code.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 이메일 도메인 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-teal-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <span className="text-teal-600 text-sm font-bold">📧</span>
                  </div>
                  <span className="font-bold text-gray-900">이메일 도메인</span>
                </div>
                
                <div>
                  <select
                    value={formData.criteria.email_domain.value}
                    onChange={(e) => handleCriteriaChange('email_domain', 'value', e.target.value)}
                    disabled={isFieldDisabled()}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  >
                    <option value="">전체 도메인</option>
                    {commonCodes.emailDomain.map((code) => (
                      <option key={code.code} value={code.code}>
                        {code.code === 'GMAIL' ? '📬' : 
                         code.code === 'NAVER' ? '🟢' : 
                         code.code === 'DAUM' ? '🟡' : 
                         code.code === 'KAKAO' ? '💬' : 
                         code.code === 'COMPANY' ? '🏢' : '📮'} {code.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SMS 수신 동의 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-amber-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-amber-600 text-sm font-bold">📱</span>
                  </div>
                  <span className="font-bold text-gray-900">SMS 수신 동의</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="sms_agree_yn"
                      value=""
                      checked={formData.criteria.sms_agree_yn.value === ''}
                      onChange={(e) => handleCriteriaChange('sms_agree_yn', 'value', e.target.value)}
                      disabled={isFieldDisabled()}
                      className="mr-3 text-amber-600"
                    />
                    <span className="text-sm">전체</span>
                  </label>
                  {commonCodes.smsAgree.map((code) => (
                    <label key={code.code} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="sms_agree_yn"
                        value={code.code}
                        checked={formData.criteria.sms_agree_yn.value === code.code}
                        onChange={(e) => handleCriteriaChange('sms_agree_yn', 'value', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="mr-3 text-amber-600"
                      />
                      <span className="text-sm">{code.code === 'Y' ? '✅' : '❌'} {code.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* EMAIL 수신 동의 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-emerald-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 text-sm font-bold">✉️</span>
                  </div>
                  <span className="font-bold text-gray-900">EMAIL 수신 동의</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="email_agree_yn"
                      value=""
                      checked={formData.criteria.email_agree_yn.value === ''}
                      onChange={(e) => handleCriteriaChange('email_agree_yn', 'value', e.target.value)}
                      disabled={isFieldDisabled()}
                      className="mr-3 text-emerald-600"
                    />
                    <span className="text-sm">전체</span>
                  </label>
                  {commonCodes.emailAgree.map((code) => (
                    <label key={code.code} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="email_agree_yn"
                        value={code.code}
                        checked={formData.criteria.email_agree_yn.value === code.code}
                        onChange={(e) => handleCriteriaChange('email_agree_yn', 'value', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="mr-3 text-emerald-600"
                      />
                      <span className="text-sm">{code.code === 'Y' ? '✅' : '❌'} {code.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 카카오톡 수신 동의 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-yellow-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-sm font-bold">💬</span>
                  </div>
                  <span className="font-bold text-gray-900">카카오톡 수신 동의</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="kakao_agree_yn"
                      value=""
                      checked={formData.criteria.kakao_agree_yn.value === ''}
                      onChange={(e) => handleCriteriaChange('kakao_agree_yn', 'value', e.target.value)}
                      disabled={isFieldDisabled()}
                      className="mr-3 text-yellow-600"
                    />
                    <span className="text-sm">전체</span>
                  </label>
                  {commonCodes.kakaoAgree.map((code) => (
                    <label key={code.code} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="kakao_agree_yn"
                        value={code.code}
                        checked={formData.criteria.kakao_agree_yn.value === code.code}
                        onChange={(e) => handleCriteriaChange('kakao_agree_yn', 'value', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="mr-3 text-yellow-600"
                      />
                      <span className="text-sm">{code.code === 'Y' ? '✅' : '❌'} {code.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* APP PUSH 수신 동의 조건 */}
              <div className="relative p-6 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:border-violet-300 bg-white/70 backdrop-blur-sm hover:shadow-md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <span className="text-violet-600 text-sm font-bold">🔔</span>
                  </div>
                  <span className="font-bold text-gray-900">APP PUSH 수신 동의</span>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-violet-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="app_push_agree_yn"
                      value=""
                      checked={formData.criteria.app_push_agree_yn.value === ''}
                      onChange={(e) => handleCriteriaChange('app_push_agree_yn', 'value', e.target.value)}
                      disabled={isFieldDisabled()}
                      className="mr-3 text-violet-600"
                    />
                    <span className="text-sm">전체</span>
                  </label>
                  {commonCodes.appPushAgree.map((code) => (
                    <label key={code.code} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-violet-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="app_push_agree_yn"
                        value={code.code}
                        checked={formData.criteria.app_push_agree_yn.value === code.code}
                        onChange={(e) => handleCriteriaChange('app_push_agree_yn', 'value', e.target.value)}
                        disabled={isFieldDisabled()}
                        className="mr-3 text-violet-600"
                      />
                      <span className="text-sm">{code.code === 'Y' ? '✅' : '❌'} {code.name}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* 태그 */}
          <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl shadow-lg border border-orange-100/50 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🏷️</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">태그</h3>
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full font-medium">선택사항</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  disabled={isFieldDisabled()}
                  placeholder="태그를 입력하고 Enter를 누르세요..."
                  className={`flex-1 px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-3 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                    isFieldDisabled() ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-orange-300'
                  }`}
                />
                {!isFieldDisabled() && (
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    추가
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200"
                  >
                    {tag}
                    {!isFieldDisabled() && (
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-orange-600 hover:text-red-600 font-bold transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/customers')}
              className="px-8 py-4 text-sm font-bold text-red-600 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl hover:from-red-100 hover:to-red-200 hover:border-red-300 hover:text-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              ✕ 취소
            </button>
            
            {!isFieldDisabled() && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-500 rounded-xl hover:from-blue-600 hover:to-blue-700 hover:border-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? '💾 저장 중...' : mode === 'edit' ? '💾 수정' : '🚀 고객군 생성'}
              </button>
            )}
          </div>
        </form>
        
        <ToastContainer />
      </div>
    </Layout>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}

export default function CustomerSegmentPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CustomerSegmentContent />
    </Suspense>
  );
} 