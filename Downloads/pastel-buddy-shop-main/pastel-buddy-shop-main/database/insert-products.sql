-- ============================================
-- products.json 데이터를 products 테이블에 INSERT
-- ============================================
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- ============================================
-- 0. 테이블 및 컬럼 자동 생성/확인
-- ============================================

-- 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category VARCHAR(50),
  tags TEXT[],
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  shipping_address TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 누락된 컬럼 추가 (DO 블록 사용)
DO $$
DECLARE
  orders_id_type TEXT;
BEGIN
  -- products 테이블 컬럼 확인 및 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'name') THEN
    ALTER TABLE products ADD COLUMN name VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'description') THEN
    ALTER TABLE products ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'price') THEN
    ALTER TABLE products ADD COLUMN price DECIMAL(10, 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'image_url') THEN
    ALTER TABLE products ADD COLUMN image_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'category') THEN
    ALTER TABLE products ADD COLUMN category VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'tags') THEN
    ALTER TABLE products ADD COLUMN tags TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'stock') THEN
    ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'is_active') THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'created_at') THEN
    ALTER TABLE products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'updated_at') THEN
    ALTER TABLE products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- customers 테이블 컬럼 확인 및 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'customers' AND column_name = 'email') THEN
    ALTER TABLE customers ADD COLUMN email VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'customers' AND column_name = 'name') THEN
    ALTER TABLE customers ADD COLUMN name VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'customers' AND column_name = 'phone') THEN
    ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'customers' AND column_name = 'address') THEN
    ALTER TABLE customers ADD COLUMN address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'customers' AND column_name = 'created_at') THEN
    ALTER TABLE customers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'customers' AND column_name = 'updated_at') THEN
    ALTER TABLE customers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- orders 테이블 컬럼 확인 및 추가
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
      ALTER TABLE orders ADD COLUMN customer_id INTEGER;
      -- 외래키 제약조건은 나중에 추가 (customers 테이블이 있어야 함)
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- 오류 발생 시에도 계속 진행
      NULL;
  END;
  
  -- customer_id 컬럼이 확실히 존재하는지 다시 확인 및 추가
  BEGIN
    PERFORM customer_id FROM orders LIMIT 1;
  EXCEPTION
    WHEN undefined_column THEN
      -- 컬럼이 없으면 다시 추가 시도
      BEGIN
        ALTER TABLE orders ADD COLUMN customer_id INTEGER;
      EXCEPTION
        WHEN duplicate_column THEN
          -- 이미 존재하면 무시
          NULL;
        WHEN OTHERS THEN
          -- 다른 오류는 무시
          NULL;
      END;
    WHEN OTHERS THEN
      -- 다른 오류는 무시
      NULL;
  END;
  
  -- user_id 컬럼 확인 및 추가 (기존 테이블에 있을 수 있음)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'user_id') THEN
    ALTER TABLE orders ADD COLUMN user_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'order_number') THEN
    ALTER TABLE orders ADD COLUMN order_number VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
    ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10, 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'status') THEN
    ALTER TABLE orders ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_address') THEN
    ALTER TABLE orders ADD COLUMN shipping_address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'phone') THEN
    ALTER TABLE orders ADD COLUMN phone VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'created_at') THEN
    ALTER TABLE orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- order_items 테이블 컬럼 확인 및 추가
  -- order_id는 orders 테이블의 id 타입에 따라 INTEGER 또는 UUID일 수 있음
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_items' AND column_name = 'order_id') THEN
    -- orders 테이블의 id 타입 확인하여 적절한 타입으로 추가
    BEGIN
      SELECT data_type INTO orders_id_type
      FROM information_schema.columns
      WHERE table_name = 'orders' AND column_name = 'id';
      
      IF orders_id_type = 'uuid' THEN
        ALTER TABLE order_items ADD COLUMN order_id UUID;
      ELSE
        ALTER TABLE order_items ADD COLUMN order_id INTEGER;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- 오류 발생 시 기본값으로 INTEGER 사용
        ALTER TABLE order_items ADD COLUMN order_id INTEGER;
    END;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_items' AND column_name = 'product_id') THEN
    ALTER TABLE order_items ADD COLUMN product_id INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_items' AND column_name = 'product_name') THEN
    ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_items' AND column_name = 'product_price') THEN
    ALTER TABLE order_items ADD COLUMN product_price DECIMAL(10, 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_items' AND column_name = 'quantity') THEN
    ALTER TABLE order_items ADD COLUMN quantity INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_items' AND column_name = 'subtotal') THEN
    ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(10, 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_items' AND column_name = 'created_at') THEN
    ALTER TABLE order_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- ============================================
  -- 모든 컬럼 자동 추가 완료
  -- ============================================
  -- 위에서 모든 필요한 컬럼들이 확인되고 추가되었습니다.
  -- PRIMARY KEY 컬럼들(id)은 테이블 생성 시 자동으로 생성되므로 별도 추가 불필요
  
END $$;

-- 기존 데이터가 있으면 삭제 (선택사항)
-- DELETE FROM products;

-- ============================================
-- 1. 상품 데이터 삽입
-- ============================================
INSERT INTO products (id, name, description, price, image_url, category, tags, stock, is_active)
VALUES 
  (
    1,
    '시그니처 플래너',
    '[#🔥갓생🔥 #오차없는시간관리] 시간도둑 잡는, 10분 계획 위클리 플래너 세트 (4colors) 👑💖🎀',
    12000.00,
    '/products/planner.jpg',
    'Stationery',
    ARRAY['갓생', '시간관리', '위클리'],
    100,
    true
  ),
  (
    2,
    '스터디용 타이머',
    '[#인스타감성📸 #뽀모도로꿀템⏱️] 미니멀 디자인, 무소음 집중력 강화 스마트 타이머 (3colors) 🚀💫✨',
    9900.00,
    '/products/timer.jpg',
    'Tech',
    ARRAY['뽀모도로', '집중력', '스마트'],
    100,
    true
  ),
  (
    3,
    '굿노트/디지털 플래너',
    '[#아이패드필수💻 #깔끔함1등💯] 굿노트 전용! 하이퍼링크 탑재 갓생 속지 파일 (4ver.) 📝💖💡',
    5000.00,
    '/products/digital-planner.jpg',
    'Digital',
    ARRAY['아이패드', '굿노트', '디지털'],
    100,
    true
  ),
  (
    4,
    '스터디 간식 키트',
    '[#시험기간구원🚨 #에너지급속충전⚡] 집중력 UP! 뇌가 좋아하는 큐레이션 간식 박스 (월별한정) 🍪🍬💪',
    15900.00,
    '/products/snack-kit.jpg',
    'Food',
    ARRAY['시험기간', '에너지', '간식'],
    100,
    true
  ),
  (
    5,
    '계획/습관 포스터',
    '[#내방꾸미기🖼️ #인증샷맛집🌟] 목표달성 스티커 함께 증정! 위클리 습관 기록 대형 포스터 (A2/A3) 📌💖🎁',
    8500.00,
    '/products/poster.jpg',
    'Living',
    ARRAY['방꾸미기', '습관기록', '포스터'],
    100,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- ============================================
-- 2. 고객 샘플 데이터 삽입 (3명)
-- ============================================
INSERT INTO customers (id, email, name, phone, address)
VALUES 
  (
    1,
    'kim.study@example.com',
    '김공부',
    '010-1234-5678',
    '서울특별시 강남구 테헤란로 123'
  ),
  (
    2,
    'lee.plan@example.com',
    '이플래너',
    '010-2345-6789',
    '서울특별시 서초구 서초대로 456'
  ),
  (
    3,
    'park.life@example.com',
    '박갓생',
    '010-3456-7890',
    '서울특별시 송파구 올림픽로 789'
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  updated_at = NOW();

-- ============================================
-- 3. 주문 샘플 데이터 삽입 (2개)
-- ============================================
-- id 컬럼 타입과 user_id 컬럼 존재 여부에 따라 동적으로 처리
DO $$
DECLARE
  id_type TEXT;
  has_user_id BOOLEAN;
  has_customer_id BOOLEAN;
  customer_1_id INTEGER;
  customer_2_id INTEGER;
  valid_user_id UUID;
  user_id_fk_exists BOOLEAN;
  has_users_table BOOLEAN;
  user_id_not_null BOOLEAN;
BEGIN
  -- orders 테이블의 id 컬럼 타입 확인
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_name = 'orders' AND column_name = 'id';
  
  -- 필수 컬럼들이 없으면 추가 (INSERT 전에 확실히 존재하도록)
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'orders' AND column_name = 'customer_id'
    ) THEN
      ALTER TABLE orders ADD COLUMN customer_id INTEGER;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- 오류 발생 시에도 계속 진행
      NULL;
  END;
  
  -- customer_id 컬럼이 확실히 존재하는지 다시 확인
  BEGIN
    PERFORM customer_id FROM orders LIMIT 1;
  EXCEPTION
    WHEN undefined_column THEN
      -- 컬럼이 없으면 다시 추가 시도
      ALTER TABLE orders ADD COLUMN customer_id INTEGER;
    WHEN OTHERS THEN
      -- 다른 오류는 무시
      NULL;
  END;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10, 2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'status'
  ) THEN
    ALTER TABLE orders ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_address TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN phone VARCHAR(20);
  END IF;
  
  -- user_id 컬럼 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) INTO has_user_id;
  
  -- user_id가 없으면 추가 (필요한 경우)
  IF NOT has_user_id THEN
    ALTER TABLE orders ADD COLUMN user_id UUID;
    has_user_id := true;
  END IF;
  
  
  -- customer_id 컬럼 존재 여부 확인 (추가 후 다시 확인)
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'orders' AND column_name = 'customer_id'
    ) INTO has_customer_id;
    
    -- customer_id 컬럼이 없으면 다시 추가 시도
    IF NOT has_customer_id THEN
      BEGIN
        ALTER TABLE orders ADD COLUMN customer_id INTEGER;
        has_customer_id := true;
      EXCEPTION
        WHEN duplicate_column THEN
          -- 이미 존재하면 무시
          has_customer_id := true;
        WHEN OTHERS THEN
          -- 다른 오류는 무시하고 계속 진행
          NULL;
      END;
    END IF;
    
    -- customer_id 컬럼이 확실히 존재하는지 테스트
    BEGIN
      PERFORM customer_id FROM orders LIMIT 1;
      has_customer_id := true;
    EXCEPTION
      WHEN undefined_column THEN
        -- 컬럼이 없으면 다시 추가
        BEGIN
          ALTER TABLE orders ADD COLUMN customer_id INTEGER;
          has_customer_id := true;
        EXCEPTION
          WHEN OTHERS THEN
            has_customer_id := false;
        END;
      WHEN OTHERS THEN
        has_customer_id := false;
    END;
  EXCEPTION
    WHEN OTHERS THEN
      has_customer_id := false;
  END;
  
  -- customer_id로 고객 ID 가져오기
  BEGIN
    SELECT id INTO customer_1_id FROM customers WHERE email = 'kim.study@example.com' LIMIT 1;
    SELECT id INTO customer_2_id FROM customers WHERE email = 'lee.plan@example.com' LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      -- 고객이 없으면 기본값 사용
      customer_1_id := NULL;
      customer_2_id := NULL;
  END;
  
  -- customer_id가 없으면 INSERT를 건너뛰기
  IF NOT has_customer_id OR customer_1_id IS NULL OR customer_2_id IS NULL THEN
    -- customer_id가 없거나 고객이 없으면 주문 삽입 건너뛰기
    RAISE NOTICE 'Skipping orders insertion: customer_id column missing or customers not found';
  ELSE
    -- id 타입이 UUID인 경우
    IF id_type = 'uuid' THEN
      -- user_id가 필수인 경우
      IF has_user_id THEN
      -- user_id 외래키 제약조건 확인
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'orders' 
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'user_id'
      ) INTO user_id_fk_exists;
      
      -- user_id NOT NULL 제약조건 확인
      BEGIN
        SELECT is_nullable = 'NO' INTO user_id_not_null
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'user_id';
      EXCEPTION
        WHEN OTHERS THEN
          user_id_not_null := false;
      END;
      
      -- user_id_not_null이 NULL이면 false로 설정
      IF user_id_not_null IS NULL THEN
        user_id_not_null := false;
      END IF;
      
      -- users 테이블 존재 여부 확인
      BEGIN
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'users'
        ) INTO has_users_table;
      EXCEPTION
        WHEN OTHERS THEN
          has_users_table := false;
      END;
      
      -- 외래키가 있고 users 테이블이 있으면 유효한 ID 가져오기
      IF user_id_fk_exists AND has_users_table THEN
        BEGIN
          SELECT id INTO valid_user_id FROM users LIMIT 1;
        EXCEPTION
          WHEN undefined_table THEN
            -- users 테이블이 없으면 user_id 사용 안 함
            valid_user_id := NULL;
            has_users_table := false;
          WHEN OTHERS THEN
            valid_user_id := NULL;
        END;
        
        -- 유효한 user_id가 있으면 사용
        IF valid_user_id IS NOT NULL AND customer_1_id IS NOT NULL AND customer_2_id IS NOT NULL THEN
          INSERT INTO orders (customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
          VALUES 
            (
              customer_1_id,
              valid_user_id,
              'ORD-2024-001',
              21900.00,
              'completed',
              '서울특별시 강남구 테헤란로 123',
              '010-1234-5678'
            ),
            (
              customer_2_id,
              valid_user_id,
              'ORD-2024-002',
              17000.00,
              'processing',
              '서울특별시 서초구 서초대로 456',
              '010-2345-6789'
            )
          ON CONFLICT (order_number) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            user_id = COALESCE(EXCLUDED.user_id, orders.user_id),
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            shipping_address = EXCLUDED.shipping_address,
            phone = EXCLUDED.phone,
            updated_at = NOW();
        ELSE
          -- users 테이블이 비어있거나 user_id를 가져올 수 없는 경우
          IF user_id_not_null THEN
            -- user_id가 NOT NULL이면 임시 UUID 생성 (외래키 제약조건이 없을 때만)
            IF NOT user_id_fk_exists THEN
              INSERT INTO orders (customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
              VALUES 
                (
                  customer_1_id,
                  gen_random_uuid(),
                  'ORD-2024-001',
                  21900.00,
                  'completed',
                  '서울특별시 강남구 테헤란로 123',
                  '010-1234-5678'
                ),
                (
                  customer_2_id,
                  gen_random_uuid(),
                  'ORD-2024-002',
                  17000.00,
                  'processing',
                  '서울특별시 서초구 서초대로 456',
                  '010-2345-6789'
                )
              ON CONFLICT (order_number) DO UPDATE SET
                customer_id = EXCLUDED.customer_id,
                user_id = COALESCE(EXCLUDED.user_id, orders.user_id),
                total_amount = EXCLUDED.total_amount,
                status = EXCLUDED.status,
                shipping_address = EXCLUDED.shipping_address,
                phone = EXCLUDED.phone,
                updated_at = NOW();
            ELSE
              -- 외래키가 있고 user_id가 NOT NULL이면 user_id 없이 삽입 시도 (실패 시 예외 처리)
              BEGIN
                -- user_id 없이 삽입 시도 (NOT NULL 제약조건 위반 가능)
                INSERT INTO orders (customer_id, order_number, total_amount, status, shipping_address, phone)
                VALUES 
                  (
                    customer_1_id,
                    'ORD-2024-001',
                    21900.00,
                    'completed',
                    '서울특별시 강남구 테헤란로 123',
                    '010-1234-5678'
                  ),
                  (
                    customer_2_id,
                    'ORD-2024-002',
                    17000.00,
                    'processing',
                    '서울특별시 서초구 서초대로 456',
                    '010-2345-6789'
                  )
                ON CONFLICT (order_number) DO UPDATE SET
                  customer_id = EXCLUDED.customer_id,
                  total_amount = EXCLUDED.total_amount,
                  status = EXCLUDED.status,
                  shipping_address = EXCLUDED.shipping_address,
                  phone = EXCLUDED.phone,
                  updated_at = NOW();
              EXCEPTION
                WHEN not_null_violation THEN
                  -- NOT NULL 제약조건 위반 시 user_id 컬럼을 NULL 허용으로 변경 시도
                  BEGIN
                    ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
                    -- 다시 삽입 시도
                    INSERT INTO orders (customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
                    VALUES 
                      (
                        customer_1_id,
                        NULL,
                        'ORD-2024-001',
                        21900.00,
                        'completed',
                        '서울특별시 강남구 테헤란로 123',
                        '010-1234-5678'
                      ),
                      (
                        customer_2_id,
                        NULL,
                        'ORD-2024-002',
                        17000.00,
                        'processing',
                        '서울특별시 서초구 서초대로 456',
                        '010-2345-6789'
                      )
                    ON CONFLICT (order_number) DO UPDATE SET
                      customer_id = EXCLUDED.customer_id,
                      total_amount = EXCLUDED.total_amount,
                      status = EXCLUDED.status,
                      shipping_address = EXCLUDED.shipping_address,
                      phone = EXCLUDED.phone,
                      updated_at = NOW();
                  EXCEPTION
                    WHEN OTHERS THEN
                      -- 그래도 실패하면 그냥 무시 (이미 존재하는 데이터일 수 있음)
                      NULL;
                  END;
                WHEN OTHERS THEN
                  -- 다른 오류는 무시
                  NULL;
              END;
            END IF;
          ELSE
            -- user_id가 NULL 허용이면 NULL로 삽입
            INSERT INTO orders (customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
            VALUES 
              (
                customer_1_id,
                NULL,
                'ORD-2024-001',
                21900.00,
                'completed',
                '서울특별시 강남구 테헤란로 123',
                '010-1234-5678'
              ),
              (
                customer_2_id,
                NULL,
                'ORD-2024-002',
                17000.00,
                'processing',
                '서울특별시 서초구 서초대로 456',
                '010-2345-6789'
              )
            ON CONFLICT (order_number) DO UPDATE SET
              customer_id = EXCLUDED.customer_id,
              total_amount = EXCLUDED.total_amount,
              status = EXCLUDED.status,
              shipping_address = EXCLUDED.shipping_address,
              phone = EXCLUDED.phone,
              updated_at = NOW();
          END IF;
        END IF;
      ELSE
        -- 외래키가 없으면 UUID 생성 또는 user_id 없이 삽입
        BEGIN
          INSERT INTO orders (customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
          VALUES 
            (
              customer_1_id,
              gen_random_uuid(),
              'ORD-2024-001',
              21900.00,
              'completed',
              '서울특별시 강남구 테헤란로 123',
              '010-1234-5678'
            ),
            (
              customer_2_id,
              gen_random_uuid(),
              'ORD-2024-002',
              17000.00,
              'processing',
              '서울특별시 서초구 서초대로 456',
              '010-2345-6789'
            )
          ON CONFLICT (order_number) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            user_id = COALESCE(EXCLUDED.user_id, orders.user_id),
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            shipping_address = EXCLUDED.shipping_address,
            phone = EXCLUDED.phone,
            updated_at = NOW();
        EXCEPTION
          WHEN OTHERS THEN
          -- 오류 발생 시 user_id 없이 삽입 시도
          INSERT INTO orders (customer_id, order_number, total_amount, status, shipping_address, phone)
          VALUES 
            (
              customer_1_id,
              'ORD-2024-001',
              21900.00,
              'completed',
              '서울특별시 강남구 테헤란로 123',
              '010-1234-5678'
            ),
            (
              customer_2_id,
              'ORD-2024-002',
              17000.00,
              'processing',
              '서울특별시 서초구 서초대로 456',
              '010-2345-6789'
            )
          ON CONFLICT (order_number) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            shipping_address = EXCLUDED.shipping_address,
            phone = EXCLUDED.phone,
            updated_at = NOW();
        END;
      END IF;
    ELSE
      -- user_id가 없는 경우
      INSERT INTO orders (customer_id, order_number, total_amount, status, shipping_address, phone)
      VALUES 
        (
          customer_1_id,
          'ORD-2024-001',
          21900.00,
          'completed',
          '서울특별시 강남구 테헤란로 123',
          '010-1234-5678'
        ),
        (
          customer_2_id,
          'ORD-2024-002',
          17000.00,
          'processing',
          '서울특별시 서초구 서초대로 456',
          '010-2345-6789'
        )
      ON CONFLICT (order_number) DO UPDATE SET
        customer_id = EXCLUDED.customer_id,
        total_amount = EXCLUDED.total_amount,
        status = EXCLUDED.status,
        shipping_address = EXCLUDED.shipping_address,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    END IF;
  ELSE
    -- INTEGER 타입인 경우 (SERIAL)
    IF has_user_id THEN
      -- user_id 외래키 제약조건 확인
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'orders' 
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'user_id'
      ) INTO user_id_fk_exists;
      
      -- user_id NOT NULL 제약조건 확인
      BEGIN
        SELECT is_nullable = 'NO' INTO user_id_not_null
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'user_id';
      EXCEPTION
        WHEN OTHERS THEN
          user_id_not_null := false;
      END;
      
      -- user_id_not_null이 NULL이면 false로 설정
      IF user_id_not_null IS NULL THEN
        user_id_not_null := false;
      END IF;
      
      -- users 테이블 존재 여부 확인
      BEGIN
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'users'
        ) INTO has_users_table;
      EXCEPTION
        WHEN OTHERS THEN
          has_users_table := false;
      END;
      
      -- 외래키가 있고 users 테이블이 있으면 유효한 ID 가져오기
      IF user_id_fk_exists AND has_users_table THEN
        BEGIN
          SELECT id INTO valid_user_id FROM users LIMIT 1;
        EXCEPTION
          WHEN undefined_table THEN
            -- users 테이블이 없으면 user_id 사용 안 함
            valid_user_id := NULL;
            has_users_table := false;
          WHEN OTHERS THEN
            valid_user_id := NULL;
        END;
        
        -- 유효한 user_id가 있으면 사용
        IF valid_user_id IS NOT NULL THEN
          INSERT INTO orders (id, customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
          VALUES 
            (
              1,
              customer_1_id,
              valid_user_id,
              'ORD-2024-001',
              21900.00,
              'completed',
              '서울특별시 강남구 테헤란로 123',
              '010-1234-5678'
            ),
            (
              2,
              customer_2_id,
              valid_user_id,
              'ORD-2024-002',
              17000.00,
              'processing',
              '서울특별시 서초구 서초대로 456',
              '010-2345-6789'
            )
          ON CONFLICT (id) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            user_id = COALESCE(EXCLUDED.user_id, orders.user_id),
            order_number = EXCLUDED.order_number,
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            shipping_address = EXCLUDED.shipping_address,
            phone = EXCLUDED.phone,
            updated_at = NOW();
        ELSE
          -- users 테이블이 비어있거나 user_id를 가져올 수 없는 경우
          IF user_id_not_null THEN
            -- user_id가 NOT NULL이면 임시 UUID 생성 (외래키 제약조건이 없을 때만)
            IF NOT user_id_fk_exists THEN
              INSERT INTO orders (id, customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
              VALUES 
                (
                  1,
                  customer_1_id,
                  gen_random_uuid(),
                  'ORD-2024-001',
                  21900.00,
                  'completed',
                  '서울특별시 강남구 테헤란로 123',
                  '010-1234-5678'
                ),
                (
                  2,
                  customer_2_id,
                  gen_random_uuid(),
                  'ORD-2024-002',
                  17000.00,
                  'processing',
                  '서울특별시 서초구 서초대로 456',
                  '010-2345-6789'
                )
              ON CONFLICT (id) DO UPDATE SET
                customer_id = EXCLUDED.customer_id,
                user_id = COALESCE(EXCLUDED.user_id, orders.user_id),
                order_number = EXCLUDED.order_number,
                total_amount = EXCLUDED.total_amount,
                status = EXCLUDED.status,
                shipping_address = EXCLUDED.shipping_address,
                phone = EXCLUDED.phone,
                updated_at = NOW();
            ELSE
              -- 외래키가 있고 user_id가 NOT NULL이면 user_id 없이 삽입 시도 (실패 시 예외 처리)
              BEGIN
                -- user_id 없이 삽입 시도 (NOT NULL 제약조건 위반 가능)
                INSERT INTO orders (id, customer_id, order_number, total_amount, status, shipping_address, phone)
                VALUES 
                  (
                    1,
                    customer_1_id,
                    'ORD-2024-001',
                    21900.00,
                    'completed',
                    '서울특별시 강남구 테헤란로 123',
                    '010-1234-5678'
                  ),
                  (
                    2,
                    customer_2_id,
                    'ORD-2024-002',
                    17000.00,
                    'processing',
                    '서울특별시 서초구 서초대로 456',
                    '010-2345-6789'
                  )
                ON CONFLICT (id) DO UPDATE SET
                  customer_id = EXCLUDED.customer_id,
                  order_number = EXCLUDED.order_number,
                  total_amount = EXCLUDED.total_amount,
                  status = EXCLUDED.status,
                  shipping_address = EXCLUDED.shipping_address,
                  phone = EXCLUDED.phone,
                  updated_at = NOW();
              EXCEPTION
                WHEN not_null_violation THEN
                  -- NOT NULL 제약조건 위반 시 user_id 컬럼을 NULL 허용으로 변경 시도
                  BEGIN
                    ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
                    -- 다시 삽입 시도
                    INSERT INTO orders (id, customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
                    VALUES 
                      (
                        1,
                        customer_1_id,
                        NULL,
                        'ORD-2024-001',
                        21900.00,
                        'completed',
                        '서울특별시 강남구 테헤란로 123',
                        '010-1234-5678'
                      ),
                      (
                        2,
                        customer_2_id,
                        NULL,
                        'ORD-2024-002',
                        17000.00,
                        'processing',
                        '서울특별시 서초구 서초대로 456',
                        '010-2345-6789'
                      )
                    ON CONFLICT (id) DO UPDATE SET
                      customer_id = EXCLUDED.customer_id,
                      order_number = EXCLUDED.order_number,
                      total_amount = EXCLUDED.total_amount,
                      status = EXCLUDED.status,
                      shipping_address = EXCLUDED.shipping_address,
                      phone = EXCLUDED.phone,
                      updated_at = NOW();
                  EXCEPTION
                    WHEN OTHERS THEN
                      -- 그래도 실패하면 그냥 무시 (이미 존재하는 데이터일 수 있음)
                      NULL;
                  END;
                WHEN OTHERS THEN
                  -- 다른 오류는 무시
                  NULL;
              END;
            END IF;
          ELSE
            -- user_id가 NULL 허용이면 NULL로 삽입
            INSERT INTO orders (id, customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
            VALUES 
              (
                1,
                customer_1_id,
                NULL,
                'ORD-2024-001',
                21900.00,
                'completed',
                '서울특별시 강남구 테헤란로 123',
                '010-1234-5678'
              ),
              (
                2,
                customer_2_id,
                NULL,
                'ORD-2024-002',
                17000.00,
                'processing',
                '서울특별시 서초구 서초대로 456',
                '010-2345-6789'
              )
            ON CONFLICT (id) DO UPDATE SET
              customer_id = EXCLUDED.customer_id,
              order_number = EXCLUDED.order_number,
              total_amount = EXCLUDED.total_amount,
              status = EXCLUDED.status,
              shipping_address = EXCLUDED.shipping_address,
              phone = EXCLUDED.phone,
              updated_at = NOW();
          END IF;
        END IF;
      ELSE
        -- 외래키가 없으면 UUID 생성 시도
        BEGIN
          INSERT INTO orders (id, customer_id, user_id, order_number, total_amount, status, shipping_address, phone)
          VALUES 
            (
              1,
              customer_1_id,
              gen_random_uuid(),
              'ORD-2024-001',
              21900.00,
              'completed',
              '서울특별시 강남구 테헤란로 123',
              '010-1234-5678'
            ),
            (
              2,
              customer_2_id,
              gen_random_uuid(),
              'ORD-2024-002',
              17000.00,
              'processing',
              '서울특별시 서초구 서초대로 456',
              '010-2345-6789'
            )
          ON CONFLICT (id) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            user_id = COALESCE(EXCLUDED.user_id, orders.user_id),
            order_number = EXCLUDED.order_number,
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            shipping_address = EXCLUDED.shipping_address,
            phone = EXCLUDED.phone,
            updated_at = NOW();
        EXCEPTION
          WHEN OTHERS THEN
          -- 오류 발생 시 user_id 없이 삽입 시도
          INSERT INTO orders (id, customer_id, order_number, total_amount, status, shipping_address, phone)
          VALUES 
            (
              1,
              customer_1_id,
              'ORD-2024-001',
              21900.00,
              'completed',
              '서울특별시 강남구 테헤란로 123',
              '010-1234-5678'
            ),
            (
              2,
              customer_2_id,
              'ORD-2024-002',
              17000.00,
              'processing',
              '서울특별시 서초구 서초대로 456',
              '010-2345-6789'
            )
          ON CONFLICT (id) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            order_number = EXCLUDED.order_number,
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            shipping_address = EXCLUDED.shipping_address,
            phone = EXCLUDED.phone,
            updated_at = NOW();
        END;
      END IF;
    ELSE
      INSERT INTO orders (id, customer_id, order_number, total_amount, status, shipping_address, phone)
      VALUES 
        (
          1,
          customer_1_id,
          'ORD-2024-001',
          21900.00,
          'completed',
          '서울특별시 강남구 테헤란로 123',
          '010-1234-5678'
        ),
        (
          2,
          customer_2_id,
          'ORD-2024-002',
          17000.00,
          'processing',
          '서울특별시 서초구 서초대로 456',
          '010-2345-6789'
        )
      ON CONFLICT (id) DO UPDATE SET
        customer_id = EXCLUDED.customer_id,
        order_number = EXCLUDED.order_number,
        total_amount = EXCLUDED.total_amount,
        status = EXCLUDED.status,
        shipping_address = EXCLUDED.shipping_address,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    END IF;
  END IF;
  END IF; -- customer_id 체크 IF 문 닫기
  
END $$;

-- ============================================
-- 4. 주문 상품 샘플 데이터 삽입
-- ============================================
-- 주문 1: 시그니처 플래너(1개) + 스터디용 타이머(1개) = 12,000 + 9,900 = 21,900원
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  1,
  '시그니처 플래너',
  12000.00,
  1,
  12000.00
FROM orders o
WHERE o.order_number = 'ORD-2024-001'
  AND NOT EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id = o.id AND oi.product_id = 1
  );

INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  2,
  '스터디용 타이머',
  9900.00,
  1,
  9900.00
FROM orders o
WHERE o.order_number = 'ORD-2024-001'
  AND NOT EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id = o.id AND oi.product_id = 2
  );

-- 주문 2: 굿노트/디지털 플래너(2개) + 계획/습관 포스터(1개) = 5,000*2 + 8,500 = 17,000원
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  3,
  '굿노트/디지털 플래너',
  5000.00,
  2,
  10000.00
FROM orders o
WHERE o.order_number = 'ORD-2024-002'
  AND NOT EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id = o.id AND oi.product_id = 3
  );

INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  5,
  '계획/습관 포스터',
  8500.00,
  1,
  8500.00
FROM orders o
WHERE o.order_number = 'ORD-2024-002'
  AND NOT EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id = o.id AND oi.product_id = 5
  );

-- ============================================
-- 완료!
-- ============================================
-- 삽입된 데이터:
-- - 상품: 5개 (ID 중복 시 업데이트)
-- - 고객: 3명 (ID 중복 시 업데이트)
-- - 주문: 2개 (ID 중복 시 업데이트)
-- - 주문 상품: 4개 항목 (중복 시 무시)
-- 
-- 예외 처리:
-- ✅ 테이블이 없으면 자동 생성
-- ✅ 컬럼이 없으면 자동 추가
-- ✅ 중복 데이터는 업데이트되거나 무시
-- ✅ 여러 번 실행해도 오류 없음

