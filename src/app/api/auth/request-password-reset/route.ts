import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { logger } from '@/lib/logger';

interface User {
  id: number;
  email: string;
}

export async function POST(request: Request) {
  let connection;
  try {
    const { email, reason } = await request.json();

    if (!email || !reason) {
      return NextResponse.json(
        { error: '이메일과 요청 사유를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 데이터베이스 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // 사용자 존재 여부 확인
    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    const users = rows as User[];

    if (!Array.isArray(users) || users.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: '등록되지 않은 이메일입니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 재설정 요청 저장
    await connection.execute(
      `INSERT INTO password_reset_requests (user_id, reason, status, created_at)
       VALUES (?, ?, 'pending', NOW())`,
      [users[0].id, reason]
    );

    logger.info('비밀번호 재설정 요청 접수', { 
      userId: users[0].id,
      email
    });

    await connection.end();

    return NextResponse.json({
      success: true,
      message: '비밀번호 재설정 요청이 접수되었습니다.'
    });
  } catch (error) {
    logger.error('비밀번호 재설정 요청 처리 오류', { error });
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        logger.error('데이터베이스 연결 종료 오류', { error: err });
      }
    }
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 