import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CampaignCheck extends RowDataPacket {
  campaign_id: number;
  campaign_name: string;
  status: string;
}

// 조건 기반 카운트 쿼리 생성 (등록 API와 동일)
function buildCountQuery(criteria: any) {
  if (!criteria) return { query: '', params: [] };

  let conditions: string[] = [];
  let params: any[] = [];

  // 나이 조건
  if (criteria.age?.min || criteria.age?.max) {
    if (criteria.age.min && criteria.age.max) {
      conditions.push('age >= ? AND age <= ?');
      params.push(parseInt(criteria.age.min), parseInt(criteria.age.max));
    } else if (criteria.age.min) {
      conditions.push('age >= ?');
      params.push(parseInt(criteria.age.min));
    } else if (criteria.age.max) {
      conditions.push('age <= ?');
      params.push(parseInt(criteria.age.max));
    }
  }

  // 기타 조건들
  const simpleConditions = [
    'gender', 'marriage_status', 'member_grade', 'marketing_agree_yn',
    'foreigner_yn', 'sms_agree_yn', 'email_agree_yn', 'kakao_agree_yn', 'app_push_agree_yn'
  ];

  simpleConditions.forEach(field => {
    if (criteria[field]?.value && criteria[field].value !== '') {
      conditions.push(`${field} = ?`);
      params.push(criteria[field].value);
    }
  });

  // 주소 조건 (LIKE 검색)
  if (criteria.address?.value && criteria.address.value !== '') {
    conditions.push('address LIKE ?');
    params.push(`%${criteria.address.value}%`);
  }

  // 이메일 도메인 조건
  if (criteria.email_domain?.value && criteria.email_domain.value !== '') {
    conditions.push('email LIKE ?');
    params.push(`%@${criteria.email_domain.value.toLowerCase()}%`);
  }

  if (conditions.length === 0) {
    return { query: '', params: [] };
  }

  const query = `SELECT COUNT(*) as count FROM members WHERE ${conditions.join(' AND ')}`;
  return { query, params };
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
        status,
        created_date,
        created_dept,
        created_emp_no,
        updated_date,
        updated_dept,
        updated_emp_no,
        created_at,
        updated_at,
        conditions,
        estimated_count,
        actual_count,
        generation_status,
        generation_requested_at,
        generation_completed_at,
        generation_error
      FROM customer_groups 
      WHERE id = ?
      AND del_yn = "N"
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
      estimated_count: group.estimated_count || group.customer_count,
      actual_count: group.actual_count || group.customer_count,
      status: group.status || 'ACTIVE',
      created_by: group.created_emp_no,
      created_at: group.created_at,
      updated_at: group.updated_at,
      created_date: group.created_date,
      created_dept: group.created_dept,
      updated_date: group.updated_date,
      updated_dept: group.updated_dept,
      updated_emp_no: group.updated_emp_no,
      conditions: group.conditions,
      generation_status: group.generation_status,
      generation_requested_at: group.generation_requested_at,
      generation_completed_at: group.generation_completed_at,
      generation_error: group.generation_error
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
      name,
      description,
      criteria,
      tags,
      created_dept,
      created_emp_no
    } = body;

    // 필수 파라미터 검증
    if (!name) {
      return NextResponse.json({
        success: false,
        error: '고객군명은 필수입니다.'
      }, { status: 400 });
    }
    
    // 고객군 존재 여부 확인
    const [existingRows] = await pool.execute(
      'SELECT id FROM customer_groups WHERE id = ? AND del_yn = "N"',
      [id]
    );

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: '고객군을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 조건을 JSON 형태로 구성 (등록 API와 동일한 방식)
    const conditions = {
      criteria: criteria || {},
      metadata: {
        created_by: created_emp_no || 'SYSTEM',
        created_at: new Date().toISOString(),
        description: description || '',
        tags: tags || []
      }
    };

    // 예상 고객 수 계산 (등록 API와 동일한 방식)
    let estimatedCount = 0;
    try {
      const countQuery = buildCountQuery(criteria);
      if (countQuery.query && countQuery.params.length > 0) {
        const [countResult] = await pool.execute(countQuery.query, countQuery.params);
        estimatedCount = (countResult as any[])[0]?.count || 0;
      } else {
        // 조건이 없으면 전체 회원 수
        const [totalResult] = await pool.execute('SELECT COUNT(*) as count FROM members');
        estimatedCount = (totalResult as any[])[0]?.count || 0;
      }
    } catch (error) {
      console.error('예상 고객 수 계산 실패:', error);
      estimatedCount = 0;
    }

    // 고객군 수정 (등록 API와 동일한 필드 구조)
    await pool.execute(`
      UPDATE customer_groups 
      SET group_name = ?, 
          description = ?,
          conditions = ?,
          estimated_count = ?,
          generation_status = 'DRAFT',
          updated_date = CURDATE(), 
          updated_dept = ?, 
          updated_emp_no = ?, 
          updated_at = NOW()
      WHERE id = ?
    `, [
      name,
      description || '',
      JSON.stringify(conditions),
      estimatedCount,
      created_dept || '마케팅팀',
      created_emp_no || 'SYSTEM',
      id
    ]);

    return NextResponse.json({
      success: true,
      message: '고객군이 성공적으로 수정되었습니다.',
      estimated_count: estimatedCount
    });

  } catch (error) {
    console.error('고객군 수정 오류:', error);
    return NextResponse.json({
      success: false,
      error: '고객군 수정에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
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
      'SELECT id, group_name FROM customer_groups WHERE id = ? AND del_yn = "N"',
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
        AND c.del_yn = "N"
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
    await pool.execute('UPDATE customer_groups SET del_yn = "N" WHERE id = ?', [id]);

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