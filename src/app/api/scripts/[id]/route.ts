import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

interface RouteContext {
  params: { id: string };
}

// 개별 스크립트 조회
export async function GET(request: NextRequest, context: RouteContext) {
  const connection = await pool.getConnection();
  try {
    // 스크립트 조회
    const [scripts] = await connection.execute(
      'SELECT * FROM scripts WHERE id = ?',
      [context.params.id]
    );

    if (!Array.isArray(scripts) || scripts.length === 0) {
      return NextResponse.json(
        { success: false, message: '스크립트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const script = scripts[0] as any;

    // 스크립트 데이터 변환
    const scriptData = {
      id: script.id,
      basicInfo: {
        name: script.name,
        type: script.type,
        description: script.description,
        status: script.status
      },
      content: {
        greeting: script.greeting || '',
        introduction: script.introduction || '',
        main_script: script.main_script || '',
        objection_handling: script.objection_handling || '',
        closing: script.closing || ''
      },
      conditions: {
        target_age_min: script.target_age_min?.toString() || '',
        target_age_max: script.target_age_max?.toString() || '',
        target_gender: script.target_gender || '',
        call_time_start: script.call_time_start || '',
        call_time_end: script.call_time_end || '',
        monday_available: Boolean(script.monday_available),
        tuesday_available: Boolean(script.tuesday_available),
        wednesday_available: Boolean(script.wednesday_available),
        thursday_available: Boolean(script.thursday_available),
        friday_available: Boolean(script.friday_available),
        saturday_available: Boolean(script.saturday_available),
        sunday_available: Boolean(script.sunday_available)
      },
      guidelines: {
        dos: script.dos || '',
        donts: script.donts || '',
        notes: script.notes || ''
      },
      created_at: script.created_at,
      updated_at: script.updated_at,
      approval_status: script.approval_status,
      approved_by: script.approved_by,
      approved_at: script.approved_at,
      rejection_reason: script.rejection_reason
    };

    return NextResponse.json({
      success: true,
      script: scriptData
    });

  } catch (error) {
    console.error('스크립트 조회 실패:', error);
    return NextResponse.json(
      { success: false, message: '스크립트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    
    // 스크립트 수정
    const [result] = await connection.execute(
      `UPDATE scripts SET 
        name = ?, type = ?, description = ?, status = ?,
        greeting = ?, introduction = ?, main_script = ?, objection_handling = ?, closing = ?,
        target_age_min = ?, target_age_max = ?, target_gender = ?,
        call_time_start = ?, call_time_end = ?,
        monday_available = ?, tuesday_available = ?, wednesday_available = ?, thursday_available = ?,
        friday_available = ?, saturday_available = ?, sunday_available = ?,
        dos = ?, donts = ?, notes = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        body.name, body.type, body.description, body.status,
        body.greeting, body.introduction, body.main_script, body.objection_handling, body.closing,
        body.target_age_min, body.target_age_max, body.target_gender,
        body.call_time_start, body.call_time_end,
        body.monday_available, body.tuesday_available, body.wednesday_available, body.thursday_available,
        body.friday_available, body.saturday_available, body.sunday_available,
        body.dos, body.donts, body.notes,
        context.params.id
      ]
    );

    return NextResponse.json({
      success: true,
      message: '스크립트가 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('스크립트 수정 실패:', error);
    return NextResponse.json(
      { success: false, message: '스크립트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// 스크립트 상태 업데이트 (승인/거절/활성화/비활성화)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const { action, approved_by } = body;

    // 스크립트 존재 확인
    const [existingScript] = await pool.execute(
      'SELECT id, status, approval_status FROM scripts WHERE id = ?',
      [id]
    );

    if ((existingScript as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: '스크립트를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const script = (existingScript as any[])[0];
    let query = '';
    let params: any[] = [];
    let message = '';

    switch (action) {
      case 'approve':
        if (!approved_by) {
          return NextResponse.json({
            success: false,
            error: '승인자 정보가 필요합니다.'
          }, { status: 400 });
        }
        query = `UPDATE scripts SET 
          approval_status = 'approved', 
          approved_by = ?, 
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?`;
        params = [approved_by, id];
        message = '스크립트가 승인되었습니다.';
        break;

      case 'reject':
        if (!approved_by) {
          return NextResponse.json({
            success: false,
            error: '처리자 정보가 필요합니다.'
          }, { status: 400 });
        }
        query = `UPDATE scripts SET 
          approval_status = 'rejected', 
          approved_by = ?, 
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?`;
        params = [approved_by, id];
        message = '스크립트가 거절되었습니다.';
        break;

      case 'activate':
        if (script.approval_status !== 'approved') {
          return NextResponse.json({
            success: false,
            error: '승인된 스크립트만 활성화할 수 있습니다.'
          }, { status: 400 });
        }
        query = `UPDATE scripts SET 
          status = 'active', 
          updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?`;
        params = [id];
        message = '스크립트가 활성화되었습니다.';
        break;

      case 'deactivate':
        query = `UPDATE scripts SET 
          status = 'inactive', 
          updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?`;
        params = [id];
        message = '스크립트가 비활성화되었습니다.';
        break;

      case 'resubmit':
        // 거절된 스크립트를 다시 승인 대기로 변경
        query = `UPDATE scripts SET 
          approval_status = 'pending', 
          approved_by = NULL, 
          approved_at = NULL,
          updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?`;
        params = [id];
        message = '스크립트가 재검토 요청되었습니다.';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

    await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error: any) {
    console.error('스크립트 상태 업데이트 오류:', error);
    return NextResponse.json({
      success: false,
      error: '스크립트 상태 업데이트에 실패했습니다: ' + error.message
    }, { status: 500 });
  }
}

// 스크립트 삭제 (개별)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;

    // 스크립트 존재 확인
    const [existingScript] = await pool.execute(
      'SELECT id, name FROM scripts WHERE id = ?',
      [id]
    );

    if ((existingScript as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: '스크립트를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 스크립트 삭제
    await pool.execute('DELETE FROM scripts WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: '스크립트가 성공적으로 삭제되었습니다.'
    });

  } catch (error: any) {
    console.error('스크립트 삭제 오류:', error);
    return NextResponse.json({
      success: false,
      error: '스크립트 삭제에 실패했습니다: ' + error.message
    }, { status: 500 });
  }
} 