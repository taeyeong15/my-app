import { NextRequest, NextResponse } from 'next/server';
import { dbLogger } from '@/lib/logger';
import { pool } from '@/lib/database';

// GET: 개별 캠페인 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = parseInt(params.id);

    // 1. 기본 캠페인 정보 조회
    const [rows] = await pool.execute(`
      SELECT 
        c.id, 
        c.name, 
        c.type, 
        c.type as type_name,
        c.description, 
        c.status, 
        c.status as status_name,
        c.start_date, 
        c.end_date, 
        c.budget, 
        c.spent, 
        c.impressions, 
        c.clicks, 
        c.conversions, 
        c.target_audience, 
        c.channels, 
        c.created_by, 
        c.created_at, 
        c.updated_at 
      FROM campaigns c
      WHERE c.id = ?
    `, [campaignId]);

    const campaigns = rows as any[];
    
    if (campaigns.length === 0) {
      return NextResponse.json({
        success: false,
        error: '캠페인을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const campaign = campaigns[0];
    
    // 2. 관련 데이터 조회
    const [customerGroupRows] = await pool.execute(`
      SELECT B.customer_group_id 
      FROM customer_groups A
      INNER JOIN campaign_customer_groups B ON A.id = B.customer_group_id
      WHERE B.campaign_id = ?
    `, [campaignId]);

    const [offerRows] = await pool.execute(`
      SELECT offer_id 
      FROM campaign_offers 
      WHERE campaign_id = ?
    `, [campaignId]);

    const [scriptRows] = await pool.execute(`
      SELECT script_id 
      FROM campaign_scripts 
      WHERE campaign_id = ?
    `, [campaignId]);

    // 3. 데이터 조합
    const target_customer_groups = (customerGroupRows as any[]).length > 0 
      ? (customerGroupRows as any[])[0].customer_group_id 
      : 0;
    
    const offers = (offerRows as any[]).length > 0 
      ? (offerRows as any[])[0].offer_id 
      : 0;
    
    const scripts = (scriptRows as any[]).length > 0 
      ? (scriptRows as any[])[0].script_id 
      : 0;

    const channels = campaign.channels || '';

    const formattedCampaign = {
      ...campaign,
      target_customer_groups,
      channels,
      offers,
      scripts,
      // 날짜 포맷 정리
      start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
      end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : ''
    };

    await dbLogger.info('캠페인 상세 조회', { campaign_id: campaignId });

    return NextResponse.json({
      success: true,
      campaign: formattedCampaign
    });

  } catch (error: any) {
    console.error('캠페인 조회 오류:', error);
    await dbLogger.error('캠페인 조회 오류', { 
      campaign_id: params.id,
      error: error.message 
    });
    
    return NextResponse.json({
      success: false,
      error: '캠페인을 불러오는데 실패했습니다.'
    }, { status: 500 });
  }
}

// PUT: 캠페인 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const campaignId = parseInt(params.id);
    const body = await request.json();
    
    const {
      name,
      type,
      description,
      status,
      start_date,
      end_date,
      budget,
      target_customer_groups,
      channels,
      offers,
      scripts,
      target_audience,
      updated_by
    } = body;

    // 기존 캠페인 정보 조회 (상태 변경 확인용)
    const [existingCampaign] = await connection.execute(`
      SELECT status, name FROM campaigns WHERE id = ?
    `, [campaignId]);

    if (!existingCampaign || (existingCampaign as any[]).length === 0) {
      throw new Error('해당 캠페인을 찾을 수 없습니다.');
    }

    const oldStatus = (existingCampaign as any[])[0].status;
    const campaignName = (existingCampaign as any[])[0].name;

    // 1. campaigns 테이블 기본 정보 수정
    const [result] = await connection.execute(`
      UPDATE campaigns 
      SET 
        name = ?, type = ?, description = ?, status = ?,
        start_date = ?, end_date = ?, budget = ?,
        channels = ?, target_audience = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      name, type, description, status, 
      start_date || null, end_date || null, budget,
      channels || null,
      target_audience, campaignId
    ]);

    if ((result as any).affectedRows === 0) {
      throw new Error('해당 캠페인을 찾을 수 없습니다.');
    }

    // 2. 기존 관계 데이터 삭제
    await connection.execute(`DELETE FROM campaign_customer_groups WHERE campaign_id = ?`, [campaignId]);
    await connection.execute(`DELETE FROM campaign_offers WHERE campaign_id = ?`, [campaignId]);
    await connection.execute(`DELETE FROM campaign_scripts WHERE campaign_id = ?`, [campaignId]);
    await connection.execute(`
      UPDATE customer_groups AS A
      , (SELECT customer_group_id FROM campaign_customer_groups WHERE campaign_id = ?) B
      SET A.use_yn = 'N' 
      WHERE 1=1
      AND A.id = B.customer_group_id
    `, [campaignId]);
    

    // 3. 새로운 관계 데이터 저장
    if (target_customer_groups) {
      await connection.execute(`
        INSERT INTO campaign_customer_groups (campaign_id, customer_group_id) 
        VALUES (?, ?)
      `, [campaignId, target_customer_groups]);
    }

    if (offers) {
      await connection.execute(`
        INSERT INTO campaign_offers (campaign_id, offer_id) 
        VALUES (?, ?)
      `, [campaignId, offers]);
    }

    if (scripts) {
      await connection.execute(`
        INSERT INTO campaign_scripts (campaign_id, script_id) 
        VALUES (?, ?)
      `, [campaignId, scripts]);
    }

    if (target_customer_groups) {
      await connection.execute(`
        UPDATE customer_groups SET use_yn = 'Y' WHERE id = ?
      `, [target_customer_groups]);
    }

    // 4. 상태가 변경된 경우 히스토리 저장
    if (oldStatus !== status) {
      const getStatusDescription = (statusCode: string) => {
        const statusMap: { [key: string]: string } = {
          'DRAFT': '임시저장',
          'PLANNING': '계획 단계',
          'DESIGN_COMPLETE': '설계 완료',
          'APPROVAL_PENDING': '승인 대기',
          'APPROVED': '승인 완료',
          'REJECTED': '반려',
          'EDITING': '수정 중',
          'READY': '실행 준비',
          'RUNNING': '실행 중',
          'PAUSED': '일시 정지',
          'COMPLETED': '완료',
          'CANCELLED': '취소'
        };
        return statusMap[statusCode] || statusCode;
      };

      const getActionType = (oldStatus: string, newStatus: string) => {
        if (newStatus === 'APPROVED') return 'approved';
        if (newStatus === 'REJECTED') return 'rejected';
        if (newStatus === 'RUNNING') return 'started';
        if (newStatus === 'PAUSED') return 'paused';
        if (newStatus === 'COMPLETED') return 'completed';
        if (newStatus === 'CANCELLED') return 'cancelled';
        return 'updated';
      };

      await connection.execute(`
        INSERT INTO campaign_history (
          campaign_id, action_type, action_by, previous_status, new_status, comments
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        campaignId,
        getActionType(oldStatus, status),
        updated_by || 'unknown',
        oldStatus,
        status,
        `캠페인 "${campaignName}" 상태 변경: ${getStatusDescription(oldStatus)} → ${getStatusDescription(status)}`
      ]);
    }

    await connection.commit();

    await dbLogger.info('캠페인 수정', { 
      campaign_id: campaignId,
      name,
      updated_by 
    });

    return NextResponse.json({
      success: true,
      message: '캠페인이 성공적으로 수정되었습니다.'
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('캠페인 수정 오류:', error);
    await dbLogger.error('캠페인 수정 오류', { 
      campaign_id: params.id,
      error: error.message 
    });
    
    return NextResponse.json({
      success: false,
      error: '캠페인 수정에 실패했습니다.',
      details: error.message
    }, { status: 500 });
  } finally {
    connection.release();
  }
}

// DELETE: 캠페인 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const campaignId = parseInt(params.id);

    // 캠페인 상태 확인 (삭제 가능한 상태인지 체크)
    const [campaignRows] = await connection.execute(`
      SELECT status, name, created_by FROM campaigns WHERE id = ?
    `, [campaignId]);

    if (!campaignRows || (campaignRows as any[]).length === 0) {
      throw new Error('캠페인을 찾을 수 없습니다.');
    }

    const campaign = (campaignRows as any[])[0];
    const campaignStatus = campaign.status;
    const campaignName = campaign.name;
    const createdBy = campaign.created_by;
    const deletableStatuses = ['DRAFT', 'PLANNING', 'REJECTED'];

    if (!deletableStatuses.includes(campaignStatus)) {
      throw new Error('현재 상태에서는 캠페인을 삭제할 수 없습니다.');
    }

    // 삭제 이력 저장 (실제 삭제 전에 저장)
    await connection.execute(`
      INSERT INTO campaign_history (
        campaign_id, action_type, action_by, previous_status, new_status, comments
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      campaignId,
      'deleted',
      createdBy || 'unknown',
      campaignStatus,
      'DELETED',
      `캠페인 "${campaignName}" 삭제됨`
    ]);

    // 관련 테이블 데이터 삭제 (외래키 제약조건으로 자동 삭제되지만 명시적으로 처리)
    await connection.execute(`
      DELETE FROM campaign_scripts WHERE campaign_id = ?
    `, [campaignId]);

    await connection.execute(`
      DELETE FROM campaign_offers WHERE campaign_id = ?
    `, [campaignId]);

    await connection.execute(`
      DELETE FROM campaign_customer_groups WHERE campaign_id = ?
    `, [campaignId]);

    await connection.execute(`
      DELETE FROM campaign_approval_requests WHERE campaign_id = ?
    `, [campaignId]);

    // 캠페인 삭제
    await connection.execute(`
      DELETE FROM campaigns WHERE id = ?
    `, [campaignId]);

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: '캠페인이 성공적으로 삭제되었습니다.'
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('캠페인 삭제 실패:', error);
    
    return NextResponse.json({
      success: false,
      message: '캠페인 삭제 중 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 });
  } finally {
    connection.release();
  }
} 