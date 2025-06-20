import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CampaignCheck extends RowDataPacket {
  campaign_id: number;
  campaign_name: string;
  status: string;
}

// GET: 특정 고객군 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 고객군 ID입니다.'
      }, { status: 400 });
    }

    const [rows] = await pool.execute(`
      SELECT 
        id,
        group_name,
        customer_count,
        use_yn,
        created_date,
        created_dept,
        created_emp_no,
        updated_date,
        updated_dept,
        updated_emp_no,
        created_at,
        updated_at
      FROM customer_groups 
      WHERE id = ?
      AND use_yn = "Y"
    `, [id]);

    const groups = rows as any[];
    
    if (groups.length === 0) {
      return NextResponse.json({
        success: false,
        error: '고객군을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const group = groups[0];
    
    // 데이터 변환 (기존 API 호환성 유지)
    const transformedGroup = {
      id: group.id,
      name: group.group_name,
      description: group.created_dept ? `${group.created_dept} - ${group.created_emp_no}` : group.created_emp_no,
      estimated_count: group.customer_count,
      actual_count: group.customer_count,
      status: group.status,
      created_by: group.created_emp_no,
      created_at: group.created_at,
      updated_at: group.updated_at,
      created_date: group.created_date,
      created_dept: group.created_dept,
      updated_date: group.updated_date,
      updated_dept: group.updated_dept,
      updated_emp_no: group.updated_emp_no
    };

    return NextResponse.json({
      success: true,
      group: transformedGroup
    });

  } catch (error) {
    console.error('고객군 상세 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '고객군 조회에 실패했습니다.'
    }, { status: 500 });
  }
}

// PUT: 고객군 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 고객군 ID입니다.'
      }, { status: 400 });
    }

    const body = await request.json();
    const {
      group_name,
      customer_count,
      use_yn,
      updated_dept,
      updated_emp_no
    } = body;

    // 필수 파라미터 검증
    if (!group_name) {
      return NextResponse.json({
        success: false,
        error: '고객군명은 필수입니다.'
      }, { status: 400 });
    }
    
    // 고객군 존재 여부 확인
    const [existingRows] = await pool.execute(
      'SELECT id FROM customer_groups WHERE id = ? AND use_yn = "Y"',
      [id]
    );

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: '고객군을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 고객군 수정
    await pool.execute(`
      UPDATE customer_groups 
      SET group_name = ?, customer_count = ?, use_yn = ?, updated_date = CURDATE(), 
          updated_dept = ?, updated_emp_no = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      group_name,
      customer_count || 0,
      use_yn || 'Y',
      updated_dept || '마케팅팀',
      updated_emp_no || 'SYSTEM',
      id
    ]);

    return NextResponse.json({
      success: true,
      message: '고객군이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('고객군 수정 오류:', error);
    return NextResponse.json({
      success: false,
      error: '고객군 수정에 실패했습니다.'
    }, { status: 500 });
  }
}

// DELETE: 고객군 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 고객군 ID입니다.'
      }, { status: 400 });
    }

    // 고객군 존재 여부 확인
    const [existingRows] = await pool.execute(
      'SELECT id, group_name FROM customer_groups WHERE id = ? AND use_yn = "Y"',
      [id]
    );

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: '고객군을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 캠페인에 매핑된 고객군이 존재하는지 확인
    try {
      const [campaignChecks] = await pool.execute<[CampaignCheck]>(`
        SELECT DISTINCT a.id as campaign_id, a.name as campaign_name, a.status
        FROM campaigns a
        INNER JOIN campaign_customer_groups b ON a.id = b.campaign_id
        INNER JOIN customer_groups c ON c.id = b.customer_group_id
        WHERE 1=1
        AND a.status != 'COMPLETED'
        AND b.customer_group_id = ?
        AND c.use_yn = "Y"
      `, [id]);

      console.log(`진행 중인 캠페인 확인 결과: ${campaignChecks.length}개`);

      if (campaignChecks.length > 0) {
        const activeCampaigns = campaignChecks.map(campaign => 
          `${campaign.campaign_name} (${campaign.status})`
        ).join(', ');

        return NextResponse.json({
          success: false,
          error: '이 고객군을 사용하는 진행 중인 캠페인이 있어 삭제 할 수 없습니다.',
          details: {
            message: '다음 캠페인들이 완료된 후 삭제 할 수 있습니다.',
            activeCampaigns: campaignChecks.map(campaign => ({
              id: campaign.campaign_id,
              name: campaign.campaign_name,
              status: campaign.status
            }))
          }
        }, { status: 409 });
      }
    } catch (error) {
      console.log('캠페인 확인 중 오류:', error);
    }
  
    // 고객군 삭제
    await pool.execute('UPDATE customer_groups SET use_yn = "N" WHERE id = ?', [id]);

    // 고객군 비활성화
    await pool.execute('UPDATE customer_groups SET status = "INACTIVE" WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: '고객군이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('고객군 삭제 오류:', error);
    return NextResponse.json({
      success: false,
      error: '고객군 삭제에 실패했습니다.'
    }, { status: 500 });
  }
} 