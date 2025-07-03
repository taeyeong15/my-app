'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ScriptForm {
  name: string;
  type: 'email' | 'sms' | 'call' | 'chatbot' | 'push';
  category: 'sales' | 'support' | 'marketing' | 'onboarding' | 'retention';
  content: string;
  subject?: string;
  variables: string[];
  conditions: {
    timing: string;
    frequency: string;
    targetAudience: string;
    triggers: string[];
  };
  settings: {
    autoSend: boolean;
    personalization: boolean;
    tracking: boolean;
    a_b_testing: boolean;
  };
}

export default function NewScriptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ScriptForm>({
    name: '',
    type: 'email',
    category: 'marketing',
    content: '',
    subject: '',
    variables: [],
    conditions: {
      timing: 'immediate',
      frequency: 'once',
      targetAudience: 'all',
      triggers: []
    },
    settings: {
      autoSend: false,
      personalization: true,
      tracking: true,
      a_b_testing: false
    }
  });

  const [currentStep, setCurrentStep] = useState(2); // 2단계로 시작
  const totalSteps = 4;
  const [newVariable, setNewVariable] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [isTestSendModalOpen, setIsTestSendModalOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTestSending, setIsTestSending] = useState(false);

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
      let target: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]];
      }
      
      const finalKey = keys[keys.length - 1];
      const currentArray = target[finalKey] as string[];
      
      if (action === 'add' && value && !currentArray.includes(value)) {
        target[finalKey] = [...currentArray, value];
      } else if (action === 'remove') {
        target[finalKey] = currentArray.filter(item => item !== value);
      }
      
      return newData;
    });
  };

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable]
      }));
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{${variable}}}` + after;
      
      setFormData(prev => ({
        ...prev,
        content: newText
      }));
      
      // 커서 위치 조정
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // API 호출 로직
      console.log('Submitting script:', formData);
      
      // 임시로 딜레이 추가
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('스크립트가 성공적으로 생성되었습니다!');
      router.push('/scripts');
    } catch (error) {
      console.error('Error creating script:', error);
      alert('스크립트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleTestSend = async () => {
    if (!testPhoneNumber.trim()) {
      alert('핸드폰 번호를 입력해주세요.');
      return;
    }

    // 핸드폰 번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    if (!phoneRegex.test(testPhoneNumber.replace(/-/g, ''))) {
      alert('올바른 핸드폰 번호 형식을 입력해주세요.');
      return;
    }

    setIsTestSending(true);
    try {
      // TODO: 실제 테스트 발송 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이
      
      alert('테스트 메시지가 성공적으로 발송되었습니다.');
      setIsTestSendModalOpen(false);
      setTestPhoneNumber('');
    } catch (error) {
      console.error('테스트 발송 실패:', error);
      alert('테스트 발송에 실패했습니다.');
    } finally {
      setIsTestSending(false);
    }
  };

  const scriptTypes = [
    { value: 'email', label: '이메일', description: '이메일 마케팅 메시지', icon: '📧' },
    { value: 'sms', label: 'SMS', description: '문자 메시지', icon: '💬' },
    { value: 'push', label: '푸시 알림', description: '모바일 푸시 알림', icon: '🔔' },
    { value: 'chatbot', label: '챗봇', description: '자동 응답 메시지', icon: '🤖' },
    { value: 'call', label: '전화', description: '전화 상담 스크립트', icon: '📞' }
  ];

  const categories = [
    { value: 'marketing', label: '마케팅', description: '프로모션 및 마케팅 메시지' },
    { value: 'support', label: '고객지원', description: '고객 문의 및 지원' },
    { value: 'sales', label: '영업', description: '영업 및 세일즈' },
    { value: 'onboarding', label: '온보딩', description: '신규 고객 안내' },
    { value: 'retention', label: '리텐션', description: '고객 유지 및 재참여' }
  ];

  const timingOptions = [
    { value: 'immediate', label: '즉시 발송' },
    { value: 'scheduled', label: '예약 발송' },
    { value: 'triggered', label: '이벤트 기반' },
    { value: 'drip', label: '드립 캠페인' }
  ];

  const frequencyOptions = [
    { value: 'once', label: '1회만' },
    { value: 'daily', label: '매일' },
    { value: 'weekly', label: '매주' },
    { value: 'monthly', label: '매월' },
    { value: 'custom', label: '사용자 정의' }
  ];

  const triggerOptions = [
    '회원가입', '첫 구매', '장바구니 방치', '리뷰 작성', 
    '생일', '휴면 상태', '재구매', '환불 요청'
  ];

  const audienceOptions = [
    { value: 'all', label: '모든 고객' },
    { value: 'new', label: '신규 고객' },
    { value: 'vip', label: 'VIP 고객' },
    { value: 'inactive', label: '휴면 고객' },
    { value: 'custom', label: '사용자 정의' }
  ];

  const generatePreview = () => {
    let preview = formData.content;
    formData.variables.forEach(variable => {
      const placeholder = getVariablePlaceholder(variable);
      preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), placeholder);
    });
    return preview;
  };

  const getVariablePlaceholder = (variable: string) => {
    const placeholders: { [key: string]: string } = {
      'name': '홍길동',
      'email': 'hong@example.com',
      'customerName': '김고객',
      'productName': '스마트폰',
      'orderNumber': 'ORD-123456',
      'discount': '30',
      'discountPercent': '20',
      'price': '299,000원',
      'company': '(주)예시회사',
      'date': '2024-01-15',
      'amount': '150,000원'
    };
    return placeholders[variable] || `[${variable}]`;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">스크립트명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="예: 신규 회원 환영 이메일"
                    required
                  />
                </div>
                {formData.type === 'email' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                    <input
                      type="text"
                      value={formData.subject || ''}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="예: 🎉 가입을 축하드립니다!"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">스크립트 유형</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scriptTypes.map((type) => (
                  <label key={type.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="scriptType"
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

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <label key={category.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={formData.category === category.value}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-4 border rounded-xl transition-all ${
                      formData.category === category.value 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="font-medium text-gray-900">{category.label}</div>
                      <div className="text-sm text-gray-500">{category.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽: 스크립트 작성 */}
            <div className="space-y-8">
              {/* 스크립트 제목 */}
              <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-xl border border-emerald-100/50 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📝</span>
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">스크립트 제목</h3>
                </div>
                
                <input
                  type="text"
                  value={formData.subject || ''}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 backdrop-blur-sm bg-white/80 hover:border-emerald-300"
                  placeholder="예: 신규 고객 환영 메시지"
                />
              </div>

              {/* 스크립트 내용 */}
              <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-xl border border-emerald-100/50 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💬</span>
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">스크립트 내용</h3>
                </div>
                
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 backdrop-blur-sm resize-none bg-white/80 hover:border-emerald-300 font-mono text-sm"
                  placeholder="안녕하세요 {{고객명}}님! 
저희 {{회사명}}에서 특별 이벤트를 진행하고 있습니다.
{{상품명}}을 {{할인율}}% 할인된 가격으로 만나보세요!

※ 변수는 {{변수명}} 형태로 입력하세요."
                  required
                />
                <div className="mt-2 text-sm text-gray-500">
                  문자 수: {formData.content.length}
                  {formData.type === 'sms' && (
                    <span className={formData.content.length > 90 ? 'text-orange-600' : ''}>
                      {' '}(SMS 권장: 90자 이하)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽: 개인화 치환 변수 + 미리보기 */}
            <div className="flex flex-col h-full">
              {/* 개인화 치환 변수 */}
              <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100/50 p-6 mb-6 flex-0">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🔧</span>
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">개인화 치환 변수</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      placeholder="변수명 입력"
                      className="flex-1 px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm bg-white/80"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addVariable();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addVariable}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                    >
                      추가
                    </button>
                  </div>

                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.variables.map((variable, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <button
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="text-sm text-blue-700 hover:text-blue-900 font-mono font-medium"
                        >
                          {`{{${variable}}}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVariable(variable)}
                          className="text-red-600 hover:text-red-800 text-sm font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {formData.variables.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                      변수를 추가하여 개인화된 메시지를 만들어보세요
                    </div>
                  )}
                </div>
              </div>

              {/* 미리보기 */}
              <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-xl border border-purple-100/50 p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">👀</span>
                    </div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">미리보기</h3>
                  </div>
                  
                  {/* 테스트 발송 버튼 */}
                  <button
                    type="button"
                    onClick={() => setIsTestSendModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <span className="text-sm">📱</span>
                    <span className="font-medium">테스트 발송</span>
                  </button>
                </div>
                
                <div className="flex-1 bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap border border-gray-200">
                  {formData.content ? (
                    <div className="space-y-2">
                      {formData.subject && (
                        <div className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          제목: {formData.subject.replace(/{{(\w+)}}/g, (match, variable) => getVariablePlaceholder(variable))}
                        </div>
                      )}
                      <div className="text-gray-700">
                        {formData.content.replace(/{{(\w+)}}/g, (match, variable) => getVariablePlaceholder(variable))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      스크립트 내용을 입력하면 미리보기가 표시됩니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">발송 조건</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">발송 시점</label>
                  <select
                    value={formData.conditions.timing}
                    onChange={(e) => handleInputChange('conditions.timing', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {timingOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">발송 빈도</label>
                  <select
                    value={formData.conditions.frequency}
                    onChange={(e) => handleInputChange('conditions.frequency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {frequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">대상 고객</label>
                  <select
                    value={formData.conditions.targetAudience}
                    onChange={(e) => handleInputChange('conditions.targetAudience', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {audienceOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">트리거 이벤트</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {triggerOptions.map((trigger) => (
                  <label key={trigger} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.conditions.triggers.includes(trigger)}
                      onChange={(e) => handleArrayChange(
                        'conditions.triggers', 
                        trigger, 
                        e.target.checked ? 'add' : 'remove'
                      )}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{trigger}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">고급 설정</h3>
              <div className="space-y-4">
                {[
                  { key: 'autoSend', label: '자동 발송', description: '조건이 충족되면 자동으로 발송됩니다' },
                  { key: 'personalization', label: '개인화', description: '수신자별로 내용을 개인화합니다' },
                  { key: 'tracking', label: '성과 추적', description: '열람률, 클릭률 등을 추적합니다' },
                  { key: 'a_b_testing', label: 'A/B 테스트', description: '여러 버전으로 테스트가 가능합니다' }
                ].map((setting) => (
                  <label key={setting.key} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.settings[setting.key as keyof typeof formData.settings]}
                      onChange={(e) => handleInputChange(`settings.${setting.key}`, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{setting.label}</div>
                      <div className="text-sm text-gray-500">{setting.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">스크립트 생성 완료 검토</h3>
              
              <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">스크립트명:</span> {formData.name}</div>
                      <div><span className="text-gray-500">유형:</span> {scriptTypes.find(t => t.value === formData.type)?.label}</div>
                      <div><span className="text-gray-500">카테고리:</span> {categories.find(c => c.value === formData.category)?.label}</div>
                      {formData.subject && <div><span className="text-gray-500">제목:</span> {formData.subject}</div>}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">발송 조건</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">발송 시점:</span> {timingOptions.find(t => t.value === formData.conditions.timing)?.label}</div>
                      <div><span className="text-gray-500">발송 빈도:</span> {frequencyOptions.find(f => f.value === formData.conditions.frequency)?.label}</div>
                      <div><span className="text-gray-500">대상 고객:</span> {audienceOptions.find(a => a.value === formData.conditions.targetAudience)?.label}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">메시지 내용</h4>
                  <div className="p-4 bg-white rounded-lg border text-sm">
                    <div className="text-gray-700 whitespace-pre-wrap">{formData.content}</div>
                  </div>
                </div>

                {formData.variables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">사용된 변수</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.variables.map((variable, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.conditions.triggers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">트리거 이벤트</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.conditions.triggers.map((trigger, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">활성화된 설정</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(formData.settings)
                      .filter(([_, value]) => value)
                      .map(([key, _], index) => {
                        const setting = [
                          { key: 'autoSend', label: '자동 발송' },
                          { key: 'personalization', label: '개인화' },
                          { key: 'tracking', label: '성과 추적' },
                          { key: 'a_b_testing', label: 'A/B 테스트' }
                        ].find(s => s.key === key);
                        
                        return setting ? (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            {setting.label}
                          </span>
                        ) : null;
                      })
                    }
                  </div>
                </div>
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
      title="스크립트 생성" 
      subtitle="새로운 마케팅 스크립트를 생성하고 캠페인에 활용하세요."
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
            <span className="text-sm font-medium text-gray-900">메시지 작성</span>
            <span className="text-sm font-medium text-gray-900">발송 설정</span>
            <span className="text-sm font-medium text-gray-900">검토 완료</span>
          </div>
        </div>

        {/* 스크립트 생성 폼 */}
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
                onClick={() => router.push('/scripts')}
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
                  {isSubmitting ? '생성 중...' : '스크립트 생성 완료'}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* 테스트 발송 모달 */}
        {isTestSendModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">테스트 발송</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsTestSendModalOpen(false);
                    setTestPhoneNumber('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* 발송 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">📧</span>
                    </div>
                    <span className="font-medium text-gray-900">이메일</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="mb-1">제목: {formData.subject || '제목 없음'}</div>
                    <div className="line-clamp-2">내용: {formData.content.substring(0, 50)}...</div>
                  </div>
                </div>

                {/* 핸드폰 번호 입력 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    📱 테스트 발송할 핸드폰 번호
                  </label>
                  <input
                    type="tel"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-3 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                    disabled={isTestSending}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    예시: 010-1234-5678 또는 01012345678
                  </p>
                </div>

                {/* 주의사항 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 text-sm">⚠️</span>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">테스트 발송 주의사항</p>
                      <ul className="text-xs space-y-1">
                        <li>• 실제 메시지가 발송됩니다</li>
                        <li>• 발송 후 취소할 수 없습니다</li>
                        <li>• 본인 또는 테스트용 번호를 사용하세요</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTestSendModalOpen(false);
                      setTestPhoneNumber('');
                    }}
                    disabled={isTestSending}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSend}
                    disabled={isTestSending || !testPhoneNumber.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isTestSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>발송 중...</span>
                      </>
                    ) : (
                      <>
                        <span>📤</span>
                        <span>테스트 발송</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 