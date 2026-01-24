-- ============================================
-- 결제 관련 필드 추가
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- ============================================

-- orders 테이블에 결제 관련 필드 추가
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);

-- 결제 키 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_payment_key ON orders(payment_key) WHERE payment_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id) WHERE payment_id IS NOT NULL;

-- 주문 상태를 업데이트하는 함수 (결제 완료 시 사용)
CREATE OR REPLACE FUNCTION update_order_status(
  p_payment_key VARCHAR,
  p_payment_id VARCHAR,
  p_status VARCHAR DEFAULT 'completed'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE orders
  SET 
    status = p_status,
    payment_key = COALESCE(p_payment_key, payment_key),
    payment_id = COALESCE(p_payment_id, payment_id),
    updated_at = NOW()
  WHERE payment_key = p_payment_key OR payment_id = p_payment_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 추가 - 사용자는 자신의 주문을 생성할 수 있음
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책 추가 - 사용자는 자신의 주문을 업데이트할 수 있음 (결제 완료 시)
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책 추가 - 사용자는 자신의 주문 상품을 생성할 수 있음
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
CREATE POLICY "Users can insert their own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 완료!
-- 이제 결제 완료 시 주문 정보가 자동으로 저장되고 상태가 업데이트됩니다.

