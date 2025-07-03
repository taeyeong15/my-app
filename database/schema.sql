-- 마케팅 캠페인 관리 시스템 - 데이터베이스 스키마
-- ====================================================
-- 버전: 1.0.0
-- 생성일: 2025-01-17
-- 설명: 전체 테이블 스키마 및 인덱스 정의

-- 데이터베이스 생성 (실제 사용하는 데이터베이스명)
CREATE DATABASE IF NOT EXISTS auth_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE auth_db;

-- ====================================================
-- 1. 사용자 관리 테이블
-- ====================================================

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 비밀번호 재설정 요청 테이블
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 인덱스
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ====================================================
-- 2. 공통 코드 관리 테이블
-- ====================================================

-- 공통 코드 테이블
CREATE TABLE IF NOT EXISTS common_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 유니크 제약조건
    UNIQUE KEY uk_code (category, sub_category, code),
    
    -- 인덱스
    INDEX idx_category (category),
    INDEX idx_sub_category (sub_category),
    INDEX idx_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- 3. 채널 관리 테이블
-- ====================================================

-- 채널 테이블
CREATE TABLE IF NOT EXISTS channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('email', 'sms', 'push', 'kakao', 'web', 'mobile', 'app') NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    configuration JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- 4. 고객군 관리 테이블
-- ====================================================

-- 고객군 테이블 (실제 DB 구조 기준)
CREATE TABLE IF NOT EXISTS customer_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,
    conditions JSON,
    customer_count INT DEFAULT 0,
    estimated_count INT DEFAULT 0,
    actual_count INT DEFAULT 0,
    del_yn VARCHAR(1) DEFAULT 'N',
    use_yn VARCHAR(10) DEFAULT 'N',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_date DATE,
    created_dept VARCHAR(50),
    created_emp_no VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date DATE,
    updated_dept VARCHAR(50),
    updated_emp_no VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    generation_status ENUM('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED') DEFAULT 'DRAFT',
    generation_error TEXT,
    generation_requested_at TIMESTAMP,
    generation_completed_at TIMESTAMP,
    
    -- 인덱스
    INDEX idx_group_name (group_name),
    INDEX idx_status (status),
    INDEX idx_use_yn (use_yn),
    INDEX idx_del_yn (del_yn),
    INDEX idx_created_date (created_date),
    INDEX idx_created_dept (created_dept),
    INDEX idx_created_emp_no (created_emp_no),
    INDEX idx_generation_status (generation_status),
    INDEX idx_generation_requested_at (generation_requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- 5. 오퍼 관리 테이블
-- ====================================================

-- 오퍼 테이블 (실제 DB 구조 기준)
CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    value DECIMAL(10,2) NOT NULL,
    value_type ENUM('percentage', 'fixed') NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_usage INT DEFAULT 0,
    usage_count INT DEFAULT 0,
    terms_conditions TEXT,
    status ENUM('active', 'inactive', 'scheduled') DEFAULT 'active',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 오퍼 조건 테이블 (실제 DB 구조 기준)
CREATE TABLE IF NOT EXISTS offer_conditions (
    offer_id INT PRIMARY KEY,
    point_accumulation TINYINT(1) DEFAULT 0,
    duplicate_usage TINYINT(1) DEFAULT 0,
    multiple_discount TINYINT(1) DEFAULT 0,
    usage_start_time TIME,
    usage_end_time TIME,
    min_quantity INT DEFAULT 0,
    max_quantity INT DEFAULT 0,
    min_amount DECIMAL(15,2) DEFAULT 0.00,
    max_amount DECIMAL(15,2) DEFAULT 0.00,
    monday_available TINYINT(1) DEFAULT 1,
    tuesday_available TINYINT(1) DEFAULT 1,
    wednesday_available TINYINT(1) DEFAULT 1,
    thursday_available TINYINT(1) DEFAULT 1,
    friday_available TINYINT(1) DEFAULT 1,
    saturday_available TINYINT(1) DEFAULT 1,
    sunday_available TINYINT(1) DEFAULT 1,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    
    -- 인덱스
    INDEX idx_point_accumulation (point_accumulation),
    INDEX idx_duplicate_usage (duplicate_usage),
    INDEX idx_multiple_discount (multiple_discount),
    INDEX idx_usage_start_time (usage_start_time),
    INDEX idx_min_quantity (min_quantity),
    INDEX idx_min_amount (min_amount),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 상품 테이블
CREATE TABLE IF NOT EXISTS products (
    product_code VARCHAR(100) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_product_name (product_name),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 오퍼 적용 상품 테이블 (실제 DB 구조 기준)
CREATE TABLE IF NOT EXISTS offer_products (
    offer_id INT NOT NULL,
    target_code VARCHAR(100) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 복합 기본키
    PRIMARY KEY (offer_id, target_code),
    
    -- 외래키
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    FOREIGN KEY (target_code) REFERENCES products(product_code) ON DELETE CASCADE,
    
    -- 인덱스
    INDEX idx_target_code (target_code),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 캠페인-오퍼 연결 테이블 (API에서 실제 사용하는 테이블)
CREATE TABLE IF NOT EXISTS campaign_offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    offer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    
    -- 유니크 제약
    UNIQUE KEY uk_campaign_offer (campaign_id, offer_id),
    
    -- 인덱스
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_offer_id (offer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 캠페인-고객군 연결 테이블 (API에서 실제 사용하는 테이블)
CREATE TABLE IF NOT EXISTS campaign_customer_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    customer_group_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_group_id) REFERENCES customer_groups(id) ON DELETE CASCADE,
    
    -- 유니크 제약
    UNIQUE KEY uk_campaign_customer_group (campaign_id, customer_group_id),
    
    -- 인덱스
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_customer_group_id (customer_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 캠페인-스크립트 연결 테이블 (API에서 실제 사용하는 테이블)
CREATE TABLE IF NOT EXISTS campaign_scripts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    script_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
    
    -- 유니크 제약
    UNIQUE KEY uk_campaign_script (campaign_id, script_id),
    
    -- 인덱스
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_script_id (script_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- 6. 스크립트 관리 테이블
-- ====================================================

-- 스크립트 테이블 (실제 DB 구조 기준)
CREATE TABLE IF NOT EXISTS scripts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(100) DEFAULT 'draft',
    approval_status VARCHAR(100) DEFAULT 'pending',
    content TEXT NOT NULL,
    variables JSON,
    subject VARCHAR(255),
    created_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_approval_status (approval_status),
    INDEX idx_name (name),
    INDEX idx_created_by (created_by),
    INDEX idx_approved_by (approved_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- 7. 캠페인 관리 테이블
-- ====================================================

-- 캠페인 테이블 (실제 DB 구조 기준)
CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNING',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    spent DECIMAL(15,2) DEFAULT 0.00,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    description VARCHAR(500),
    target_audience VARCHAR(100),
    channels VARCHAR(100),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_created_by (created_by),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 캠페인 승인 요청 테이블
CREATE TABLE IF NOT EXISTS campaign_approval_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    requester_id INT NOT NULL,
    approver_id INT NOT NULL,
    request_message TEXT,
    approval_comment TEXT,
    priority ENUM('urgent', 'high', 'normal', 'low') DEFAULT 'normal',
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 인덱스
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 캠페인 이력 테이블
CREATE TABLE IF NOT EXISTS campaign_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_by VARCHAR(255),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- 인덱스
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    INDEX idx_action_by (action_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- 8. 공지사항 테이블
-- ====================================================

-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('notice', 'announcement', 'maintenance') DEFAULT 'notice',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    target_users JSON,
    view_count INT DEFAULT 0,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_pinned (is_pinned),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- 9. 시스템 로그 테이블 (선택사항)
-- ====================================================

-- 시스템 로그 테이블
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    level ENUM('error', 'warn', 'info', 'debug') NOT NULL,
    message TEXT NOT NULL,
    meta JSON,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 인덱스
    INDEX idx_level (level),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- 데이터베이스 스키마 버전 정보
-- ====================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 현재 스키마 버전 기록
INSERT INTO schema_migrations (version, description) VALUES 
('1.0.0', 'Initial schema creation') 
ON DUPLICATE KEY UPDATE executed_at = CURRENT_TIMESTAMP; 