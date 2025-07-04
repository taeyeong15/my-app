import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const offset = (page - 1) * limit;

  console.log('Scripts API GET - 파라미터:', { page, limit, search, status, type, offset });

  try {
    let whereClause = 'WHERE 1=1';
    let whereParams: any[] = [];

    // 검색 조건 추가 (스크립트명, 제목, 설명, 내용, 생성자)
    if (search && search !== 'all') {
      whereClause += ' AND (name LIKE ? OR subject LIKE ? OR description LIKE ? OR content LIKE ? OR created_by LIKE ?)';
      const searchTerm = `%${search}%`;
      whereParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // 상태 필터
    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      whereParams.push(status);
    }

    // 유형 필터
    if (type && type !== 'all') {
      whereClause += ' AND type = ?';
      whereParams.push(type);
    }



    console.log('Scripts API GET - 쿼리 파라미터:', { whereClause, whereParams });

    // 총 개수 조회
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM scripts ${whereClause}`,
      whereParams
    );
    const total = (countResult as any[])[0].total;
    console.log('Count 결과:', total);

    // 데이터 조회
    const mainQuery = `
      SELECT 
        id, name, description, type, status, content, 
        variables, subject, created_by, created_at, updated_at
      FROM scripts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    console.log('실행할 쿼리:', mainQuery);
    const [rows] = await pool.execute(mainQuery, whereParams);
    console.log('Select 결과 row 수:', (rows as any[]).length);

    // JSON 데이터 파싱
    const scripts = (rows as any[]).map(row => {
      let variables = null;
      
      try {
        if (row.variables) {
          variables = typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables;
        }
      } catch (error) {
        console.warn(`스크립트 ${row.id}의 variables JSON 파싱 실패:`, error);
        variables = null;
      }
      
      return {
        ...row,
        variables
      };
    });

    console.log('최종 scripts 데이터:', scripts.length, '개');

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: scripts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('스크립트 조회 오류 상세:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    return NextResponse.json({
      success: false,
      error: '스크립트 목록을 불러오는데 실패했습니다: ' + error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      type,
      content,
      subject,
      variables,
      created_by,
      sourceId,
      newName
    } = body;

    // 복사 API 분기
    if (sourceId) {
      if (!newName || !created_by) {
        return NextResponse.json({
          success: false,
          error: '새 이름과 생성자 정보가 필요합니다.'
        }, { status: 400 });
      }
      const [originalScripts] = await pool.execute(
        'SELECT * FROM scripts WHERE id = ?',
        [sourceId]
      );
      const originalScript = (originalScripts as any[])[0];
      if (!originalScript) {
        return NextResponse.json({
          success: false,
          error: '복사할 스크립트를 찾을 수 없습니다.'
        }, { status: 404 });
      }
      const insertQuery = `
        INSERT INTO scripts (
          name, description, type, status, content,
          variables, subject, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, NOW(), NOW())
      `;
      const [result] = await pool.execute(insertQuery, [
        newName,
        originalScript.description,
        originalScript.type,
        originalScript.content,
        originalScript.variables,
        originalScript.subject,
        created_by
      ]);
      const newScriptId = (result as any).insertId;
      return NextResponse.json({
        success: true,
        message: '스크립트가 성공적으로 복사되었습니다.',
        data: { id: newScriptId, name: newName }
      });
    }

    if (!name || !type || !content || !created_by) {
      return NextResponse.json({
        success: false,
        error: '필수 필드가 누락되었습니다. (name, type, content, created_by)'
      }, { status: 400 });
    }
    const variablesJson = variables ? JSON.stringify(variables) : null;
    const query = `
      INSERT INTO scripts (
        name, description, type, status, content,
        variables, subject, created_by
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      name,
      description || null,
      type,
      content,
      variablesJson,
      subject || null,
      created_by
    ]);
    const insertId = (result as any).insertId;
    return NextResponse.json({
      success: true,
      message: '스크립트가 성공적으로 생성되었습니다.',
      data: { id: insertId }
    });
  } catch (error: any) {
    console.error('스크립트 생성/복사 오류:', error);
    return NextResponse.json({
      success: false,
      error: '스크립트 생성/복사에 실패했습니다: ' + error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      name, 
      description, 
      type, 
      content, 
      subject, 
      variables,
      status
    } = body;

    // 필수 필드 검증
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '스크립트 ID가 필요합니다.'
      }, { status: 400 });
    }

    // 스크립트 존재 확인
    const [existingScript] = await pool.execute(
      'SELECT id FROM scripts WHERE id = ?',
      [id]
    );

    if ((existingScript as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: '스크립트를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // variables를 JSON 문자열로 변환
    const variablesJson = variables ? JSON.stringify(variables) : null;

    // 업데이트할 필드들 동적 구성
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    if (subject !== undefined) {
      updateFields.push('subject = ?');
      updateValues.push(subject);
    }
    if (variables !== undefined) {
      updateFields.push('variables = ?');
      updateValues.push(variablesJson);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    // updated_at은 항상 업데이트
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    if (updateFields.length === 1) { // updated_at만 있는 경우
      return NextResponse.json({
        success: false,
        error: '업데이트할 필드가 없습니다.'
      }, { status: 400 });
    }

    const query = `UPDATE scripts SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(query, updateValues);

    return NextResponse.json({
      success: true,
      message: '스크립트가 성공적으로 수정되었습니다.'
    });

  } catch (error: any) {
    console.error('스크립트 수정 오류:', error);
    return NextResponse.json({
      success: false,
      error: '스크립트 수정에 실패했습니다: ' + error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '스크립트 ID가 필요합니다.'
      }, { status: 400 });
    }

    // 스크립트 존재 확인
    const [existingScript] = await pool.execute(
      'SELECT id, name FROM scripts WHERE id = ?',
      [id]
    );

    if ((existingScript as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: '스크립트를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 스크립트 삭제
    await pool.execute('DELETE FROM scripts WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: '스크립트가 성공적으로 삭제되었습니다.'
    });

  } catch (error: any) {
    console.error('스크립트 삭제 오류:', error);
    return NextResponse.json({
      success: false,
      error: '스크립트 삭제에 실패했습니다: ' + error.message
    }, { status: 500 });
  }
} 