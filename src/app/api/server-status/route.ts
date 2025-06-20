import { NextRequest, NextResponse } from 'next/server';

// 서버 시작 시간 (서버가 재시작될 때마다 새로 설정됨)
const SERVER_START_TIME = Date.now();

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      serverStartTime: SERVER_START_TIME,
      currentTime: Date.now(),
      uptime: Date.now() - SERVER_START_TIME
    });
  } catch (error) {
    console.error('서버 상태 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 상태 조회 실패' 
      },
      { status: 500 }
    );
  }
} 