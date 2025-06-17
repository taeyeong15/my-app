import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subCategory = searchParams.get('sub_category');

    let query = `
      SELECT category, sub_category, code, name, description, sort_order
      FROM common_codes 
      WHERE is_active = TRUE
    `;
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (subCategory) {
      query += ' AND sub_category = ?';
      params.push(subCategory);
    }

    query += ' ORDER BY category, sub_category, sort_order, code';

    const [codes] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      codes
    });
  } catch (error) {
    console.error('공통코드 조회 오류:', error);
    return NextResponse.json(
      { error: '공통코드를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'init_data') {
      // 우선순위 데이터 삽입
      const priorityData = [
        ['CAMPAIGN', 'PRIORITY', 'urgent', '긴급', '긴급 우선순위', 1],
        ['CAMPAIGN', 'PRIORITY', 'high', '높음', '높은 우선순위', 2],
        ['CAMPAIGN', 'PRIORITY', 'normal', '보통', '보통 우선순위', 3],
        ['CAMPAIGN', 'PRIORITY', 'low', '낮음', '낮은 우선순위', 4]
      ];

      // 액션타입 데이터 삽입
      const actionTypeData = [
        ['CAMPAIGN', 'ACTION_TYPE', 'created', '생성됨', '캠페인 생성 액션', 1],
        ['CAMPAIGN', 'ACTION_TYPE', 'updated', '수정됨', '캠페인 수정 액션', 2],
        ['CAMPAIGN', 'ACTION_TYPE', 'approved', '승인됨', '캠페인 승인 액션', 3],
        ['CAMPAIGN', 'ACTION_TYPE', 'rejected', '거부됨', '캠페인 거부 액션', 4],
        ['CAMPAIGN', 'ACTION_TYPE', 'started', '시작됨', '캠페인 시작 액션', 5],
        ['CAMPAIGN', 'ACTION_TYPE', 'paused', '일시정지', '캠페인 일시정지 액션', 6],
        ['CAMPAIGN', 'ACTION_TYPE', 'completed', '완료됨', '캠페인 완료 액션', 7],
        ['CAMPAIGN', 'ACTION_TYPE', 'deleted', '삭제됨', '캠페인 삭제 액션', 8]
      ];

      const allData = [...priorityData, ...actionTypeData];

      for (const data of allData) {
        const [category, sub_category, code, name, description, sort_order] = data;
        
        // 중복 체크
        const [existing] = await pool.execute(
          'SELECT id FROM common_codes WHERE category = ? AND sub_category = ? AND code = ?',
          [category, sub_category, code]
        );

        if ((existing as any[]).length === 0) {
          await pool.execute(
            'INSERT INTO common_codes (category, sub_category, code, name, description, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
            [category, sub_category, code, name, description, sort_order]
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: '초기 데이터가 성공적으로 삽입되었습니다.'
      });
    }

    return NextResponse.json(
      { error: '잘못된 액션입니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('공통코드 삽입 오류:', error);
    return NextResponse.json(
      { error: '공통코드 삽입에 실패했습니다.' },
      { status: 500 }
    );
  }
} 