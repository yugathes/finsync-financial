import { createClient } from '@supabase/supabase-js';
import { prisma } from '../lib/prisma';

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

// Export Prisma client as the primary database client
export { prisma as db };
export { prisma };