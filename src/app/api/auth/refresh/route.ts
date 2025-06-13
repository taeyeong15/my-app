import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshSession } from '@/lib/session';

export async function POST() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken) {
      return NextResponse.json({ 
        error: '세션이 존재하지 않습니다.' 
      }, { 
        status: 401 
      });
    }

    // 세션 갱신
    const newToken = await refreshSession(sessionToken.value);

    if (!newToken) {
      return NextResponse.json({ 
        error: '세션 갱신에 실패했습니다.' 
      }, { 
        status: 401 
      });
    }

    // 새로운 세션 토큰을 쿠키에 설정
    cookies().set('session_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json({ 
      error: '세션 갱신 중 오류가 발생했습니다.' 
    }, { 
      status: 500 
    });
  }
} 