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

    if (search && search.trim()) {
      whereConditions.push('(name LIKE ? OR description LIKE ? OR created_by LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all') {
      whereConditions.push('status = ?');
      queryParams.push(status);
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
        name,
        description,
        criteria,
        estimated_count,
        actual_count,
        status,
        created_by,
        created_at,
        updated_at
      FROM customer_groups 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const [rows] = await pool.execute(mainQuery, queryParams);
    
    // JSON 데이터 파싱
    const groups = (rows as any[]).map(row => {
      let criteria = {};
      
      try {
        if (row.criteria) {
          if (typeof row.criteria === 'string') {
            criteria = JSON.parse(row.criteria);
          } else {
            criteria = row.criteria;
          }
        }
      } catch (error) {
        console.warn(`고객 그룹 조건 파싱 실패 (그룹 ${row.id}):`, row.criteria);
        criteria = {};
      }
      
      return {
        ...row,
        criteria
      };
    });
    
    return NextResponse.json({ 
      groups,
      success: true,
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
      name,
      description,
      criteria,
      estimated_count,
      created_by
    } = body;

    // 필수 파라미터 검증
    if (!name || !created_by) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다. (name, created_by)'
      }, { status: 400 });
    }

    const [result] = await pool.execute(`
      INSERT INTO customer_groups (
        name, description, criteria, estimated_count, actual_count, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 0, 'active', ?, NOW(), NOW())
    `, [
      name,
      description || null,
      JSON.stringify(criteria || {}),
      estimated_count || 0,
      created_by
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