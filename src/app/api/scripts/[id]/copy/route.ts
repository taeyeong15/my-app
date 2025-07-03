import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import mysql from 'mysql2/promise';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scriptId = parseInt(params.id);
    if (isNaN(scriptId)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 스크립트 ID입니다.' },
        { status: 400 }
      );
    }

    const { newName, created_by } = await request.json();

    if (!newName || !newName.trim()) {
      return NextResponse.json(
        { success: false, message: '새 스크립트명을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!created_by || !created_by.trim()) {
      return NextResponse.json(
        { success: false, message: '생성자 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();

    try {
      // 원본 스크립트 조회
      const [rows] = await connection.execute(
        'SELECT * FROM scripts WHERE id = ?',
        [scriptId]
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, message: '스크립트를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const originalScript = rows[0];

      // 중복된 이름 확인
      const [duplicateCheck] = await connection.execute(
        'SELECT COUNT(*) as count FROM scripts WHERE name = ?',
        [newName.trim()]
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      if (duplicateCheck[0].count > 0) {
        return NextResponse.json(
          { success: false, message: '이미 존재하는 스크립트명입니다.' },
          { status: 400 }
        );
      }

      // 새 스크립트 생성 (복사)
      const [result] = await connection.execute(
        `INSERT INTO scripts (
          name, description, type, status, approval_status, 
          content, variables, subject, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          newName.trim(),
          originalScript.description,
          originalScript.type,
          'draft', // 복사된 스크립트는 초안 상태로 시작
          'pending', // 승인 대기 상태로 시작
          originalScript.content,
          originalScript.variables,
          originalScript.subject,
          created_by.trim()
        ]
      ) as [mysql.ResultSetHeader, mysql.FieldPacket[]];

      const newScriptId = result.insertId;

      // 생성된 스크립트 정보 조회
      const [newScriptRows] = await connection.execute(
        'SELECT * FROM scripts WHERE id = ?',
        [newScriptId]
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      return NextResponse.json({
        success: true,
        message: '스크립트가 성공적으로 복사되었습니다.',
        script: newScriptRows[0]
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('스크립트 복사 중 오류 발생:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '스크립트 복사 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 