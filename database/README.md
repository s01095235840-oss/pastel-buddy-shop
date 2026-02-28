# 데이터베이스 설정 가이드

이 가이드는 Supabase에서 주문 내역 기능을 위한 데이터베이스 테이블을 설정하는 방법을 안내합니다.

## 📋 사전 준비

- Supabase 계정 및 프로젝트가 필요합니다
- Supabase Dashboard 접근 권한이 있어야 합니다

## 🔧 데이터베이스 설정 방법

### 1. Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: (자신의 프로젝트)

### 2. SQL Editor 실행

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭

### 3. SQL 스키마 실행

1. `schema.sql` 파일의 내용을 복사
2. SQL Editor에 붙여넣기
3. 우측 하단의 **Run** 버튼 클릭

이렇게 하면 다음 테이블들이 생성됩니다:
- `orders` - 주문 정보 테이블
- `order_items` - 주문 상품 상세 테이블

### 4. 테이블 확인

1. 좌측 메뉴에서 **Table Editor** 클릭
2. `orders`와 `order_items` 테이블이 생성되었는지 확인

## 📊 테이블 구조

### orders 테이블
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 주문 고유 ID (Primary Key) |
| user_id | UUID | 사용자 ID (Foreign Key) |
| order_number | VARCHAR(50) | 주문 번호 (예: ORD-2024-001) |
| total_amount | DECIMAL(10,2) | 총 주문 금액 |
| status | VARCHAR(20) | 주문 상태 (pending, processing, completed, cancelled) |
| created_at | TIMESTAMP | 주문 생성 시간 |
| updated_at | TIMESTAMP | 주문 수정 시간 |

### order_items 테이블
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 항목 고유 ID (Primary Key) |
| order_id | UUID | 주문 ID (Foreign Key) |
| product_id | INTEGER | 상품 ID |
| product_name | VARCHAR(255) | 상품명 |
| product_price | DECIMAL(10,2) | 상품 가격 |
| quantity | INTEGER | 수량 |
| subtotal | DECIMAL(10,2) | 소계 (가격 × 수량) |
| created_at | TIMESTAMP | 생성 시간 |

## 🔒 보안 설정 (RLS)

스키마에는 Row Level Security (RLS) 정책이 포함되어 있어, 각 사용자는 자신의 주문 내역만 조회할 수 있습니다.

## 🧪 테스트 데이터 삽입 (선택사항)

테스트를 위해 샘플 데이터를 삽입하려면:

1. 먼저 사용자 ID를 확인합니다:
   - Supabase Dashboard > Authentication > Users에서 자신의 User ID 복사

2. SQL Editor에서 다음 쿼리 실행 (user_id를 자신의 ID로 변경):

```sql
-- 샘플 주문 추가
INSERT INTO orders (user_id, order_number, total_amount, status)
VALUES 
  ('your-user-id-here', 'ORD-2024-001', 45000.00, 'completed'),
  ('your-user-id-here', 'ORD-2024-002', 32000.00, 'completed');

-- 샘플 주문 상품 추가
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
VALUES 
  ((SELECT id FROM orders WHERE order_number = 'ORD-2024-001'), 1, '디지털 플래너', 15000.00, 3, 45000.00),
  ((SELECT id FROM orders WHERE order_number = 'ORD-2024-002'), 2, '파스텔 포스터', 8000.00, 4, 32000.00);
```

## ✅ 설정 완료 확인

1. 웹사이트에 로그인
2. 우측 상단의 사용자 아이콘 클릭
3. **마이페이지** 선택
4. 주문 내역이 표시되는지 확인

## 🆘 문제 해결

### 테이블이 보이지 않는 경우
- SQL이 정상적으로 실행되었는지 확인
- SQL Editor에서 에러 메시지 확인
- Supabase 프로젝트가 올바른지 확인

### 주문 내역이 표시되지 않는 경우
- 로그인이 되어 있는지 확인
- 브라우저 콘솔에서 에러 메시지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### RLS 관련 오류가 발생하는 경우
- `schema.sql`의 RLS 정책 부분이 모두 실행되었는지 확인
- Supabase API 키가 올바른지 확인

## 📝 참고사항

- 주문 상태는 `pending`, `processing`, `completed`, `cancelled` 중 하나여야 합니다
- 모든 금액은 원화(KRW) 기준입니다
- 주문 번호는 중복될 수 없습니다
- 사용자는 자신의 주문만 조회할 수 있습니다 (RLS 적용)
