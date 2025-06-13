import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'ansxodud2410!',
  database: 'auth_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: '사용자 ID와 새 비밀번호를 입력해주세요.', success: false },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: '비밀번호는 최소 4자 이상이어야 합니다.', success: false },
        { status: 400 }
      );
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 비밀번호 업데이트
    const [result] = await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: '비밀번호가 성공적으로 변경되었습니다.',
      success: true 
    });
  } catch (error) {
    console.error('비밀번호 재설정 에러:', error);
    return NextResponse.json(
      { error: '비밀번호 재설정에 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 