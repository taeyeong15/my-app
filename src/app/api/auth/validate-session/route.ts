import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function POST(request: NextRequest) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json({
        success: false,
        error: '사용자 정보가 누락되었습니다.'
      }, { status: 400 });
    }

    // 사용자 존재 여부 및 활성 상태 확인
    const [userRows] = await connection.execute(`
      SELECT id, email, name, role, status, last_login 
      FROM users 
      WHERE id = ? AND email = ? AND status = 'active'
    `, [userId, email]);

    if ((userRows as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 세션입니다.'
      }, { status: 401 });
    }

    const user = (userRows as any[])[0];

    // 마지막 로그인 시간 업데이트
    await connection.execute(`
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = ?
    `, [userId]);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('세션 검증 오류:', error);
    return NextResponse.json({
      success: false,
      error: '세션 검증 중 오류가 발생했습니다.'
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 