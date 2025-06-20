import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import { RowDataPacket } from 'mysql2';

interface VerificationRow extends RowDataPacket {
  user_id: number;
  phone: string;
  code: string;
  expires_at: Date;
}

export async function POST(request: Request) {
  try {
    const { phone, code, newPassword } = await request.json();

    if (!phone || !code || !newPassword) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    logger.info('비밀번호 재설정 시도', { phone });

    // 인증 코드 확인
    const [verifications] = await pool.execute<VerificationRow[]>(
      'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND expires_at > NOW()',
      [phone, code]
    );

    if (verifications.length === 0) {
      logger.warn('유효하지 않은 인증 코드', { phone });
      return NextResponse.json(
        { error: '유효하지 않은 인증 코드입니다.' },
        { status: 400 }
      );
    }

    const verification = verifications[0];

    // 비밀번호 유효성 검사
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, verification.user_id]
    );

    // 사용된 인증 코드 삭제
    await pool.execute(
      'DELETE FROM verification_codes WHERE phone = ?',
      [phone]
    );

    logger.info('비밀번호 재설정 성공', { phone });

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 재설정되었습니다.'
    });
  } catch (error) {
    logger.error('비밀번호 재설정 오류', { error });
    return NextResponse.json(
      { error: '비밀번호 재설정에 실패했습니다.' },
      { status: 500 }
    );
  }
} 