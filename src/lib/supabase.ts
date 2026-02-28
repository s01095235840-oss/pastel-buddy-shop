import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경 변수가 없어도 앱이 작동하도록 더미 클라이언트 생성
let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. 일부 기능이 제한될 수 있습니다.');
  // 더미 클라이언트 생성 (실제로는 작동하지 않지만 에러를 방지)
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
