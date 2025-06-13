import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_db',
  port: parseInt(process.env.DB_PORT || '3306'),
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
        email,
        role
      FROM users 
      WHERE role = 'admin' 
      ORDER BY name ASC
    `);

    return NextResponse.json({
      success: true,
      admins: rows
    });

  } catch (error: any) {
    console.error('관리자 목록 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      message: '관리자 목록을 불러오는데 실패했습니다.',
      error: error.message
    }, { status: 500 });
  }
} 