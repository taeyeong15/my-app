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