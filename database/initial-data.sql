-- 마케팅 캠페인 관리 시스템 - 초기 데이터
-- =============================================
-- 버전: 1.0.0
-- 설명: 시스템 운영에 필요한 기본 데이터 삽입

USE campaign_db;

-- ====================================================
-- 1. 관리자 계정 생성
-- ====================================================

-- 기본 관리자 계정 (비밀번호: admin123! - 운영 시 반드시 변경)
INSERT INTO users (email, password, name, role, is_active) VALUES 
('admin@company.com', '$2b$12$XvY8nQGjJ8.Fw5KaQbYgPOX.GR2K.JGxYvQFhEaZGXgZZYHqYmQnK', '시스템 관리자', 'admin', TRUE),
('manager@company.com', '$2b$12$XvY8nQGjJ8.Fw5KaQbYgPOX.GR2K.JGxYvQFhEaZGXgZZYHqYmQnK', '캠페인 매니저', 'manager', TRUE),
('user@company.com', '$2b$12$XvY8nQGjJ8.Fw5KaQbYgPOX.GR2K.JGxYvQFhEaZGXgZZYHqYmQnK', '일반 사용자', 'user', TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 2. 공통 코드 데이터
-- ====================================================

-- 캠페인 유형
INSERT INTO common_codes (category, sub_category, code, name, description, sort_order) VALUES
('CAMPAIGN', 'TYPE', 'promotion', '프로모션', '상품 판매 촉진 캠페인', 1),
('CAMPAIGN', 'TYPE', 'awareness', '인지도 향상', '브랜드 인지도 향상 캠페인', 2),
('CAMPAIGN', 'TYPE', 'retention', '고객 유지', '기존 고객 유지 캠페인', 3),
('CAMPAIGN', 'TYPE', 'acquisition', '신규 고객 확보', '신규 고객 획득 캠페인', 4),
('CAMPAIGN', 'TYPE', 'loyalty', '로열티', '고객 충성도 향상 캠페인', 5),
('CAMPAIGN', 'TYPE', 'seasonal', '시즌 이벤트', '계절별 특별 이벤트', 6),
('CAMPAIGN', 'TYPE', 'launch', '신제품 런칭', '신제품 출시 캠페인', 7)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 우선순위
INSERT INTO common_codes (category, sub_category, code, name, description, sort_order) VALUES
('CAMPAIGN', 'PRIORITY', 'urgent', '긴급', '즉시 처리가 필요한 우선순위', 1),
('CAMPAIGN', 'PRIORITY', 'high', '높음', '높은 우선순위', 2),
('CAMPAIGN', 'PRIORITY', 'normal', '보통', '일반적인 우선순위', 3),
('CAMPAIGN', 'PRIORITY', 'low', '낮음', '낮은 우선순위', 4)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 액션 타입
INSERT INTO common_codes (category, sub_category, code, name, description, sort_order) VALUES
('CAMPAIGN', 'ACTION_TYPE', 'created', '생성됨', '캠페인 생성 액션', 1),
('CAMPAIGN', 'ACTION_TYPE', 'updated', '수정됨', '캠페인 수정 액션', 2),
('CAMPAIGN', 'ACTION_TYPE', 'approved', '승인됨', '캠페인 승인 액션', 3),
('CAMPAIGN', 'ACTION_TYPE', 'rejected', '거부됨', '캠페인 거부 액션', 4),
('CAMPAIGN', 'ACTION_TYPE', 'started', '시작됨', '캠페인 시작 액션', 5),
('CAMPAIGN', 'ACTION_TYPE', 'paused', '일시정지', '캠페인 일시정지 액션', 6),
('CAMPAIGN', 'ACTION_TYPE', 'completed', '완료됨', '캠페인 완료 액션', 7),
('CAMPAIGN', 'ACTION_TYPE', 'deleted', '삭제됨', '캠페인 삭제 액션', 8)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 3. 기본 채널 데이터
-- ====================================================

INSERT INTO channels (name, type, description, status, configuration) VALUES
('이메일 마케팅', 'email', '이메일을 통한 마케팅 메시지 발송', 'active', '{"smtp_host": "", "smtp_port": 587, "encryption": "tls"}'),
('SMS 발송', 'sms', 'SMS 메시지 발송', 'active', '{"provider": "", "api_key": "", "sender_number": ""}'),
('푸시 알림', 'push', '모바일 앱 푸시 알림', 'active', '{"fcm_key": "", "apns_cert": ""}'),
('카카오톡 비즈메시지', 'kakao', '카카오톡 비즈니스 메시지', 'active', '{"sender_key": "", "template_code": ""}'),
('웹사이트 팝업', 'web', '웹사이트 팝업 메시지', 'active', '{"display_rules": {}, "design_settings": {}}'),
('모바일 인앱', 'mobile', '모바일 앱 내 메시지', 'active', '{"sdk_version": "", "display_conditions": {}}')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 4. 샘플 고객군 데이터
-- ====================================================

INSERT INTO customer_groups (name, description, conditions, estimated_count, actual_count, created_by) VALUES
('전체 고객', '모든 등록된 고객', '{"age_min": 0, "age_max": 999, "gender": "all"}', 50000, 48523, 'admin@company.com'),
('VIP 고객', '최고 등급 고객군', '{"membership_level": "VIP", "purchase_amount_min": 1000000}', 2500, 2341, 'admin@company.com'),
('신규 가입 고객', '최근 3개월 내 가입한 고객', '{"signup_date_from": "2024-10-01", "signup_date_to": "2024-12-31"}', 8500, 8234, 'admin@company.com'),
('20-30대 여성', '20대에서 30대 여성 고객', '{"age_min": 20, "age_max": 39, "gender": "female"}', 15000, 14823, 'admin@company.com'),
('휴면 고객', '6개월 이상 구매 이력이 없는 고객', '{"last_purchase_date_before": "2024-06-01"}', 12000, 11654, 'admin@company.com')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 5. 샘플 오퍼 데이터
-- ====================================================

INSERT INTO offers (name, type, description, value, value_type, start_date, end_date, max_usage, status, created_by) VALUES
('신규 가입 10% 할인', 'discount', '신규 회원 대상 첫 구매 10% 할인', 10.00, 'percentage', '2025-01-01', '2025-12-31', 10000, 'active', 'admin@company.com'),
('VIP 전용 20% 쿠폰', 'coupon', 'VIP 회원 전용 특별 할인 쿠폰', 20.00, 'percentage', '2025-01-01', '2025-03-31', 1000, 'active', 'admin@company.com'),
('생일 축하 5000원 증정', 'gift', '생일 고객 대상 5000원 상품권', 5000.00, 'fixed', '2025-01-01', '2025-12-31', NULL, 'active', 'admin@company.com'),
('구매 적립 2배 이벤트', 'point', '구매 시 적립금 2배 지급', 200.00, 'percentage', '2025-02-01', '2025-02-28', NULL, 'active', 'admin@company.com'),
('캐시백 3% 이벤트', 'cashback', '결제 금액의 3% 캐시백', 3.00, 'percentage', '2025-01-15', '2025-01-31', 5000, 'active', 'admin@company.com')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 6. 샘플 스크립트 데이터
-- ====================================================

INSERT INTO scripts (name, type, description, subject, content, variables, created_by) VALUES
('신규 가입 환영 이메일', 'email', '신규 회원 가입 환영 메시지', '{{COMPANY_NAME}}에 오신 것을 환영합니다!', 
'안녕하세요 {{USER_NAME}}님,<br><br>{{COMPANY_NAME}}에 가입해 주셔서 감사합니다.<br><br>특별 혜택: {{OFFER_DESCRIPTION}}<br><br>지금 바로 쇼핑을 시작해보세요!', 
'["USER_NAME", "COMPANY_NAME", "OFFER_DESCRIPTION"]', 'admin@company.com'),

('프로모션 SMS', 'sms', '프로모션 안내 SMS', NULL, 
'[{{COMPANY_NAME}}] {{USER_NAME}}님께 특별 혜택! {{OFFER_DESCRIPTION}} 지금 확인하세요. {{LINK}}', 
'["USER_NAME", "COMPANY_NAME", "OFFER_DESCRIPTION", "LINK"]', 'admin@company.com'),

('앱 푸시 알림', 'push', '모바일 앱 푸시 알림', '특별 이벤트 안내', 
'{{USER_NAME}}님, 놓치면 후회할 특별 이벤트! {{OFFER_DESCRIPTION}}', 
'["USER_NAME", "OFFER_DESCRIPTION"]', 'admin@company.com'),

('카카오톡 비즈메시지', 'kakao', '카카오톡 비즈니스 메시지', NULL, 
'{{USER_NAME}}님 안녕하세요!\n\n{{COMPANY_NAME}}에서 특별한 소식을 전해드립니다.\n\n{{OFFER_DESCRIPTION}}\n\n자세한 내용은 아래 버튼을 눌러 확인해보세요!', 
'["USER_NAME", "COMPANY_NAME", "OFFER_DESCRIPTION"]', 'admin@company.com'),

('웹사이트 팝업', 'web', '웹사이트 팝업 메시지', '특별 혜택 안내', 
'<div class="popup-content"><h2>{{TITLE}}</h2><p>{{DESCRIPTION}}</p><button>{{CTA_TEXT}}</button></div>', 
'["TITLE", "DESCRIPTION", "CTA_TEXT"]', 'admin@company.com')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 7. 샘플 공지사항 데이터
-- ====================================================

INSERT INTO notices (title, content, type, priority, is_pinned, created_by) VALUES
('시스템 정기 점검 안내', '매주 일요일 오전 2시-4시 정기 점검이 있습니다. 서비스 이용에 참고해 주세요.', 'maintenance', 'normal', TRUE, 'admin@company.com'),
('신규 기능 업데이트', '캠페인 우선순위 설정 기능이 추가되었습니다. 승인 요청 시 우선순위를 선택할 수 있습니다.', 'announcement', 'high', FALSE, 'admin@company.com'),
('보안 정책 변경 안내', '비밀번호 정책이 강화되었습니다. 8자리 이상, 특수문자 포함이 필수입니다.', 'notice', 'high', FALSE, 'admin@company.com')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 8. 시스템 설정 확인
-- ====================================================

-- 외래키 제약조건 확인
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'campaign_db' 
AND CONSTRAINT_TYPE = 'FOREIGN KEY';

-- 인덱스 확인
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'campaign_db' 
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- 데이터 삽입 완료 로그
INSERT INTO system_logs (level, message, meta) VALUES
('info', 'Initial data insertion completed', '{"version": "1.0.0", "tables_populated": 8, "timestamp": "2025-01-17"}');

COMMIT; 