import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';
import { logger } from './logger';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const SESSION_TIMEOUT = 30 * 60; // 30분을 초 단위로 설정

interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface Session {
  user: SessionUser;
  expiresAt: Date;
  lastActivity: Date;
}

export async function createSession(user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // JWT 토큰 생성
  const token = await new SignJWT({ 
    user,
    lastActivity: now
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_TIMEOUT}s`)
    .setIssuedAt()
    .sign(SECRET_KEY);

  return token;
}

export async function refreshSession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    
    if (!payload || !payload.user) {
      return null;
    }

    // 새로운 세션 토큰 생성
    return createSession(payload.user as SessionUser);
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
}

export async function getSession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    
    if (!payload || !payload.user) {
      return null;
    }

    const now = Date.now();
    const lastActivity = payload.lastActivity as number * 1000;
    
    // 마지막 활동으로부터 30분이 지났는지 확인
    if (now - lastActivity > SESSION_TIMEOUT * 1000) {
      return null;
    }

    return {
      user: payload.user as SessionUser,
      expiresAt: new Date(payload.exp ? payload.exp * 1000 : now + SESSION_TIMEOUT * 1000),
      lastActivity: new Date(lastActivity)
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

export async function removeSession(token: string): Promise<void> {
  // 세션 삭제는 클라이언트에서 쿠키를 제거하는 것으로 처리됨
}

export async function verifySession(sessionToken: string): Promise<Session | null> {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // 세션 조회
    const [sessions] = await connection.execute(
      `SELECT s.*, u.id as user_id, u.email, u.name, u.role
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [sessionToken]
    );

    await connection.end();

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return null;
    }

    const session = sessions[0] as any;
    return {
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role
      },
      expiresAt: new Date(session.expires_at),
      lastActivity: new Date(session.last_activity)
    };
  } catch (error) {
    logger.error('세션 검증 오류', { error });
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        logger.error('데이터베이스 연결 종료 오류', { error: err });
      }
    }
    return null;
  }
} 