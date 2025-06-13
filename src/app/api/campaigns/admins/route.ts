import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

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
