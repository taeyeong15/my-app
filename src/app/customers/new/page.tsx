'use client';

import Layout from '@/components/Layout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerSegmentForm {
  name: string;
  description: string;
  criteria: {
    age: { min: string; max: string; enabled: boolean };
    gender: { value: string; enabled: boolean };
    purchaseAmount: { min: string; max: string; enabled: boolean };
    purchaseCount: { min: string; max: string; enabled: boolean };
    lastPurchase: { days: string; enabled: boolean };
    region: { value: string; enabled: boolean };
    membershipLevel: { value: string; enabled: boolean };
  };
  tags: string[];
}

export default function NewCustomerSegmentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerSegmentForm>({
    name: '',
    description: '',
    criteria: {
      age: { min: '', max: '', enabled: false },
      gender: { value: '', enabled: false },
      purchaseAmount: { min: '', max: '', enabled: false },
      purchaseCount: { min: '', max: '', enabled: false },
      lastPurchase: { days: '', enabled: false },
      region: { value: '', enabled: false },
      membershipLevel: { value: '', enabled: false },
    },
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCriteriaChange = (criteriaType: string, field: string, value: string | boolean) => {
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
    setIsSubmitting(true);

    try {
      // 실제 API 호출 대신 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('고객군이 성공적으로 생성되었습니다!');
      router.push('/customers');
    } catch (error) {
      console.error('고객군 생성 실패:', error);
      alert('고객군 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCriteriaSQL = () => {
    const conditions: string[] = [];
    
    if (formData.criteria.age.enabled && formData.criteria.age.min && formData.criteria.age.max) {
      conditions.push(`나이 BETWEEN ${formData.criteria.age.min} AND ${formData.criteria.age.max}`);
    }
    
    if (formData.criteria.gender.enabled && formData.criteria.gender.value) {
      conditions.push(`성별 = '${formData.criteria.gender.value}'`);
    }
    
    if (formData.criteria.purchaseAmount.enabled && formData.criteria.purchaseAmount.min && formData.criteria.purchaseAmount.max) {
      conditions.push(`총구매액 BETWEEN ${formData.criteria.purchaseAmount.min} AND ${formData.criteria.purchaseAmount.max}`);
    }
    
    if (formData.criteria.purchaseCount.enabled && formData.criteria.purchaseCount.min && formData.criteria.purchaseCount.max) {
      conditions.push(`구매횟수 BETWEEN ${formData.criteria.purchaseCount.min} AND ${formData.criteria.purchaseCount.max}`);
    }
    
    if (formData.criteria.lastPurchase.enabled && formData.criteria.lastPurchase.days) {
      conditions.push(`마지막구매일 >= ${formData.criteria.lastPurchase.days}일 전`);
    }
    
    if (formData.criteria.region.enabled && formData.criteria.region.value) {
      conditions.push(`지역 = '${formData.criteria.region.value}'`);
    }
    
    if (formData.criteria.membershipLevel.enabled && formData.criteria.membershipLevel.value) {
      conditions.push(`회원등급 = '${formData.criteria.membershipLevel.value}'`);
    }
    
    return conditions.join(' AND ') || '조건을 설정해주세요';
  };

  return (
    <Layout 
      title="고객군 생성" 
      subtitle="타겟 마케팅을 위한 새로운 고객군을 생성할 수 있습니다."
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  고객군명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 고가치 고객군"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="고객군의 특성과 목적을 설명해주세요..."
                />
              </div>
            </div>
          </div>

          {/* 세분화 조건 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">세분화 조건</h3>
            
            <div className="space-y-6">
              {/* 연령 조건 */}
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={formData.criteria.age.enabled}
                  onChange={(e) => handleCriteriaChange('age', 'enabled', e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">연령</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.criteria.age.min}
                      onChange={(e) => handleCriteriaChange('age', 'min', e.target.value)}
                      disabled={!formData.criteria.age.enabled}
                      placeholder="최소"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 w-20"
                    />
                    <span>~</span>
                    <input
                      type="number"
                      value={formData.criteria.age.max}
                      onChange={(e) => handleCriteriaChange('age', 'max', e.target.value)}
                      disabled={!formData.criteria.age.enabled}
                      placeholder="최대"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 w-20"
                    />
                    <span className="text-sm text-gray-500">세</span>
                  </div>
                </div>
              </div>

              {/* 성별 조건 */}
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={formData.criteria.gender.enabled}
                  onChange={(e) => handleCriteriaChange('gender', 'enabled', e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                  <select
                    value={formData.criteria.gender.value}
                    onChange={(e) => handleCriteriaChange('gender', 'value', e.target.value)}
                    disabled={!formData.criteria.gender.enabled}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">선택해주세요</option>
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                  </select>
                </div>
              </div>

              {/* 구매 금액 조건 */}
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={formData.criteria.purchaseAmount.enabled}
                  onChange={(e) => handleCriteriaChange('purchaseAmount', 'enabled', e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">총 구매 금액</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.criteria.purchaseAmount.min}
                      onChange={(e) => handleCriteriaChange('purchaseAmount', 'min', e.target.value)}
                      disabled={!formData.criteria.purchaseAmount.enabled}
                      placeholder="최소 금액"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 w-32"
                    />
                    <span>~</span>
                    <input
                      type="number"
                      value={formData.criteria.purchaseAmount.max}
                      onChange={(e) => handleCriteriaChange('purchaseAmount', 'max', e.target.value)}
                      disabled={!formData.criteria.purchaseAmount.enabled}
                      placeholder="최대 금액"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 w-32"
                    />
                    <span className="text-sm text-gray-500">원</span>
                  </div>
                </div>
              </div>

              {/* 구매 횟수 조건 */}
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={formData.criteria.purchaseCount.enabled}
                  onChange={(e) => handleCriteriaChange('purchaseCount', 'enabled', e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">구매 횟수</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.criteria.purchaseCount.min}
                      onChange={(e) => handleCriteriaChange('purchaseCount', 'min', e.target.value)}
                      disabled={!formData.criteria.purchaseCount.enabled}
                      placeholder="최소"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 w-20"
                    />
                    <span>~</span>
                    <input
                      type="number"
                      value={formData.criteria.purchaseCount.max}
                      onChange={(e) => handleCriteriaChange('purchaseCount', 'max', e.target.value)}
                      disabled={!formData.criteria.purchaseCount.enabled}
                      placeholder="최대"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 w-20"
                    />
                    <span className="text-sm text-gray-500">회</span>
                  </div>
                </div>
              </div>

              {/* 마지막 구매일 조건 */}
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={formData.criteria.lastPurchase.enabled}
                  onChange={(e) => handleCriteriaChange('lastPurchase', 'enabled', e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">마지막 구매일</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">최근</span>
                    <input
                      type="number"
                      value={formData.criteria.lastPurchase.days}
                      onChange={(e) => handleCriteriaChange('lastPurchase', 'days', e.target.value)}
                      disabled={!formData.criteria.lastPurchase.enabled}
                      placeholder="일수"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 w-20"
                    />
                    <span className="text-sm text-gray-500">일 이내</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 생성된 조건 미리보기 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">조건 미리보기</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <code className="text-sm text-gray-700">
                {generateCriteriaSQL()}
              </code>
            </div>
          </div>

          {/* 태그 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">태그</h3>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="태그 추가..."
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/customers')}
              className="inline-flex items-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  생성 중...
                </>
              ) : (
                '고객군 생성'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 