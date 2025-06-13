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
        email, 
        name, 
        role, 
        status, 
        department, 
        phone, 
        last_login, 
        created_at, 
        updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    return NextResponse.json({ 
      users: rows,
      success: true 
    });
  } catch (error) {
    console.error('사용자 조회 에러:', error);
    return NextResponse.json(
      { error: '사용자를 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 