import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    logger.info('로그아웃 시도');

    // 세션 토큰 쿠키 삭제
    cookies().delete('session_token');

    logger.info('로그아웃 성공');
    return NextResponse.json({ 
      success: true,
      message: '로그아웃되었습니다.' 
    });
  } catch (error) {
    logger.error('로그아웃 오류', { error });
    return NextResponse.json(
      { error: '로그아웃 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 