import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET() {
  try {
    const [rows] = await pool.execute(`
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
      ORDER BY created_at DESC
    `);
    
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
    
    return NextResponse.json({ 
      channels,
      success: true 
    });
  } catch (error) {
    console.error('채널 조회 에러:', error);
    return NextResponse.json(
      { error: '채널을 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 