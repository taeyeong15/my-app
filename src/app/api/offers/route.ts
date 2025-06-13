import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'ansxodud2410!',
  database: 'auth_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET() {
  try {
    const [rows] = await pool.execute(`
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
      ORDER by created_at DESC
    `);
    
    const offers = (rows as any[]).map(row => {
      return {
        ...row,
        // 날짜 포맷 정리
        start_date: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : '',
        end_date: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : ''
      };
    });

    return NextResponse.json({ 
      offers: offers,
      success: true 
    });
  } catch (error) {
    console.error('오퍼 조회 에러:', error);
    return NextResponse.json(
      { error: '오퍼를 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 