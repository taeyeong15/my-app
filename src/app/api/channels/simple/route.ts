import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET() {
  try {
    let channelTypes: any[] = [];
    
    // channels 테이블이 존재하는지 먼저 확인
    try {
      const [rows] = await pool.execute(`
        SELECT DISTINCT
          COALESCE(type, 'unknown') as code,
          COALESCE(name, 'unknown') as name
        FROM channels 
        WHERE status = 'active'
        ORDER BY code, name
      `);
      
      channelTypes = rows as any[];
      
      // DB에서 데이터를 가져왔지만 비어있다면 기본 데이터 사용
      if (channelTypes.length === 0) {
        throw new Error('No active channels found');
      }
      
    } catch (tableError: any) {
      // channels 테이블이 없거나 구조가 다르거나 데이터가 없으면 기본 채널 데이터 사용
      console.warn('channels 테이블 조회 실패, 기본 데이터 사용:', tableError.message);
      
      channelTypes = [
        { code: 'email', name: '이메일 발송' },
        { code: 'sms', name: 'SMS 발송' },  
        { code: 'push', name: '푸시 알림' },
        { code: 'kakao', name: '카카오톡' },
        { code: 'app', name: '앱 내 알림' },
        { code: 'web', name: '웹사이트' }
      ];
    }

    // 중복 제거 - code를 기준으로 유니크한 데이터만 반환
    const uniqueChannels = channelTypes.reduce((acc: any[], current: any) => {
      const existingChannel = acc.find(item => item.code === current.code);
      if (!existingChannel && current.code) { // 빈 코드 값 필터링
        acc.push(current);
      }
      return acc;
    }, []);

    return NextResponse.json({
      success: true,
      channels: uniqueChannels
    });

  } catch (error: any) {
    console.error('채널 목록 조회 실패:', error);
    
    // 에러가 발생해도 기본 채널 데이터는 제공
    const defaultChannels = [
      { code: 'email', name: '이메일 발송' },
      { code: 'sms', name: 'SMS 발송' },  
      { code: 'push', name: '푸시 알림' },
      { code: 'kakao', name: '카카오톡' },
      { code: 'app', name: '앱 내 알림' },
      { code: 'web', name: '웹사이트' }
    ];

    return NextResponse.json({
      success: true,
      channels: defaultChannels
    });
  }
} 