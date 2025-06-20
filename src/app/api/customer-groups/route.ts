import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

// GET: 고객 그룹 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const offset = (page - 1) * limit;

  try {
    let whereConditions = [];
    let queryParams: any[] = [];

    // 사용중인 고객군만 조회
    whereConditions.push('use_yn = ?');
    queryParams.push('Y');

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

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM customer_groups ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = (countResult as any[])[0].total;

    // 페이징된 데이터 조회
    const mainQuery = `
      SELECT 
        id,
        group_name,
        description,
        customer_count,
        estimated_count,
        actual_count,
        use_yn,
        status,
        created_date,
        created_dept,
        created_emp_no,
        updated_date,
        updated_dept,
        updated_emp_no,
        created_at,
        updated_at
      FROM customer_groups 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
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
    const statsQuery = `
      SELECT 
        COUNT(*) as totalGroups,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activeGroups,
        SUM(customer_count) as totalEstimatedCount,
        SUM(customer_count) as totalActualCount
      FROM customer_groups 
      ${whereClause}
    `;
    
    const [statsResult] = await pool.execute(statsQuery, queryParams);
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

// POST: 새 고객 그룹 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      group_name,
      created_dept,
      created_emp_no,
      customer_count
    } = body;

    // 필수 파라미터 검증
    if (!group_name || !created_emp_no) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다. (group_name, created_emp_no)'
      }, { status: 400 });
    }

    const [result] = await pool.execute(`
      INSERT INTO customer_groups (
        group_name, customer_count, use_yn, created_date, created_dept, created_emp_no
      ) VALUES (?, ?, 'Y', CURDATE(), ?, ?)
    `, [
      group_name,
      customer_count || 0,
      created_dept || '마케팅팀',
      created_emp_no
    ]);

    const insertId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      message: '고객군이 성공적으로 생성되었습니다.',
      id: insertId
    });

  } catch (error: any) {
    console.error('고객군 생성 오류:', error);
    return NextResponse.json({
      success: false,
      error: '고객군 생성에 실패했습니다.'
    }, { status: 500 });
  }
}