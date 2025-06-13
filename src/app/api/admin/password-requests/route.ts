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
        pr.id,
        pr.user_id as userId,
        u.email,
        u.name,
        pr.reason,
        pr.status,
        pr.created_at as createdAt
      FROM password_reset_requests pr
      JOIN users u ON pr.user_id = u.id
      ORDER BY pr.created_at DESC
    `);
    
    return NextResponse.json({ 
      requests: rows,
      success: true 
    });
  } catch (error) {
    console.error('비밀번호 재설정 요청 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '비밀번호 재설정 요청 목록을 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 