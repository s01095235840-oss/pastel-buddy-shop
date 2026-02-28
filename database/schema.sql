-- 주문 테이블 생성
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. 주문(Orders) 테이블
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 주문 상품(Order Items) 테이블
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 4. Row Level Security (RLS) 정책 활성화
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성 - 사용자는 자신의 주문만 조회 가능
-- 기존 정책이 있으면 삭제
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;

-- 새로운 정책 생성
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 6. 주문 상태 업데이트 함수 (자동으로 updated_at 갱신)
-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- 함수는 CREATE OR REPLACE로 자동 대체됨
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 새로운 트리거 생성
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 샘플 데이터 삽입 (테스트용 - 선택사항)
-- 주의: user_id는 실제 인증된 사용자의 UUID로 교체해야 합니다
-- 예시:
-- INSERT INTO orders (user_id, order_number, total_amount, status)
-- VALUES 
--   ('your-user-uuid-here', 'ORD-2024-001', 45000.00, 'completed'),
--   ('your-user-uuid-here', 'ORD-2024-002', 32000.00, 'completed');

-- INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
-- VALUES 
--   ((SELECT id FROM orders WHERE order_number = 'ORD-2024-001'), 1, '디지털 플래너', 15000.00, 3, 45000.00),
--   ((SELECT id FROM orders WHERE order_number = 'ORD-2024-002'), 2, '파스텔 포스터', 8000.00, 4, 32000.00);
