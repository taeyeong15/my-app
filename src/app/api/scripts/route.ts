import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

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

// GET: 스크립트 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const offset = (page - 1) * limit;

  console.log('Scripts API GET - 파라미터:', { page, limit, status, type, offset });

  try {
    let whereClause = 'WHERE 1=1';
    let countParams: any[] = [];
    let selectParams: any[] = [];

    if (status) {
      whereClause += ' AND status = ?';
      countParams.push(status);
      selectParams.push(status);
    }

    if (type) {
      whereClause += ' AND type = ?';
      countParams.push(type);
      selectParams.push(type);
    }

    console.log('Scripts API GET - 쿼리 파라미터:', { whereClause, countParams, selectParams });

    // 총 개수 조회
    console.log('Count 쿼리 실행 중...');
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM scripts ${whereClause}`,
      countParams
    );
    const total = (countResult as any[])[0].total;
    console.log('Count 결과:', total);

    // 데이터 조회 - 실제 테이블 구조에 맞게 수정
    selectParams.push(limit, offset);
    console.log('Select 쿼리 실행 중...', selectParams);
    
    const [rows] = await pool.execute(`
      SELECT 
        id, name, type, content, variables, status, 
        description, subject, approval_status, created_by, 
        approved_by, approved_at, created_at, updated_at
      FROM scripts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, selectParams);

    console.log('Select 결과 row 수:', (rows as any[]).length);

    // JSON 데이터 파싱
    const scripts = (rows as any[]).map(row => {
      let variables = {};
      
      try {
        if (row.variables) {
          variables = typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables;
        }
      } catch (error) {
        console.warn(`스크립트 ${row.id}의 variables JSON 파싱 실패:`, error);
        variables = {};
      }
      
      return {
        ...row,
        variables
      };
    });

    console.log('최종 scripts 데이터:', scripts.length, '개');

    return NextResponse.json({
      success: true,
      data: scripts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('스크립트 조회 오류 상세:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    
    return NextResponse.json({
      success: false,
      error: '스크립트 목록을 불러오는데 실패했습니다: ' + error.message
    }, { status: 500 });
  }
}

// POST: 새 스크립트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      content,
      variables,
      subject,
      status = 'draft',
      approval_status = 'pending',
      description,
      created_by
    } = body;

    const [result] = await pool.execute(`
      INSERT INTO scripts (
        name, type, content, variables, subject, status, approval_status, description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, type, content, 
      variables ? JSON.stringify(variables) : null,
      subject, status, approval_status, description, created_by
    ]);

    const insertId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      message: '스크립트가 생성되었습니다.',
      id: insertId
    });

  } catch (error: any) {
    console.error('스크립트 생성 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '스크립트 생성에 실패했습니다.'
    }, { status: 500 });
  }
}

// PUT: 스크립트 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      type,
      content,
      variables,
      subject,
      status,
      approval_status,
      description,
      updated_by
    } = body;

    const [result] = await pool.execute(`
      UPDATE scripts 
      SET 
        name = ?, type = ?, content = ?, variables = ?, subject = ?,
        status = ?, approval_status = ?, description = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      name, type, content, 
      variables ? JSON.stringify(variables) : null,
      subject, status, approval_status, description, id
    ]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 스크립트를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '스크립트가 수정되었습니다.'
    });

  } catch (error: any) {
    console.error('스크립트 수정 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '스크립트 수정에 실패했습니다.'
    }, { status: 500 });
  }
}

// DELETE: 스크립트 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '삭제할 스크립트 ID가 필요합니다.'
      }, { status: 400 });
    }

    const [result] = await pool.execute(
      'DELETE FROM scripts WHERE id = ?',
      [parseInt(id)]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 스크립트를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '스크립트가 삭제되었습니다.'
    });

  } catch (error: any) {
    console.error('스크립트 삭제 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '스크립트 삭제에 실패했습니다.'
    }, { status: 500 });
  }
} 