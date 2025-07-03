import { NextRequest, NextResponse } from 'next/server';
import { dbLogger } from '@/lib/logger';
import { pool } from '@/lib/database';

// GET: 캠페인 이력 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const campaignId = searchParams.get('campaign_id');
  const actionType = searchParams.get('action_type');
  const search = searchParams.get('search');
  const dateRange = searchParams.get('date_range');
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

    if (search && search.trim()) {
      whereConditions.push('(c.name LIKE ? OR ch.action_by LIKE ? OR ch.comments LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (dateRange && dateRange !== 'all') {
      switch (dateRange) {
        case 'today':
          whereConditions.push('DATE(ch.action_date) = CURDATE()');
          break;
        case 'week':
          whereConditions.push('ch.action_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
          break;
        case 'month':
          whereConditions.push('ch.action_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
          break;
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM campaign_history ch LEFT JOIN campaigns c ON ch.campaign_id = c.id ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = (countResult as any[])[0].total;

    // 전체 통계 데이터 조회 (페이징과 무관하게 전체 데이터 기준)
    const statsQuery = `
      SELECT 
        ch.action_type,
        COUNT(*) as count,
        DATE(ch.action_date) as action_date
      FROM campaign_history ch
      LEFT JOIN campaigns c ON ch.campaign_id = c.id
      ${whereClause}
      GROUP BY ch.action_type, DATE(ch.action_date)
    `;
    const [statsRows] = await pool.execute(statsQuery, queryParams);

    // 통계 계산
    const allStats = statsRows as any[];
    const totalHistory = allStats.reduce((sum, row) => sum + (Number(row.count) || 0), 0);
    const approvedCount = allStats.filter(row => row.action_type === 'approved').reduce((sum, row) => sum + (Number(row.count) || 0), 0);
    const updatedCount = allStats.filter(row => row.action_type === 'updated').reduce((sum, row) => sum + (Number(row.count) || 0), 0);
    
    // 오늘 활동 계산
    const today = new Date().toISOString().split('T')[0];
    const todayActivity = allStats.filter(row => row.action_date === today).reduce((sum, row) => sum + (Number(row.count) || 0), 0);

    // 페이징된 데이터 조회
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
      },
      statistics: {
        totalHistory,
        approvedCount,
        updatedCount,
        todayActivity
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