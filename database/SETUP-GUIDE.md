# 🚀 Timeline Shop - 완전한 데이터베이스 설정 가이드

이 가이드는 Timeline Shop의 모든 데이터베이스 기능을 설정하는 방법을 안내합니다.

## 📋 목차

1. [데이터베이스 구조 개요](#데이터베이스-구조-개요)
2. [설정 방법](#설정-방법)
3. [테이블 상세 설명](#테이블-상세-설명)
4. [테스트 방법](#테스트-방법)
5. [문제 해결](#문제-해결)

---

## 📊 데이터베이스 구조 개요

Timeline Shop은 다음 5개의 주요 테이블을 사용합니다:

```
┌─────────────────┐
│  auth.users     │ ← Supabase 기본 인증 테이블
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
┌────────▼────────┐    ┌──────────────┐    ┌─▼──────────┐
│ user_profiles   │    │   products   │    │ cart_items │
│ (사용자 프로필)  │    │   (제품)     │    │ (장바구니)  │
└─────────────────┘    └──────┬───────┘    └────────────┘
                              │
                    ┌─────────▼─────────┐
                    │     orders        │
                    │     (주문)        │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   order_items     │
                    │   (주문 상품)     │
                    └───────────────────┘
```

---

## 🔧 설정 방법

### 1단계: Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택: `fyyywvbhktfolpibknnd`

### 2단계: SQL 스키마 실행

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭
3. `complete-schema.sql` 파일 내용 전체 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭 (⌘ + Enter 또는 Ctrl + Enter)

### 3단계: 실행 확인

실행이 완료되면 다음 메시지가 표시됩니다:
```
Success. No rows returned
```

### 4단계: 테이블 확인

1. 좌측 메뉴에서 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ `user_profiles`
   - ✅ `products` (샘플 데이터 5개 포함)
   - ✅ `cart_items`
   - ✅ `orders`
   - ✅ `order_items`

---

## 📚 테이블 상세 설명

### 1. `user_profiles` - 사용자 프로필

회원가입 시 자동으로 생성되는 사용자 프로필 정보

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 사용자 고유 ID (auth.users와 연결) |
| `email` | VARCHAR(255) | 이메일 주소 |
| `full_name` | VARCHAR(100) | 전체 이름 (선택) |
| `phone` | VARCHAR(20) | 전화번호 (선택) |
| `address` | TEXT | 주소 (선택) |
| `created_at` | TIMESTAMP | 가입일 |
| `updated_at` | TIMESTAMP | 수정일 |

**특징:**
- 회원가입 시 자동으로 생성됨 (트리거)
- 본인 프로필만 조회/수정 가능 (RLS)

---

### 2. `products` - 제품

쇼핑몰 제품 정보

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | SERIAL | 제품 고유 ID |
| `name` | VARCHAR(255) | 제품명 |
| `description` | TEXT | 제품 설명 |
| `price` | DECIMAL(10,2) | 가격 |
| `image_url` | TEXT | 이미지 URL |
| `category` | VARCHAR(50) | 카테고리 (Stationery, Tech, Digital, Food, Living) |
| `tags` | TEXT[] | 태그 배열 |
| `stock` | INTEGER | 재고 수량 |
| `is_active` | BOOLEAN | 활성화 여부 |
| `created_at` | TIMESTAMP | 생성일 |
| `updated_at` | TIMESTAMP | 수정일 |

**특징:**
- 샘플 데이터 5개 자동 삽입
- 모든 사용자가 활성화된 제품 조회 가능
- 재고 관리 가능

---

### 3. `cart_items` - 장바구니

사용자별 장바구니 아이템

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 장바구니 아이템 ID |
| `user_id` | UUID | 사용자 ID |
| `product_id` | INTEGER | 제품 ID |
| `quantity` | INTEGER | 수량 |
| `created_at` | TIMESTAMP | 추가일 |
| `updated_at` | TIMESTAMP | 수정일 |

**특징:**
- 로그인한 사용자만 사용 가능
- 같은 제품은 중복 추가 불가 (수량만 증가)
- 본인 장바구니만 조회/수정/삭제 가능 (RLS)

---

### 4. `orders` - 주문

사용자의 주문 정보

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 주문 고유 ID |
| `user_id` | UUID | 사용자 ID |
| `order_number` | VARCHAR(50) | 주문 번호 (예: ORD-2024-01-001) |
| `total_amount` | DECIMAL(10,2) | 총 주문 금액 |
| `status` | VARCHAR(20) | 주문 상태 |
| `shipping_address` | TEXT | 배송 주소 |
| `phone` | VARCHAR(20) | 연락처 |
| `created_at` | TIMESTAMP | 주문일 |
| `updated_at` | TIMESTAMP | 수정일 |

**주문 상태:**
- `pending` - 대기중
- `processing` - 처리중
- `completed` - 완료
- `cancelled` - 취소

**특징:**
- 본인 주문만 조회 가능 (RLS)
- 주문 번호 자동 생성 함수 제공

---

### 5. `order_items` - 주문 상품

주문에 포함된 상품 상세 정보

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 주문 상품 ID |
| `order_id` | UUID | 주문 ID |
| `product_id` | INTEGER | 제품 ID |
| `product_name` | VARCHAR(255) | 제품명 (스냅샷) |
| `product_price` | DECIMAL(10,2) | 제품 가격 (스냅샷) |
| `quantity` | INTEGER | 수량 |
| `subtotal` | DECIMAL(10,2) | 소계 |
| `created_at` | TIMESTAMP | 생성일 |

**특징:**
- 주문 시점의 제품 정보 저장 (가격 변동 대비)
- 본인 주문의 상품만 조회 가능 (RLS)

---

## 🧪 테스트 방법

### 1. 제품 데이터 확인

```sql
SELECT * FROM products;
```

5개의 샘플 제품이 표시되어야 합니다.

### 2. 회원가입 테스트

1. 웹사이트에서 회원가입
2. SQL Editor에서 확인:

```sql
SELECT * FROM user_profiles;
```

가입한 이메일이 표시되어야 합니다.

### 3. 장바구니 테스트 (선택사항)

로그인 후 장바구니에 상품 추가 후:

```sql
SELECT * FROM cart_details WHERE user_id = 'your-user-id';
```

### 4. 주문 테스트용 샘플 데이터

테스트를 위해 샘플 주문을 생성하려면:

```sql
-- 1. 자신의 user_id 확인
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- 2. 샘플 주문 생성 (user_id를 위에서 확인한 값으로 변경)
INSERT INTO orders (user_id, order_number, total_amount, status)
VALUES 
  ('your-user-id-here', generate_order_number(), 45000.00, 'completed');

-- 3. 주문 상품 추가
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
VALUES 
  (
    (SELECT id FROM orders WHERE user_id = 'your-user-id-here' ORDER BY created_at DESC LIMIT 1),
    1,
    '시그니처 플래너',
    12000.00,
    3,
    36000.00
  );
```

---

## 🔍 유용한 쿼리

### 전체 주문 내역 조회

```sql
SELECT * FROM order_summary WHERE user_id = 'your-user-id';
```

### 장바구니 총액 계산

```sql
SELECT 
  user_id,
  SUM(subtotal) as cart_total
FROM cart_details
WHERE user_id = 'your-user-id'
GROUP BY user_id;
```

### 카테고리별 제품 수

```sql
SELECT 
  category,
  COUNT(*) as product_count,
  SUM(stock) as total_stock
FROM products
WHERE is_active = true
GROUP BY category;
```

---

## 🆘 문제 해결

### 문제 1: "permission denied for table" 오류

**원인:** RLS 정책 문제

**해결:**
```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'products';

-- 필요시 RLS 재설정
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### 문제 2: 회원가입 시 프로필이 생성되지 않음

**원인:** 트리거가 작동하지 않음

**해결:**
```sql
-- 트리거 확인
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 수동으로 프로필 생성
INSERT INTO user_profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);
```

### 문제 3: 제품 이미지가 표시되지 않음

**원인:** 이미지 경로 문제

**해결:**
- 제품 이미지는 `/src/assets/products/` 폴더에 있어야 합니다
- 또는 Supabase Storage를 사용하여 이미지 업로드

### 문제 4: 주문 번호 생성 오류

**해결:**
```sql
-- 주문 번호 생성 함수 테스트
SELECT generate_order_number();
```

---

## 📝 다음 단계

1. ✅ 데이터베이스 스키마 실행 완료
2. ✅ 샘플 데이터 확인
3. 🔄 애플리케이션에서 DB 연동 (다음 작업)
4. 🔄 장바구니 DB 연동
5. 🔄 주문 시스템 구현

---

## 💡 추가 정보

### Storage 설정 (이미지 업로드용)

제품 이미지를 Supabase Storage에 업로드하려면:

1. Dashboard > Storage > Create bucket
2. Bucket 이름: `products`
3. Public bucket으로 설정
4. 이미지 업로드 후 URL을 `products.image_url`에 저장

### 백업 권장사항

정기적으로 데이터베이스를 백업하세요:

```sql
-- 전체 데이터 백업 (SQL Editor에서 실행)
COPY (SELECT * FROM products) TO '/tmp/products_backup.csv' CSV HEADER;
COPY (SELECT * FROM orders) TO '/tmp/orders_backup.csv' CSV HEADER;
```

---

## 📞 지원

문제가 계속되면:
1. Supabase 공식 문서: https://supabase.com/docs
2. 프로젝트 로그 확인: Dashboard > Logs
3. SQL 에러 메시지 확인

---

**설정 완료!** 🎉

이제 애플리케이션에서 데이터베이스를 사용할 수 있습니다.
