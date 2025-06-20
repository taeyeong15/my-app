import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/database';

interface UserRow {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  let connection;
  
  try {
    const body = await request.json();
    const { email, password } = body;

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.', success: false },
        { status: 400 }
      );
    }

    console.log('로그인 시도:', email, '시작 시간:', new Date().toISOString());

    // 데이터베이스 연결 타임아웃 설정 (5초)
    const connectionPromise = pool.getConnection();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('데이터베이스 연결 타임아웃')), 5000);
    });

    connection = await Promise.race([connectionPromise, timeoutPromise]) as any;

    // 사용자 조회 (인덱스 활용을 위해 email만 조회)
    const [users] = await connection.execute(
      'SELECT id, email, password, name, role FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    const userArray = users as UserRow[];

    if (userArray.length === 0) {
      console.log('사용자 없음:', email, '소요시간:', Date.now() - startTime, 'ms');
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다.', success: false },
        { status: 401 }
      );
    }

    const user = userArray[0];

    // 비밀번호 검증 (타임아웃 설정)
    const passwordCheckPromise = bcrypt.compare(password, user.password);
    const passwordTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('비밀번호 검증 타임아웃')), 3000);
    });

    const isPasswordValid = await Promise.race([passwordCheckPromise, passwordTimeoutPromise]) as boolean;

    if (!isPasswordValid) {
      console.log('비밀번호 불일치:', email, '소요시간:', Date.now() - startTime, 'ms');
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

    console.log('로그인 성공:', userInfo.email, '소요시간:', Date.now() - startTime, 'ms');
    
    return NextResponse.json({
      success: true,
      user: userInfo,
      message: '로그인에 성공했습니다.'
    });
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('로그인 오류:', error, '소요시간:', errorTime, 'ms');
    
    // 타임아웃 에러인지 확인
    if (error instanceof Error && error.message.includes('타임아웃')) {
      return NextResponse.json(
        { error: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.', success: false },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.', success: false },
      { status: 500 }
    );
  } finally {
    // 연결 해제
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('연결 해제 오류:', releaseError);
      }
    }
  }
} 