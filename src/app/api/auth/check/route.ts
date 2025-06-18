import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

// 동적 렌더링 강제 설정
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken) {
      return NextResponse.json({ 
        isAuthenticated: false,
        error: '인증되지 않았습니다.'
      }, { 
        status: 401 
      });
    }

    const session = await getSession(sessionToken.value);

    if (!session) {
      return NextResponse.json({ 
        isAuthenticated: false,
        error: '세션이 만료되었습니다.'
      }, { 
        status: 401 
      });
    }

    return NextResponse.json({ 
      isAuthenticated: true,
      user: session.user
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      isAuthenticated: false,
      error: '인증 확인에 실패했습니다.'
    }, { 
      status: 401 
    });
  }
} 