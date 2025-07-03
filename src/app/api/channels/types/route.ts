import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';
export async function GET() {
  try {
    // channels 테이블에서 고유한 type 목록 조회
    const [rows] = await pool.execute(`
      SELECT DISTINCT 
        type,
        CASE 
          WHEN type = 'sms' THEN 'SMS'
          WHEN type = 'lms' THEN 'LMS'
          WHEN type = 'mms' THEN 'MMS'
          WHEN type = 'app_push' THEN '앱푸시'
          WHEN type = 'kakao_f' THEN '친구톡'
          WHEN type = 'kakao_al' THEN '알림톡'
          WHEN type = 'email' THEN '이메일'          
          ELSE type
        END as label
      FROM channels
      WHERE status = 'active'
      ORDER BY 
        CASE type 
          WHEN 'sms' THEN 1
          WHEN 'lms' THEN 2
          WHEN 'mms' THEN 3
          WHEN 'app_push' THEN 4
          WHEN 'kakao_f' THEN 5
          WHEN 'kakao_al' THEN 6
          WHEN 'email' THEN 7
          ELSE 8
        END
    `);

    const types = rows as { type: string; label: string }[];
    
    // 기본 타입이 없으면 기본값 제공
    if (types.length === 0) {
      return NextResponse.json({
        success: true,
        data: [
          { type: 'email', label: '이메일' },
          { type: 'sms', label: 'SMS' },
          { type: 'push', label: '푸시' },
          { type: 'alimtalk', label: '알림톡' }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      data: types
    });

  } catch (error: any) {
    console.error('채널 유형 조회 오류:', error);
    
    // 에러 시 기본값 반환
    return NextResponse.json({
      success: true,
      data: [
        { type: 'email', label: '이메일' },
        { type: 'sms', label: 'SMS' },
        { type: 'push', label: '푸시' },
        { type: 'alimtalk', label: '알림톡' }
      ]
    });
  }
} 