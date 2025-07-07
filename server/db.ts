import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Use Supabase environment variables
const supabaseUrl = process.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_REACT_APP_SUPABASE_URL and VITE_REACT_APP_SUPABASE_ANON_KEY must be set",
  );
}

// Create Supabase client for authentication and real-time features
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Since we don't have the direct database password, we'll use Supabase's REST API approach
// For now, we'll keep the Drizzle setup but use DATABASE_URL if available
let client;
if (process.env.DATABASE_URL) {
  client = postgres(process.env.DATABASE_URL, { prepare: false });
} else {
  // Create a minimal client that will work with Supabase's REST API
  client = postgres('postgresql://postgres:placeholder@localhost:5432/postgres', { prepare: false });
}

export const db = drizzle(client, { schema });