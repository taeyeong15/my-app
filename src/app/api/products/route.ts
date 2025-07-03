import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let sql = `
      SELECT 
        product_code,
        product_name,
        created_by,
        created_at
      FROM products 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // 검색 조건 추가
    if (search) {
      sql += ` AND (product_code LIKE ? OR product_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ` ORDER BY created_at DESC`;
    
    const [rows] = await db.execute(sql, params);
    const products = rows;
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 