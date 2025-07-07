import { createClient } from '@supabase/supabase-js';

// Access Vite environment variables
const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error(
    'VITE_REACT_APP_SUPABASE_URL and VITE_REACT_APP_SUPABASE_ANON_KEY must be set'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
