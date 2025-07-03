import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

// GET: 고객 그룹 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const use_yn = searchParams.get('use_yn');
  const mode = searchParams.get('mode');
  const campaignId = searchParams.get('campaignId');
  const offset = (page - 1) * limit;

  try {
    let whereConditions = [];
    let queryParams: any[] = [];

    // 사용중인 고객군만 조회
    whereConditions.push('del_yn = ?');
    queryParams.push('N');

    if (search && search.trim()) {
      whereConditions.push('(group_name LIKE ? OR created_dept LIKE ? OR created_emp_no LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        whereConditions.push('status = ?');
        queryParams.push('ACTIVE');
      } else if (status === 'inactive') {
        whereConditions.push('status = ?');
        queryParams.push('INACTIVE');
      }
    }

    // 고객군 전체 통계 조건 세팅
    const whereTotalClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 캠페인 생성시 고객군 조건 세팅
    if (use_yn === 'N') {
      whereConditions.push('use_yn = ?');
      queryParams.push(use_yn);
    } else if (mode === 'view' || mode === 'edit') {
      // 캠페인 상세보기/수정시 고객군 조건 세팅
      whereConditions.push('(use_yn = ? OR b.campaign_id = ?)');
      queryParams.push('N', campaignId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 총 개수 조회
    let countQuery = '';
    if (mode === 'view' || mode === 'edit') {
      countQuery = `SELECT COUNT(*) as total FROM customer_groups a left join campaign_customer_groups b on a.id = b.customer_group_id ${whereClause}`;
    } else {
      countQuery = `SELECT COUNT(*) as total FROM customer_groups ${whereClause}`;
    }
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = (countResult as any[])[0].total;

    // 페이징된 데이터 조회
    let mainQuery = '';
    if (mode === 'view' || mode === 'edit') {
      mainQuery = `
      SELECT 
        a.id,
        a.group_name,
        a.description,
        a.customer_count,
        a.estimated_count,
        a.actual_count,
        a.use_yn,
        a.status,
        a.generation_status,
        a.generation_requested_at,
        a.generation_completed_at,
        a.generation_error,
        a.conditions,
        a.created_date,
        a.created_dept,
        a.created_emp_no,
        a.updated_date,
        a.updated_dept,
        a.updated_emp_no,
        a.created_at,
        a.updated_at
      FROM customer_groups a
      left join campaign_customer_groups b on a.id = b.customer_group_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      mainQuery = `
        SELECT 
          a.id,
          a.group_name,
          a.description,
          a.customer_count,
          a.estimated_count,
          a.actual_count,
          a.use_yn,
          a.status,
          a.generation_status,
          a.generation_requested_at,
          a.generation_completed_at,
          a.generation_error,
          a.conditions,
          a.created_date,
          a.created_dept,
          a.created_emp_no,
          a.updated_date,
          a.updated_dept,
          a.updated_emp_no,
          a.created_at,
          a.updated_at
        FROM customer_groups a
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const [rows] = await pool.execute(mainQuery, queryParams);
    
    // 데이터 변환 (기존 API 호환성 유지)
    const groups = (rows as any[]).map(row => ({
      id: row.id,
      name: row.group_name,
      description: row.description || (row.created_dept ? `${row.created_dept} - ${row.created_emp_no}` : row.created_emp_no),
      estimated_count: row.estimated_count || row.customer_count || 0,
      actual_count: row.actual_count || row.customer_count || 0,
      status: row.status,
      use_yn: row.use_yn,
      generation_status: row.generation_status || 'COMPLETED',
      generation_requested_at: row.generation_requested_at,
      generation_completed_at: row.generation_completed_at,
      generation_error: row.generation_error,
      conditions: parseConditions(row.conditions),
      created_by: row.created_emp_no,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_date: row.created_date,
      created_dept: row.created_dept,
      updated_date: row.updated_date,
      updated_dept: row.updated_dept,
      updated_emp_no: row.updated_emp_no
    }));

    // 전체 통계 데이터 조회 (검색 조건 적용)
    // 통계 쿼리용 별도 파라미터 생성
    const statsParams = [];
    statsParams.push('N'); // del_yn = 'N'

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      statsParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        statsParams.push('ACTIVE');
      } else if (status === 'inactive') {
        statsParams.push('INACTIVE');
      }
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as totalGroups,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activeGroups,
        SUM(estimated_count) as totalEstimatedCount,
        SUM(actual_count) as totalActualCount
      FROM customer_groups 
      ${whereTotalClause}
    `;
    
    const [statsResult] = await pool.execute(statsQuery, statsParams);
    const statistics = (statsResult as any[])[0];
    
    return NextResponse.json({ 
      groups,
      success: true,
      statistics: {
        totalGroups: statistics.totalGroups || 0,
        activeGroups: statistics.activeGroups || 0,
        totalEstimatedCount: statistics.totalEstimatedCount || 0,
        totalActualCount: statistics.totalActualCount || 0
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('고객 그룹 조회 에러:', error);
    return NextResponse.json(
      { error: '고객 그룹을 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
}

// POST: 새 고객 그룹 조건 저장 (실제 고객군 생성은 별도 요청)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      criteria,
      tags,
      created_dept,
      created_emp_no,
      generate_immediately = false // 즉시 생성 여부 옵션
    } = body;

    // 필수 파라미터 검증
    if (!name || !created_emp_no) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다. (name, created_emp_no)'
      }, { status: 400 });
    }

    // 조건을 JSON 형태로 구성
    const conditions = {
      criteria: criteria || {},
      metadata: {
        created_by: created_emp_no,
        created_at: new Date().toISOString(),
        description: description || '',
        tags: tags || []
      }
    };

    // 예상 고객 수 계산
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

    // 고객군 조건 저장
    const [result] = await pool.execute(`
      INSERT INTO customer_groups (
        group_name, 
        description,
        conditions,
        estimated_count,
        actual_count,
        generation_status,
        use_yn, 
        status,
        created_date, 
        created_dept, 
        created_emp_no
      ) VALUES (?, ?, ?, ?, 0, 'DRAFT', 'N', 'ACTIVE', CURDATE(), ?, ?)
    `, [
      name,
      description || '',
      JSON.stringify(conditions),
      estimatedCount,
      created_dept || '마케팅팀',
      created_emp_no
    ]);

    const insertId = (result as any).insertId;

    // 즉시 생성 옵션이 활성화된 경우 고객군 생성 실행
    if (generate_immediately) {
      try {
        await generateCustomerGroup(insertId, criteria);
      } catch (error) {
        console.error('즉시 고객군 생성 실패:', error);
        // 실패해도 조건 저장은 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      message: generate_immediately ? 
        '고객군 조건이 저장되고 생성이 시작되었습니다.' : 
        '고객군 조건이 성공적으로 저장되었습니다.',
      id: insertId,
      estimated_count: estimatedCount,
      generation_status: generate_immediately ? 'GENERATING' : 'DRAFT'
    });

  } catch (error) {
    console.error('고객군 조건 저장 실패:', error);
    return NextResponse.json({
      success: false,
      error: '고객군 조건 저장에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// 고객군 실제 생성 함수
async function generateCustomerGroup(customerGroupId: number, criteria: any) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 생성 상태를 GENERATING으로 변경
    await connection.execute(`
      UPDATE customer_groups 
      SET generation_status = 'GENERATING', 
          generation_requested_at = NOW(),
          generation_error = NULL
      WHERE id = ?
    `, [customerGroupId]);

    // 조건에 맞는 고객 조회
    const memberQuery = buildMemberQuery(criteria);
    console.log('Member Query:', memberQuery.query);
    console.log('Query Params:', memberQuery.params);

    let memberNos: number[] = [];
    if (memberQuery.query && memberQuery.params.length > 0) {
      const [memberRows] = await connection.execute(memberQuery.query, memberQuery.params);
      memberNos = (memberRows as any[]).map((row: any) => row.member_no);
    } else {
      // 조건이 없으면 전체 회원
      const [allMembers] = await connection.execute('SELECT member_no FROM members');
      memberNos = (allMembers as any[]).map((row: any) => row.member_no);
    }

    console.log(`조건에 맞는 고객 수: ${memberNos.length}명`);

    // 기존 매핑 데이터 존재 여부 확인 후 삭제
    const [existingData] = await connection.execute(
      'SELECT COUNT(*) as count FROM customers WHERE id = ?', 
      [customerGroupId]
    );
    const existingCount = (existingData as any[])[0].count;
    
    if (existingCount > 0) {
      console.log(`기존 매핑 데이터 ${existingCount}개를 삭제합니다.`);
      await connection.execute('DELETE FROM customers WHERE id = ?', [customerGroupId]);
    } else {
      console.log('삭제할 기존 매핑 데이터가 없습니다.');
    }

    // 새로운 매핑 데이터 삽입
    if (memberNos.length > 0) {
      const insertValues = memberNos.map(memberNo => [customerGroupId, memberNo]);
      const placeholders = insertValues.map(() => '(?, ?)').join(', ');
      const flatValues = insertValues.flat();
      
      await connection.execute(
        `INSERT INTO customers (id, member_no) VALUES ${placeholders}`,
        flatValues
      );
    }

    // 고객군 정보 업데이트
    await connection.execute(`
      UPDATE customer_groups 
      SET actual_count = ?, 
          customer_count = ?,
          generation_status = 'COMPLETED',
          generation_completed_at = NOW()
      WHERE id = ?
    `, [memberNos.length, memberNos.length, customerGroupId]);

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    
    // 실패 상태로 업데이트
    await connection.execute(`
      UPDATE customer_groups 
      SET generation_status = 'FAILED',
          generation_error = ?
      WHERE id = ?
    `, [error instanceof Error ? error.message : '알 수 없는 오류', customerGroupId]);
    
    throw error;
  } finally {
    connection.release();
  }
}

// 조건 기반 카운트 쿼리 생성
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

// 조건 기반 회원 조회 쿼리 생성
function buildMemberQuery(criteria: any) {
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

  const query = `SELECT member_no FROM members WHERE ${conditions.join(' AND ')}`;
  return { query, params };
}

function parseConditions(conditions: any): any {
  if (!conditions) return null;
  
  // 이미 객체인 경우 그대로 반환
  if (typeof conditions === 'object') {
    return conditions;
  }
  
  // 문자열인 경우 JSON 파싱 시도
  if (typeof conditions === 'string') {
    try {
      return JSON.parse(conditions);
    } catch (error) {
      console.error('조건 파싱 실패:', error);
      return null;
    }
  }
  
  return null;
}