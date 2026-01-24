import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fyyywvbhktfolpibknnd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eXl3dmJoa3Rmb2xwaWJrbm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjUxNDcsImV4cCI6MjA4MzYwMTE0N30.ZKZIYpkykfOnYotflpiBRxAq1QWqmYRC3dRgT56wzeQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
