import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 설정 (하드코딩)
const supabaseUrl = 'https://fyyywvbhktfolpibknnd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eXl3dmJoa3Rmb2xwaWJrbm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjUxNDcsImV4cCI6MjA4MzYwMTE0N30.ZKZIYpkykfOnYotflpiBRxAq1QWqmYRC3dRgT56wzeQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
