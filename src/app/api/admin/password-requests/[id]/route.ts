import { NextRequest, NextResponse } from 'next/server';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const requestId = params.id;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다.', success: false },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'UPDATE password_reset_requests SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, requestId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다.', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: '요청 상태가 성공적으로 업데이트되었습니다.',
      success: true 
    });
  } catch (error) {
    console.error('요청 상태 업데이트 에러:', error);
    return NextResponse.json(
      { error: '요청 처리에 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 