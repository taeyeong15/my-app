'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useToast } from '@/components/Toast';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface CustomerGroup {
  id: number;
  name: string;
  description: string;
  estimated_count: number;
  actual_count: number;
}

interface Offer {
  id: number;
  name: string;
  type: string;
  description: string;
  value: number;
  value_type: string;
}

interface Script {
  id: number;
  name: string;
  type: string;
  description: string;
  content: string;
}

interface Channel {
  code: string;
  name: string;
}

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CampaignFormData {
  name: string;
  type: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: string;
  target_customer_groups: number;
  channels: string;
  offers: number;
  scripts: number;
  target_audience: string;
  status: string;
}

// SearchParams를 사용하는 내부 컴포넌트
function NewCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('id'); // URL에서 캠페인 ID 가져오기
  const mode = searchParams.get('mode'); // 'view' 모드 확인
  const isEditMode = !!campaignId;
  const isViewMode = mode === 'view'; // 상세보기 모드

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 페이징 상태 추가
  const [customerGroupsPage, setCustomerGroupsPage] = useState(1);
  const [offersPage, setOffersPage] = useState(1);
  const [scriptsPage, setScriptsPage] = useState(1);
  const itemsPerPage = 6; // 두 줄(3*2)
  
  // 검색 상태 추가
  const [customerGroupsFilter, setCustomerGroupsFilter] = useState('');
  const [offersFilter, setOffersFilter] = useState('');
  const [scriptsFilter, setScriptsFilter] = useState('');
  
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [campaignTypes, setCampaignTypes] = useState<any[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('normal');
  const [approvalMessage, setApprovalMessage] = useState('');

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
    target_customer_groups: 0,  // 초기값을 0으로 변경
    channels: '',
    offers: 0,  // 초기값을 0으로 변경
    scripts: 0,  // 초기값을 0으로 변경
    target_audience: '',
    status: 'PLANNING'
  });

  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    const initializePage = async () => {
      try {
        // 사용자 인증 확인
        const loggedInUser = sessionStorage.getItem('currentUser');
        if (!loggedInUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(loggedInUser);
        setUser(userData);

        // 기본 데이터 로드
        await loadInitialData();

        // 수정 모드인 경우 기존 캠페인 데이터 로드
        if (isEditMode && campaignId) {
          await loadCampaignData(campaignId);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('페이지 초기화 실패:', error);
        router.push('/login');
      }
    };
    
    initializePage();
  }, [router, isEditMode, campaignId]);

  // 메뉴에서 캠페인 생성을 클릭했을 때 폼 리셋을 위한 useEffect 추가
  useEffect(() => {
    const resetParam = searchParams.get('reset');
    if (resetParam === 'true' && !isEditMode) {
      // 폼 데이터를 초기값으로 리셋
      setFormData({
        name: '',
        type: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: '',
        target_customer_groups: 0,
        channels: '',
        offers: 0,
        scripts: 0,
        target_audience: '',
        status: 'PLANNING'
      });

      // 페이지 상태도 초기화
      setCustomerGroupsPage(1);
      setOffersPage(1);
      setScriptsPage(1);
      setCustomerGroupsFilter('');
      setOffersFilter('');
      setScriptsFilter('');

      // URL에서 reset 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('reset');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, isEditMode]);

  const loadInitialData = async () => {
    try {
      // 모든 필요한 데이터를 병렬로 로드
      const [
        customerGroupsRes,
        offersRes,
        scriptsRes,
        channelsRes,
        typesRes,
        adminsRes,
        prioritiesRes
      ] = await Promise.all([
        fetch('/api/customer-groups'),
        fetch('/api/offers'),
        fetch('/api/scripts/simple'),
        fetch('/api/channels/simple'),
        fetch('/api/common-codes?category=CAMPAIGN&sub_category=TYPE'),
        fetch('/api/campaigns/admins'),
        fetch('/api/common-codes?category=CAMPAIGN&sub_category=PRIORITY')
      ]);

      const [
        customerGroupsData,
        offersData,
        scriptsData,
        channelsData,
        typesData,
        adminsData,
        prioritiesData
      ] = await Promise.all([
        customerGroupsRes.json(),
        offersRes.json(),
        scriptsRes.json(),
        channelsRes.json(),
        typesRes.json(),
        adminsRes.json(),
        prioritiesRes.json()
      ]);

      if (customerGroupsData.success) {
        setCustomerGroups(customerGroupsData.groups || []);
      }

      if (offersData.success) {
        setOffers(offersData.offers || []);
      }

      if (scriptsData.success) {
        setScripts(scriptsData.data || []);
      } else {
        console.error('스크립트 API 오류:', scriptsData.error);
        // API 오류시 빈 배열로 설정
        setScripts([]);
      }

      if (channelsData.success) {        
        // 중복 제거를 위해 code를 기준으로 유니크한 데이터만 설정
        const uniqueChannels = (channelsData.channels || []).reduce((acc: Channel[], current: Channel) => {
          const existingChannel = acc.find(item => item.code === current.code);
          if (!existingChannel) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        setChannels(uniqueChannels);
      } else {
        console.error('채널 API 오류:', channelsData.error);
        // API 오류시 기본 채널 데이터 사용
        setChannels([
          { code: 'email', name: '이메일' },
          { code: 'sms', name: 'SMS' },
          { code: 'push', name: '푸시' },
          { code: 'kakao', name: '카카오톡' }
        ]);
      }

      if (typesData.success) {
        setCampaignTypes(typesData.codes || []);
      }

      if (adminsData.success) {
        setAdmins(adminsData.admins || []);
      }

      if (prioritiesData.success) {
        setPriorities(prioritiesData.codes || []);
      }
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
    }
  };

  const loadCampaignData = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`);
      const data = await response.json();

      if (data.success && data.campaign) {
        const campaign = data.campaign;
        setFormData({
          name: campaign.name || '',
          type: campaign.type || '',
          description: campaign.description || '',
          start_date: campaign.start_date || '',
          end_date: campaign.end_date || '',
          budget: campaign.budget?.toString() || '',
          target_customer_groups: campaign.target_customer_groups || 0,
          channels: campaign.channels || '',
          offers: campaign.offers || 0,
          scripts: campaign.scripts || 0,
          target_audience: campaign.target_audience || '',
          status: campaign.status || 'PLANNING'
        });
      }
    } catch (error) {
      console.error('캠페인 데이터 로드 실패:', error);
      alert('캠페인 데이터를 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 임시저장이 아닌 경우에만 필수 필드 검증
      if (!isDraft) {
        const missingFields = [];
        
        // 필수 항목 검증
        if (!formData.name) missingFields.push('캠페인명');
        if (!formData.type) missingFields.push('캠페인 유형');
        if (!formData.start_date) missingFields.push('시작일');
        if (!formData.end_date) missingFields.push('종료일');
        if (!formData.budget) missingFields.push('예산');
        if (!formData.channels) missingFields.push('발송 채널');
        if (!formData.target_customer_groups) missingFields.push('대상 고객군');
        if (!formData.scripts) missingFields.push('스크립트');

        if (missingFields.length > 0) {
          showToast(`다음 필수 항목을 입력해주세요:\n• ${missingFields.join('\n• ')}`, 'error');
          setIsSaving(false);
          return;
        }

        // 날짜 검증
        if (new Date(formData.start_date) >= new Date(formData.end_date)) {
          showToast('종료일은 시작일보다 늦어야 합니다.', 'error');
          setIsSaving(false);
          return;
        }

        // 예산 검증
        const budget = parseFloat(formData.budget);
        if (isNaN(budget) || budget <= 0) {
          showToast('예산은 0보다 큰 숫자여야 합니다.', 'error');
          setIsSaving(false);
          return;
        }
      }

      // API 요청 데이터 준비
      const requestData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        created_by: user?.email || 'unknown',
        updated_by: user?.email || 'unknown',
        is_draft: isDraft
      };

      const url = isEditMode ? `/api/campaigns/${campaignId}` : '/api/campaigns';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        const message = isDraft 
          ? '캠페인이 임시저장되었습니다!' 
          : isEditMode 
            ? '캠페인이 성공적으로 수정되었습니다!' 
            : '캠페인이 성공적으로 생성되었습니다!';
        showToast(message, 'success');
        router.push('/campaigns');
      } else {
        throw new Error(data.error || data.details || '요청 처리 실패');
      }
    } catch (error: any) {
      console.error('캠페인 저장 오류:', error);
      showToast('캠페인 저장 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraftSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleSubmit(e as any, true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 단일 선택 핸들러로 변경
  const handleSingleSelectChange = (field: keyof CampaignFormData, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 채널 단일 선택 핸들러
  const handleChannelChange = (channelCode: string) => {
    setFormData(prev => ({
      ...prev,
      channels: channelCode
    }));
  };

  // 상태별 버튼 표시 여부 결정 (상세보기 모드에서는 모든 버튼 숨김)
  // 임시저장: 임시저장(DRAFT), 계획(PLANNING) 상태일 때만 사용 가능
  const canShowDraftSave = !isViewMode && (!isEditMode || ['DRAFT', 'PLANNING'].includes(formData.status));
  
  // 승인요청: 임시저장(DRAFT), 계획(PLANNING), 설계완료(DESIGN_COMPLETE), 수정(EDITING) 상태일 때만 사용 가능
  const canShowApprovalRequest = !isViewMode && (!isEditMode || ['DRAFT', 'PLANNING', 'DESIGN_COMPLETE', 'EDITING'].includes(formData.status));
  
  // 삭제: 임시저장(DRAFT), 계획(PLANNING), 반려(REJECTED) 상태일 때만 사용 가능
  const canShowDelete = !isViewMode && isEditMode && ['DRAFT', 'PLANNING', 'REJECTED'].includes(formData.status);
  
  // 저장(수정): 수정(EDITING) 상태일 때만 사용 가능 (또는 신규 생성)
  const canShowSave = !isViewMode && (formData.status === 'EDITING');

  const handleApprovalRequest = () => {
    // 필수 항목 검증을 먼저 수행
    const missingFields = [];
    if (!formData.name) missingFields.push('캠페인명');
    if (!formData.type) missingFields.push('캠페인 유형');
    if (!formData.start_date) missingFields.push('시작일');
    if (!formData.end_date) missingFields.push('종료일');
    if (!formData.budget) missingFields.push('예산');
    if (!formData.channels) missingFields.push('발송 채널');
    if (!formData.target_customer_groups) missingFields.push('대상 고객군');
    if (!formData.scripts) missingFields.push('스크립트');

    if (missingFields.length > 0) {
      showToast(`승인 요청을 위해 다음 필수 항목을 입력해주세요:\n• ${missingFields.join('\n• ')}`, 'warning');
      return;
    }

    // 날짜 검증
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      showToast('종료일은 시작일보다 늦어야 합니다.', 'error');
      return;
    }

    // 예산 검증
    const budget = parseFloat(formData.budget);
    if (isNaN(budget) || budget <= 0) {
      showToast('예산은 0보다 큰 숫자여야 합니다.', 'error');
      return;
    }

    // 필수 항목이 모두 충족되면 승인 요청 모달 열기
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedAdmin || !approvalMessage.trim()) {
      showToast('승인자를 선택하고 승인 요청 메시지를 입력해주세요.', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      
      // 먼저 캠페인을 저장 (승인 요청 전)
      const saveResponse = await fetch(isEditMode ? `/api/campaigns/${campaignId}` : '/api/campaigns', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : 0,
          created_by: user?.email || 'unknown',
          updated_by: user?.email || 'unknown',
          is_draft: false
        }),
      });

      const saveData = await saveResponse.json();
      
      if (!saveData.success) {
        throw new Error(saveData.error || '캠페인 저장에 실패했습니다.');
      }

      const targetCampaignId = isEditMode ? campaignId : saveData.id;

      // 승인 요청 전송
      const approvalResponse = await fetch('/api/campaigns/approval-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: targetCampaignId,
          requester_id: user?.id,
          approver_id: selectedAdmin,
          request_message: approvalMessage,
          priority: selectedPriority
        }),
      });

      const approvalData = await approvalResponse.json();

      if (approvalData.success) {
        showToast('캠페인 승인 요청이 성공적으로 전송되었습니다!', 'success');
        setShowApprovalModal(false);
        router.push('/campaigns');
      } else {
        throw new Error(approvalData.error || '승인 요청에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('승인 요청 오류:', error);
      showToast('승인 요청 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignId) {
      showToast('삭제할 캠페인을 찾을 수 없습니다.', 'error');
      return;
    }

    if (!confirm('정말로 이 캠페인을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        showToast('캠페인이 성공적으로 삭제되었습니다.', 'success');
        router.push('/campaigns');
      } else {
        throw new Error(data.error || '캠페인 삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('캠페인 삭제 오류:', error);
      showToast('캠페인 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 채널별 스크립트 필터링 (단일 채널 기준)
  const getFilteredScripts = () => {
    return scripts.filter(script => {
      // 채널이 선택되지 않은 경우 스크립트를 보여주지 않음
      if (!formData.channels) {
        return false;
      }
      
      // 선택된 채널에 해당하는 스크립트만 표시
      const channelMatch = script.type === formData.channels;
      
      // 검색 필터 적용
      const searchMatch = !scriptsFilter || 
        script.name.toLowerCase().includes(scriptsFilter.toLowerCase()) ||
        script.description.toLowerCase().includes(scriptsFilter.toLowerCase());
      
      return channelMatch && searchMatch;
    });
  };

  // 고객군 필터링
  const getFilteredCustomerGroups = () => {
    return customerGroups.filter(group => {
      return !customerGroupsFilter || 
        group.name.toLowerCase().includes(customerGroupsFilter.toLowerCase()) ||
        group.description.toLowerCase().includes(customerGroupsFilter.toLowerCase());
    });
  };

  // 오퍼 필터링
  const getFilteredOffers = () => {
    return offers.filter(offer => {
      return !offersFilter || 
        offer.name.toLowerCase().includes(offersFilter.toLowerCase()) ||
        offer.description.toLowerCase().includes(offersFilter.toLowerCase());
    });
  };

  // 페이지네이션 헬퍼
  const getPaginatedItems = (items: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (itemsLength: number) => {
    return Math.ceil(itemsLength / itemsPerPage);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isEditMode ? '캠페인 데이터를 불러오는 중...' : '페이지를 로드하는 중...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title={isEditMode ? "캠페인 수정" : "캠페인 생성"} 
      subtitle={isEditMode ? "기존 캠페인을 수정할 수 있습니다." : "새로운 마케팅 캠페인을 생성하고 설정하세요."}
    >
      <div className="p-6">
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-10">
          {/* 기본 정보 - 예산 및 기간 포함 */}
          <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-lg border border-indigo-100/50 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📋</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">기본 정보</h3>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">필수 항목 포함</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 첫 번째 열 */}
              <div className="space-y-6">
                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                    <span className="text-red-500 mr-1">*</span>
                    캠페인명
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    required
                    className={`w-full px-4 py-3 border-2 ${formData.name ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                      isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-indigo-300'
                    }`}
                    placeholder="캠페인 이름을 입력하세요"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                    <span className="text-red-500 mr-1">*</span>
                    캠페인 유형
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    required
                    className={`w-full px-4 py-3 border-2 ${formData.type ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                      isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-indigo-300'
                    }`}
                  >
                    <option value="">유형을 선택하세요</option>
                    {campaignTypes.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                      <span className="text-red-500 mr-1">*</span>
                      시작일
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      required
                      className={`w-full px-4 py-3 border-2 ${formData.start_date ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                        isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-indigo-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                      <span className="text-red-500 mr-1">*</span>
                      종료일
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      required
                      className={`w-full px-4 py-3 border-2 ${formData.end_date ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                        isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-indigo-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                    <span className="text-red-500 mr-1">*</span>
                    예산 (원)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    required
                    min="0"
                    step="1000"
                    className={`w-full px-4 py-3 border-2 ${formData.budget ? 'border-indigo-200' : 'border-red-200'} rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                      isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-indigo-300'
                    }`}
                    placeholder="예: 1,000,000"
                  />
                </div>
              </div>

              {/* 두 번째 열 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">캠페인 설명</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    rows={6}
                    className={`w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none ${
                      isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-indigo-300'
                    }`}
                    placeholder="캠페인의 목적과 내용을 상세히 설명해주세요..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    타겟 오디언스
                    <span className="text-xs text-gray-500 ml-2">(선택사항)</span>
                  </label>
                  <input
                    type="text"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                      isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-indigo-300'
                    }`}
                    placeholder="예: 20-40대 여성, 신규 가입자"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 발송 채널 선택 - 단일 선택으로 변경 */}
          <div className="bg-gradient-to-br from-white to-pink-50/30 rounded-2xl shadow-lg border border-pink-100/50 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📡</span>
              </div>
              <h3 className="flex items-center text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {/* <span className="text-red-500 mr-2">*</span> */}
                발송 채널 선택
              </h3>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">필수</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {channels.map((channel, index) => (
                <label key={`channel-${channel.code}-${index}`} className="cursor-pointer group">
                  <input
                    type="radio"
                    name="channels"
                    value={channel.code}
                    checked={formData.channels === channel.code}
                    onChange={(e) => handleChannelChange(e.target.value)}
                    disabled={isViewMode}
                    className="sr-only"
                  />
                  <div className={`relative p-6 border-2 rounded-2xl transition-all duration-300 text-center transform group-hover:scale-105 ${
                    formData.channels === channel.code
                      ? 'border-gradient-to-r from-pink-500 to-rose-500 bg-gradient-to-br from-pink-50 to-rose-50 shadow-lg ring-4 ring-pink-500/20' 
                      : (!formData.channels ? 'border-red-200 hover:border-pink-300 bg-white/70 backdrop-blur-sm hover:shadow-md' : 'border-gray-200 hover:border-pink-300 bg-white/70 backdrop-blur-sm hover:shadow-md')
                  } ${isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {formData.channels === channel.code && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    <span className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors">{channel.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 대상 고객군 선택 */}
          <div className="bg-gradient-to-br from-white to-teal-50/30 rounded-2xl shadow-lg border border-teal-100/50 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
              <h3 className="flex items-center text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {/* <span className="text-red-500 mr-2">*</span> */}
                대상 고객군 선정
              </h3>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">필수</span>
            </div>
            
            {/* 검색 필터 */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 고객군명 또는 설명으로 검색..."
                  value={customerGroupsFilter}
                  onChange={(e) => setCustomerGroupsFilter(e.target.value)}
                  disabled={isViewMode}
                  className={`w-full pl-4 pr-4 py-3 border-2 border-teal-200 rounded-xl focus:ring-3 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                    isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-teal-300'
                  }`}
                />
              </div>
            </div>
            
            {(() => {
              const filteredGroups = getFilteredCustomerGroups();
              const paginatedGroups = getPaginatedItems(filteredGroups, customerGroupsPage);
              const totalPages = getTotalPages(filteredGroups.length);
              
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedGroups.map((group) => (
                      <label key={group.id} className="cursor-pointer group">
                        <input
                          type="radio"
                          name="target_customer_groups"
                          checked={formData.target_customer_groups === group.id}
                          onChange={() => handleSingleSelectChange('target_customer_groups', group.id)}
                          disabled={isViewMode}
                          className="sr-only"
                        />
                        <div className={`relative p-6 border-2 rounded-2xl transition-all duration-300 transform group-hover:scale-105 ${
                          formData.target_customer_groups === group.id
                            ? 'border-gradient-to-r from-teal-500 to-cyan-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-lg ring-4 ring-teal-500/20' 
                            : (!formData.target_customer_groups ? 'border-red-200 hover:border-teal-300 bg-white/70 backdrop-blur-sm hover:shadow-md' : 'border-gray-200 hover:border-teal-300 bg-white/70 backdrop-blur-sm hover:shadow-md')
                        } ${isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          {formData.target_customer_groups === group.id && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">{group.name}</h4>
                              <p className="text-sm text-gray-600 mb-3 leading-relaxed">{group.description}</p>
                              <div className="flex justify-between text-xs text-gray-500 space-x-4">
                                <span className="bg-gradient-to-r from-teal-100 to-teal-200 px-2 py-1 rounded-full">예상: {group.estimated_count.toLocaleString()}명</span>
                                <span className="bg-gradient-to-r from-cyan-100 to-cyan-200 px-2 py-1 rounded-full">실제: {group.actual_count.toLocaleString()}명</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {/* 페이징 */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4 mt-8">
                      <button
                        type="button"
                        onClick={() => setCustomerGroupsPage(prev => Math.max(1, prev - 1))}
                        disabled={customerGroupsPage === 1 || isViewMode}
                        className="px-4 py-2 text-sm font-medium border-2 border-teal-200 text-teal-600 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← 이전
                      </button>
                      <span className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 rounded-xl">
                        {customerGroupsPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCustomerGroupsPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={customerGroupsPage === totalPages || isViewMode}
                        className="px-4 py-2 text-sm font-medium border-2 border-teal-200 text-teal-600 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음 →
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* 오퍼 선정 */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-blue-100/50 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🎁</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">오퍼 선정</h3>
            </div>
            
            {/* 검색 필터 */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 오퍼명 또는 설명으로 검색..."
                  value={offersFilter}
                  onChange={(e) => setOffersFilter(e.target.value)}
                  disabled={isViewMode}
                  className={`w-full pl-4 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                    isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-blue-300'
                  }`}
                />
              </div>
            </div>
            
            {(() => {
              const filteredOffers = getFilteredOffers();
              const paginatedOffers = getPaginatedItems(filteredOffers, offersPage);
              const totalPages = getTotalPages(filteredOffers.length);
              
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedOffers.map((offer) => (
                      <label key={offer.id} className="cursor-pointer group">
                        <input
                          type="radio"
                          name="offers"
                          checked={formData.offers === offer.id}
                          onChange={() => handleSingleSelectChange('offers', offer.id)}
                          disabled={isViewMode}
                          className="sr-only"
                        />
                        <div className={`relative p-6 border-2 rounded-2xl transition-all duration-300 transform group-hover:scale-105 ${
                          formData.offers === offer.id
                            ? 'border-gradient-to-r from-blue-500 to-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg ring-4 ring-blue-500/20' 
                            : 'border-gray-200 hover:border-blue-300 bg-white/70 backdrop-blur-sm hover:shadow-md'
                        } ${isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          {formData.offers === offer.id && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{offer.name}</h4>
                              <p className="text-sm text-gray-600 mb-3 leading-relaxed">{offer.description}</p>
                              <div className="flex items-center space-x-3">
                                <span className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-1 rounded-full font-medium">
                                  {offer.type}
                                </span>
                                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  {offer.value_type === 'percentage' ? `${offer.value}%` : `${offer.value.toLocaleString()}원`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {/* 페이징 */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4 mt-8">
                      <button
                        type="button"
                        onClick={() => setOffersPage(prev => Math.max(1, prev - 1))}
                        disabled={offersPage === 1 || isViewMode}
                        className="px-4 py-2 text-sm font-medium border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← 이전
                      </button>
                      <span className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-xl">
                        {offersPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOffersPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={offersPage === totalPages || isViewMode}
                        className="px-4 py-2 text-sm font-medium border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음 →
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* 스크립트 선택 */}
          <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-lg border border-emerald-100/50 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📝</span>
              </div>
              <h3 className="flex items-center text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {/* <span className="text-red-500 mr-2">*</span> */}
                스크립트 선택
              </h3>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">필수</span>
            </div>
            
            {/* 검색 필터 */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 스크립트명 또는 설명으로 검색..."
                  value={scriptsFilter}
                  onChange={(e) => setScriptsFilter(e.target.value)}
                  disabled={isViewMode}
                  className={`w-full pl-4 pr-4 py-3 border-2 border-green-200 rounded-xl focus:ring-3 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                    isViewMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-green-300'
                  }`}
                />
              </div>
            </div>
            
            {(() => {
              const filteredScripts = getFilteredScripts();
              const paginatedScripts = getPaginatedItems(filteredScripts, scriptsPage);
              const totalPages = getTotalPages(filteredScripts.length);
              
              // 채널이 선택되지 않은 경우 안내 메시지 표시
              if (!formData.channels) {
                return (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">📡</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">발송 채널을 먼저 선택해주세요</h4>
                    <p className="text-sm text-gray-500">채널을 선택하면 해당 채널에 맞는 스크립트가 표시됩니다.</p>
                  </div>
                );
              }
              
              // 필터링된 스크립트가 없는 경우
              if (filteredScripts.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">해당 채널의 스크립트가 없습니다</h4>
                    <p className="text-sm text-gray-500">
                      선택한 채널 ({channels.find(c => c.code === formData.channels)?.name})에 맞는 스크립트를 찾을 수 없습니다.
                    </p>
                  </div>
                );
              }
              
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedScripts.map((script) => (
                      <label key={script.id} className="cursor-pointer group">
                        <input
                          type="radio"
                          name="scripts"
                          checked={formData.scripts === script.id}
                          onChange={() => handleSingleSelectChange('scripts', script.id)}
                          disabled={isViewMode}
                          className="sr-only"
                        />
                        <div className={`relative p-6 border-2 rounded-2xl transition-all duration-300 transform group-hover:scale-105 ${
                          formData.scripts === script.id
                            ? 'border-gradient-to-r from-green-500 to-emerald-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-4 ring-green-500/20' 
                            : (!formData.scripts ? 'border-red-200 hover:border-green-300 bg-white/70 backdrop-blur-sm hover:shadow-md' : 'border-gray-200 hover:border-green-300 bg-white/70 backdrop-blur-sm hover:shadow-md')
                        } ${isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          {formData.scripts === script.id && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{script.name}</h4>
                              <p className="text-sm text-gray-600 mb-3 leading-relaxed">{script.description}</p>
                              <span className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-1 rounded-full font-medium">
                                {script.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {/* 페이징 */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4 mt-8">
                      <button
                        type="button"
                        onClick={() => setScriptsPage(prev => Math.max(1, prev - 1))}
                        disabled={scriptsPage === 1 || isViewMode}
                        className="px-4 py-2 text-sm font-medium border-2 border-green-200 text-green-600 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← 이전
                      </button>
                      <span className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl">
                        {scriptsPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setScriptsPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={scriptsPage === totalPages || isViewMode}
                        className="px-4 py-2 text-sm font-medium border-2 border-green-200 text-green-600 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음 →
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <Link
              href="/campaigns"
              className="px-8 py-4 text-sm font-bold text-red-600 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl hover:from-red-100 hover:to-red-200 hover:border-red-300 hover:text-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              ✕ 취소
            </Link>
            
            {/* 우측 정렬된 버튼 그룹 - 임시저장, 저장, 승인요청, 삭제 순서 */}
            <div className="flex space-x-4">
              {/* 1. 임시저장 버튼 */}
              {canShowDraftSave && (
                <button
                  type="button"
                  onClick={handleDraftSave}
                  disabled={isSaving}
                  className="px-8 py-4 text-sm font-bold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl hover:from-gray-100 hover:to-gray-200 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                >
                  {isSaving ? '💾 저장 중...' : '📝 임시저장'}
                </button>
              )}

              {/* 2. 저장 버튼 (신규 생성 또는 수정) */}
              {canShowSave && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-500 rounded-xl hover:from-blue-600 hover:to-blue-700 hover:border-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                >
                  {isSaving ? '💾 저장 중...' : isEditMode ? '💾 저장' : '🚀 캠페인 생성'}
                </button>
              )}

              {/* 3. 승인 요청 버튼 */}
              {canShowApprovalRequest && (
                <button
                  type="button"
                  onClick={handleApprovalRequest}
                  disabled={isSaving}
                  className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 border-2 border-green-500 rounded-xl hover:from-green-600 hover:to-emerald-700 hover:border-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                >
                  ✅ 승인 요청
                </button>
              )}

              {/* 4. 삭제 버튼 */}
              {canShowDelete && (
                <button
                  type="button"
                  onClick={handleDeleteCampaign}
                  disabled={isSaving}
                  className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 border-2 border-red-500 rounded-xl hover:from-red-600 hover:to-red-700 hover:border-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                >
                  🗑️ 삭제
                </button>
              )}
            </div>
          </div>
        </form>

        {/* 승인 요청 모달 */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">캠페인 승인 요청</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    승인자 선택 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedAdmin || ''}
                    onChange={(e) => setSelectedAdmin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">승인자를 선택하세요</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    우선순위 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {priorities.length > 0 ? (
                      priorities.map((priority) => (
                        <option key={priority.code} value={priority.code}>
                          {priority.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="urgent">긴급</option>
                        <option value="high">높음</option>
                        <option value="normal">보통</option>
                        <option value="low">낮음</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    승인 요청 메시지 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={approvalMessage}
                    onChange={(e) => setApprovalMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="승인 요청 사유를 입력해주세요..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedAdmin(null);
                    setSelectedPriority('normal');
                    setApprovalMessage('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApprovalSubmit}
                  disabled={isSaving || !selectedAdmin || !approvalMessage.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? '요청 중...' : '승인 요청'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </Layout>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function NewCampaignPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">페이지를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </Layout>
    }>
      <NewCampaignContent />
    </Suspense>
  );
} 