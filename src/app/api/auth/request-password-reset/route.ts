import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { logger } from '@/lib/logger';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: number;
  email: string;
}

export async function POST(request: Request) {
  try {
    const { email, reason } = await request.json();

    if (!email || !reason) {
      return NextResponse.json(
        { error: '이메일과 요청 사유를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 존재 여부 확인
    const [rows] = await pool.execute<User[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: '등록되지 않은 이메일입니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 재설정 요청 저장
    await pool.execute(
      `INSERT INTO password_reset_requests (user_id, reason, status, created_at)
       VALUES (?, ?, 'pending', NOW())`,
      [rows[0].id, reason]
    );

    logger.info('비밀번호 재설정 요청 접수', { 
      userId: rows[0].id,
      email
    });

    return NextResponse.json({
      success: true,
      message: '비밀번호 재설정 요청이 접수되었습니다.'
    });
  } catch (error) {
    logger.error('비밀번호 재설정 요청 처리 오류', { error });
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 