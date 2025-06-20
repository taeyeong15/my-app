import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/database';
import { logger } from '@/lib/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface User extends RowDataPacket {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

// 데이터베이스 테이블 초기화
async function initializeUsersTable() {
  try {
    // users 테이블 존재 여부 확인
    const [tables] = await pool.execute('SHOW TABLES LIKE "users"');
    console.log('Existing tables:', tables);

    if (Array.isArray(tables) && tables.length === 0) {
      // users 테이블이 없으면 생성
      await pool.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_role (role)
        )
      `);
      console.log('Users table created successfully');
    }

    // 테이블 구조 확인
    const [columns] = await pool.execute('DESCRIBE users');
    console.log('Users table structure:', columns);

  } catch (error) {
    console.error('Database table initialization failed:', error);
  }
}

// 서버 시작시 테이블 확인
initializeUsersTable();

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // 필수 필드 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 중복 이메일 확인
    const [existingUsers] = await pool.execute<User[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (email, password, name, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [email, hashedPassword, name, 'user']
    );

    // 생성된 사용자 정보 조회
    const [rows] = await pool.execute<User[]>(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const newUser = rows[0];

    console.log('New user created:', newUser);

    logger.info('회원가입 성공', { userId: newUser.id, email });

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    logger.error('회원가입 오류', { error });
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 