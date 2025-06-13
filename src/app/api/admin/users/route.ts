import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/database';
import { verifySession } from '@/lib/session';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    return NextResponse.json({ 
      users: rows,
      success: true 
    });
  } catch (error) {
    console.error('사용자 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는데 실패했습니다.', success: false },
      { status: 500 }
    );
  }
} 