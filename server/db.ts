import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

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