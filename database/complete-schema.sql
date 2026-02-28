-- ============================================
-- Timeline Shop - 완전한 데이터베이스 스키마
-- ============================================
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- 
-- 이 스키마는 다음을 포함합니다:
-- 1. 사용자 프로필 (User Profiles)
-- 2. 제품 (Products)
-- 3. 장바구니 (Cart)
-- 4. 주문 (Orders)
-- 5. 주문 상품 (Order Items)
-- ============================================

-- ============================================
-- 1. 사용자 프로필 테이블
-- ============================================
-- auth.users는 Supabase가 자동으로 관리하므로
-- 추가 프로필 정보를 저장하는 테이블을 생성합니다

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 회원가입 시 자동으로 프로필 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. 제품(Products) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category VARCHAR(50),
  tags TEXT[], -- PostgreSQL 배열 타입
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 장바구니(Cart) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id) -- 같은 상품은 한 번만 추가 (수량만 증가)
);

-- ============================================
-- 4. 주문(Orders) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  shipping_address TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 주문 상품(Order Items) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. 인덱스 생성 (성능 향상)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- 7. Row Level Security (RLS) 정책
-- ============================================

-- 사용자 프로필 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 제품 RLS (모든 사용자가 조회 가능)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- 장바구니 RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own cart"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- 주문 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 주문 상품 RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. 자동 업데이트 트리거
-- ============================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 제품 샘플 데이터 삽입
-- ============================================
INSERT INTO products (name, description, price, image_url, category, tags, stock, is_active)
VALUES 
  (
    '시그니처 플래너',
    '[#🔥갓생🔥 #오차없는시간관리] 시간도둑 잡는, 10분 계획 위클리 플래너 세트 (4colors) 👑💖🎀',
    12000.00,
    '/assets/products/planner.jpg',
    'Stationery',
    ARRAY['갓생', '시간관리', '위클리'],
    100,
    true
  ),
  (
    '스터디용 타이머',
    '[#인스타감성📸 #뽀모도로꿀템⏱️] 미니멀 디자인, 무소음 집중력 강화 스마트 타이머 (3colors) 🚀💫✨',
    9900.00,
    '/assets/products/timer.jpg',
    'Tech',
    ARRAY['뽀모도로', '집중력', '스마트'],
    150,
    true
  ),
  (
    '굿노트/디지털 플래너',
    '[#아이패드필수💻 #깔끔함1등💯] 굿노트 전용! 하이퍼링크 탑재 갓생 속지 파일 (4ver.) 📝💖💡',
    5000.00,
    '/assets/products/digital-planner.jpg',
    'Digital',
    ARRAY['아이패드', '굿노트', '디지털'],
    999,
    true
  ),
  (
    '스터디 간식 키트',
    '[#시험기간구원🚨 #에너지급속충전⚡] 집중력 UP! 뇌가 좋아하는 큐레이션 간식 박스 (월별한정) 🍪🍬💪',
    15900.00,
    '/assets/products/snack-kit.jpg',
    'Food',
    ARRAY['시험기간', '에너지', '간식'],
    50,
    true
  ),
  (
    '계획/습관 포스터',
    '[#내방꾸미기🖼️ #인증샷맛집🌟] 목표달성 스티커 함께 증정! 위클리 습관 기록 대형 포스터 (A2/A3) 📌💖🎁',
    8500.00,
    '/assets/products/poster.jpg',
    'Living',
    ARRAY['방꾸미기', '습관기록', '포스터'],
    80,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. 주문 번호 생성 함수
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  year_month TEXT;
  sequence_num INTEGER;
BEGIN
  -- 현재 년월 (예: 2024-01)
  year_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- 해당 월의 주문 개수 + 1
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM orders
  WHERE order_number LIKE 'ORD-' || year_month || '-%';
  
  -- 주문 번호 생성 (예: ORD-2024-01-001)
  new_order_number := 'ORD-' || year_month || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. 유용한 뷰(View) 생성
-- ============================================

-- 장바구니 상세 정보 뷰
CREATE OR REPLACE VIEW cart_details AS
SELECT 
  c.id,
  c.user_id,
  c.product_id,
  c.quantity,
  p.name AS product_name,
  p.price AS product_price,
  p.image_url AS product_image,
  (c.quantity * p.price) AS subtotal,
  c.created_at
FROM cart_items c
JOIN products p ON c.product_id = p.id;

-- 주문 요약 뷰
CREATE OR REPLACE VIEW order_summary AS
SELECT 
  o.id AS order_id,
  o.user_id,
  o.order_number,
  o.total_amount,
  o.status,
  o.created_at,
  COUNT(oi.id) AS item_count,
  SUM(oi.quantity) AS total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.user_id, o.order_number, o.total_amount, o.status, o.created_at;

-- ============================================
-- 완료!
-- ============================================
-- 이제 다음 단계를 진행하세요:
-- 1. Supabase Dashboard에서 이 SQL을 실행
-- 2. Table Editor에서 테이블이 생성되었는지 확인
-- 3. 애플리케이션에서 데이터베이스 연동 테스트
