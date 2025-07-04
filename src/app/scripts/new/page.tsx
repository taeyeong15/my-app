'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import Image from 'next/image';

interface ScriptForm {
  name: string;
  type: string;
  category: string;
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
  description: string;
}

interface ChannelType {
  type: string;
  label: string;
  description?: string;
}

interface CommonCode {
  category: string;
  sub_category: string;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

// 채널별 미리보기 컴포넌트들
function KakaoPreview({ subject, content, images = [], onClose }: { subject?: string; content: string; images?: string[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-[#FEE500] rounded-3xl p-0 w-[380px] shadow-2xl border border-yellow-300 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl font-bold z-10">×</button>
        <div className="flex items-center w-full px-6 pt-6 pb-2">
          <Image src="/kakao-logo.png" alt="카카오톡" width={40} height={40} className="rounded-full border-2 border-yellow-400 bg-white mr-3" />
          <span className="font-bold text-gray-800 text-lg">카카오톡 알림톡</span>
        </div>
        <div className="w-full flex flex-col items-start px-6 pb-6">
          <div className="flex items-end mt-2">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-inner border border-yellow-100 max-w-[90%] text-gray-900 text-[15px] leading-relaxed break-words" style={{ fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, sans-serif' }}>
              {images.length > 0 && (
                <div className="mb-2">
                  {images.map((url) => (
                    <img key={url} src={url} alt="카카오톡 이미지" className="rounded-lg w-full max-w-[220px] max-h-48 object-contain bg-gray-100 mx-auto" />
                  ))}
                </div>
              )}
              {subject && <div className="font-bold mb-1 text-base">{subject}</div>}
              <span className="align-middle" style={{ wordBreak: 'break-all', fontSize: '15px', lineHeight: '1.7' }}>{content}</span>
            </div>
            <span className="ml-2 text-2xl select-none">🟡</span>
          </div>
          <button className="mt-4 px-4 py-2 rounded-xl bg-[#3C1E1E] text-white font-bold text-sm shadow hover:bg-[#2d1515] transition">확인</button>
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ subject, content, images = [], onClose }: { subject?: string; content: string; images?: string[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[480px] shadow-2xl border border-blue-200 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl font-bold z-10">×</button>
        <div className="w-full flex flex-col items-center pt-8 pb-2">
          <span className="text-2xl text-blue-700 mb-2">📧</span>
          <span className="font-bold text-gray-800 text-lg">이메일 미리보기</span>
        </div>
        <div className="w-full flex flex-col items-center px-8 pb-8">
          <div className="bg-blue-50 rounded-xl p-4 shadow-inner text-gray-900 mb-4 w-full">
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((url) => (
                  <img key={url} src={url} alt="이메일 이미지" className="rounded-lg w-full max-w-[220px] max-h-48 object-contain bg-gray-100" />
                ))}
              </div>
            )}
            {subject && <div className="font-bold mb-2 text-base">{subject}</div>}
            <div className="whitespace-pre-line text-[15px] leading-relaxed">{content}</div>
          </div>
          <div className="text-xs text-gray-400 text-right w-full">Powered by Marketing Platform</div>
        </div>
      </div>
    </div>
  );
}

function SmsPreview({ content, onClose }: { content: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[320px] shadow-xl border border-gray-200 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl font-bold z-10">×</button>
        <div className="w-full flex flex-col items-center pt-5 pb-2">
          <span className="text-xs text-gray-400 mb-1">메시지</span>
          <span className="text-gray-700 font-bold text-base">010-0000-0000</span>
        </div>
        <div className="w-full flex flex-col items-end px-4 pb-6">
          <div className="bg-blue-100 rounded-2xl px-4 py-2 shadow-inner border border-blue-50 max-w-[90%] text-gray-900 text-[15px] leading-relaxed break-words mt-2" style={{ fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, sans-serif' }}>
            <span className="align-middle" style={{ wordBreak: 'break-all', fontSize: '15px', lineHeight: '1.7' }}>{content}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PushPreview({ content, onClose }: { content: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[340px] shadow-xl border border-blue-200 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl font-bold z-10">×</button>
        <div className="w-full flex flex-col items-center pt-5 pb-2">
          <span className="text-xs text-blue-400 mb-1">앱푸시</span>
          <span className="text-blue-700 font-bold text-base">마케팅 플랫폼</span>
        </div>
        <div className="w-full flex flex-col items-end px-4 pb-6">
          <div className="bg-blue-50 rounded-2xl px-4 py-2 shadow-inner border border-blue-100 max-w-[90%] text-gray-900 text-[15px] leading-relaxed break-words mt-2">
            <span className="align-middle" style={{ wordBreak: 'break-all', fontSize: '15px', lineHeight: '1.7' }}>{content}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LmsPreview({ subject, content, onClose }: { subject?: string; content: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[340px] shadow-xl border border-gray-200 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl font-bold z-10">×</button>
        <div className="w-full flex flex-col items-center pt-5 pb-2">
          <span className="text-xs text-gray-400 mb-1">장문 메시지</span>
          <span className="text-gray-700 font-bold text-base">010-0000-0000</span>
        </div>
        <div className="w-full flex flex-col items-end px-4 pb-6">
          <div className="bg-blue-100 rounded-2xl px-4 py-2 shadow-inner border border-blue-50 max-w-[90%] text-gray-900 text-[15px] leading-relaxed break-words mt-2">
            {subject && <div className="font-bold mb-1 text-base">{subject}</div>}
            <span className="align-middle" style={{ wordBreak: 'break-all', fontSize: '15px', lineHeight: '1.7' }}>{content}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MmsPreview({ subject, content, images = [], onClose }: { subject?: string; content: string; images?: string[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[340px] shadow-xl border border-gray-200 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl font-bold z-10">×</button>
        <div className="w-full flex flex-col items-center pt-5 pb-2">
          <span className="text-xs text-gray-400 mb-1">멀티미디어 메시지</span>
          <span className="text-gray-700 font-bold text-base">010-0000-0000</span>
        </div>
        <div className="w-full flex flex-col items-end px-4 pb-6">
          <div className="bg-blue-100 rounded-2xl px-4 py-2 shadow-inner border border-blue-50 max-w-[90%] text-gray-900 text-[15px] leading-relaxed break-words mt-2">
            {images.length > 0 && (
              <div className="mb-2">
                {images.map((url) => (
                  <img key={url} src={url} alt="MMS 이미지" className="rounded-lg w-full max-w-[180px] max-h-40 object-contain bg-gray-100 mx-auto" />
                ))}
              </div>
            )}
            {subject && <div className="font-bold mb-1 text-base">{subject}</div>}
            <span className="align-middle" style={{ wordBreak: 'break-all', fontSize: '15px', lineHeight: '1.7' }}>{content}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FriendTalkPreview({ subject, content, images = [], onClose }: { subject?: string; content: string; images?: string[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-[#F7E600] rounded-3xl p-0 w-[380px] shadow-2xl border border-yellow-300 relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl font-bold z-10">×</button>
        <div className="flex items-center w-full px-6 pt-6 pb-2">
          <Image src="/kakao-logo.png" alt="카카오톡" width={40} height={40} className="rounded-full border-2 border-yellow-400 bg-white mr-3" />
          <span className="font-bold text-gray-800 text-lg">카카오톡 친구톡</span>
        </div>
        <div className="w-full flex flex-col items-start px-6 pb-6">
          <div className="flex items-end mt-2">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-inner border border-yellow-100 max-w-[90%] text-gray-900 text-[15px] leading-relaxed break-words" style={{ fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, sans-serif' }}>
              {images.length > 0 && (
                <div className="mb-2">
                  {images.map((url) => (
                    <img key={url} src={url} alt="친구톡 이미지" className="rounded-lg w-full max-w-[220px] max-h-48 object-contain bg-gray-100 mx-auto" />
                  ))}
                </div>
              )}
              {subject && <div className="font-bold mb-1 text-base">{subject}</div>}
              <span className="align-middle" style={{ wordBreak: 'break-all', fontSize: '15px', lineHeight: '1.7' }}>{content}</span>
            </div>
            <span className="ml-2 text-2xl select-none">🟡</span>
          </div>
          <button className="mt-4 px-4 py-2 rounded-xl bg-[#3C1E1E] text-white font-bold text-sm shadow hover:bg-[#2d1515] transition">채팅방 이동</button>
        </div>
      </div>
    </div>
  );
}

// 바이트 계산 함수
function getByteLength(str: string) {
  let byte = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    if (ch <= 0x007F) byte += 1; // 영문, 숫자, 특수문자
    else if (ch <= 0x07FF) byte += 2;
    else if (ch <= 0xFFFF) byte += 2; // 한글, 기타
    else byte += 3;
  }
  return byte;
}

// 채널별 메시지 길이 제한값
function getMessageLimit(type: string) {
  const t = (type || '').toLowerCase();
  if (t === 'sms') return { type: 'byte', limit: 90 };
  if (t === 'lms' || t === 'mms') return { type: 'byte', limit: 2000 };
  if (t === 'friendtalk' || t === '친구톡' || t === 'alrimtalk' || t === '알림톡' || t === 'kakao') return { type: 'char', limit: 1000 };
  if (t === 'push' || t === 'app_push') return { type: 'char', limit: 1000 };
  if (t === 'email') return { type: 'char', limit: 2000 };
  return { type: 'char', limit: 2000 };
}

export default function NewScriptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, ToastContainer } = useToast();
  const mode = searchParams.get('mode');
  const id = searchParams.get('id');
  
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [isTestSendModalOpen, setIsTestSendModalOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [isChannelPreviewOpen, setIsChannelPreviewOpen] = useState(false);
  
  // 옵션 데이터
  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CommonCode[]>([]);
  const [timingOptions, setTimingOptions] = useState<CommonCode[]>([]);
  const [frequencyOptions, setFrequencyOptions] = useState<CommonCode[]>([]);
  const [audienceOptions, setAudienceOptions] = useState<CommonCode[]>([]);
  const [triggerOptions, setTriggerOptions] = useState<CommonCode[]>([]);
  
  // 변수 관련
  const [availableVariables, setAvailableVariables] = useState<CommonCode[]>([]);
  const [variableSearchTerm, setVariableSearchTerm] = useState('');
  const [variablePage, setVariablePage] = useState(1);
  const [variableTotalPages, setVariableTotalPages] = useState(1);
  
  // 사용자 정보
  const [user, setUser] = useState<User | null>(null);
  
  // 폼 데이터
  const [formData, setFormData] = useState<ScriptForm>({
    name: '',
    description: '',
    type: '',
    category: '',
    content: '',
    subject: '',
    variables: [],
    conditions: {
      timing: '',
      frequency: '',
      targetAudience: '',
      triggers: []
    },
    settings: {
      autoSend: false,
      personalization: false,
      tracking: false,
      a_b_testing: false
    }
  });

  // 경고 메시지 상태
  const [messageLimitWarning, setMessageLimitWarning] = useState('');

  // 이미지 업로드 상태
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  // 업로드 허용 채널
  const canUploadImage = ['mms', 'kakao_f', 'email'].includes((formData.type || '').toLowerCase());

  useEffect(() => {
    const checkAuth = () => {
      try {
        const loggedInUser = sessionStorage.getItem('currentUser');
        
        if (!loggedInUser) {
          router.push('/login');
          return;
        }
        
        const currentUser = JSON.parse(loggedInUser);
        setUser(currentUser);
        
        // 인증 확인 후 데이터 로드
        loadOptionsData();
        loadAvailableVariables();
        
        // 상세보기/수정 모드인 경우 스크립트 데이터 로드
        if (id && (isViewMode || isEditMode)) {
          loadScriptData();
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router, id, isViewMode, isEditMode]);

  // 옵션 데이터 로딩
  const loadOptionsData = async () => {
    try {
      setIsLoading(true);
      
      // 병렬로 모든 옵션 데이터 로딩
      const [channelTypesRes, categoryRes, timingRes, frequencyRes, audienceRes, triggerRes] = await Promise.all([
        fetch('/api/channels/types'),
        fetch('/api/common-codes?category=SCRIPT&sub_category=CATEGORY'),
        fetch('/api/common-codes?category=SCRIPT&sub_category=TIMING'),
        fetch('/api/common-codes?category=SCRIPT&sub_category=FREQUENCY'),
        fetch('/api/common-codes?category=SCRIPT&sub_category=TARGET_AUDIENCE'),
        fetch('/api/common-codes?category=SCRIPT&sub_category=TRIGGERS')
      ]);

      // 채널 타입
      if (channelTypesRes.ok) {
        const channelData = await channelTypesRes.json();
        if (channelData.success) {
          setChannelTypes(channelData.data || []);
        }
      }

      // 타이밍 옵션
      if (timingRes.ok) {
        const timingData = await timingRes.json();
        if (timingData.success) {
          setTimingOptions(timingData.data || []);
        }
      }

      // 빈도 옵션
      if (frequencyRes.ok) {
        const frequencyData = await frequencyRes.json();
        if (frequencyData.success) {
          setFrequencyOptions(frequencyData.data || []);
        }
      }

      // 대상 옵션
      if (audienceRes.ok) {
        const audienceData = await audienceRes.json();
        if (audienceData.success) {
          setAudienceOptions(audienceData.data || []);
        }
      }

      // 트리거 옵션
      if (triggerRes.ok) {
        const triggerData = await triggerRes.json();
        if (triggerData.success) {
          setTriggerOptions(triggerData.data || []);
        }
      }
    } catch (error) {
      console.error('옵션 데이터 로딩 실패:', error);
      showToast('옵션 데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 스크립트 데이터 로드 (상세보기/수정 모드)
  const loadScriptData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/scripts/${id}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        const script = data.script;
        
        // 스크립트 데이터를 폼에 설정
        setFormData({
          name: script.basicInfo?.name || '',
          description: script.description || '',
          type: script.basicInfo?.type || '',
          category: script.basicInfo?.category || '',
          content: script.content?.main_script || script.content || '',
          subject: script.subject || '',
          variables: script.variables ? Object.keys(script.variables) : [],
          conditions: {
            timing: script.conditions?.timing || 'immediate',
            frequency: script.conditions?.frequency || 'once',
            targetAudience: script.conditions?.targetAudience || 'all',
            triggers: script.conditions?.triggers || []
          },
          settings: {
            autoSend: script.settings?.autoSend || false,
            personalization: script.settings?.personalization !== false,
            tracking: script.settings?.tracking !== false,
            a_b_testing: script.settings?.a_b_testing || false
          }
        });
      } else {
        showToast('스크립트 데이터를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('스크립트 데이터 로드 실패:', error);
      showToast('스크립트 데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용 가능한 변수 로딩
  const loadAvailableVariables = async (search = '', page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '6',
        search: search,
        category: 'PERSONALIZATION',
        sub_category: 'VARIABLE'
      });

      const response = await fetch(`/api/common-codes?${params}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setAvailableVariables(data.data || []);
        setVariableTotalPages(data.pagination?.totalPages || 0);
      }
    } catch (error) {
      console.error('변수 로딩 실패:', error);
    }
  };

  // 변수 검색
  const handleVariableSearch = () => {
    setVariablePage(1);
    loadAvailableVariables(variableSearchTerm, 1);
  };

  // 변수 페이지 변경
  const handleVariablePageChange = (newPage: number) => {
    setVariablePage(newPage);
    loadAvailableVariables(variableSearchTerm, newPage);
  };

  // 메시지 입력 핸들러 수정
  const handleMessageInput = (value: string) => {
    const { type, limit } = getMessageLimit(formData.type);
    let valid = true;
    let warning = '';
    if (type === 'byte') {
      const byteLen = getByteLength(value);
      if (byteLen > limit) {
        valid = false;
        warning = `최대 ${limit}바이트까지 입력 가능합니다. (현재 ${byteLen}바이트)`;
      }
    } else {
      if (value.length > limit) {
        valid = false;
        warning = `최대 ${limit}자까지 입력 가능합니다. (현재 ${value.length}자)`;
      }
    }
    setMessageLimitWarning(warning);
    if (valid) {
      handleInputChange('content', value);
    }
  };

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

    // 메시지 내용이 변경될 때 사용된 변수 추출 및 업데이트
    if (field === 'content') {
      extractVariablesFromContent(value);
    }
  };

  // 메시지 내용에서 변수 추출
  const extractVariablesFromContent = (content: string) => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variableRegex);
    const extractedVariables: string[] = [];
    
    if (matches) {
      matches.forEach(match => {
        const variable = match.replace(/\{\{|\}\}/g, '');
        if (!extractedVariables.includes(variable)) {
          extractedVariables.push(variable);
        }
      });
    }
    
    // 추출된 변수로 formData.variables 업데이트
    setFormData(prev => ({
      ...prev,
      variables: extractedVariables
    }));
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
    if (variableSearchTerm && !formData.variables.includes(variableSearchTerm)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, variableSearchTerm]
      }));
      setVariableSearchTerm('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
    
    // 메시지 내용에서도 해당 변수 제거
    const newContent = formData.content.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), '');
    setFormData(prev => ({
      ...prev,
      content: newContent
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
        content: newText,
        variables: prev.variables.includes(variable) ? prev.variables : [...prev.variables, variable]
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
    
    if (isViewMode) {
      return; // 상세보기 모드에서는 제출 방지
    }
    
    // 기본 유효성 검사
    if (!formData.name.trim()) {
      showToast('스크립트 이름을 입력해주세요.', 'error');
      return;
    }
    
    if (!formData.type) {
      showToast('채널 타입을 선택해주세요.', 'error');
      return;
    }
    
    if (!formData.content.trim()) {
      showToast('스크립트 내용을 입력해주세요.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const url = isEditMode ? `/api/scripts/${id}` : '/api/scripts';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          created_by: user?.email
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(
          isEditMode ? '스크립트가 성공적으로 수정되었습니다.' : '스크립트가 성공적으로 생성되었습니다.',
          'success'
        );
        router.push('/scripts');
      } else {
        showToast(result.error || '오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePreview = () => {
    let preview = formData.content;
    
    // 변수를 실제 값으로 치환
    formData.variables.forEach(variable => {
      const placeholder = getVariablePlaceholder(variable);
      preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), placeholder);
    });
    
    return preview;
  };

  // 테스트 발송 함수 추가
  const handleTestSend = async () => {
    if (!testPhoneNumber.trim()) {
      showToast('핸드폰 번호를 입력해주세요.', 'error');
      return;
    }
    // 핸드폰 번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    if (!phoneRegex.test(testPhoneNumber.replace(/-/g, ''))) {
      showToast('올바른 핸드폰 번호 형식을 입력해주세요.', 'error');
      return;
    }
    setIsTestSending(true);
    try {
      // TODO: 실제 테스트 발송 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이
      showToast('테스트 메시지가 발송되었습니다!', 'success');
      setIsTestSendModalOpen(false);
      setTestPhoneNumber('');
    } catch (error) {
      console.error('테스트 발송 실패:', error);
      showToast('테스트 발송에 실패했습니다.', 'error');
    } finally {
      setIsTestSending(false);
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    setImageUploadError('');
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.url) {
          uploaded.push(data.url);
        } else {
          setImageUploadError(data.error || '이미지 업로드 실패');
        }
      }
      setUploadedImages(prev => [...prev, ...uploaded]);
    } catch (err) {
      setImageUploadError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 이미지 삭제
  const handleRemoveImage = (url: string) => {
    setUploadedImages(prev => prev.filter(img => img !== url));
  };

  // 채널별 미리보기 렌더 함수
  const renderChannelPreviewModal = () => {
    if (!isChannelPreviewOpen) return null;
    const type = (formData.type || '').toLowerCase();
    const subject = formData.subject;
    const content = generatePreview();
    // 미리보기에 이미지 반영
    if (type === 'sms') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <SmsPreview content={content} onClose={() => setIsChannelPreviewOpen(false)} />
        </div>
      );
    }
    if (type === 'lms') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <LmsPreview subject={subject} content={content} onClose={() => setIsChannelPreviewOpen(false)} />
        </div>
      );
    }
    if (type === 'mms') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <MmsPreview subject={subject} content={content} images={uploadedImages} onClose={() => setIsChannelPreviewOpen(false)} />
        </div>
      );
    }
    if (type === 'push' || type === 'app_push') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <PushPreview content={content} onClose={() => setIsChannelPreviewOpen(false)} />
        </div>
      );
    }
    if (type === 'email') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <EmailPreview subject={subject} content={content} images={uploadedImages} onClose={() => setIsChannelPreviewOpen(false)} />
        </div>
      );
    }
    if (type === 'friendtalk' || type === 'kakao_f') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <FriendTalkPreview subject={subject} content={content} images={uploadedImages} onClose={() => setIsChannelPreviewOpen(false)} />
        </div>
      );
    }
    if (type === 'kakao_al') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <KakaoPreview subject={subject} content={content} images={uploadedImages} onClose={() => setIsChannelPreviewOpen(false)} />
        </div>
      );
    }
    // 기본: 이메일 스타일
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <EmailPreview subject={subject} content={content} images={uploadedImages} onClose={() => setIsChannelPreviewOpen(false)} />
      </div>
    );
  };

  const getVariablePlaceholder = (variable: string) => {
    const placeholders: { [key: string]: string } = {
      'customer_name': '홍길동',
      'customer_email': 'hong@example.com',
      'customer_phone': '010-1234-5678',
      'product_name': '프리미엄 상품',
      'order_id': 'ORD-2024-001',
      'order_amount': '150,000원',
      'discount_amount': '15,000원',
      'company_name': '우리회사',
      'support_email': 'support@company.com',
      'support_phone': '1588-1234'
    };
    
    return placeholders[variable] || `[${variable}]`;
  };

  if (isLoading) {
    return (
      <Layout title="스크립트 정보 불러오는 중..." subtitle="잠시만 기다려주세요.">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">스크립트 정보를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 페이지 제목과 설명 설정
  const getPageTitle = () => {
    if (isViewMode) return '스크립트 상세보기';
    if (isEditMode) return '스크립트 수정';
    return '새 스크립트 생성';
  };

  const getPageSubtitle = () => {
    if (isViewMode) return '스크립트의 상세 정보를 확인합니다.';
    if (isEditMode) return '기존 스크립트의 정보를 수정합니다.';
    return '캠페인에 사용할 새로운 스크립트를 생성합니다.';
  };

  return (
    <Layout title={getPageTitle()} subtitle={getPageSubtitle()}>
      {renderChannelPreviewModal()}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-full mx-auto px-6 py-6">
          <form onSubmit={handleSubmit}>
            {/* 1. 기본 정보 영역 */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-xl border border-indigo-100/50 p-8 hover:shadow-2xl transition-all duration-300 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📝</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">기본 정보</h3>
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">필수 항목</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                    <span className="text-red-500 mr-2">*</span>
                    스크립트 이름
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${formData.name ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-indigo-300'
                    }`}
                    placeholder="예: 신규 가입 환영 메시지"
                    disabled={isViewMode}
                    required
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                    <span className="text-red-500 mr-2">*</span>
                    채널 타입
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${formData.type ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm ${
                      isViewMode 
                        ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                        : 'bg-white/80 hover:border-indigo-300'
                    }`}
                    disabled={isViewMode}
                    required
                  >
                    <option value="">채널 타입을 선택하세요</option>
                    {channelTypes.map((channel) => (
                      <option key={channel.type} value={channel.type}>
                        {channel.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  스크립트 설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 backdrop-blur-sm resize-none ${
                    isViewMode 
                      ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                      : 'bg-white/80 hover:border-indigo-300'
                  }`}
                  placeholder="스크립트에 대한 설명을 입력하세요"
                  disabled={isViewMode}
                  rows={3}
                />
              </div>
            </div>

            {/* 2. 스크립트 정보 영역 */}
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100/50 p-8 hover:shadow-2xl transition-all duration-300 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📄</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">스크립트 정보</h3>
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">필수 항목</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[520px]">
                {/* 좌측: 메시지 내용 영역 */}
                <div className="flex flex-col h-full">
                  {formData.type === 'email' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        이메일 제목
                      </label>
                      <input
                        type="text"
                        value={formData.subject || ''}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        className={`w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm ${
                          isViewMode 
                            ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                            : 'bg-white/80 hover:border-blue-300'
                        }`}
                        placeholder="이메일 제목을 입력하세요"
                        disabled={isViewMode}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-col">
                    <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                      <span className="text-red-500 mr-2">*</span>
                      메시지 내용
                    </label>
                    {/* 이미지 업로드 UI (mms, kakao_f, email만) */}
                    {canUploadImage && (
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-600 mb-2">이미지 첨부</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {isUploadingImage && <div className="text-xs text-blue-500 mt-1">업로드 중...</div>}
                        {imageUploadError && <div className="text-xs text-red-500 mt-1">{imageUploadError}</div>}
                        {/* 업로드된 이미지 미리보기 및 삭제 */}
                        {uploadedImages.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-2">
                            {uploadedImages.map((url) => (
                              <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                                <img src={url} alt="업로드 이미지" className="object-cover w-full h-full" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(url)}
                                  className="absolute top-0 right-0 bg-white bg-opacity-80 text-red-500 rounded-bl-lg px-1 py-0.5 text-xs font-bold hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={(e) => handleMessageInput(e.target.value)}
                      onDrop={(e) => {
                        e.preventDefault();
                        const variable = e.dataTransfer.getData('text/plain');
                        if (variable) {
                          // 드래그&드롭도 길이 제한 적용
                          const next = formData.content + `{{${variable}}}`;
                          handleMessageInput(next);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      disabled={isViewMode}
                      className={`w-full flex-1 px-4 py-3 border-2 ${formData.content ? 'border-blue-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm resize-none ${
                        isViewMode 
                          ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                          : 'bg-white/80 hover:border-blue-300'
                      }`}
                      placeholder="스크립트 내용을 입력하세요. 변수를 사용하려면 {{변수명}} 형식으로 입력하거나, 우측 변수를 드래그하여 추가하세요."
                      required
                    />
                    {messageLimitWarning && (
                      <div className="mt-2 text-sm text-red-500 font-bold">{messageLimitWarning}</div>
                    )}
                  </div>
                </div>

                {/* 우측: 개인화 변수 영역 */}
                <div className="flex flex-col h-full">
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-blue-100 p-6 flex flex-col h-full">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">🔧</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-700">개인화 변수</h4>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">선택 항목</span>
                    </div>
                    
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      {/* 변수 검색 - 자연스러운 디자인 */}
                      <div className="relative">
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={variableSearchTerm}
                              onChange={(e) => setVariableSearchTerm(e.target.value)}
                              disabled={isViewMode}
                              placeholder="변수명으로 검색하세요..."
                              className={`w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm ${
                                isViewMode 
                                  ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                                  : 'bg-white/80 hover:border-blue-300'
                              }`}
                              onKeyPress={(e) => e.key === 'Enter' && handleVariableSearch()}
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleVariableSearch}
                            disabled={isViewMode}
                            className={`px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-blue-500 rounded-xl hover:from-blue-600 hover:to-purple-700 hover:border-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                              isViewMode ? 'opacity-50 cursor-not-allowed transform-none' : ''
                            }`}
                          >
                            검색
                          </button>
                        </div>
                      </div>

                      {/* 사용 가능한 변수 목록 - 더 큰 공간 */}
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-blue-100 p-6">
                        <h5 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                          <span className="mr-2">📋</span>
                          사용 가능한 변수 (클릭 또는 드래그하여 추가)
                        </h5>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {availableVariables.map((variable) => (
                            <button
                              key={variable.code}
                              type="button"
                              onClick={() => insertVariable(variable.code)}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', variable.code);
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              draggable={!isViewMode}
                              disabled={isViewMode}
                              className={`text-left p-2 text-sm border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                                isViewMode ? 'opacity-50 cursor-not-allowed' : 'bg-white/80'
                              }`}
                            >
                              <div className="font-bold text-blue-600 text-xs mb-1 truncate">{`{{${variable.code}}}`}</div>
                              <div className="text-xs text-gray-500 truncate">{variable.name}</div>
                            </button>
                          ))}
                        </div>
                        
                        {/* 페이지네이션 - 더 깔끔한 디자인 */}
                        {variableTotalPages > 1 && (
                          <div className="flex justify-center items-center space-x-2 pt-4 border-t border-blue-200">
                            <button
                              type="button"
                              onClick={() => handleVariablePageChange(variablePage - 1)}
                              disabled={variablePage <= 1}
                              className="px-3 py-2 text-sm font-bold text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg hover:from-gray-100 hover:to-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ← 이전
                            </button>
                            <span className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-200 rounded-lg">
                              {variablePage} / {variableTotalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleVariablePageChange(variablePage + 1)}
                              disabled={variablePage >= variableTotalPages}
                              className="px-3 py-2 text-sm font-bold text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg hover:from-gray-100 hover:to-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              다음 →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 선택된 변수 목록 - 더 명확한 표시 */}
                      <div className="bg-gradient-to-br from-green-50 to-blue-50/30 rounded-xl border border-green-100 p-6">
                        <h5 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                          <span className="mr-2">✅</span>
                          선택된 변수 (메시지에서 자동 추출됨)
                        </h5>
                        <div className="flex flex-wrap gap-3">
                          {formData.variables.map((variable) => (
                            <span
                              key={variable}
                              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-green-100 to-blue-100 text-green-700 border-2 border-green-200 shadow-sm"
                            >
                              <span className="mr-2">🔗</span>
                              {`{{${variable}}}`}
                              <button
                                type="button"
                                onClick={() => removeVariable(variable)}
                                disabled={isViewMode}
                                className={`ml-3 text-green-600 hover:text-green-800 transition-colors font-bold ${
                                  isViewMode ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {formData.variables.length === 0 && (
                            <div className="flex items-center text-sm text-gray-500 italic">
                              <span className="mr-2">💡</span>
                              메시지에 변수를 추가하면 여기에 표시됩니다.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 미리보기 영역 */}
            <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl shadow-xl border border-orange-100/50 p-8 hover:shadow-2xl transition-all duration-300 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👁️</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">미리보기</h3>
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full font-medium">확인</span>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/80 rounded-xl border border-orange-200">
                    <div className="text-sm font-bold text-gray-700 mb-2">스크립트 정보</div>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">이름:</span> {formData.name || '미입력'}</div>
                      <div><span className="font-medium">타입:</span> {channelTypes.find(c => c.type === formData.type)?.label || formData.type || '미선택'}</div>
                      {formData.description && <div><span className="font-medium">설명:</span> {formData.description}</div>}
                      {formData.subject && <div><span className="font-medium">제목:</span> {formData.subject}</div>}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/80 rounded-xl border border-orange-200">
                    <div className="text-sm font-bold text-gray-700 mb-2">메시지 미리보기</div>
                    <div className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg border border-orange-200 max-h-32 overflow-y-auto">
                      {generatePreview() || '내용이 입력되지 않았습니다.'}
                    </div>
                  </div>
                </div>
                
                {/* 미리보기 버튼 */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsChannelPreviewOpen(true)}
                    disabled={isViewMode}
                    className={`px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 border-2 border-orange-500 rounded-xl hover:from-orange-600 hover:to-red-700 hover:border-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                      isViewMode ? 'opacity-50 cursor-not-allowed transform-none' : ''
                    }`}
                  >
                    채널별 미리보기
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTestSendModalOpen(true)}
                    disabled={isViewMode}
                    className={`px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-500 rounded-xl hover:from-green-600 hover:to-green-700 hover:border-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                      isViewMode ? 'opacity-50 cursor-not-allowed transform-none' : ''
                    }`}
                  >
                    테스트 발송
                  </button>
                </div>
              </div>
            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/scripts')}
                className="px-8 py-4 text-sm font-bold text-red-600 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl hover:from-red-100 hover:to-red-200 hover:border-red-300 hover:text-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {isViewMode ? '목록으로' : '취소'}
              </button>

              {!isViewMode && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-500 rounded-xl hover:from-green-600 hover:to-green-700 hover:border-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                >
                  {isSubmitting ? (isEditMode ? '🚀 수정 중...' : '🚀 생성 중...') : (isEditMode ? '🚀 스크립트 수정' : '🚀 스크립트 생성')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* 테스트 발송 모달 */}
      {isTestSendModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-96 max-w-[90vw]">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📱</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                테스트 발송
              </h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                  <span className="text-red-500 mr-2">*</span>
                  핸드폰 번호
                </label>
                <input
                  type="text"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-blue-100 p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3">발송될 메시지</h4>
                <div className="text-sm whitespace-pre-wrap bg-white/80 rounded-lg p-3 border border-blue-200">
                  {generatePreview()}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setIsTestSendModalOpen(false);
                  setTestPhoneNumber('');
                }}
                className="px-6 py-3 text-sm font-bold text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all duration-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleTestSend}
                disabled={isTestSending}
                className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-blue-500 rounded-xl hover:from-blue-600 hover:to-purple-700 hover:border-blue-600 transition-all duration-200 disabled:opacity-50"
              >
                {isTestSending ? '발송 중...' : '발송'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 컴포넌트 */}
      <ToastContainer />
    </Layout>
  );
} 