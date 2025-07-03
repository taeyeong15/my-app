-- 마케팅 캠페인 관리 시스템 - 초기 데이터
-- =============================================
-- 버전: 1.0.0
-- 설명: 시스템 운영에 필요한 기본 데이터 삽입

USE auth_db;

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

-- 오퍼 유형
INSERT INTO common_codes (category, sub_category, code, name, description, sort_order) VALUES
('OFFER', 'TYPE', 'DISCOUNT_RATE', '할인율', '퍼센트 할인', 1),
('OFFER', 'TYPE', 'DISCOUNT_AMOUNT', '할인금액', '고정 금액 할인', 2),
('OFFER', 'TYPE', 'FREE_SHIPPING', '무료배송', '배송비 면제 혜택', 3),
('OFFER', 'TYPE', 'GIFT', '사은품', '구매시 무료 증정품', 4),
('OFFER', 'TYPE', 'COUPON', '쿠폰', '다회 사용 가능한 쿠폰', 5),
('OFFER', 'TYPE', 'POINT', '포인트', '포인트 적립 혜택', 6)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 개인화 치환 변수
INSERT INTO common_codes (category, sub_category, code, name, description, sort_order) VALUES
('PERSONALIZATION', 'VARIABLE', 'USER_NAME', '고객명', '고객의 실명', 1),
('PERSONALIZATION', 'VARIABLE', 'USER_NICKNAME', '닉네임', '고객의 닉네임', 2),
('PERSONALIZATION', 'VARIABLE', 'USER_EMAIL', '이메일', '고객의 이메일 주소', 3),
('PERSONALIZATION', 'VARIABLE', 'USER_PHONE', '연락처', '고객의 휴대폰 번호', 4),
('PERSONALIZATION', 'VARIABLE', 'USER_BIRTHDAY', '생일', '고객의 생년월일', 5),
('PERSONALIZATION', 'VARIABLE', 'USER_AGE', '나이', '고객의 나이', 6),
('PERSONALIZATION', 'VARIABLE', 'USER_GENDER', '성별', '고객의 성별', 7),
('PERSONALIZATION', 'VARIABLE', 'USER_GRADE', '회원등급', '고객의 회원등급', 8),
('PERSONALIZATION', 'VARIABLE', 'COMPANY_NAME', '회사명', '우리 회사명', 9),
('PERSONALIZATION', 'VARIABLE', 'COMPANY_PHONE', '회사연락처', '회사 대표 전화번호', 10),
('PERSONALIZATION', 'VARIABLE', 'COMPANY_EMAIL', '회사이메일', '회사 대표 이메일', 11),
('PERSONALIZATION', 'VARIABLE', 'OFFER_NAME', '오퍼명', '해당 캠페인의 오퍼명', 12),
('PERSONALIZATION', 'VARIABLE', 'OFFER_DESCRIPTION', '오퍼설명', '오퍼 상세 설명', 13),
('PERSONALIZATION', 'VARIABLE', 'OFFER_VALUE', '혜택금액', '할인 금액이나 혜택', 14),
('PERSONALIZATION', 'VARIABLE', 'PRODUCT_NAME', '상품명', '대상 상품명', 15),
('PERSONALIZATION', 'VARIABLE', 'PRODUCT_PRICE', '상품가격', '상품의 가격', 16),
('PERSONALIZATION', 'VARIABLE', 'LINK_URL', '링크주소', '클릭 시 이동할 URL', 17),
('PERSONALIZATION', 'VARIABLE', 'UNSUBSCRIBE_URL', '수신거부링크', '수신거부 페이지 URL', 18),
('PERSONALIZATION', 'VARIABLE', 'CURRENT_DATE', '현재날짜', '오늘 날짜', 19),
('PERSONALIZATION', 'VARIABLE', 'EXPIRY_DATE', '만료날짜', '혜택 만료일', 20)
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

INSERT INTO customer_groups (group_name, description, conditions, customer_count, estimated_count, actual_count, del_yn, use_yn, status, created_date, created_dept, created_emp_no, generation_status) VALUES
('전체 고객', '모든 등록된 고객', '{"age_min": 0, "age_max": 999, "gender": "all"}', 48523, 50000, 48523, 'N', 'N', 'ACTIVE', CURDATE(), '관리부', 'ADM001', 'COMPLETED'),
('VIP 고객', '최고 등급 고객군', '{"membership_level": "VIP", "purchase_amount_min": 1000000}', 2341, 2500, 2341, 'N', 'N', 'ACTIVE', CURDATE(), '관리부', 'ADM001', 'COMPLETED'),
('신규 가입 고객', '최근 3개월 내 가입한 고객', '{"signup_date_from": "2024-10-01", "signup_date_to": "2024-12-31"}', 8234, 8500, 8234, 'N', 'N', 'ACTIVE', CURDATE(), '관리부', 'ADM001', 'COMPLETED'),
('20-30대 여성', '20대에서 30대 여성 고객', '{"age_min": 20, "age_max": 39, "gender": "female"}', 14823, 15000, 14823, 'N', 'N', 'ACTIVE', CURDATE(), '관리부', 'ADM001', 'COMPLETED'),
('휴면 고객', '6개월 이상 구매 이력이 없는 고객', '{"last_purchase_date_before": "2024-06-01"}', 11654, 12000, 11654, 'N', 'N', 'ACTIVE', CURDATE(), '관리부', 'ADM001', 'COMPLETED')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 5. 샘플 상품 데이터
-- ====================================================

INSERT INTO products (product_code, product_name, created_by) VALUES
('PROD001', '스마트폰 갤럭시 S24', 'admin@company.com'),
('PROD002', '노트북 맥북 프로', 'admin@company.com'),
('PROD003', '태블릿 아이패드', 'admin@company.com'),
('PROD004', '무선 이어폰 에어팟', 'admin@company.com'),
('PROD005', '스마트워치 애플워치', 'admin@company.com'),
('PROD006', '블루투스 스피커', 'admin@company.com'),
('PROD007', '휴대용 충전기', 'admin@company.com'),
('PROD008', '스마트TV 55인치', 'admin@company.com'),
('PROD009', '게이밍 키보드', 'admin@company.com'),
('PROD010', '무선 마우스', 'admin@company.com'),
('CAT001', '전자제품 카테고리', 'admin@company.com'),
('CAT002', '스마트폰 카테고리', 'admin@company.com'),
('CAT003', '컴퓨터 카테고리', 'admin@company.com'),
('CAT004', '액세서리 카테고리', 'admin@company.com'),
('BRAND001', '삼성 브랜드', 'admin@company.com'),
('BRAND002', '애플 브랜드', 'admin@company.com'),
('BRAND003', 'LG 브랜드', 'admin@company.com')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 6. 샘플 오퍼 데이터
-- ====================================================

INSERT INTO offers (name, type, description, value, value_type, start_date, end_date, max_usage, status, created_by) VALUES
('신규 가입 10% 할인', 'discount', '신규 회원 대상 첫 구매 10% 할인', 10.00, 'percentage', '2025-01-01', '2025-12-31', 10000, 'active', 'admin@company.com'),
('VIP 전용 20% 쿠폰', 'coupon', 'VIP 회원 전용 특별 할인 쿠폰', 20.00, 'percentage', '2025-01-01', '2025-03-31', 1000, 'active', 'admin@company.com'),
('생일 축하 5000원 증정', 'gift', '생일 고객 대상 5000원 상품권', 5000.00, 'fixed', '2025-01-01', '2025-12-31', NULL, 'active', 'admin@company.com'),
('구매 적립 2배 이벤트', 'point', '구매 시 적립금 2배 지급', 200.00, 'percentage', '2025-02-01', '2025-02-28', NULL, 'active', 'admin@company.com'),
('캐시백 3% 이벤트', 'cashback', '결제 금액의 3% 캐시백', 3.00, 'percentage', '2025-01-15', '2025-01-31', 5000, 'active', 'admin@company.com')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 오퍼-상품 연결 샘플 데이터
INSERT INTO offer_products (offer_id, target_code, created_by) VALUES
(1, 'PROD001', 'admin@company.com'),
(1, 'PROD002', 'admin@company.com'),
(1, 'CAT001', 'admin@company.com'),
(2, 'BRAND002', 'admin@company.com'),
(2, 'PROD003', 'admin@company.com'),
(3, 'CAT004', 'admin@company.com'),
(4, 'PROD001', 'admin@company.com'),
(4, 'PROD004', 'admin@company.com'),
(5, 'BRAND001', 'admin@company.com')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 7. 샘플 스크립트 데이터
-- ====================================================

INSERT INTO scripts (name, description, type, status, approval_status, content, variables, subject, created_by) VALUES
('신규 가입 환영 이메일', '신규 회원 가입 환영 메시지', 'email', 'active', 'approved', 
'안녕하세요 {{USER_NAME}}님,<br><br>{{COMPANY_NAME}}에 가입해 주셔서 감사합니다.<br><br>특별 혜택: {{OFFER_DESCRIPTION}}<br><br>지금 바로 쇼핑을 시작해보세요!', 
'["USER_NAME", "COMPANY_NAME", "OFFER_DESCRIPTION"]', '{{COMPANY_NAME}}에 오신 것을 환영합니다!', 'admin@company.com'),

('프로모션 SMS', '프로모션 안내 SMS', 'sms', 'active', 'approved',
'[{{COMPANY_NAME}}] {{USER_NAME}}님께 특별 혜택! {{OFFER_DESCRIPTION}} 지금 확인하세요. {{LINK}}', 
'["USER_NAME", "COMPANY_NAME", "OFFER_DESCRIPTION", "LINK"]', NULL, 'admin@company.com'),

('앱 푸시 알림', '모바일 앱 푸시 알림', 'push', 'active', 'approved',
'{{USER_NAME}}님, 놓치면 후회할 특별 이벤트! {{OFFER_DESCRIPTION}}', 
'["USER_NAME", "OFFER_DESCRIPTION"]', '특별 이벤트 안내', 'admin@company.com'),

('카카오톡 비즈메시지', '카카오톡 비즈니스 메시지', 'kakao', 'active', 'approved',
'{{USER_NAME}}님 안녕하세요!\n\n{{COMPANY_NAME}}에서 특별한 소식을 전해드립니다.\n\n{{OFFER_DESCRIPTION}}\n\n자세한 내용은 아래 버튼을 눌러 확인해보세요!', 
'["USER_NAME", "COMPANY_NAME", "OFFER_DESCRIPTION"]', NULL, 'admin@company.com'),

('웹사이트 팝업', '웹사이트 팝업 메시지', 'web', 'active', 'approved',
'<div class="popup-content"><h2>{{TITLE}}</h2><p>{{DESCRIPTION}}</p><button>{{CTA_TEXT}}</button></div>', 
'["TITLE", "DESCRIPTION", "CTA_TEXT"]', '특별 혜택 안내', 'admin@company.com')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 8. 샘플 공지사항 데이터
-- ====================================================

INSERT INTO notices (title, content, type, priority, is_pinned, created_by) VALUES
('시스템 정기 점검 안내', '매주 일요일 오전 2시-4시 정기 점검이 있습니다. 서비스 이용에 참고해 주세요.', 'maintenance', 'normal', TRUE, 'admin@company.com'),
('신규 기능 업데이트', '캠페인 우선순위 설정 기능이 추가되었습니다. 승인 요청 시 우선순위를 선택할 수 있습니다.', 'announcement', 'high', FALSE, 'admin@company.com'),
('보안 정책 변경 안내', '비밀번호 정책이 강화되었습니다. 8자리 이상, 특수문자 포함이 필수입니다.', 'notice', 'high', FALSE, 'admin@company.com')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ====================================================
-- 9. 시스템 설정 확인
-- ====================================================

-- 외래키 제약조건 확인
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'auth_db' 
AND CONSTRAINT_TYPE = 'FOREIGN KEY';

-- 인덱스 확인
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'auth_db' 
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- 데이터 삽입 완료 로그
INSERT INTO system_logs (level, message, meta) VALUES
('info', 'Initial data insertion completed', '{"version": "1.0.0", "tables_populated": 9, "timestamp": "2025-01-17"}');

COMMIT; 