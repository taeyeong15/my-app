import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const [notices] = await pool.execute(`
      SELECT 
        id,
        title,
        content,
        type,
        status,
        publish_date,
        expiry_date,
        views,
        author,
        created_at,
        updated_at
      FROM notices
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      notices: notices || []
    });

  } catch (error) {
    console.error('공지사항 조회 에러:', error);
    return NextResponse.json(
      { error: '공지사항을 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, type, status, publishDate, expiryDate, author } = body;

    const [result] = await pool.execute(`
      INSERT INTO notices (title, content, type, status, publish_date, expiry_date, author, views, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `, [title, content, type, status, publishDate, expiryDate, author]);

    return NextResponse.json({
      success: true,
      message: '공지사항이 성공적으로 생성되었습니다.',
      id: (result as any).insertId
    });

  } catch (error) {
    console.error('공지사항 생성 에러:', error);
    return NextResponse.json(
      { error: '공지사항 생성에 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 