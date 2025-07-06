import { createClient } from '@supabase/supabase-js';

// Access Vite environment variables
const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. ' +
    'Make sure you have VITE_REACT_APP_SUPABASE_URL and VITE_REACT_APP_SUPABASE_ANON_KEY in your .env file ' +
    'and that the Vite development server is running.'
  );
  // You might want to throw an error here or handle this case more gracefully
  // depending on your application's requirements.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
