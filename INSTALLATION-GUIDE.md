# 마케팅 캠페인 관리 시스템 - 설치 가이드

## 📋 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [설치 준비사항](#설치-준비사항)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [애플리케이션 설치](#애플리케이션-설치)
5. [Docker 배포](#docker-배포)
6. [보안 설정](#보안-설정)
7. [운영 관리](#운영-관리)
8. [문제 해결](#문제-해결)

## 🖥️ 시스템 요구사항

### 최소 사양
- **CPU**: 2코어 이상
- **메모리**: 4GB RAM 이상
- **디스크**: 20GB 이상 여유공간
- **네트워크**: 인터넷 연결 (초기 설치 시)

### 지원 운영체제
- Windows Server 2019 이상
- Ubuntu 20.04 LTS 이상
- CentOS 8 이상
- macOS 12 이상 (개발용)

### 필수 소프트웨어
- Node.js 18.17.0 이상
- MySQL 8.0 이상
- Docker 20.10 이상 (Docker 배포 시)

## 🔧 설치 준비사항

### 1. 소스코드 다운로드
```bash
# Git으로 다운로드
git clone <repository-url>
cd my-app

# 또는 압축파일 압축 해제
unzip campaign-system-v1.0.0.zip
cd campaign-system
```

### 2. Node.js 설치 확인
```bash
node --version  # v18.17.0 이상이어야 함
npm --version   # v9.0.0 이상이어야 함
```

### 3. MySQL 설치 및 설정
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server-8.0

# CentOS/RHEL
sudo yum install mysql-server

# Windows
# MySQL 공식 사이트에서 설치 프로그램 다운로드
```

## 🗄️ 데이터베이스 설정

### 1. MySQL 서비스 시작
```bash
# Linux
sudo systemctl start mysql
sudo systemctl enable mysql

# Windows
net start MySQL80
```

### 2. 데이터베이스 및 사용자 생성
```sql
-- MySQL 루트 계정으로 접속 후 실행
CREATE DATABASE campaign_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'campaign_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON campaign_db.* TO 'campaign_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 스키마 및 초기 데이터 설정
```bash
# 스키마 생성
mysql -u campaign_user -p campaign_db < database/schema.sql

# 초기 데이터 삽입
mysql -u campaign_user -p campaign_db < database/initial-data.sql
```

## 📦 애플리케이션 설치

### 1. 의존성 패키지 설치
```bash
# 온라인 환경
npm install

# 오프라인 환경 (미리 다운로드된 패키지 사용)
npm install --offline --prefer-offline
```

### 2. 환경변수 설정
```bash
# 환경변수 파일 생성
cp env.template .env

# .env 파일 편집 (필수)
# - JWT_SECRET: 32자 이상의 랜덤 문자열
# - DB_PASSWORD: 데이터베이스 비밀번호
# - 기타 설정값들
```

### 3. 애플리케이션 빌드
```bash
# 프로덕션 빌드
npm run build:prod

# 빌드 확인
ls -la .next/
```

### 4. 애플리케이션 시작
```bash
# 프로덕션 모드로 시작
npm start

# 또는 PM2를 사용한 프로세스 관리
npm install -g pm2
pm2 start npm --name "campaign-system" -- start
pm2 save
pm2 startup
```

## 🐳 Docker 배포

### 1. Docker 이미지 빌드
```bash
# 애플리케이션 이미지 빌드
docker build -t campaign-system:1.0.0 .

# 빌드 확인
docker images | grep campaign-system
```

### 2. 환경변수 파일 준비
```bash
# Docker 환경변수 파일 생성
cp env.template .env.docker

# 필수 변수 설정
# - DB_ROOT_PASSWORD
# - DB_PASSWORD  
# - JWT_SECRET
# - REDIS_PASSWORD
```

### 3. Docker Compose로 전체 서비스 실행
```bash
# 프로덕션 환경 시작
docker-compose -f docker-compose.prod.yml up -d

# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f app
```

## 🔒 보안 설정

### 1. 필수 보안 설정
```bash
# 1. 기본 관리자 비밀번호 변경
# 웹 인터페이스에서 admin@company.com 계정의 비밀번호 변경

# 2. JWT 비밀키 생성
openssl rand -base64 32

# 3. 파일 권한 설정
chmod 600 .env
chmod 700 logs/
chmod 755 uploads/

# 4. 방화벽 설정 (포트 3000만 허용)
sudo ufw allow 3000/tcp
sudo ufw enable
```

### 2. SSL 인증서 설정 (권장)
```bash
# Let's Encrypt 인증서 발급
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Nginx 설정 (ssl 디렉토리에 인증서 복사)
sudo cp /etc/letsencrypt/live/your-domain.com/*.pem ./ssl/
```

### 3. 보안 점검
```bash
# 의존성 보안 취약점 검사
npm audit

# 패키지 업데이트 확인
npm outdated

# 보안 설정 확인
npm run security:check
```

## 🔧 운영 관리

### 1. 로그 관리
```bash
# 로그 확인
tail -f logs/combined-$(date +%Y-%m-%d).log
tail -f logs/error-$(date +%Y-%m-%d).log

# 로그 정리 (30일 이상 된 로그 삭제)
npm run logs:clean
```

### 2. 데이터베이스 백업
```bash
# 데이터베이스 백업
mkdir -p backup
npm run backup:db

# 백업 파일 확인
ls -la backup/
```

### 3. 시스템 모니터링
```bash
# 프로세스 상태 확인
ps aux | grep node

# 메모리 사용량 확인
free -h

# 디스크 사용량 확인
df -h

# 네트워크 연결 확인
netstat -tlnp | grep 3000
```

### 4. 업데이트 절차
```bash
# 1. 백업 생성
npm run backup:db

# 2. 서비스 중지
pm2 stop campaign-system

# 3. 코드 업데이트
git pull origin master

# 4. 의존성 업데이트
npm install

# 5. 빌드
npm run build:prod

# 6. 서비스 재시작
pm2 restart campaign-system
```

## 🚨 문제 해결

### 일반적인 문제

#### 1. 데이터베이스 연결 실패
```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u campaign_user -p -h localhost campaign_db

# 방화벽 확인
sudo ufw status
```

#### 2. 애플리케이션 시작 실패
```bash
# 로그 확인
cat logs/error-$(date +%Y-%m-%d).log

# 포트 사용 확인
lsof -i :3000

# 환경변수 확인
cat .env | grep -v PASSWORD
```

#### 3. 성능 문제
```bash
# CPU/메모리 사용량 확인
top
htop

# 데이터베이스 성능 확인
mysql -u campaign_user -p -e "SHOW PROCESSLIST;"

# 애플리케이션 로그 확인
grep "ERROR\|WARN" logs/combined-$(date +%Y-%m-%d).log
```

### 연락처
- **기술 지원**: admin@company.com
- **시스템 관리**: support@company.com
- **보안 이슈**: security@company.com

---

## 📝 추가 리소스

- [운영 매뉴얼](OPERATION-MANUAL.md)
- [보안 가이드라인](SECURITY-GUIDE.md)
- [API 문서](API-DOCUMENTATION.md)
- [트러블슈팅 가이드](TROUBLESHOOTING.md) 