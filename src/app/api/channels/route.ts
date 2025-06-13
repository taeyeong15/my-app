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

// GET: 채널 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    // 총 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM channels ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // 데이터 조회
    const [rows] = await pool.execute(`
      SELECT 
        *,
        CASE 
          WHEN type = 'email' THEN '이메일'
          WHEN type = 'sms' THEN 'SMS'
          WHEN type = 'push' THEN '푸시'
          WHEN type = 'kakao' THEN '카카오톡'
          WHEN type = 'web' THEN '웹'
          WHEN type = 'mobile' THEN '모바일'
          ELSE type
        END as type_label,
        CASE 
          WHEN status = 'active' THEN '활성'
          WHEN status = 'inactive' THEN '비활성'
          WHEN status = 'maintenance' THEN '점검중'
          ELSE status
        END as status_label,
        ROUND(total_success / NULLIF(total_sent, 0) * 100, 2) as calculated_success_rate,
        ROUND(monthly_used / NULLIF(monthly_quota, 0) * 100, 2) as quota_usage_percent
      FROM channels
      ${whereClause}
      ORDER BY 
        CASE status 
          WHEN 'active' THEN 1 
          WHEN 'maintenance' THEN 2 
          WHEN 'inactive' THEN 3 
        END,
        type,
        name
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // JSON 데이터 파싱
    const channels = (rows as any[]).map(row => {
      let config = {};
      
      try {
        if (row.config) {
          config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
        }
      } catch (error) {
        console.warn(`채널 ${row.id}의 config 파싱 실패:`, row.config);
        config = {};
      }
      
      return {
        ...row,
        config,
        // 보안상 민감한 정보는 제외하고 반환
        api_key: row.api_key ? '***' : null,
        api_secret: row.api_secret ? '***' : null
      };
    });

    await dbLogger.info('채널 목록 조회', { 
      status, 
      type,
      page, 
      limit,
      total_count: total 
    });

    return NextResponse.json({
      success: true,
      data: channels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('채널 조회 오류:', error);
    await dbLogger.error('채널 조회 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '채널 목록을 불러오는데 실패했습니다.'
    }, { status: 500 });
  }
}

// POST: 새 채널 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      description,
      status = 'active',
      api_endpoint,
      api_key,
      api_secret,
      config,
      rate_limit = 1000,
      cost_per_message = 0,
      monthly_quota = 0,
      created_by
    } = body;

    const [result] = await pool.execute(`
      INSERT INTO channels (
        name, type, description, status, api_endpoint,
        api_key, api_secret, config, rate_limit, cost_per_message,
        monthly_quota, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, type, description, status, api_endpoint,
      api_key, api_secret, config ? JSON.stringify(config) : null,
      rate_limit, cost_per_message, monthly_quota, created_by
    ]);

    const insertId = (result as any).insertId;

    await dbLogger.info('새 채널 생성', { 
      channel_id: insertId,
      name,
      type,
      created_by 
    });

    return NextResponse.json({
      success: true,
      message: '채널이 생성되었습니다.',
      id: insertId
    });

  } catch (error: any) {
    console.error('채널 생성 오류:', error);
    await dbLogger.error('채널 생성 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '채널 생성에 실패했습니다.'
    }, { status: 500 });
  }
}

// PUT: 채널 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      type,
      description,
      status,
      api_endpoint,
      api_key,
      api_secret,
      config,
      rate_limit,
      cost_per_message,
      monthly_quota,
      updated_by
    } = body;

    // API 키가 '***'이면 업데이트하지 않음
    let updateQuery = `
      UPDATE channels 
      SET 
        name = ?, type = ?, description = ?, status = ?,
        api_endpoint = ?, config = ?, rate_limit = ?,
        cost_per_message = ?, monthly_quota = ?, updated_by = ?,
        updated_at = NOW()
    `;
    let params = [
      name, type, description, status, api_endpoint,
      config ? JSON.stringify(config) : null, rate_limit,
      cost_per_message, monthly_quota, updated_by
    ];

    if (api_key && api_key !== '***') {
      updateQuery += ', api_key = ?';
      params.push(api_key);
    }

    if (api_secret && api_secret !== '***') {
      updateQuery += ', api_secret = ?';
      params.push(api_secret);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.execute(updateQuery, params);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 채널을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    await dbLogger.info('채널 수정', { 
      channel_id: id,
      name,
      updated_by 
    });

    return NextResponse.json({
      success: true,
      message: '채널이 수정되었습니다.'
    });

  } catch (error: any) {
    console.error('채널 수정 오류:', error);
    await dbLogger.error('채널 수정 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '채널 수정에 실패했습니다.'
    }, { status: 500 });
  }
}

// DELETE: 채널 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '삭제할 채널 ID가 필요합니다.'
      }, { status: 400 });
    }

    // 채널 사용 여부 확인
    const [usageResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM campaigns WHERE type = (SELECT type FROM channels WHERE id = ?)',
      [parseInt(id)]
    );
    const usageCount = (usageResult as any[])[0].count;

    if (usageCount > 0) {
      return NextResponse.json({
        success: false,
        error: '해당 채널을 사용하는 캠페인이 있어 삭제할 수 없습니다.'
      }, { status: 400 });
    }

    const [result] = await pool.execute(
      'DELETE FROM channels WHERE id = ?',
      [parseInt(id)]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 채널을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    await dbLogger.info('채널 삭제', { channel_id: id });

    return NextResponse.json({
      success: true,
      message: '채널이 삭제되었습니다.'
    });

  } catch (error: any) {
    console.error('채널 삭제 오류:', error);
    await dbLogger.error('채널 삭제 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '채널 삭제에 실패했습니다.'
    }, { status: 500 });
  }
} 