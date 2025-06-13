import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const offset = (page - 1) * limit;

    // WHERE 조건 구성
    let whereConditions = [];
    let queryParams: any[] = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    if (type && type !== 'all') {
      whereConditions.push('type = ?');
      queryParams.push(type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 전체 개수 조회
    let total = 0;
    if (whereConditions.length > 0) {
      const countQuery = `SELECT COUNT(*) as total FROM campaigns ${whereClause}`;
      const [countResult] = await db.execute(countQuery, queryParams);
      total = (countResult as any[])[0].total;
    } else {
      const [countResult] = await db.execute('SELECT COUNT(*) as total FROM campaigns');
      total = (countResult as any[])[0].total;
    }

    // 상태별 캠페인 수 조회 (필터 조건 무시하고 전체 기준)
    const [statusCounts] = await db.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM campaigns 
      GROUP BY status
    `);

    // 상태별 카운트를 객체로 변환
    const statusCountMap = (statusCounts as any[]).reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    // 캠페인 목록 조회
    const mainQuery = `
      SELECT 
        id, name, type, status, start_date, end_date, budget, spent, impressions, clicks, 
        conversions, description, target_audience, channels, created_by, created_at
      FROM campaigns 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [campaigns] = await db.execute(mainQuery, queryParams);

    return NextResponse.json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      statusCounts: statusCountMap
    });

  } catch (error: any) {
    console.error('캠페인 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '캠페인 조회에 실패했습니다.'
    }, { status: 500 });
  }
}

// POST: 새 캠페인 생성
export async function POST(request: NextRequest) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const body = await request.json();
    const {
      name,
      type,
      description,
      status = 'PLANNING',
      start_date,
      end_date,
      budget,
      target_customer_groups,
      channels,
      offers,
      scripts,
      target_audience,
      created_by,
      is_draft = false // 임시저장 여부
    } = body;

    // 1. campaigns 테이블에 기본 정보 저장 (실제 존재하는 컬럼들만)
    const [campaignResult] = await connection.execute(`
      INSERT INTO campaigns (
        name, type, description, status, start_date, end_date, budget,
        channels, target_audience, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name || '',
      type || '',
      description || '',
      is_draft ? 'DRAFT' : (status || 'PLANNING'),
      start_date || null,
      end_date || null,
      budget || 0,
      channels || null,  // TEXT 타입이므로 단순하게 처리
      target_audience || '',
      created_by || 'unknown'
    ]);

    const campaignId = (campaignResult as any).insertId;

    // 캠페인 히스토리에 초기 상태 저장
    await connection.execute(`
      INSERT INTO campaign_history (
        campaign_id, action_type, action_by, previous_status, new_status, comments
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      campaignId, 
      'created',
      created_by || 'unknown',
      null, 
      is_draft ? 'DRAFT' : (status || 'PLANNING'),
      is_draft ? '임시저장으로 캠페인 생성' : '캠페인 생성'
    ]);

    // 2. 캠페인 고객군 저장 (campaign_customer_groups 테이블)
    if (target_customer_groups) {
      await connection.execute(`
        INSERT INTO campaign_customer_groups (campaign_id, customer_group_id) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
      `, [campaignId, target_customer_groups]);
    }

    // 3. 캠페인 오퍼 저장 (campaign_offers 테이블)
    if (offers) {
      await connection.execute(`
        INSERT INTO campaign_offers (campaign_id, offer_id) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
      `, [campaignId, offers]);
    }

    // 4. 캠페인 스크립트 저장 (campaign_scripts 테이블)
    if (scripts) {
      await connection.execute(`
        INSERT INTO campaign_scripts (campaign_id, script_id) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
      `, [campaignId, scripts]);
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: is_draft ? '캠페인이 임시저장되었습니다.' : '캠페인이 성공적으로 생성되었습니다.',
      id: campaignId,
      campaign: {
        id: campaignId,
        name: name || '',
        type: type || '',
        description: description || '',
        status: is_draft ? 'DRAFT' : (status || 'PLANNING'),
        start_date,
        end_date,
        budget: budget || 0,
        created_by: created_by || 'unknown'
      }
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('캠페인 생성 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '캠페인 생성에 실패했습니다.',
      details: error.message
    }, { status: 500 });
  } finally {
    connection.release();
  }
}