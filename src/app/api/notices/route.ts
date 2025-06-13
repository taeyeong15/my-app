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

// GET: 공지사항 목록 조회
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
      `SELECT COUNT(*) as total FROM notices ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // 데이터 조회
    const [rows] = await pool.execute(`
      SELECT 
        *,
        CASE 
          WHEN type = 'general' THEN '일반'
          WHEN type = 'maintenance' THEN '점검'
          WHEN type = 'update' THEN '업데이트'
          WHEN type = 'emergency' THEN '긴급'
          WHEN type = 'event' THEN '이벤트'
          ELSE type
        END as type_label,
        CASE 
          WHEN priority = 'urgent' THEN '긴급'
          WHEN priority = 'high' THEN '높음'
          WHEN priority = 'normal' THEN '보통'
          WHEN priority = 'low' THEN '낮음'
          ELSE priority
        END as priority_label,
        CASE 
          WHEN status = 'draft' THEN '임시저장'
          WHEN status = 'published' THEN '게시됨'
          WHEN status = 'archived' THEN '보관됨'
          ELSE status
        END as status_label
      FROM notices
      ${whereClause}
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          WHEN 'low' THEN 4 
        END,
        created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    await dbLogger.info('공지사항 목록 조회', { 
      status, 
      type,
      page, 
      limit,
      total_count: total 
    });

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('공지사항 조회 오류:', error);
    await dbLogger.error('공지사항 조회 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '공지사항 목록을 불러오는데 실패했습니다.'
    }, { status: 500 });
  }
}

// POST: 새 공지사항 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      type = 'general',
      priority = 'normal',
      status = 'draft',
      target_audience = 'all',
      start_date,
      end_date,
      is_popup = false,
      is_important = false,
      attachment_url,
      attachment_name,
      created_by
    } = body;

    const [result] = await pool.execute(`
      INSERT INTO notices (
        title, content, type, priority, status, target_audience,
        start_date, end_date, is_popup, is_important, 
        attachment_url, attachment_name, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, content, type, priority, status, target_audience,
      start_date, end_date, is_popup, is_important,
      attachment_url, attachment_name, created_by
    ]);

    const insertId = (result as any).insertId;

    await dbLogger.info('새 공지사항 생성', { 
      notice_id: insertId,
      title,
      created_by 
    });

    return NextResponse.json({
      success: true,
      message: '공지사항이 생성되었습니다.',
      id: insertId
    });

  } catch (error: any) {
    console.error('공지사항 생성 오류:', error);
    await dbLogger.error('공지사항 생성 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '공지사항 생성에 실패했습니다.'
    }, { status: 500 });
  }
}

// PUT: 공지사항 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      content,
      type,
      priority,
      status,
      target_audience,
      start_date,
      end_date,
      is_popup,
      is_important,
      attachment_url,
      attachment_name,
      updated_by
    } = body;

    const [result] = await pool.execute(`
      UPDATE notices 
      SET 
        title = ?, content = ?, type = ?, priority = ?, status = ?,
        target_audience = ?, start_date = ?, end_date = ?,
        is_popup = ?, is_important = ?, attachment_url = ?,
        attachment_name = ?, updated_by = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title, content, type, priority, status,
      target_audience, start_date, end_date,
      is_popup, is_important, attachment_url,
      attachment_name, updated_by, id
    ]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 공지사항을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    await dbLogger.info('공지사항 수정', { 
      notice_id: id,
      title,
      updated_by 
    });

    return NextResponse.json({
      success: true,
      message: '공지사항이 수정되었습니다.'
    });

  } catch (error: any) {
    console.error('공지사항 수정 오류:', error);
    await dbLogger.error('공지사항 수정 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '공지사항 수정에 실패했습니다.'
    }, { status: 500 });
  }
}

// DELETE: 공지사항 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '삭제할 공지사항 ID가 필요합니다.'
      }, { status: 400 });
    }

    const [result] = await pool.execute(
      'DELETE FROM notices WHERE id = ?',
      [parseInt(id)]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 공지사항을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    await dbLogger.info('공지사항 삭제', { notice_id: id });

    return NextResponse.json({
      success: true,
      message: '공지사항이 삭제되었습니다.'
    });

  } catch (error: any) {
    console.error('공지사항 삭제 오류:', error);
    await dbLogger.error('공지사항 삭제 오류', { error: error.message });
    
    return NextResponse.json({
      success: false,
      error: '공지사항 삭제에 실패했습니다.'
    }, { status: 500 });
  }
} 