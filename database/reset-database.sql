-- ============================================
-- 데이터베이스 초기화 스크립트
-- ============================================
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!
-- 테스트 환경에서만 사용하세요.
-- ============================================

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Users can view their own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can insert into their own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can delete from their own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;

-- 2. 뷰 삭제
DROP VIEW IF EXISTS cart_details;
DROP VIEW IF EXISTS order_summary;

-- 3. 트리거 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- 4. 함수 삭제
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS generate_order_number();

-- 5. 테이블 삭제 (순서 중요 - 외래키 때문)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================
-- 완료!
-- ============================================
-- 이제 complete-schema.sql을 실행하세요.
