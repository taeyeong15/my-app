#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// 암호화 설정 (crypto.ts와 동일)
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

async function promptQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    console.log('🔐 환경변수 암호화 도구');
    console.log('='.repeat(50));

    // 환경 선택
    const environment = await promptQuestion('환경을 선택하세요 (dev/prod): ');
    
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
      process.exit(1);
    }

    // 마스터 시크릿 입력
    const masterSecret = await promptQuestion('마스터 시크릿을 입력하세요 (빈 값이면 기본값 사용): ');
    const finalMasterSecret = masterSecret || 'default-master-secret-change-this';

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
          const encryptedValue = 'ENC:' + encrypt(value, finalMasterSecret);
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
      modifiedLines.push(`MASTER_SECRET=${finalMasterSecret}`);
      console.log('✅ MASTER_SECRET 추가됨');
    }

    // 백업 생성
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`📁 원본 파일 백업: ${backupPath}`);

    // 암호화된 내용 저장
    fs.writeFileSync(envPath, modifiedLines.join('\n'));

    console.log('\n✨ 암호화 완료!');
    console.log(`📊 총 ${encryptedCount}개의 환경변수가 암호화되었습니다.`);
    console.log(`📂 파일: ${envFile}`);
    
    if (encryptedCount > 0) {
      console.log('\n⚠️  중요: 마스터 시크릿을 안전한 곳에 보관하세요!');
      console.log('   서버 시작 시 MASTER_SECRET 환경변수가 필요합니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

main(); 