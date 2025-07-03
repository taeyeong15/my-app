import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '5');
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || 'all';
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE 1=1';
    let whereParams: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      whereParams.push(searchPattern, searchPattern);
    }

    if (type !== 'all') {
      whereClause += ' AND type = ?';
      whereParams.push(type);
    }

    if (status !== 'all') {
      whereClause += ' AND status = ?';
      whereParams.push(status);
    }

    // 총 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM offers ${whereClause}`,
      whereParams
    );
    const total = (countResult as any[])[0].total;

    // 데이터 조회
    const mainQuery = `
      SELECT
        id,
        name,
        type,
        description,
        value,
        value_type,
        start_date,
        end_date,
        max_usage,
        usage_count,
        status,
        terms_conditions,
        created_by,
        created_at,
        updated_at
      FROM offers
      ${whereClause}
      ORDER by created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const [rows] = await pool.execute(mainQuery, whereParams);
    
    const offers = (rows as any[]).map(row => {
      return {
        ...row,
        // 날짜 포맷 정리
        start_date: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : '',
        end_date: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : ''
      };
    });

    // 검색 조건에 맞는 전체 데이터의 통계 조회
    const statsQuery = `
      SELECT 
        COUNT(*) as totalOffers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeOffers,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduledOffers,
        SUM(usage_count) as totalUsage
      FROM offers 
      ${whereClause}
    `;
    
    const [statsResult] = await pool.execute(statsQuery, whereParams);
    const statistics = (statsResult as any[])[0];

    return NextResponse.json({ 
      success: true,
      offers: offers,
      statistics: {
        totalOffers: statistics.totalOffers || 0,
        activeOffers: statistics.activeOffers || 0,
        scheduledOffers: statistics.scheduledOffers || 0,
        totalUsage: statistics.totalUsage || 0
      },
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
    console.error('오퍼 조회 오류 상세:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    return NextResponse.json({
      success: false,
      error: '오퍼를 불러오는데 실패했습니다: ' + error.message
    }, { status: 500 });
  }
} 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { basicInfo, conditions, products } = body;

    // 필수 필드 검증
    if (!basicInfo.name || !basicInfo.type || !basicInfo.value || !basicInfo.start_date || !basicInfo.end_date) {
      return NextResponse.json({
        success: false,
        error: '필수 입력 항목이 누락되었습니다.'
      }, { status: 400 });
    }

    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. 오퍼 기본 정보 삽입
      const [offerResult] = await connection.execute(`
        INSERT INTO offers (
          name, type, description, value, value_type, start_date, end_date,
          max_usage, status, terms_conditions, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        basicInfo.name,
        basicInfo.type,
        basicInfo.description || '',
        parseFloat(basicInfo.value),
        basicInfo.value_type,
        basicInfo.start_date,
        basicInfo.end_date,
        basicInfo.max_usage ? parseInt(basicInfo.max_usage) : null,
        basicInfo.status,
        basicInfo.terms_conditions || '',
        'system' // TODO: 실제 사용자 정보로 교체
      ]);

      const offerId = (offerResult as any).insertId;

      // 2. 오퍼 조건 삽입
      if (conditions) {
        await connection.execute(`
          INSERT INTO offer_conditions (
            offer_id, point_accumulation, duplicate_usage, multiple_discount,
            usage_start_time, usage_end_time, min_quantity, max_quantity,
            min_amount, max_amount, monday_available, tuesday_available,
            wednesday_available, thursday_available, friday_available,
            saturday_available, sunday_available, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          offerId,
          conditions.point_accumulation || false,
          conditions.duplicate_usage || false,
          conditions.multiple_discount || false,
          conditions.usage_start_time || null,
          conditions.usage_end_time || null,
          conditions.min_quantity ? parseInt(conditions.min_quantity) : null,
          conditions.max_quantity ? parseInt(conditions.max_quantity) : null,
          conditions.min_amount ? parseFloat(conditions.min_amount) : null,
          conditions.max_amount ? parseFloat(conditions.max_amount) : null,
          conditions.monday_available !== undefined ? conditions.monday_available : true,
          conditions.tuesday_available !== undefined ? conditions.tuesday_available : true,
          conditions.wednesday_available !== undefined ? conditions.wednesday_available : true,
          conditions.thursday_available !== undefined ? conditions.thursday_available : true,
          conditions.friday_available !== undefined ? conditions.friday_available : true,
          conditions.saturday_available !== undefined ? conditions.saturday_available : true,
          conditions.sunday_available !== undefined ? conditions.sunday_available : true,
          'system' // TODO: 실제 사용자 정보로 교체
        ]);
      }

      // 3. 오퍼 상품 삽입
      if (products && products.target_codes && products.target_codes.length > 0) {
        const insertValues = products.target_codes.map((code: string) => [offerId, code, 'system']);
        const placeholders = products.target_codes.map(() => '(?, ?, ?)').join(', ');
        
        await connection.execute(
          `INSERT INTO offer_products (offer_id, target_code, created_by) VALUES ${placeholders}`,
          insertValues.flat()
        );
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({
        success: true,
        message: '오퍼가 성공적으로 생성되었습니다.',
        offerId: offerId
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error: any) {
    console.error('오퍼 생성 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '오퍼 생성 중 오류가 발생했습니다: ' + error.message
    }, { status: 500 });
  }
}