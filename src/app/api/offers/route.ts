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

  try {
    let whereClause = 'WHERE 1=1';
    let whereParams: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      whereParams.push(searchPattern, searchPattern);
    }

    if (type !== 'all') {
      whereClause += ' AND type = ?';
      whereParams.push(type);
    }

    if (status !== 'all') {
      whereClause += ' AND status = ?';
      whereParams.push(status);
    }

    // 총 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM offers ${whereClause}`,
      whereParams
    );
    const total = (countResult as any[])[0].total;

    // 데이터 조회
    const mainQuery = `
      SELECT
        id,
        name,
        type,
        description,
        value,
        value_type,
        start_date,
        end_date,
        max_usage,
        usage_count,
        status,
        terms_conditions,
        created_by,
        created_at,
        updated_at
      FROM offers
      ${whereClause}
      ORDER by created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const [rows] = await pool.execute(mainQuery, whereParams);
    
    const offers = (rows as any[]).map(row => {
      return {
        ...row,
        // 날짜 포맷 정리
        start_date: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : '',
        end_date: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : ''
      };
    });

    return NextResponse.json({ 
      success: true,
      offers: offers,
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
    console.error('오퍼 조회 오류 상세:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    return NextResponse.json({
      success: false,
      error: '오퍼를 불러오는데 실패했습니다: ' + error.message
    }, { status: 500 });
  }
} 