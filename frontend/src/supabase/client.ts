import { createClient } from '@supabase/supabase-js';

// Use the actual Supabase project URL and anon key
const supabaseUrl = 'https://ezcatmlmwyavjbsemabx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y2F0bWxtd3lhdmpic2VtYWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTgxMjQsImV4cCI6MjA2NzM3NDEyNH0.MDc7qU5KuiJKhouBDQqu0zPO3cDSCVZbtVYckOWYSvo';

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error(
    'VITE_REACT_APP_SUPABASE_URL and VITE_REACT_APP_SUPABASE_ANON_KEY must be set'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection immediately
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase auth test error:', error);
  } else {
    console.log('Supabase auth test successful:', data ? 'Session exists' : 'No session');
  }
});
