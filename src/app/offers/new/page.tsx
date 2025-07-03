'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useConfirmModal } from '@/components/ConfirmModal';
import ProductSelectModal from '@/components/ProductSelectModal';

// 기본 정보 (offers 테이블)
interface OfferBasicInfo {
  name: string;
  type: string;
  description: string;
  value: string;
  value_type: 'percentage' | 'fixed';
  start_date: string;
  end_date: string;
  max_usage: string;
  status: 'active' | 'inactive' | 'scheduled';
  terms_conditions: string;
}

// 조건 정보 (offer_conditions 테이블)
interface OfferConditions {
  point_accumulation: boolean;
  duplicate_usage: boolean;
  multiple_discount: boolean;
  usage_start_time: string;
  usage_end_time: string;
  min_quantity: string;
  max_quantity: string;
  min_amount: string;
  max_amount: string;
  monday_available: boolean;
  tuesday_available: boolean;
  wednesday_available: boolean;
  thursday_available: boolean;
  friday_available: boolean;
  saturday_available: boolean;
  sunday_available: boolean;
}

// 대상 상품 정보 (offer_products 테이블)
interface OfferProducts {
  target_codes: string[];
}

interface OfferForm {
  basicInfo: OfferBasicInfo;
  conditions: OfferConditions;
  products: OfferProducts;
}

export default function NewOfferPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | 'view'>('create');
  const [offerTypesFromAPI, setOfferTypesFromAPI] = useState<Array<{code: string, name: string, description: string}>>([]);
  const { showToast, ToastContainer } = useToast();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [formData, setFormData] = useState<OfferForm>({
    basicInfo: {
      name: '',
      type: '',
      description: '',
      value: '',
      value_type: 'percentage',
      start_date: '',
      end_date: '',
      max_usage: '',
      status: 'active',
      terms_conditions: ''
    },
    conditions: {
      point_accumulation: false,
      duplicate_usage: false,
      multiple_discount: false,
      usage_start_time: '',
      usage_end_time: '',
      min_quantity: '',
      max_quantity: '',
      min_amount: '',
      max_amount: '',
      monday_available: true,
      tuesday_available: true,
      wednesday_available: true,
      thursday_available: true,
      friday_available: true,
      saturday_available: true,
      sunday_available: true
    },
    products: {
      target_codes: []
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [newTargetCode, setNewTargetCode] = useState('');

  // 오퍼 타입 기본값 (API 로드 실패 시 사용) - 테스트를 위해 주석 처리
  /*
  const defaultOfferTypes = [
    { value: 'discount', label: '할인', description: '할인 혜택', icon: '💰' },
    { value: 'coupon', label: '쿠폰', description: '쿠폰 혜택', icon: '🎫' },
    { value: 'freebie', label: '무료제공', description: '무료 제공 혜택', icon: '🎁' },
    { value: 'point', label: '적립금', description: '포인트 적립 혜택', icon: '⭐' }
  ];
  */

  // 초기화를 위한 useEffect (한 번만 실행)
  useEffect(() => {
    const checkAuth = () => {
      try {
        const loggedInUser = sessionStorage.getItem('currentUser');
        
        if (!loggedInUser) {
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    const loadOfferTypes = async () => {
      try {
        console.log('🔍 오퍼 타입 API 호출 시작...');
        const response = await fetch('/api/common-codes?category=OFFER&sub_category=TYPE');
        console.log('📡 API 응답 상태:', response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 API 응답 데이터:', data);
          console.log('🎯 추출된 오퍼 타입 데이터:', data.data || []);
          setOfferTypesFromAPI(data.data || []);
        } else {
          console.error('❌ API 응답 실패:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('💥 오퍼 타입 로드 실패:', error);
      }
    };
    
    checkAuth();
    loadOfferTypes();
  }, [router]);

  // 오퍼 데이터 로드를 위한 별도 useEffect
  useEffect(() => {
    const loadOfferData = async (id: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/offers/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setFormData(data.offer);
            showToast('오퍼 정보를 불러왔습니다.', 'success');
          } else {
            showToast('오퍼 정보를 불러오는데 실패했습니다.', 'error');
          }
        } else {
          showToast('오퍼를 찾을 수 없습니다.', 'error');
        }
      } catch (error) {
        console.error('오퍼 데이터 로드 실패:', error);
        showToast('오퍼 정보 로드 중 오류가 발생했습니다.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const initializePage = () => {
      // URL 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      const pageMode = urlParams.get('mode') as 'edit' | 'view' || 'create';
      
      setOfferId(id);
      setMode(id ? pageMode : 'create');
      
      // 기존 오퍼 데이터 로드
      if (id) {
        loadOfferData(id);
      }
    };
    
    initializePage();
  }, []); // 빈 배열로 한 번만 실행

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayChange = (field: string, value: string, action: 'add' | 'remove') => {
    if (field === 'products.target_codes') {
      setFormData(prev => ({
        ...prev,
        products: {
          ...prev.products,
          target_codes: action === 'add' 
            ? (value && !prev.products.target_codes.includes(value) 
                ? [...prev.products.target_codes, value] 
                : prev.products.target_codes)
            : prev.products.target_codes.filter(item => item !== value)
        }
      }));
    }
  };

  const handleProductSelect = (productCode: string) => {
    const isSelected = formData.products.target_codes.includes(productCode);
    if (isSelected) {
      handleArrayChange('products.target_codes', productCode, 'remove');
    } else {
      handleArrayChange('products.target_codes', productCode, 'add');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 3단계가 아닐 때만 다음 단계로 이동
    if (currentStep < totalSteps) {
      // 1단계에서 2단계로 이동 시 기본 검증
      if (currentStep === 1) {
        const errors = [];
        
        if (!formData.basicInfo.name.trim()) {
          errors.push('오퍼명을 입력해주세요.');
        }
        
        if (!formData.basicInfo.type) {
          errors.push('오퍼 유형을 선택해주세요.');
        }
        
        if (!formData.basicInfo.value.trim()) {
          errors.push('할인 값을 입력해주세요.');
        }
        
        if (!formData.basicInfo.start_date) {
          errors.push('시작일을 선택해주세요.');
        }
        
        if (!formData.basicInfo.end_date) {
          errors.push('종료일을 선택해주세요.');
        }
        
        if (errors.length > 0) {
          const errorMessage = '다음 필수 항목을 입력해주세요:\n\n' + errors.map(error => `• ${error}`).join('\n');
          showToast(errorMessage, 'error', 7000);
          return;
        }
        
        // 날짜 검증
        if (formData.basicInfo.start_date && formData.basicInfo.end_date) {
          if (new Date(formData.basicInfo.start_date) > new Date(formData.basicInfo.end_date)) {
            showToast('시작일은 종료일보다 이후일 수 없습니다.', 'error');
            return;
          }
        }
        
        if (formData.basicInfo.start_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = new Date(formData.basicInfo.start_date);
          if (startDate < today) {
            showToast('시작일은 오늘 이후로 설정해주세요.', 'error');
            return;
          }
        }
      }
      
      // 2단계에서 3단계로 이동 시 시간 검증
      if (currentStep === 2) {
        // 사용 시간 검증
        if (formData.conditions.usage_start_time && formData.conditions.usage_end_time) {
          const startTime = formData.conditions.usage_start_time;
          const endTime = formData.conditions.usage_end_time;
          
          if (startTime >= endTime) {
            showToast('사용 종료 시간은 사용 시작 시간보다 늦어야 합니다.', 'error');
            return;
          }
        }
      }
      
      nextStep();
    }
  };

  // 필수값 검증 함수
  const validateRequiredFields = () => {
    const errors = [];
    
    if (!formData.basicInfo.name.trim()) {
      errors.push('오퍼명을 입력해주세요.');
    }
    
    if (!formData.basicInfo.type) {
      errors.push('오퍼 유형을 선택해주세요.');
    }
    
    if (!formData.basicInfo.value.trim()) {
      errors.push('할인 값을 입력해주세요.');
    }
    
    if (!formData.basicInfo.start_date) {
      errors.push('시작일을 선택해주세요.');
    }
    
    if (!formData.basicInfo.end_date) {
      errors.push('종료일을 선택해주세요.');
    }
    
    // 시작일이 종료일보다 늦은 경우
    if (formData.basicInfo.start_date && formData.basicInfo.end_date) {
      if (new Date(formData.basicInfo.start_date) > new Date(formData.basicInfo.end_date)) {
        errors.push('시작일은 종료일보다 이후일 수 없습니다.');
      }
    }
    
    // 시작일이 오늘보다 이전인 경우
    if (formData.basicInfo.start_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(formData.basicInfo.start_date);
      if (startDate < today) {
        errors.push('시작일은 오늘 이후로 설정해주세요.');
      }
    }
    
    return errors;
  };

  const handleCreateOffer = async () => {
    // 필수값 검증
    const validationErrors = validateRequiredFields();
    
    if (validationErrors.length > 0) {
      const errorMessage = '다음 항목을 확인해주세요:\n\n' + validationErrors.map(error => `• ${error}`).join('\n');
      showToast(errorMessage, 'error', 7000);
      return;
    }
    
    // 최종 확인
    const offerTypeName = offerTypes.find((t: any) => t.value === formData.basicInfo.type)?.label || '선택된 유형';
    const isEdit = mode === 'edit';
    const confirmMessage = `다음 내용으로 오퍼를 ${isEdit ? '수정' : '생성'}하시겠습니까?\n\n` +
      `📋 오퍼명: ${formData.basicInfo.name}\n` +
      `🎯 유형: ${offerTypeName}\n` +
      `💰 할인값: ${formData.basicInfo.value}${formData.basicInfo.value_type === 'percentage' ? '%' : '원'}\n` +
      `📅 기간: ${formData.basicInfo.start_date} ~ ${formData.basicInfo.end_date}\n` +
      `📊 상태: ${formData.basicInfo.status === 'active' ? '활성' : formData.basicInfo.status === 'inactive' ? '비활성' : '예약'}\n\n` +
      `⚠️ ${isEdit ? '수정' : '생성'} 후에는 일부 정보를 변경할 수 없습니다.`;
    
    const confirmed = await showConfirm(
      `오퍼 ${isEdit ? '수정' : '생성'} 확인`,
      confirmMessage,
      {
        confirmText: `🚀 ${isEdit ? '수정하기' : '생성하기'}`,
        cancelText: '취소',
        type: 'success'
      }
    );
    
    if (!confirmed) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const url = isEdit ? `/api/offers/${offerId}` : '/api/offers';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast(`오퍼가 성공적으로 ${isEdit ? '수정' : '생성'}되었습니다!`, 'success');
        
        // 성공 후 잠시 대기하고 페이지 이동
        setTimeout(() => {
      router.push('/offers');
        }, 1500);
      } else {
        showToast(data.error || `오퍼 ${isEdit ? '수정' : '생성'} 중 오류가 발생했습니다.`, 'error');
      }
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} offer:`, error);
      showToast(`오퍼 ${isEdit ? '수정' : '생성'} 중 오류가 발생했습니다.\n다시 시도해주세요.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // 오퍼 타입에 따른 아이콘 반환 함수
  const getIconForOfferType = (code: string): string => {
    switch (code) {
      case 'discount': return '💰';
      case 'coupon': return '🎫';
      case 'freebie': return '🎁';
      case 'point': return '⭐';
      default: return '🏷️';
    }
  };

  // API에서 로드된 타입이 있으면 사용, 없으면 빈 배열 (테스트를 위해 기본값 사용 안함)
  console.log('🔬 현재 offerTypesFromAPI 상태:', offerTypesFromAPI);
  console.log('📊 offerTypesFromAPI 길이:', offerTypesFromAPI.length);
  
  const offerTypes = offerTypesFromAPI.length > 0 ? 
    offerTypesFromAPI.map(type => ({
      value: type.code,
      label: type.name,
      description: type.description,
      icon: getIconForOfferType(type.code)
    })) : [];
  
  console.log('✅ 최종 offerTypes:', offerTypes);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-10">
            {/* 기본 정보 섹션 */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-xl border border-indigo-100/50 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📋</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">기본 정보</h3>
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">필수 항목</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                    <span className="text-red-500 mr-2">*</span>
                    오퍼명
                  </label>
                  <input
                    type="text"
                    value={formData.basicInfo.name}
                    onChange={(e) => handleInputChange('basicInfo.name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${formData.basicInfo.name ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-indigo-300'
                    }`}
                    placeholder="예: 여름 시즌 30% 할인"
                    disabled={isViewMode}
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                    <span className="text-red-500 mr-2">*</span>
                    할인 값
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={formData.basicInfo.value}
                      onChange={(e) => handleInputChange('basicInfo.value', e.target.value)}
                      className={`flex-1 px-4 py-3 border-2 ${formData.basicInfo.value ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm ${
                        isViewMode 
                          ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                          : 'bg-white/80 hover:border-indigo-300'
                      }`}
                      placeholder="30"
                      min="0"
                      disabled={isViewMode}
                      required
                    />
                    <select
                      value={formData.basicInfo.value_type}
                      onChange={(e) => handleInputChange('basicInfo.value_type', e.target.value)}
                      className={`px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm font-semibold ${
                        isViewMode 
                          ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                          : 'bg-white/80 hover:border-indigo-300'
                      }`}
                      disabled={isViewMode}
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">원</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label 
                    htmlFor="start_date" 
                    className="flex items-center text-sm font-bold text-gray-700 mb-3 cursor-pointer"
                  >
                    <span className="text-red-500 mr-2">*</span>
                    시작일
                  </label>
                  <div className="relative">
                  <input
                      id="start_date"
                    type="date"
                    value={formData.basicInfo.start_date}
                    onChange={(e) => handleInputChange('basicInfo.start_date', e.target.value)}
                      className={`w-full px-4 py-3 border-2 ${formData.basicInfo.start_date ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm ${
                        isViewMode 
                          ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                          : 'bg-white/80 hover:border-indigo-300 cursor-pointer'
                      }`}
                      disabled={isViewMode}
                    required
                  />
                    {!isViewMode && (
                      <div 
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => {
                          const input = document.getElementById('start_date') as HTMLInputElement;
                          (input as any)?.showPicker?.();
                        }}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label 
                    htmlFor="end_date" 
                    className="flex items-center text-sm font-bold text-gray-700 mb-3 cursor-pointer"
                  >
                    <span className="text-red-500 mr-2">*</span>
                    종료일
                  </label>
                  <div className="relative">
                  <input
                      id="end_date"
                    type="date"
                    value={formData.basicInfo.end_date}
                    onChange={(e) => handleInputChange('basicInfo.end_date', e.target.value)}
                      className={`w-full px-4 py-3 border-2 ${formData.basicInfo.end_date ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm ${
                        isViewMode 
                          ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                          : 'bg-white/80 hover:border-indigo-300 cursor-pointer'
                      }`}
                      disabled={isViewMode}
                    required
                  />
                    {!isViewMode && (
                      <div 
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => {
                          const input = document.getElementById('end_date') as HTMLInputElement;
                          (input as any)?.showPicker?.();
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    최대 사용 횟수
                  </label>
                  <input
                    type="number"
                    value={formData.basicInfo.max_usage}
                    onChange={(e) => handleInputChange('basicInfo.max_usage', e.target.value)}
                    className={`w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-indigo-300'
                    }`}
                    placeholder="무제한인 경우 비워두세요"
                    min="0"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                    <span className="text-red-500 mr-2">*</span>
                    상태
                  </label>
                  <select
                    value={formData.basicInfo.status}
                    onChange={(e) => handleInputChange('basicInfo.status', e.target.value)}
                    className={`w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm font-semibold ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-indigo-300'
                    }`}
                    disabled={isViewMode}
                    required
                  >
                    <option value="active">✅ 활성</option>
                    <option value="inactive">❌ 비활성</option>
                    <option value="scheduled">⏰ 예약</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  설명
                </label>
                <textarea
                  value={formData.basicInfo.description}
                  onChange={(e) => handleInputChange('basicInfo.description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm resize-none ${
                    isViewMode 
                      ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                      : 'bg-white/80 hover:border-indigo-300'
                  }`}
                  placeholder="오퍼에 대한 상세 설명을 입력하세요..."
                  disabled={isViewMode}
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  이용약관
                </label>
                <textarea
                  value={formData.basicInfo.terms_conditions}
                  onChange={(e) => handleInputChange('basicInfo.terms_conditions', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm resize-none ${
                    isViewMode 
                      ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                      : 'bg-white/80 hover:border-indigo-300'
                  }`}
                  placeholder="오퍼 사용 시 적용되는 이용약관을 입력하세요..."
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* 오퍼 유형 선택 섹션 */}
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-xl border border-purple-100/50 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">오퍼 유형 선택</h3>
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">필수 항목</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {offerTypes.map((type: any) => (
                  <label key={type.value} className={`group ${isViewMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      name="offerType"
                      value={type.value}
                      checked={formData.basicInfo.type === type.value}
                      onChange={(e) => handleInputChange('basicInfo.type', e.target.value)}
                      className="sr-only"
                      disabled={isViewMode}
                    />
                    <div className={`p-6 border-2 rounded-2xl transition-all duration-300 ${
                      formData.basicInfo.type === type.value
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 ring-2 ring-purple-200 shadow-lg scale-105'
                        : isViewMode 
                          ? 'border-gray-200 bg-gray-50 opacity-70'
                          : 'border-gray-200 hover:border-purple-300 bg-white/80 backdrop-blur-sm group-hover:shadow-lg group-hover:scale-102'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">{type.icon}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          formData.basicInfo.type === type.value
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.basicInfo.type === type.value && (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg mb-2">{type.label}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-10">
            {/* 기본 조건 설정 */}
            <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-xl border border-emerald-100/50 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚙️</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">사용 조건</h3>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">선택사항</span>
              </div>
              
              {/* 옵션 설정 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <label className={`p-4 border-2 ${formData.conditions.point_accumulation ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 bg-white/70'} rounded-2xl transition-all duration-300 backdrop-blur-sm ${
                  isViewMode 
                    ? 'cursor-not-allowed opacity-70' 
                    : 'hover:border-emerald-300 hover:shadow-md cursor-pointer'
                }`}>
                  <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="point_accumulation"
                    checked={formData.conditions.point_accumulation}
                    onChange={(e) => handleInputChange('conditions.point_accumulation', e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      disabled={isViewMode}
                    />
                    <span className="text-sm font-bold text-gray-700 flex items-center">
                      ⭐ 포인트 적립 허용
                    </span>
                </div>
                </label>
                <label className={`p-4 border-2 ${formData.conditions.duplicate_usage ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 bg-white/70'} rounded-2xl transition-all duration-300 backdrop-blur-sm ${
                  isViewMode 
                    ? 'cursor-not-allowed opacity-70' 
                    : 'hover:border-emerald-300 hover:shadow-md cursor-pointer'
                }`}>
                  <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="duplicate_usage"
                    checked={formData.conditions.duplicate_usage}
                    onChange={(e) => handleInputChange('conditions.duplicate_usage', e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      disabled={isViewMode}
                    />
                    <span className="text-sm font-bold text-gray-700 flex items-center">
                      🔄 중복 사용 허용
                    </span>
                </div>
                </label>
                <label className={`p-4 border-2 ${formData.conditions.multiple_discount ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 bg-white/70'} rounded-2xl transition-all duration-300 backdrop-blur-sm ${
                  isViewMode 
                    ? 'cursor-not-allowed opacity-70' 
                    : 'hover:border-emerald-300 hover:shadow-md cursor-pointer'
                }`}>
                  <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="multiple_discount"
                    checked={formData.conditions.multiple_discount}
                    onChange={(e) => handleInputChange('conditions.multiple_discount', e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      disabled={isViewMode}
                    />
                    <span className="text-sm font-bold text-gray-700 flex items-center">
                      💰 복수 할인 허용
                    </span>
                  </div>
                  </label>
              </div>

              {/* 시간 제한 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label 
                    htmlFor="usage_start_time" 
                    className={`block text-sm font-bold text-gray-700 mb-3 ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    🕘 사용 시작 시간
                  </label>
                  <div className="relative">
                  <input
                      id="usage_start_time"
                    type="time"
                    value={formData.conditions.usage_start_time}
                    onChange={(e) => handleInputChange('conditions.usage_start_time', e.target.value)}
                      className={`w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 backdrop-blur-sm ${
                        isViewMode 
                          ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                          : 'bg-white/80 hover:border-emerald-300 cursor-pointer'
                      }`}
                      disabled={isViewMode}
                    />
                    {!isViewMode && (
                      <div 
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => {
                          const input = document.getElementById('usage_start_time') as HTMLInputElement;
                          (input as any)?.showPicker?.();
                        }}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label 
                    htmlFor="usage_end_time" 
                    className={`block text-sm font-bold text-gray-700 mb-3 ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    🕕 사용 종료 시간
                  </label>
                  <div className="relative">
                  <input
                      id="usage_end_time"
                    type="time"
                    value={formData.conditions.usage_end_time}
                    onChange={(e) => handleInputChange('conditions.usage_end_time', e.target.value)}
                      className={`w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 backdrop-blur-sm ${
                        isViewMode 
                          ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                          : 'bg-white/80 hover:border-emerald-300 cursor-pointer'
                      }`}
                      disabled={isViewMode}
                    />
                    {!isViewMode && (
                      <div 
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => {
                          const input = document.getElementById('usage_end_time') as HTMLInputElement;
                          (input as any)?.showPicker?.();
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 수량 제한 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📦 최소 구매 수량
                  </label>
                  <input
                    type="number"
                    value={formData.conditions.min_quantity}
                    onChange={(e) => handleInputChange('conditions.min_quantity', e.target.value)}
                    className={`w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 backdrop-blur-sm ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-emerald-300'
                    }`}
                    placeholder="제한 없음"
                    min="0"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📦 최대 구매 수량
                  </label>
                  <input
                    type="number"
                    value={formData.conditions.max_quantity}
                    onChange={(e) => handleInputChange('conditions.max_quantity', e.target.value)}
                    className={`w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 backdrop-blur-sm ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-emerald-300'
                    }`}
                    placeholder="제한 없음"
                    min="0"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              {/* 금액 제한 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    💳 최소 구매 금액
                  </label>
                  <input
                    type="number"
                    value={formData.conditions.min_amount}
                    onChange={(e) => handleInputChange('conditions.min_amount', e.target.value)}
                    className={`w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 backdrop-blur-sm ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-emerald-300'
                    }`}
                    placeholder="제한 없음"
                    min="0"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    💳 최대 구매 금액
                  </label>
                  <input
                    type="number"
                    value={formData.conditions.max_amount}
                    onChange={(e) => handleInputChange('conditions.max_amount', e.target.value)}
                    className={`w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 backdrop-blur-sm ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-emerald-300'
                    }`}
                    placeholder="제한 없음"
                    min="0"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            {/* 요일별 설정 */}
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100/50 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📅</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">요일별 사용 가능 설정</h3>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">선택사항</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { key: 'monday_available', label: '월', emoji: '🌙' },
                  { key: 'tuesday_available', label: '화', emoji: '🔥' },
                  { key: 'wednesday_available', label: '수', emoji: '💧' },
                  { key: 'thursday_available', label: '목', emoji: '🌳' },
                  { key: 'friday_available', label: '금', emoji: '⭐' },
                  { key: 'saturday_available', label: '토', emoji: '🎯' },
                  { key: 'sunday_available', label: '일', emoji: '☀️' }
                ].map((day) => (
                  <label key={day.key} className={`p-3 border-2 ${formData.conditions[day.key as keyof OfferConditions] ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white/70'} rounded-2xl transition-all duration-300 backdrop-blur-sm ${
                    isViewMode 
                      ? 'cursor-not-allowed opacity-70' 
                      : 'hover:border-blue-300 hover:shadow-md cursor-pointer'
                  }`}>
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-xl">{day.emoji}</span>
                    <input
                      type="checkbox"
                      id={day.key}
                      checked={formData.conditions[day.key as keyof OfferConditions] as boolean}
                      onChange={(e) => handleInputChange(`conditions.${day.key}`, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isViewMode}
                      />
                      <span className="text-sm font-bold text-gray-700 text-center">
                        {day.label}요일
                      </span>
                  </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-10">
            {/* 대상 상품 설정 */}
            <div className="bg-gradient-to-br from-white to-yellow-50/30 rounded-2xl shadow-xl border border-yellow-100/50 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📦</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">대상 상품 설정</h3>
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full font-medium">선택사항</span>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  🏷️ 적용 대상 상품 선택
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTargetCode}
                    onChange={(e) => setNewTargetCode(e.target.value)}
                    className={`flex-1 px-4 py-3 border-2 border-yellow-200 rounded-xl focus:ring-3 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all duration-200 backdrop-blur-sm ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-yellow-300'
                    }`}
                    placeholder="직접 입력하거나 상품 선택 버튼을 이용하세요"
                    disabled={isViewMode}
                  />
                  {!isViewMode && (
                    <>
                  <button
                    type="button"
                    onClick={() => {
                      if (newTargetCode.trim()) {
                        handleArrayChange('products.target_codes', newTargetCode.trim(), 'add');
                        setNewTargetCode('');
                      }
                    }}
                        className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                        ➕ 직접 추가
                  </button>
                      <button
                        type="button"
                        onClick={() => setIsProductModalOpen(true)}
                        className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        🛍️ 상품 선택
                      </button>
                    </>
                  )}
                </div>
              </div>

              {formData.products.target_codes.length > 0 && (
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📋 적용 대상 목록
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {formData.products.target_codes.map((code, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 font-semibold rounded-full border border-yellow-200 shadow-sm"
                      >
                        🏷️ {code}
                        {!isViewMode && (
                        <button
                          type="button"
                          onClick={() => handleArrayChange('products.target_codes', code, 'remove')}
                            className="ml-2 text-yellow-600 hover:text-yellow-800 font-bold text-lg"
                        >
                          ×
                        </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 최종 검토 */}
            <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl shadow-xl border border-gray-100/50 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✅</span>
                  </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">입력 정보 최종 검토</h3>
                <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full font-medium">확인 필수</span>
                </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 기본 정보 */}
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 text-lg mb-4 flex items-center">
                    <span className="text-2xl mr-2">📋</span>
                    기본 정보
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">오퍼명:</span>
                      <span className="font-bold text-gray-900">{formData.basicInfo.name || '❌ 미입력'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">유형:</span>
                      <span className="font-bold text-gray-900">
                        {offerTypes.find((t: any) => t.value === formData.basicInfo.type)?.icon} {offerTypes.find((t: any) => t.value === formData.basicInfo.type)?.label || '❌ 미선택'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">할인값:</span>
                      <span className="font-bold text-gray-900">
                        {formData.basicInfo.value || '❌ 미입력'}{formData.basicInfo.value_type === 'percentage' ? '%' : '원'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">기간:</span>
                      <span className="font-bold text-gray-900">
                        {formData.basicInfo.start_date || '❌ 미입력'} ~ {formData.basicInfo.end_date || '❌ 미입력'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">최대 사용횟수:</span>
                      <span className="font-bold text-gray-900">{formData.basicInfo.max_usage || '♾️ 무제한'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">상태:</span>
                      <span className="font-bold text-gray-900">
                        {formData.basicInfo.status === 'active' ? '✅ 활성' : 
                         formData.basicInfo.status === 'inactive' ? '❌ 비활성' : '⏰ 예약'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 사용 조건 */}
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-900 text-lg mb-4 flex items-center">
                    <span className="text-2xl mr-2">⚙️</span>
                    사용 조건
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">포인트 적립:</span>
                      <span className="font-bold text-gray-900">{formData.conditions.point_accumulation ? '✅ 허용' : '❌ 불허용'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">중복 사용:</span>
                      <span className="font-bold text-gray-900">{formData.conditions.duplicate_usage ? '✅ 허용' : '❌ 불허용'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">복수 할인:</span>
                      <span className="font-bold text-gray-900">{formData.conditions.multiple_discount ? '✅ 허용' : '❌ 불허용'}</span>
                    </div>
                    {(formData.conditions.usage_start_time || formData.conditions.usage_end_time) && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">사용 시간:</span>
                        <span className="font-bold text-gray-900">
                          🕘 {formData.conditions.usage_start_time || '00:00'} ~ 🕕 {formData.conditions.usage_end_time || '23:59'}
                        </span>
                      </div>
                    )}
                    {(formData.conditions.min_quantity || formData.conditions.max_quantity) && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">구매 수량:</span>
                        <span className="font-bold text-gray-900">
                          📦 {formData.conditions.min_quantity || '제한없음'} ~ {formData.conditions.max_quantity || '제한없음'}
                        </span>
                      </div>
                    )}
                    {(formData.conditions.min_amount || formData.conditions.max_amount) && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">구매 금액:</span>
                        <span className="font-bold text-gray-900">
                          💳 {formData.conditions.min_amount || '제한없음'}원 ~ {formData.conditions.max_amount || '제한없음'}원
                        </span>
                      </div>
                    )}
                  </div>
                  </div>
                </div>

              {/* 대상 상품 정보 */}
                {formData.products.target_codes.length > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-100">
                  <h4 className="font-bold text-yellow-900 text-lg mb-4 flex items-center">
                    <span className="text-2xl mr-2">📦</span>
                    대상 상품
                  </h4>
                  <div className="text-sm">
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-gray-600">적용 대상:</span>
                      <div className="flex flex-wrap gap-2 ml-4">
                        {formData.products.target_codes.map((code, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                            🏷️ {code}
                          </span>
                        ))}
                      </div>
                    </div>
                    </div>
                  </div>
                )}

              {/* 주의 사항 */}
              <div className="mt-8 p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-100">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="font-bold text-red-900 text-lg">생성 전 확인사항</h4>
                </div>
                <ul className="space-y-2 text-sm text-red-700">
                  <li className="flex items-center space-x-2">
                    <span>•</span>
                    <span>모든 필수 입력 항목이 올바르게 입력되었는지 확인해주세요.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span>•</span>
                    <span>오퍼 생성 후에는 일부 정보를 수정할 수 없습니다.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span>•</span>
                    <span>시작일과 종료일을 다시 한 번 확인해주세요.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
  return (
      <Layout title="오퍼 정보 불러오는 중..." subtitle="잠시만 기다려주세요.">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">오퍼 정보를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 페이지 제목과 설명 설정
  const getPageTitle = () => {
    switch (mode) {
      case 'view': return '오퍼 상세보기';
      case 'edit': return '오퍼 수정';
      default: return '새 오퍼 생성';
    }
  };

  const getPageSubtitle = () => {
    switch (mode) {
      case 'view': return '오퍼의 상세 정보를 확인할 수 있습니다.';
      case 'edit': return '기존 오퍼의 정보를 수정할 수 있습니다.';
      default: return '고객에게 제공할 새로운 오퍼를 생성합니다.';
    }
  };

  const isViewMode = mode === 'view';

  return (
    <Layout title={getPageTitle()} subtitle={getPageSubtitle()}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-full mx-auto px-6 py-6">
          {/* 진행 단계 표시 - 개선된 버전 */}
          <div className="mb-10">
          <div className="flex items-center justify-center space-x-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                  <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-3 font-bold text-xl transition-all duration-500 ${
                  step <= currentStep
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-500 text-white shadow-2xl scale-110'
                      : 'border-gray-300 text-gray-400 bg-white shadow-lg'
                }`}>
                    {step <= currentStep && (
                      <div className="absolute -inset-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                    )}
                    <span className="relative z-10">{step}</span>
                </div>
                  <div className={`ml-4 ${
                    step <= currentStep ? 'text-indigo-700' : 'text-gray-400'
                }`}>
                    <div className="text-lg font-bold">
                  {step === 1 && '기본 정보'}
                  {step === 2 && '조건 설정'}
                  {step === 3 && '대상상품 & 검토'}
                    </div>
                    <div className="text-sm opacity-80">
                      {step === 1 && '오퍼 기본 정보 입력'}
                      {step === 2 && '세부 사용 조건 설정'}
                      {step === 3 && '최종 확인 및 생성'}
                    </div>
                </div>
                {step < totalSteps && (
                    <div className={`ml-8 w-20 h-2 rounded-full transition-all duration-500 ${
                      step < currentStep 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg' 
                        : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {renderStep()}

            {/* 액션 버튼 */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <button
              type="button"
                onClick={() => router.push('/offers')}
                className="px-8 py-4 text-sm font-bold text-red-600 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl hover:from-red-100 hover:to-red-200 hover:border-red-300 hover:text-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {isViewMode ? '목록으로' : '취소'}
            </button>

              <div className="flex space-x-4">
                {/* 모든 모드에서 단계별 네비게이션 버튼 표시 */}
                {currentStep === 1 && (
                  <>
                    {!isViewMode && (
                      <button
                        type="submit"
                        className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 border-2 border-indigo-500 rounded-xl hover:from-indigo-600 hover:to-purple-700 hover:border-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        다음 단계
                      </button>
                    )}
                    {isViewMode && (
                <button
                  type="button"
                  onClick={nextStep}
                        className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 border-2 border-indigo-500 rounded-xl hover:from-indigo-600 hover:to-purple-700 hover:border-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                        다음 단계
                </button>
                    )}
                  </>
                )}
                
                {currentStep === 2 && (
                  <>
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-8 py-4 text-sm font-bold text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      이전 단계
                    </button>
                    {!isViewMode && (
                <button
                  type="submit"
                        className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 border-2 border-indigo-500 rounded-xl hover:from-indigo-600 hover:to-purple-700 hover:border-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        다음 단계
                      </button>
                    )}
                    {isViewMode && (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 border-2 border-indigo-500 rounded-xl hover:from-indigo-600 hover:to-purple-700 hover:border-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        다음 단계
                      </button>
                    )}
                  </>
                )}
                
                {currentStep === 3 && (
                  <>
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-8 py-4 text-sm font-bold text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      이전 단계
                    </button>
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={handleCreateOffer}
                  disabled={isSubmitting}
                        className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-500 rounded-xl hover:from-green-600 hover:to-green-700 hover:border-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                      >
                        {isSubmitting ? (mode === 'edit' ? '🚀 수정 중...' : '🚀 생성 중...') : (mode === 'edit' ? '🚀 오퍼 수정' : '🚀 오퍼 생성')}
                </button>
                      )}
                    </>
              )}
            </div>
          </div>
        </form>
      </div>
      </div>
      
      {/* 토스트 및 모달 컴포넌트 */}
      <ToastContainer />
      <ConfirmModalComponent />
      <ProductSelectModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleProductSelect}
        selectedCodes={formData.products.target_codes}
      />
    </Layout>
  );
}
