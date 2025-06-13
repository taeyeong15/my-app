import { NextResponse } from 'next/server';
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

interface UserRow {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('로그인 시도:', email);

    // 사용자 조회
    const [users] = await pool.execute(
      'SELECT id, email, password, name, role FROM users WHERE email = ?',
      [email]
    );

    const userArray = users as UserRow[];

    if (userArray.length === 0) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다.', success: false },
        { status: 401 }
      );
    }

    const user = userArray[0];

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다.', success: false },
        { status: 401 }
      );
    }

    // 사용자 정보 반환 (비밀번호 제외)
    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    console.log('로그인 성공:', userInfo);
    return NextResponse.json({
      success: true,
      user: userInfo,
      message: '로그인에 성공했습니다.'
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.', success: false },
      { status: 500 }
    );
  }
} 