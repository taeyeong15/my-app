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

  console.log('Channels API GET - 파라미터:', { page, limit, search, type, status, offset });

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

    console.log('Channels API GET - 쿼리 파라미터:', { whereClause, whereParams });

    // 총 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM channels ${whereClause}`,
      whereParams
    );
    const total = (countResult as any[])[0].total;
    console.log('Channels Count 결과:', total);

    // 데이터 조회
    const mainQuery = `
      SELECT 
        id, 
        name, 
        type, 
        description, 
        status, 
        config, 
        api_endpoint, 
        daily_limit, 
        monthly_limit, 
        cost_per_send, 
        created_by, 
        created_at, 
        updated_at 
      FROM channels 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    console.log('실행할 쿼리:', mainQuery);
    const [rows] = await pool.execute(mainQuery, whereParams);
    console.log('Channels Select 결과 row 수:', (rows as any[]).length);
    
    // JSON 데이터 파싱
    const channels = (rows as any[]).map(row => {
      let config = {};
      
      try {
        if (row.config) {
          config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
        }
      } catch (error) {
        console.warn(`채널 ${row.id}의 config 파싱 실패:`, row.config);
        config = {};
      }
      
      return {
        ...row,
        config
      };
    });

    console.log('최종 channels 데이터:', channels.length, '개');
    
    return NextResponse.json({ 
      success: true,
      channels,
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
    console.error('채널 조회 오류 상세:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    return NextResponse.json({
      success: false,
      error: '채널을 불러오는데 실패했습니다: ' + error.message
    }, { status: 500 });
  }
} 