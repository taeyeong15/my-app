#!/bin/bash

# 마케팅 캠페인 관리 시스템 - 보안 점검 스크립트
# ================================================
# 실행: chmod +x scripts/security-check.sh && ./scripts/security-check.sh

echo "🔍 마케팅 캠페인 관리 시스템 보안 점검 시작..."
echo "================================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 점검 결과 카운터
PASS=0
WARN=0
FAIL=0

# 점검 함수
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARN++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL++))
}

# 1. 파일 권한 점검
echo -e "\n${BLUE}1. 파일 권한 점검${NC}"
echo "-------------------------------"

if [ -f ".env" ]; then
    env_perms=$(stat -c "%a" .env)
    if [ "$env_perms" = "600" ] || [ "$env_perms" = "400" ]; then
        check_pass ".env 파일 권한이 안전합니다 ($env_perms)"
    else
        check_fail ".env 파일 권한이 안전하지 않습니다 ($env_perms). 600 권한을 설정하세요."
    fi
else
    check_warn ".env 파일이 존재하지 않습니다."
fi

if [ -d "logs" ]; then
    logs_perms=$(stat -c "%a" logs)
    if [ "$logs_perms" = "700" ] || [ "$logs_perms" = "750" ]; then
        check_pass "logs 디렉토리 권한이 안전합니다 ($logs_perms)"
    else
        check_warn "logs 디렉토리 권한을 확인하세요 ($logs_perms)"
    fi
fi

# 2. 환경변수 보안 점검
echo -e "\n${BLUE}2. 환경변수 보안 점검${NC}"
echo "-------------------------------"

if [ -f ".env" ]; then
    # JWT 비밀키 길이 점검
    jwt_secret=$(grep "JWT_SECRET=" .env | cut -d'=' -f2)
    if [ ${#jwt_secret} -ge 32 ]; then
        check_pass "JWT 비밀키 길이가 충분합니다 (${#jwt_secret}자)"
    else
        check_fail "JWT 비밀키가 너무 짧습니다 (${#jwt_secret}자). 최소 32자 이상 설정하세요."
    fi
    
    # 기본값 사용 점검
    if grep -q "your-super-secret-jwt-key" .env; then
        check_fail "JWT_SECRET에 기본값이 설정되어 있습니다. 반드시 변경하세요."
    fi
    
    if grep -q "your-secure-database-password" .env; then
        check_fail "DB_PASSWORD에 기본값이 설정되어 있습니다. 반드시 변경하세요."
    fi
    
    # 프로덕션 모드 점검
    if grep -q "NODE_ENV=production" .env; then
        check_pass "프로덕션 모드로 설정되어 있습니다"
    else
        check_warn "NODE_ENV가 production으로 설정되지 않았습니다"
    fi
else
    check_fail ".env 파일이 존재하지 않습니다"
fi

# 3. 네트워크 보안 점검
echo -e "\n${BLUE}3. 네트워크 보안 점검${NC}"
echo "-------------------------------"

# 포트 사용 점검
if command -v netstat >/dev/null 2>&1; then
    open_ports=$(netstat -tlnp | grep -E ':3000|:3306|:6379' | wc -l)
    if [ $open_ports -gt 0 ]; then
        check_warn "데이터베이스/캐시 포트가 외부에 노출되어 있을 수 있습니다"
        netstat -tlnp | grep -E ':3000|:3306|:6379'
    else
        check_pass "네트워크 포트 설정이 안전합니다"
    fi
fi

# 4. Node.js 의존성 보안 점검
echo -e "\n${BLUE}4. Node.js 의존성 보안 점검${NC}"
echo "-------------------------------"

if command -v npm >/dev/null 2>&1; then
    # npm audit 실행
    audit_result=$(npm audit --audit-level=moderate 2>/dev/null)
    if [ $? -eq 0 ]; then
        check_pass "npm 의존성에 심각한 보안 취약점이 없습니다"
    else
        check_fail "npm 의존성에 보안 취약점이 발견되었습니다. 'npm audit fix' 실행을 권장합니다"
    fi
    
    # 오래된 패키지 점검
    outdated=$(npm outdated --json 2>/dev/null | jq -r 'keys[]' 2>/dev/null | wc -l)
    if [ $outdated -gt 0 ]; then
        check_warn "$outdated 개의 패키지 업데이트가 가능합니다"
    else
        check_pass "모든 패키지가 최신 상태입니다"
    fi
fi

# 5. 데이터베이스 보안 점검
echo -e "\n${BLUE}5. 데이터베이스 보안 점검${NC}"
echo "-------------------------------"

if command -v mysql >/dev/null 2>&1 && [ -f ".env" ]; then
    db_host=$(grep "DB_HOST=" .env | cut -d'=' -f2)
    db_user=$(grep "DB_USER=" .env | cut -d'=' -f2)
    db_password=$(grep "DB_PASSWORD=" .env | cut -d'=' -f2)
    db_name=$(grep "DB_NAME=" .env | cut -d'=' -f2)
    
    # 데이터베이스 연결 테스트
    if mysql -h "$db_host" -u "$db_user" -p"$db_password" -e "USE $db_name; SELECT 1;" >/dev/null 2>&1; then
        check_pass "데이터베이스 연결이 정상입니다"
        
        # 기본 관리자 계정 점검
        admin_count=$(mysql -h "$db_host" -u "$db_user" -p"$db_password" -e "USE $db_name; SELECT COUNT(*) FROM users WHERE email='admin@company.com' AND password LIKE '\$2b\$%';" -N 2>/dev/null)
        if [ "$admin_count" = "1" ]; then
            check_warn "기본 관리자 계정이 존재합니다. 비밀번호를 변경했는지 확인하세요"
        fi
    else
        check_fail "데이터베이스 연결에 실패했습니다"
    fi
fi

# 6. 로그 보안 점검
echo -e "\n${BLUE}6. 로그 보안 점검${NC}"
echo "-------------------------------"

if [ -d "logs" ]; then
    # 로그 파일에서 민감한 정보 검사
    if find logs -name "*.log" -exec grep -l -i "password\|secret\|token\|key" {} \; 2>/dev/null | head -1 >/dev/null; then
        check_warn "로그 파일에 민감한 정보가 포함되어 있을 수 있습니다"
    else
        check_pass "로그 파일에 민감한 정보가 발견되지 않았습니다"
    fi
    
    # 로그 파일 크기 점검
    large_logs=$(find logs -name "*.log" -size +100M 2>/dev/null)
    if [ -n "$large_logs" ]; then
        check_warn "큰 로그 파일이 발견되었습니다. 정리를 권장합니다"
    else
        check_pass "로그 파일 크기가 적절합니다"
    fi
fi

# 7. SSL/TLS 설정 점검
echo -e "\n${BLUE}7. SSL/TLS 설정 점검${NC}"
echo "-------------------------------"

if [ -d "ssl" ]; then
    if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
        check_pass "SSL 인증서 파일이 존재합니다"
        
        # 인증서 만료일 점검
        if command -v openssl >/dev/null 2>&1; then
            expiry_date=$(openssl x509 -in ssl/cert.pem -noout -enddate 2>/dev/null | cut -d'=' -f2)
            if [ $? -eq 0 ]; then
                expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null)
                current_timestamp=$(date +%s)
                days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [ $days_until_expiry -lt 30 ]; then
                    check_warn "SSL 인증서가 $days_until_expiry 일 후 만료됩니다"
                else
                    check_pass "SSL 인증서가 유효합니다 ($days_until_expiry 일 남음)"
                fi
            fi
        fi
    else
        check_warn "SSL 인증서 파일이 없습니다. HTTPS 설정을 권장합니다"
    fi
else
    check_warn "SSL 디렉토리가 없습니다. HTTPS 설정을 권장합니다"
fi

# 8. 백업 확인
echo -e "\n${BLUE}8. 백업 설정 점검${NC}"
echo "-------------------------------"

if [ -d "backup" ]; then
    recent_backup=$(find backup -name "*.sql" -mtime -7 2>/dev/null | head -1)
    if [ -n "$recent_backup" ]; then
        check_pass "최근 백업 파일이 존재합니다"
    else
        check_warn "최근 일주일 내 백업 파일이 없습니다"
    fi
else
    check_warn "backup 디렉토리가 없습니다. 정기 백업 설정을 권장합니다"
fi

# 최종 결과 출력
echo -e "\n${BLUE}보안 점검 결과 요약${NC}"
echo "================================================"
echo -e "${GREEN}통과: $PASS${NC}"
echo -e "${YELLOW}경고: $WARN${NC}"
echo -e "${RED}실패: $FAIL${NC}"

total=$((PASS + WARN + FAIL))
if [ $total -gt 0 ]; then
    score=$((PASS * 100 / total))
    echo -e "\n보안 점수: $score/100"
    
    if [ $score -ge 80 ]; then
        echo -e "${GREEN}보안 상태가 양호합니다! 🎉${NC}"
    elif [ $score -ge 60 ]; then
        echo -e "${YELLOW}보안 상태가 보통입니다. 경고사항을 검토하세요. ⚠️${NC}"
    else
        echo -e "${RED}보안 상태가 위험합니다. 즉시 개선이 필요합니다! 🚨${NC}"
    fi
fi

echo -e "\n${BLUE}권장사항:${NC}"
echo "1. 정기적으로 보안 점검을 실행하세요"
echo "2. 모든 기본 비밀번호를 변경하세요"
echo "3. HTTPS를 설정하여 통신을 암호화하세요"
echo "4. 정기 백업을 설정하고 복구 테스트를 수행하세요"
echo "5. 시스템 업데이트를 정기적으로 확인하세요"

exit 0 