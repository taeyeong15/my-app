import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '5');
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || 'all';
  const offset = (page - 1) * limit;

  console.log('Notices API GET - 파라미터:', { page, limit, search, type, status, offset });

  try {
    let whereClause = 'WHERE 1=1';
    let whereParams: any[] = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ? OR author LIKE ?)';
      const searchPattern = `%${search}%`;
      whereParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (type !== 'all') {
      whereClause += ' AND type = ?';
      whereParams.push(type);
    }

    if (status !== 'all') {
      whereClause += ' AND status = ?';
      whereParams.push(status);
    }

    console.log('Notices API GET - 쿼리 파라미터:', { whereClause, whereParams });

    // 총 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM notices ${whereClause}`,
      whereParams
    );
    const total = (countResult as any[])[0].total;
    console.log('Notices Count 결과:', total);

    // 데이터 조회 - publish_date 대신 created_at 사용
    const mainQuery = `
      SELECT 
        id,
        title,
        content,
        type,
        status,
        created_at as publish_date,
        updated_at as expiry_date,
        0 as views,
        COALESCE(author, 'Admin') as author,
        created_at,
        updated_at
      FROM notices
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    console.log('실행할 쿼리:', mainQuery);
    const [rows] = await pool.execute(mainQuery, whereParams);
    console.log('Notices Select 결과 row 수:', (rows as any[]).length);

    const notices = rows as any[];

    console.log('최종 notices 데이터:', notices.length, '개');

    return NextResponse.json({
      success: true,
      notices: notices || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('공지사항 조회 오류 상세:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    return NextResponse.json({
      success: false,
      error: '공지사항을 불러오는데 실패했습니다: ' + error.message
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, type, status, author } = body;

    const [result] = await pool.execute(`
      INSERT INTO notices (title, content, type, status, author, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, content, type, status, author || 'Admin']);

    return NextResponse.json({
      success: true,
      message: '공지사항이 성공적으로 생성되었습니다.',
      id: (result as any).insertId
    });

  } catch (error) {
    console.error('공지사항 생성 에러:', error);
    return NextResponse.json(
      { error: '공지사항 생성에 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 