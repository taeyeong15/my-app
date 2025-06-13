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
    const [rows] = await pool.execute(`
      SELECT 
        id,
        name,
        description,
        criteria,
        estimated_count,
        actual_count,
        status,
        created_by,
        created_at,
        updated_at
      FROM customer_groups 
      ORDER BY created_at DESC
    `);
    
    // JSON 데이터 파싱
    const groups = (rows as any[]).map(row => {
      let criteria = {};
      
      try {
        if (row.criteria) {
          if (typeof row.criteria === 'string') {
            criteria = JSON.parse(row.criteria);
          } else {
            criteria = row.criteria;
          }
        }
      } catch (error) {
        console.warn(`고객 그룹 조건 파싱 실패 (그룹 ${row.id}):`, row.criteria);
        criteria = {};
      }
      
      return {
        ...row,
        criteria
      };
    });
    
    return NextResponse.json({ 
      groups,
      success: true 
    });
  } catch (error) {
    console.error('고객 그룹 조회 에러:', error);
    return NextResponse.json(
      { error: '고객 그룹을 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 