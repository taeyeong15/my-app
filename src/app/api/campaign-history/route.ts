import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { dbLogger } from '@/lib/logger';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// GET: 캠페인 이력 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const campaignId = searchParams.get('campaign_id');
  const actionType = searchParams.get('action_type');
  const offset = (page - 1) * limit;

  try {
    let whereConditions = [];
    let queryParams: any[] = [];

    if (campaignId) {
      whereConditions.push('ch.campaign_id = ?');
      queryParams.push(parseInt(campaignId));
    }

    if (actionType && actionType !== 'all') {
      whereConditions.push('ch.action_type = ?');
      queryParams.push(actionType);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM campaign_history ch LEFT JOIN campaigns c ON ch.campaign_id = c.id ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = (countResult as any[])[0].total;

    // 데이터 조회
    const mainQuery = `
      SELECT 
        ch.*,
        c.name as campaign_name,
        c.type as campaign_type,
        CASE 
          WHEN ch.action_type = 'created' THEN '생성됨'
          WHEN ch.action_type = 'updated' THEN '수정됨'
          WHEN ch.action_type = 'approved' THEN '승인됨'
          WHEN ch.action_type = 'rejected' THEN '거부됨'
          WHEN ch.action_type = 'started' THEN '시작됨'
          WHEN ch.action_type = 'paused' THEN '일시정지됨'
          WHEN ch.action_type = 'completed' THEN '완료됨'
          WHEN ch.action_type = 'deleted' THEN '삭제됨'
          ELSE ch.action_type
        END as action_label
      FROM campaign_history ch
      LEFT JOIN campaigns c ON ch.campaign_id = c.id
      ${whereClause}
      ORDER BY ch.action_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(mainQuery, queryParams);

    // JSON 데이터 파싱
    const history = (rows as any[]).map(row => {
      let changes = {};
      
      try {
        if (row.changes) {
          changes = typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes;
        }
      } catch (error) {
        console.warn(`이력 ${row.id}의 changes 파싱 실패:`, row.changes);
        changes = {};
      }
      
      return {
        ...row,
        changes
      };
    });

    return NextResponse.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('캠페인 이력 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '캠페인 이력을 불러오는데 실패했습니다.'
    }, { status: 500 });
  }
} 