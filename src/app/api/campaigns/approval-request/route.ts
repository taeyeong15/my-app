import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { dbLogger } from '@/lib/logger';

// POST: 캠페인 승인 요청
export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const body = await request.json();
    const {
      campaign_id,
      requester_id,
      approver_id,
      request_message
    } = body;

    // 필수 파라미터 검증
    if (!campaign_id || !requester_id || !approver_id) {
      throw new Error('필수 파라미터가 누락되었습니다. (campaign_id, requester_id, approver_id)');
    }

    // 1. 이미 승인 요청이 있는지 확인
    const [existingRows] = await connection.execute(`
      SELECT id FROM campaign_approval_requests 
      WHERE campaign_id = ? AND status = 'PENDING'
    `, [campaign_id]);

    if ((existingRows as any[]).length > 0) {
      throw new Error('이미 승인 요청 중인 캠페인입니다.');
    }

    // 2. 승인 요청 생성 (request_message가 null일 수 있으므로 명시적 처리)
    const [result] = await connection.execute(`
      INSERT INTO campaign_approval_requests (
        campaign_id, requester_id, approver_id, request_message, status
      ) VALUES (?, ?, ?, ?, 'PENDING')
    `, [campaign_id, requester_id, approver_id, request_message || null]);

    // 3. 캠페인 상태를 PENDING_APPROVAL로 변경
    await connection.execute(`
      UPDATE campaigns 
      SET status = 'PENDING_APPROVAL', updated_at = NOW()
      WHERE id = ?
    `, [campaign_id]);

    await connection.commit();

    const requestId = (result as any).insertId;

    await dbLogger.info('캠페인 승인 요청', { 
      approval_request_id: requestId,
      campaign_id,
      requester_id,
      approver_id 
    });

    return NextResponse.json({
      success: true,
      message: '캠페인 승인 요청이 전송되었습니다.',
      id: requestId
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('캠페인 승인 요청 오류:', error);
    await dbLogger.error('캠페인 승인 요청 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: error.message || '캠페인 승인 요청에 실패했습니다.'
    }, { status: 500 });
  } finally {
    connection.release();
  }
}

// PUT: 승인 요청 처리 (승인/거부)
export async function PUT(request: NextRequest) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const body = await request.json();
    const {
      id,
      status, // 'approved' or 'rejected'
      response_message,
      approver_email
    } = body;

    // 필수 파라미터 검증
    if (!id || !status) {
      throw new Error('필수 파라미터가 누락되었습니다. (id, status)');
    }

    // 1. 승인 요청 정보 조회
    const [requestRows] = await connection.execute(`
      SELECT 
        car.campaign_id,
        c.name as campaign_name,
        c.status as current_status
      FROM campaign_approval_requests car
      JOIN campaigns c ON car.campaign_id = c.id
      WHERE car.id = ?
    `, [id]);

    if ((requestRows as any[]).length === 0) {
      throw new Error('승인 요청을 찾을 수 없습니다.');
    }

    const campaign_id = (requestRows as any[])[0].campaign_id;
    const campaign_name = (requestRows as any[])[0].campaign_name;
    const current_status = (requestRows as any[])[0].current_status;

    // 2. 승인 요청 상태 업데이트
    await connection.execute(`
      UPDATE campaign_approval_requests 
      SET 
        status = ?,
        approval_comment = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [status.toUpperCase(), response_message || null, id]);

    // 3. 캠페인 상태 업데이트
    const newCampaignStatus = status === 'approved' ? 'APPROVED' : 'REJECTED';
    await connection.execute(`
      UPDATE campaigns 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `, [newCampaignStatus, campaign_id]);

    // 4. 캠페인 이력 저장
    await connection.execute(`
      INSERT INTO campaign_history (
        campaign_id, action_type, action_by, previous_status, new_status, comments
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      campaign_id,
      status === 'approved' ? 'approved' : 'rejected',
      approver_email || 'unknown',
      current_status,
      newCampaignStatus,
      `캠페인 "${campaign_name}" ${status === 'approved' ? '승인' : '거부'}: ${response_message || ''}`
    ]);

    await connection.commit();

    await dbLogger.info('캠페인 승인 처리', { 
      approval_request_id: id,
      campaign_id,
      status,
      approver_email 
    });

    return NextResponse.json({
      success: true,
      message: `캠페인이 ${status === 'approved' ? '승인' : '거부'}되었습니다.`
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('캠페인 승인 처리 오류:', error);
    await dbLogger.error('캠페인 승인 처리 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '승인 처리에 실패했습니다.',
      details: error.message
    }, { status: 500 });
  } finally {
    connection.release();
  }
} 