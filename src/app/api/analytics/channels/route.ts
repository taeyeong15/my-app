import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const channelType = searchParams.get('type') || 'all';
    
    let whereClause = '';
    const whereClauses = [];
    
    // 기간 필터
    switch (period) {
      case 'last30days':
        whereClauses.push('period_end >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
        break;
      case 'last3months':
        whereClauses.push('period_end >= DATE_SUB(NOW(), INTERVAL 3 MONTH)');
        break;
      case 'last6months':
        whereClauses.push('period_end >= DATE_SUB(NOW(), INTERVAL 6 MONTH)');
        break;
    }
    
    // 채널 타입 필터
    if (channelType !== 'all') {
      whereClauses.push(`channel_type = '${channelType}'`);
    }
    
    if (whereClauses.length > 0) {
      whereClause = 'WHERE ' + whereClauses.join(' AND ');
    }

    const [analytics] = await pool.execute(`
      SELECT 
        id,
        channel_name,
        channel_type,
        period_start,
        period_end,
        total_sent,
        total_delivered,
        total_opened,
        total_clicked,
        total_converted,
        total_unsubscribed,
        total_bounced,
        delivery_rate,
        open_rate,
        click_rate,
        conversion_rate,
        unsubscribe_rate,
        bounce_rate,
        cost,
        revenue,
        roi,
        avg_response_time,
        peak_send_time,
        best_day_of_week,
        created_at,
        updated_at
      FROM channel_analytics 
      ${whereClause}
      ORDER BY period_end DESC, channel_name ASC
    `) as any[];

    return NextResponse.json({
      success: true,
      analytics: analytics || []
    });

  } catch (error) {
    console.error('채널 분석 데이터 조회 에러:', error);
    return NextResponse.json(
      { error: '채널 분석 데이터를 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 