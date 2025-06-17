#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 암호화 설정
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function getMasterKey(masterSecret) {
  return crypto.scryptSync(masterSecret, 'salt', KEY_LENGTH);
}

function encrypt(text, masterSecret) {
  try {
    const key = getMasterKey(masterSecret);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('암호화 실패:', error);
    throw new Error('데이터 암호화에 실패했습니다');
  }
}

function isEncrypted(value) {
  return value && value.startsWith('ENC:');
}

function main() {
  try {
    console.log('🔐 환경변수 자동 암호화 도구');
    console.log('='.repeat(50));

    // 명령행 인수로 환경과 마스터 시크릿 받기
    const args = process.argv.slice(2);
    const environment = args[0] || 'dev'; // 기본값: dev
    const masterSecret = args[1] || 'default-master-secret-change-this'; // 기본값

    let envFile;
    if (environment === 'dev') {
      envFile = '.env.development';
    } else if (environment === 'prod') {
      envFile = '.env.production';
    } else {
      envFile = '.env';
    }

    const envPath = path.join(process.cwd(), envFile);
    
    // .env 파일 존재 확인
    if (!fs.existsSync(envPath)) {
      console.error(`❌ ${envFile} 파일을 찾을 수 없습니다.`);
      console.log(`💡 먼저 다음 명령어를 실행하세요: npm run setup:${environment === 'dev' ? 'dev' : 'prod'}`);
      process.exit(1);
    }

    console.log(`📂 환경: ${environment}`);
    console.log(`📄 파일: ${envFile}`);
    console.log(`🔑 마스터 시크릿: ${masterSecret.substring(0, 10)}...`);

    // .env 파일 읽기
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    // 암호화할 키들
    const sensitiveKeys = [
      'DB_PASSWORD',
      'JWT_SECRET',
      'SMTP_PASSWORD',
      'REDIS_PASSWORD',
      'API_SECRET_KEY'
    ];

    let modifiedLines = [];
    let encryptedCount = 0;

    console.log('\n🔄 환경변수 암호화 중...');

    for (const line of envLines) {
      if (line.trim() === '' || line.startsWith('#')) {
        modifiedLines.push(line);
        continue;
      }

      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');

      if (sensitiveKeys.includes(key) && value && !isEncrypted(value)) {
        try {
          const encryptedValue = 'ENC:' + encrypt(value, masterSecret);
          modifiedLines.push(`${key}=${encryptedValue}`);
          console.log(`✅ ${key} 암호화 완료`);
          encryptedCount++;
        } catch (error) {
          console.error(`❌ ${key} 암호화 실패:`, error.message);
          modifiedLines.push(line);
        }
      } else {
        modifiedLines.push(line);
      }
    }

    // MASTER_SECRET 추가 (없는 경우)
    if (!envLines.some(line => line.startsWith('MASTER_SECRET='))) {
      modifiedLines.push(`MASTER_SECRET=${masterSecret}`);
      console.log('✅ MASTER_SECRET 추가됨');
    }

    // 백업 생성
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`📁 원본 파일 백업: ${path.basename(backupPath)}`);

    // 암호화된 내용 저장
    fs.writeFileSync(envPath, modifiedLines.join('\n'));

    console.log('\n✨ 암호화 완료!');
    console.log(`📊 총 ${encryptedCount}개의 환경변수가 암호화되었습니다.`);
    console.log(`📂 파일: ${envFile}`);
    
    if (encryptedCount > 0) {
      console.log('\n⚠️  중요: 마스터 시크릿을 안전한 곳에 보관하세요!');
      console.log('   서버 시작 시 MASTER_SECRET 환경변수가 필요합니다.');
    }

    console.log('\n🚀 다음 단계:');
    if (environment === 'dev') {
      console.log('   npm run dev');
    } else {
      console.log('   npm run build:prod');
      console.log('   npm run start:prod');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 사용법 안내
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
사용법: 
  node scripts/encrypt-env-auto.js [환경] [마스터시크릿]

예시:
  node scripts/encrypt-env-auto.js dev
  node scripts/encrypt-env-auto.js dev my-secret-key  
  node scripts/encrypt-env-auto.js prod ultra-secure-prod-key

환경 옵션:
  dev  - 개발 환경 (.env.development)
  prod - 운영 환경 (.env.production)
  `);
  process.exit(0);
}

main(); 