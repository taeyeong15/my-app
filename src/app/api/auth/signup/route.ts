import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { logger } from '@/lib/logger';

interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

// 데이터베이스 연결 테스트
async function testDatabaseConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log('Database connection test successful');

    // users 테이블 존재 여부 확인
    const [tables] = await connection.execute('SHOW TABLES LIKE "users"');
    console.log('Existing tables:', tables);

    if (Array.isArray(tables) && tables.length === 0) {
      // users 테이블이 없으면 생성
      await connection.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table created successfully');
    }

    // 테이블 구조 확인
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('Table structure:', columns);

    await connection.end();
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

// 서버 시작시 테이블 확인
testDatabaseConnection();

export async function POST(request: Request) {
  let connection;
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

    // 데이터베이스 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // 중복 이메일 확인
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      await connection.end();
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    const [result] = await connection.execute(
      'INSERT INTO users (email, password, name, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [email, hashedPassword, name, 'user']
    ) as mysql.ResultSetHeader[];

    // 생성된 사용자 정보 조회
    const [rows] = await connection.query(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const users = rows as User[];
    const newUser = users[0];

    console.log('New user created:', newUser);

    logger.info('회원가입 성공', { userId: newUser.id, email });

    await connection.end();

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });
  } catch (error) {
    logger.error('회원가입 오류', { error });
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        logger.error('데이터베이스 연결 종료 오류', { error: err });
      }
    }
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 