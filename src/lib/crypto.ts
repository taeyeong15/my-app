import crypto from 'crypto';

// 암호화 설정
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

/**
 * 마스터 키 생성 (시스템별로 고유한 키)
 */
function getMasterKey(): Buffer {
  const masterSecret = process.env.MASTER_SECRET || 'default-master-secret-change-this';
  return crypto.scryptSync(masterSecret, 'salt', KEY_LENGTH);
}

/**
 * 문자열 암호화
 */
export function encrypt(text: string): string {
  try {
    const key = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // IV + 암호화된 데이터 결합
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('암호화 실패:', error);
    throw new Error('데이터 암호화에 실패했습니다');
  }
}

/**
 * 문자열 복호화
 */
export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('잘못된 암호화 데이터 형식');
    }

    const key = getMasterKey();
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('복호화 실패:', error);
    throw new Error('데이터 복호화에 실패했습니다');
  }
}

/**
 * 환경변수가 암호화되어 있는지 확인
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  
  // 암호화된 데이터는 "ENC:" 접두사로 시작
  return value.startsWith('ENC:');
}

/**
 * 환경변수 값 복호화 (필요시)
 */
export function getDecryptedEnvValue(key: string): string | undefined {
  const value = process.env[key];
  
  if (!value) return undefined;
  
  if (isEncrypted(value)) {
    try {
      // "ENC:" 접두사 제거 후 복호화
      const encryptedData = value.substring(4);
      return decrypt(encryptedData);
    } catch (error) {
      console.error(`환경변수 ${key} 복호화 실패:`, error);
      return undefined;
    }
  }
  
  return value;
}

/**
 * 민감한 환경변수들을 암호화된 형태로 변환
 */
export function encryptSensitiveEnvVars(envObject: Record<string, string>): Record<string, string> {
  const sensitiveKeys = [
    'DB_PASSWORD',
    'JWT_SECRET',
    'SMTP_PASSWORD',
    'REDIS_PASSWORD',
    'API_SECRET_KEY',
    'MASTER_SECRET'
  ];

  const result = { ...envObject };

  sensitiveKeys.forEach(key => {
    if (result[key] && !isEncrypted(result[key])) {
      try {
        result[key] = 'ENC:' + encrypt(result[key]);
      } catch (error) {
        console.error(`${key} 암호화 실패:`, error);
      }
    }
  });

  return result;
} 