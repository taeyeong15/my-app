import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { dbLogger } from '@/lib/logger';

// GET: 승인대기 캠페인 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status') || 'PENDING';
  const offset = (page - 1) * limit;

  let connection;
  try {
    connection = await db.getConnection();

    // 총 개수 조회
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM campaign_approval_requests WHERE status = ?',
      [status]
    );
    const total = (countResult as any[])[0].total;

    // 데이터 조회 - campaign_approval_requests 테이블 기준
    const [rows] = await connection.execute(`
      SELECT 
        car.id,
        car.campaign_id,
        car.requester_id,
        car.approver_id,
        car.request_message,
        car.status as approval_status,
        car.approval_comment as response_message,
        car.created_at as request_date,
        car.updated_at as approval_date,
        c.name as campaign_name,
        c.type as campaign_type,
        c.description,
        c.budget,
        c.target_audience,
        c.start_date,
        c.end_date,
        c.status as campaign_status,
        CASE 
          WHEN c.type = 'email' THEN '이메일'
          WHEN c.type = 'sms' THEN 'SMS'
          WHEN c.type = 'push' THEN '푸시'
          WHEN c.type = 'kakao' THEN '카카오톡'
          WHEN c.type = 'mixed' THEN '통합'
          ELSE c.type
        END as type_label,
        'normal' as priority,
        '보통' as priority_label,
        COALESCE(u1.name, u1.email, 'unknown') as requester,
        COALESCE(u2.name, u2.email, 'N/A') as approver
      FROM campaign_approval_requests car
      LEFT JOIN campaigns c ON car.campaign_id = c.id
      LEFT JOIN users u1 ON car.requester_id = u1.id
      LEFT JOIN users u2 ON car.approver_id = u2.id
      WHERE car.status = ?
      ORDER BY car.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, [status]);

    await dbLogger.info('캠페인 승인대기 목록 조회', { 
      status, 
      page, 
      limit,
      total_count: total 
    });

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('승인대기 캠페인 조회 오류:', error);
    await dbLogger.error('승인대기 캠페인 조회 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '승인대기 캠페인 목록을 불러오는데 실패했습니다.'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// POST: 새 승인대기 캠페인 생성
export async function POST(request: NextRequest) {
  let connection;
  try {
    connection = await db.getConnection();
    const body = await request.json();
    const {
      campaign_id,
      requester_id,
      approver_id,
      request_message
    } = body;

    // 필수 파라미터 검증
    if (!campaign_id || !requester_id || !approver_id) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다. (campaign_id, requester_id, approver_id)'
      }, { status: 400 });
    }

    const [result] = await connection.execute(`
      INSERT INTO campaign_approval_requests (
        campaign_id, requester_id, approver_id, request_message, status, created_at
      ) VALUES (?, ?, ?, ?, 'PENDING', NOW())
    `, [
      campaign_id, 
      requester_id, 
      approver_id, 
      request_message || null
    ]);

    const insertId = (result as any).insertId;

    await dbLogger.info('새 승인대기 캠페인 생성', { 
      approval_request_id: insertId,
      campaign_id,
      requester_id 
    });

    return NextResponse.json({
      success: true,
      message: '승인 요청이 등록되었습니다.',
      id: insertId
    });

  } catch (error: any) {
    console.error('승인대기 캠페인 생성 오류:', error);
    await dbLogger.error('승인대기 캠페인 생성 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '승인 요청 등록에 실패했습니다.'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PUT: 승인대기 캠페인 승인/거부
export async function PUT(request: NextRequest) {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    const body = await request.json();
    const {
      id,
      status,
      approver_id,
      approval_comment
    } = body;

    // 필수 파라미터 검증
    if (!id || !status || !approver_id) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다. (id, status, approver_id)'
      }, { status: 400 });
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
      return NextResponse.json({
        success: false,
        error: '해당 승인 요청을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const campaign_id = (requestRows as any[])[0].campaign_id;
    const campaign_name = (requestRows as any[])[0].campaign_name;
    const current_status = (requestRows as any[])[0].current_status;

    // 2. 승인 요청 상태 업데이트
    const [result] = await connection.execute(`
      UPDATE campaign_approval_requests 
      SET 
        status = ?,
        approver_id = ?,
        approval_comment = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [status, approver_id, approval_comment || null, id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 승인 요청을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 3. 캠페인 상태 업데이트
    const newCampaignStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
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
      status === 'APPROVED' ? 'approved' : 'rejected',
      approver_id,
      current_status,
      newCampaignStatus,
      `캠페인 "${campaign_name}" ${status === 'APPROVED' ? '승인' : '거부'}: ${approval_comment || ''}`
    ]);

    await connection.commit();

    await dbLogger.info('캠페인 승인 처리', { 
      approval_request_id: id,
      campaign_id,
      status,
      approver_id 
    });

    return NextResponse.json({
      success: true,
      message: status === 'APPROVED' ? '캠페인이 승인되었습니다.' : '캠페인이 거부되었습니다.'
    });

  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error('캠페인 승인 처리 오류:', error);
    await dbLogger.error('캠페인 승인 처리 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '승인 처리에 실패했습니다.',
      details: error.message
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 