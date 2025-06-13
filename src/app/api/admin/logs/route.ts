import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET() {
  try {
    // 먼저 기본 시스템 로그 데이터가 없으면 샘플 데이터 생성
    const [existingLogs] = await pool.execute('SELECT COUNT(*) as count FROM system_logs');
    const logCount = (existingLogs as any[])[0].count;
    
    if (logCount === 0) {
      await pool.execute(`
        INSERT INTO system_logs (level, message, user_id, ip_address, user_agent, context) VALUES
        ('info', '사용자 로그인', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"email": "user@example.com", "category": "auth"}'),
        ('warning', '캠페인 예산 80% 소진 경고', 2, '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"campaign_id": 123, "budget_used": 80, "category": "campaign"}'),
        ('error', 'API 호출 실패', NULL, '10.0.0.15', 'API Client/1.0', '{"endpoint": "/api/send-sms", "error": "Connection timeout", "category": "system"}'),
        ('info', 'SMS 발송 완료', 3, '192.168.1.102', 'Chrome/91.0', '{"recipient": "+821012345678", "status": "delivered", "category": "channel"}'),
        ('debug', '데이터베이스 쿼리 실행', NULL, 'localhost', 'System Process', '{"query": "SELECT * FROM campaigns", "duration": "0.05s", "category": "database"}'),
        ('error', '잘못된 로그인 시도', NULL, '192.168.1.200', 'Unknown Browser', '{"email": "hacker@example.com", "attempts": 5, "category": "auth"}'),
        ('info', '새 캠페인 생성', 1, '192.168.1.100', 'Chrome/91.0', '{"campaign_name": "Summer Sale 2024", "category": "campaign"}'),
        ('warning', 'SMS 발송 한도 90% 도달', 2, '192.168.1.101', 'Chrome/91.0', '{"channel": "SMS", "limit_used": 90, "category": "channel"}')
      `);
    }
    
        const [rows] = await pool.execute(`
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
      ORDER BY sl.created_at DESC
      LIMIT 1000
    `);

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
    
    return NextResponse.json({ 
      logs,
      success: true 
    });
  } catch (error) {
    console.error('시스템 로그 조회 에러:', error);
    return NextResponse.json(
      { error: '시스템 로그를 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 