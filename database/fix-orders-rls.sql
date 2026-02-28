-- ============================================
-- orders 테이블 RLS 정책 수정 및 customer_email 컬럼 추가
-- ============================================
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- 
-- 이 스크립트는 orders 테이블에서 이메일 기반 주문 조회를 가능하게 합니다.

-- ============================================
-- 1. orders 테이블에 customer_email 컬럼 추가 (없으면)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
  END IF;
END $$;

-- ============================================
-- 2. 기존 orders의 customer_email 업데이트 (customers 테이블과 조인)
-- ============================================
UPDATE orders o
SET customer_email = c.email
FROM customers c
WHERE o.customer_id = c.id 
  AND o.customer_email IS NULL;

-- ============================================
-- 3. RLS 정책 수정
-- ============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders by email" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;

-- 이메일로 주문 조회 가능하도록 정책 생성
CREATE POLICY "Anyone can view orders by email"
  ON orders FOR SELECT
  USING (true);

-- 주문 삽입 정책 (결제 승인 시 필요)
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- 주문 업데이트 정책
CREATE POLICY "Anyone can update orders"
  ON orders FOR UPDATE
  USING (true);

-- ============================================
-- 4. order_items 테이블 RLS 정책 수정
-- ============================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can view order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;

-- 모든 사용자가 order_items를 조회할 수 있도록 설정
CREATE POLICY "Anyone can view order items"
  ON order_items FOR SELECT
  USING (true);

-- order_items 삽입 정책
CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 완료 메시지
-- ============================================
-- 이제 orders 테이블에서 customer_email로 주문을 조회할 수 있습니다.

