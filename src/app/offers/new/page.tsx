'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OfferForm {
  name: string;
  type: 'discount' | 'freeShipping' | 'gift' | 'coupon' | 'bundle';
  description: string;
  value: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  maxUsage: string;
  conditions: {
    minPurchaseAmount: string;
    maxPurchaseAmount: string;
    applicableProducts: string[];
    excludedProducts: string[];
    userSegments: string[];
  };
  channels: string[];
}

export default function NewOfferPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OfferForm>({
    name: '',
    type: 'discount',
    description: '',
    value: '',
    targetAudience: '',
    startDate: '',
    endDate: '',
    maxUsage: '',
    conditions: {
      minPurchaseAmount: '',
      maxPurchaseAmount: '',
      applicableProducts: [],
      excludedProducts: [],
      userSegments: []
    },
    channels: []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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
    
    checkAuth();
  }, [router]);

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
    const keys = field.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let target = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i] as keyof typeof target] as any;
      }
      
      const finalKey = keys[keys.length - 1];
      const currentArray = target[finalKey as keyof typeof target] as string[];
      
      if (action === 'add' && value && !currentArray.includes(value)) {
        target[finalKey as keyof typeof target] = [...currentArray, value] as any;
      } else if (action === 'remove') {
        target[finalKey as keyof typeof target] = currentArray.filter(item => item !== value) as any;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // API 호출 로직
      console.log('Submitting offer:', formData);
      
      // 임시로 딜레이 추가
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('오퍼가 성공적으로 생성되었습니다!');
      router.push('/offers');
    } catch (error) {
      console.error('Error creating offer:', error);
      alert('오퍼 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const offerTypes = [
    { value: 'discount', label: '할인', description: '고정 금액 또는 비율 할인', icon: '💰' },
    { value: 'freeShipping', label: '무료배송', description: '배송비 면제 혜택', icon: '🚚' },
    { value: 'gift', label: '사은품', description: '구매시 무료 증정품', icon: '🎁' },
    { value: 'coupon', label: '쿠폰', description: '다회 사용 가능한 쿠폰', icon: '🎫' },
    { value: 'bundle', label: '번들', description: '상품 묶음 할인', icon: '📦' }
  ];

  const availableChannels = [
    { value: 'email', label: '이메일', icon: '📧' },
    { value: 'sms', label: 'SMS', icon: '💬' },
    { value: 'push', label: '푸시 알림', icon: '🔔' },
    { value: 'kakao', label: '카카오톡', icon: '💛' },
    { value: 'social', label: '소셜미디어', icon: '📱' },
    { value: 'app', label: '앱 내 알림', icon: '📲' }
  ];

  const userSegments = [
    '신규 고객', 'VIP 고객', '휴면 고객', '재구매 고객', 
    '고가 구매 고객', '할인 민감 고객', '브랜드 충성 고객'
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">오퍼명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="예: 여름 시즌 30% 할인"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">할인 값 *</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="30% 또는 10000원"
                    required
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="오퍼에 대한 상세 설명을 입력하세요..."
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">오퍼 유형 선택</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offerTypes.map((type) => (
                  <label key={type.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="offerType"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-4 border rounded-xl transition-all ${
                      formData.type === type.value 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">유효 기간</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시작일 *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">종료일 *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">최대 사용 횟수</label>
                  <input
                    type="number"
                    value={formData.maxUsage}
                    onChange={(e) => handleInputChange('maxUsage', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="제한없음"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">적용 조건</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">최소 구매 금액</label>
                  <input
                    type="number"
                    value={formData.conditions.minPurchaseAmount}
                    onChange={(e) => handleInputChange('conditions.minPurchaseAmount', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">최대 구매 금액</label>
                  <input
                    type="number"
                    value={formData.conditions.maxPurchaseAmount}
                    onChange={(e) => handleInputChange('conditions.maxPurchaseAmount', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="제한없음"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">대상 고객군</h3>
              <div className="space-y-3">
                {userSegments.map((segment) => (
                  <label key={segment} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.conditions.userSegments.includes(segment)}
                      onChange={(e) => handleArrayChange(
                        'conditions.userSegments', 
                        segment, 
                        e.target.checked ? 'add' : 'remove'
                      )}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{segment}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">배포 채널 선택</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableChannels.map((channel) => (
                  <label key={channel.value} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes(channel.value)}
                      onChange={(e) => handleArrayChange(
                        'channels', 
                        channel.value, 
                        e.target.checked ? 'add' : 'remove'
                      )}
                      className="sr-only"
                    />
                    <div className={`p-4 border rounded-xl transition-all ${
                      formData.channels.includes(channel.value)
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{channel.icon}</span>
                        <span className="font-medium text-gray-900">{channel.label}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">상품 적용 범위</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">적용 상품</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="상품명 또는 상품 코드 입력"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value) {
                            handleArrayChange('conditions.applicableProducts', value, 'add');
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                        const value = input?.value.trim();
                        if (value) {
                          handleArrayChange('conditions.applicableProducts', value, 'add');
                          input.value = '';
                        }
                      }}
                    >
                      추가
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.conditions.applicableProducts.map((product, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {product}
                        <button
                          type="button"
                          onClick={() => handleArrayChange('conditions.applicableProducts', product, 'remove')}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제외 상품</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="제외할 상품명 또는 상품 코드 입력"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value) {
                            handleArrayChange('conditions.excludedProducts', value, 'add');
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                        const value = input?.value.trim();
                        if (value) {
                          handleArrayChange('conditions.excludedProducts', value, 'add');
                          input.value = '';
                        }
                      }}
                    >
                      추가
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.conditions.excludedProducts.map((product, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                      >
                        {product}
                        <button
                          type="button"
                          onClick={() => handleArrayChange('conditions.excludedProducts', product, 'remove')}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">오퍼 생성 완료 검토</h3>
              
              <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">오퍼명:</span> {formData.name}</div>
                      <div><span className="text-gray-500">유형:</span> {offerTypes.find(t => t.value === formData.type)?.label}</div>
                      <div><span className="text-gray-500">할인 값:</span> {formData.value}</div>
                      <div><span className="text-gray-500">설명:</span> {formData.description || '없음'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">기간 및 조건</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">시작일:</span> {formData.startDate}</div>
                      <div><span className="text-gray-500">종료일:</span> {formData.endDate}</div>
                      <div><span className="text-gray-500">최대 사용:</span> {formData.maxUsage || '제한없음'}</div>
                      <div><span className="text-gray-500">최소 구매:</span> {formData.conditions.minPurchaseAmount || '0'}원</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">대상 고객군</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.conditions.userSegments.length > 0 ? (
                      formData.conditions.userSegments.map((segment, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {segment}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">모든 고객</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">배포 채널</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.channels.map((channelValue, index) => {
                      const channel = availableChannels.find(c => c.value === channelValue);
                      return (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center space-x-1">
                          <span>{channel?.icon}</span>
                          <span>{channel?.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {(formData.conditions.applicableProducts.length > 0 || formData.conditions.excludedProducts.length > 0) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">상품 적용 범위</h4>
                    {formData.conditions.applicableProducts.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-500">적용 상품:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {formData.conditions.applicableProducts.map((product, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.conditions.excludedProducts.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500">제외 상품:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {formData.conditions.excludedProducts.map((product, index) => (
                            <span key={index} className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout 
      title="오퍼 생성" 
      subtitle="새로운 마케팅 오퍼를 생성하고 고객에게 제공하세요."
    >
      <div className="p-6">
        {/* 진행 단계 표시 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === currentStep
                      ? 'bg-blue-600 text-white'
                      : step < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`w-16 h-1 mx-2 transition-colors ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3">
            <span className="text-sm font-medium text-gray-900">기본 정보</span>
            <span className="text-sm font-medium text-gray-900">조건 설정</span>
            <span className="text-sm font-medium text-gray-900">채널 설정</span>
            <span className="text-sm font-medium text-gray-900">검토 완료</span>
          </div>
        </div>

        {/* 오퍼 생성 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {renderStep()}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              이전
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/offers')}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  다음
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isSubmitting ? '생성 중...' : '오퍼 생성 완료'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
} 