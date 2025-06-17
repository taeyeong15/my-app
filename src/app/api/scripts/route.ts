import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const approval = searchParams.get('approval');
  const offset = (page - 1) * limit;

  console.log('Scripts API GET - 파라미터:', { page, limit, search, status, type, approval, offset });

  try {
    let whereClause = 'WHERE 1=1';
    let whereParams = [];

    if (status) {
      whereClause += ' AND status = ?';
      whereParams.push(status);
    }

    if (type) {
      whereClause += ' AND type = ?';
      whereParams.push(type);
    }

    console.log('Scripts API GET - 쿼리 파라미터:', { whereClause, whereParams });

    // 총 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM scripts ${whereClause}`,
      whereParams
    );
    const total = (countResult as any[])[0].total;
    console.log('Count 결과:', total);

    // 데이터 조회 - 캠페인 API와 동일한 방식으로 하드코딩
    const mainQuery = `
      SELECT 
        id, name, type, content, variables, status, 
        description, subject, approval_status, created_by, 
        approved_by, approved_at, created_at, updated_at
      FROM scripts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    console.log('실행할 쿼리:', mainQuery);
    const [rows] = await pool.execute(mainQuery, whereParams);
    console.log('Select 결과 row 수:', (rows as any[]).length);

    // JSON 데이터 파싱
    const scripts = (rows as any[]).map(row => {
      let variables = {};
      
      try {
        if (row.variables) {
          variables = typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables;
        }
      } catch (error) {
        console.warn(`스크립트 ${row.id}의 variables JSON 파싱 실패:`, error);
        variables = {};
      }
      
      return {
        ...row,
        variables
      };
    });

    console.log('최종 scripts 데이터:', scripts.length, '개');

    return NextResponse.json({
      success: true,
      data: scripts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('스크립트 조회 오류 상세:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    return NextResponse.json({
      success: false,
      error: '스크립트 목록을 불러오는데 실패했습니다: ' + error.message
    }, { status: 500 });
  }
} 