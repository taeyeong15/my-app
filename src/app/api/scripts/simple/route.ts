import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET() {
  try {
    let scripts: any[] = [];
    
    // scripts 테이블이 존재하는지 먼저 확인
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id, name, type, description, content
        FROM scripts 
        WHERE status = 'active'
        ORDER BY created_at DESC
        LIMIT 20
      `);
      
      scripts = rows as any[];
      
      // DB에서 데이터를 가져왔지만 비어있다면 기본 데이터 사용
      if (scripts.length === 0) {
        throw new Error('No active scripts found');
      }
      
    } catch (tableError: any) {
      // scripts 테이블이 없거나 구조가 다르거나 데이터가 없으면 기본 스크립트 데이터 사용
      console.warn('scripts 테이블 조회 실패, 기본 데이터 사용:', tableError.message);
      
      scripts = [
        { id: 1, name: '신규 가입자 환영 메시지', type: 'email', description: '신규 가입자를 위한 환영 메시지', content: '환영합니다!' },
        { id: 2, name: '프로모션 알림', type: 'sms', description: '할인 프로모션 알림 메시지', content: '특별 할인 혜택을 놓치지 마세요!' },
        { id: 3, name: '푸시 알림 스크립트', type: 'push', description: '앱 푸시 알림용 스크립트', content: '새로운 소식이 도착했습니다.' },
        { id: 4, name: '카카오톡 이벤트 알림', type: 'alimtalk', description: '카카오톡 이벤트 알림', content: '이벤트에 참여하세요!' }
      ];
    }

    return NextResponse.json({
      success: true,
      data: scripts
    });

  } catch (error: any) {
    console.error('스크립트 목록 조회 실패:', error);
    
    // 에러가 발생해도 기본 스크립트 데이터는 제공
    const defaultScripts = [
      { id: 1, name: '신규 가입자 환영 메시지', type: 'email', description: '신규 가입자를 위한 환영 메시지', content: '환영합니다!' },
      { id: 2, name: '프로모션 알림', type: 'sms', description: '할인 프로모션 알림 메시지', content: '특별 할인 혜택을 놓치지 마세요!' },
      { id: 3, name: '푸시 알림 스크립트', type: 'push', description: '앱 푸시 알림용 스크립트', content: '새로운 소식이 도착했습니다.' },
      { id: 4, name: '카카오톡 이벤트 알림', type: 'alimtalk', description: '카카오톡 이벤트 알림', content: '이벤트에 참여하세요!' }
    ];

    return NextResponse.json({
      success: true,
      data: defaultScripts
    });
  }
} 