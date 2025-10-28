import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to get a Supabase client with service role (admin) privileges if available
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.VITE_REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('Supabase URL not found in environment');
  }
  
  // Try to use service role key for admin operations, otherwise fall back to anon key
  const supabaseKey = supabaseServiceKey || process.env.VITE_REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseKey) {
    throw new Error('Supabase key not found in environment');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Helper to verify a commitment exists in the database
 */
export async function verifyCommitmentInDB(
  userId: string,
  commitmentTitle: string
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  
  // Query via the API endpoint instead of direct DB access
  const response = await fetch(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'}/api/commitments/user/${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch commitments: ${response.statusText}`);
  }
  
  const commitments = await response.json();
  return commitments.some((c: any) => c.title === commitmentTitle);
}

/**
 * Helper to get commitment details from database
 */
export async function getCommitmentFromDB(
  userId: string,
  commitmentTitle: string
): Promise<any | null> {
  const response = await fetch(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'}/api/commitments/user/${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch commitments: ${response.statusText}`);
  }
  
  const commitments = await response.json();
  return commitments.find((c: any) => c.title === commitmentTitle) || null;
}

/**
 * Helper to delete all commitments for a test user (cleanup)
 */
export async function deleteAllUserCommitments(userId: string): Promise<void> {
  const response = await fetch(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'}/api/commitments/user/${userId}`);
  
  if (!response.ok) {
    return; // User might not have any commitments
  }
  
  const commitments = await response.json();
  
  // Delete each commitment
  for (const commitment of commitments) {
    await fetch(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'}/api/commitments/${commitment.id}`, {
      method: 'DELETE',
    });
  }
}

/**
 * Helper to verify a group exists in the database
 */
export async function verifyGroupInDB(
  groupId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'}/api/groups/${groupId}`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Helper to get user's groups from database
 */
export async function getUserGroups(userId: string): Promise<any[]> {
  const response = await fetch(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'}/api/groups/user/${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch groups: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Helper to verify dashboard totals
 */
export async function getDashboardTotals(
  userId: string,
  month: string
): Promise<{ income: number; expenses: number; balance: number }> {
  const response = await fetch(
    `${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'}/api/dashboard/${userId}?month=${month}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    income: parseFloat(data.income || 0),
    expenses: parseFloat(data.expenses || 0),
    balance: parseFloat(data.balance || 0),
  };
}

/**
 * Helper to create a test commitment directly via API (bypass UI)
 */
export async function createCommitmentViaAPI(
  userId: string,
  commitment: {
    title: string;
    category: string;
    amount: number;
    type?: string;
    recurring?: boolean;
    shared?: boolean;
    groupId?: string;
  }
): Promise<any> {
  const response = await fetch(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'}/api/commitments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      ...commitment,
      type: commitment.type || 'static',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create commitment: ${error}`);
  }
  
  return await response.json();
}

/**
 * Helper to import commitments via API
 */
export async function importCommitmentsViaAPI(
  userId: string,
  commitments: Array<{
    title: string;
    category: string;
    amount: number;
    type: string;
    recurring: boolean;
  }>
): Promise<any> {
  const response = await fetch(`${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000'}/api/commitments/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      commitments,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to import commitments: ${error}`);
  }
  
  return await response.json();
}
