import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    
    let whereClause = '';
    
    switch (period) {
      case 'last30days':
        whereClause = 'WHERE period_end >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'last3months':
        whereClause = 'WHERE period_end >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
        break;
      case 'last6months':
        whereClause = 'WHERE period_end >= DATE_SUB(NOW(), INTERVAL 6 MONTH)';
        break;
      default:
        whereClause = '';
    }

    const [analytics] = await pool.execute(`
      SELECT 
        id,
        offer_id,
        period_start,
        period_end,
        total_usage,
        total_discount_amount,
        total_order_amount,
        conversion_rate,
        avg_order_value,
        roi,
        customer_acquisition,
        repeat_usage,
        created_at,
        updated_at
      FROM offer_analytics 
      ${whereClause}
      ORDER BY period_end DESC, offer_id ASC
    `) as any[];

    return NextResponse.json({
      success: true,
      analytics: analytics || []
    });

  } catch (error) {
    console.error('오퍼 분석 데이터 조회 에러:', error);
    return NextResponse.json(
      { error: '오퍼 분석 데이터를 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 