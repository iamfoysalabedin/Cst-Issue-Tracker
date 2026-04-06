
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pzjkgoebjttuxoiopcqu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6amtnb2VianR0dXhvaW9wY3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODY2NDYsImV4cCI6MjA5MTA2MjY0Nn0.284IbEwcWqPp73D3R6B_aVf5ezf26lkPVe3KqrHfjcw';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
