import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'ansxodud2410!',
  database: 'auth_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodType = searchParams.get('type') || 'all';
    const year = searchParams.get('year') || 'all';
    
    let whereClause = '';
    const whereClauses = [];
    
    // 기간 타입 필터
    if (periodType !== 'all') {
      whereClauses.push(`period_type = '${periodType}'`);
    }
    
    // 연도 필터
    if (year !== 'all') {
      whereClauses.push(`YEAR(period_start) = ${year}`);
    }
    
    if (whereClauses.length > 0) {
      whereClause = 'WHERE ' + whereClauses.join(' AND ');
    }

    const [analytics] = await pool.execute(`
      SELECT 
        id,
        period_name,
        period_type,
        period_start,
        period_end,
        total_campaigns,
        total_sent,
        total_delivered,
        total_opened,
        total_clicked,
        total_converted,
        total_cost,
        total_revenue,
        avg_delivery_rate,
        avg_open_rate,
        avg_click_rate,
        avg_conversion_rate,
        roi,
        customer_acquisition,
        customer_retention_rate,
        top_performing_channel,
        top_performing_campaign,
        budget_utilization,
        created_at,
        updated_at
      FROM period_analytics 
      ${whereClause}
      ORDER BY period_start DESC
    `) as any[];

    return NextResponse.json({
      success: true,
      analytics: analytics || []
    });

  } catch (error) {
    console.error('기간 분석 데이터 조회 에러:', error);
    return NextResponse.json(
      { error: '기간 분석 데이터를 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 