import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '5');
  const search = searchParams.get('search') || '';
  const level = searchParams.get('level') || 'all';
  const category = searchParams.get('category') || 'all';
  const offset = (page - 1) * limit;

  console.log('Logs API GET - 파라미터:', { page, limit, search, level, category, offset });

  try {
    // 먼저 기본 시스템 로그 데이터가 없으면 샘플 데이터 생성
    const [existingLogs] = await pool.execute('SELECT COUNT(*) as count FROM system_logs');
    const logCount = (existingLogs as any[])[0].count;
    
    if (logCount === 0) {
      await pool.execute(`
        INSERT INTO system_logs (level, message, user_id, ip_address, user_agent, context) VALUES
        ('info', '사용자 로그인', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"email": "user@example.com", "category": "user"}'),
        ('warn', '캠페인 예산 80% 소진 경고', 2, '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"campaign_id": 123, "budget_used": 80, "category": "campaign"}'),
        ('error', 'API 호출 실패', NULL, '10.0.0.15', 'API Client/1.0', '{"endpoint": "/api/send-sms", "error": "Connection timeout", "category": "system"}'),
        ('info', 'SMS 발송 완료', 3, '192.168.1.102', 'Chrome/91.0', '{"recipient": "+821012345678", "status": "delivered", "category": "security"}'),
        ('debug', '데이터베이스 쿼리 실행', NULL, 'localhost', 'System Process', '{"query": "SELECT * FROM campaigns", "duration": "0.05s", "category": "api"}'),
        ('error', '잘못된 로그인 시도', NULL, '192.168.1.200', 'Unknown Browser', '{"email": "hacker@example.com", "attempts": 5, "category": "security"}'),
        ('info', '새 캠페인 생성', 1, '192.168.1.100', 'Chrome/91.0', '{"campaign_name": "Summer Sale 2024", "category": "campaign"}'),
        ('warn', 'SMS 발송 한도 90% 도달', 2, '192.168.1.101', 'Chrome/91.0', '{"channel": "SMS", "limit_used": 90, "category": "security"}')
      `);
    }

    let whereClause = 'WHERE 1=1';
    let whereParams: any[] = [];

    if (search) {
      whereClause += ' AND (sl.message LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${search}%`;
      whereParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (level !== 'all') {
      whereClause += ' AND sl.level = ?';
      whereParams.push(level);
    }

    if (category !== 'all') {
      whereClause += ' AND JSON_EXTRACT(sl.context, "$.category") = ?';
      whereParams.push(category);
    }

    console.log('Logs API GET - 쿼리 파라미터:', { whereClause, whereParams });

    // 총 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM system_logs sl LEFT JOIN users u ON sl.user_id = u.id ${whereClause}`,
      whereParams
    );
    const total = (countResult as any[])[0].total;
    console.log('Logs Count 결과:', total);

    // 데이터 조회
    const mainQuery = `
      SELECT 
        sl.id,
        sl.level,
        sl.message,
        sl.user_id,
        sl.ip_address,
        sl.user_agent,
        sl.context,
        sl.created_at,
        u.name as user_name,
        u.email as user_email
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    console.log('실행할 쿼리:', mainQuery);
    const [rows] = await pool.execute(mainQuery, whereParams);
    console.log('Logs Select 결과 row 수:', (rows as any[]).length);

    // JSON 데이터 파싱
    const logs = (rows as any[]).map(row => {
      let context = {};
      
      try {
        if (row.context) {
          context = typeof row.context === 'string' ? JSON.parse(row.context) : row.context;
        }
      } catch (error) {
        console.warn(`로그 ${row.id}의 context 파싱 실패:`, row.context);
        context = {};
      }
      
      return {
        ...row,
        context,
        category: (context as any).category || 'system'
      };
    });

    console.log('최종 logs 데이터:', logs.length, '개');
    
    return NextResponse.json({ 
      success: true,
      logs,
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
    console.error('시스템 로그 조회 오류 상세:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    return NextResponse.json({
      success: false,
      error: '시스템 로그를 불러오는데 실패했습니다: ' + error.message
    }, { status: 500 });
  }
} 