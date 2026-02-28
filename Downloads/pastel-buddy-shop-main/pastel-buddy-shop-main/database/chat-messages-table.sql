-- ============================================
-- 챗봇 메시지 테이블 생성
-- ============================================
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- ============================================
-- chat_messages 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'bot')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성 (성능 향상)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 메시지를 조회할 수 있음
CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 모든 사용자가 메시지를 삽입할 수 있음
CREATE POLICY "Anyone can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 완료!
-- ============================================
-- 생성된 테이블:
-- - chat_messages - 챗봇 메시지 저장

