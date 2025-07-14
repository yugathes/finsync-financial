import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@db/schema';

// Use the actual Supabase project URL and anon key
const supabaseUrl = 'https://ezcatmlmwyavjbsemabx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y2F0bWxtd3lhdmpic2VtYWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTgxMjQsImV4cCI6MjA2NzM3NDEyNH0.MDc7qU5KuiJKhouBDQqu0zPO3cDSCVZbtVYckOWYSvo';

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// For this project, we'll primarily use Supabase client
// Only initialize drizzle if we have a proper DATABASE_URL
let db: any = null;

if (process.env.DATABASE_URL) {
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  db = drizzle(client, { schema });
}

export { db };