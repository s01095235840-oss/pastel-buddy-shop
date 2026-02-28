-- ============================================
-- customers 테이블 RLS 정책 수정
-- ============================================
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- 
-- 이 스크립트는 customers 테이블에 대한 접근 권한 문제를 해결합니다.
-- 406 Not Acceptable 에러를 방지하기 위해 RLS 정책을 설정합니다.

-- ============================================
-- 1. customers 테이블이 없으면 생성
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. RLS 활성화 (필요한 경우)
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. 기존 정책 삭제 (있다면)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view customers" ON customers;
DROP POLICY IF EXISTS "Anyone can insert customers" ON customers;
DROP POLICY IF EXISTS "Anyone can update customers" ON customers;

-- ============================================
-- 4. 새로운 RLS 정책 생성
-- ============================================

-- 모든 사용자가 customers 테이블을 조회할 수 있도록 설정
-- (이메일로 고객 정보를 찾기 위해 필요)
CREATE POLICY "Anyone can view customers"
  ON customers FOR SELECT
  USING (true);

-- 모든 사용자가 customers 테이블에 데이터를 삽입할 수 있도록 설정
-- (새 고객 등록을 위해 필요)
CREATE POLICY "Anyone can insert customers"
  ON customers FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 customers 테이블의 데이터를 업데이트할 수 있도록 설정
-- (고객 정보 수정을 위해 필요)
CREATE POLICY "Anyone can update customers"
  ON customers FOR UPDATE
  USING (true);

-- ============================================
-- 5. 인덱스 생성 (성능 향상)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ============================================
-- 완료 메시지
-- ============================================
-- 이제 customers 테이블에 대한 접근이 가능합니다.
-- 406 Not Acceptable 에러가 해결되어야 합니다.

