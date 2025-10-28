import { Page, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to login a user via the UI
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Helper to register a new user via the UI
 */
export async function registerViaUI(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/register');
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for successful registration (may redirect to login or dashboard)
  await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });
}

/**
 * Helper to logout via UI
 */
export async function logoutViaUI(page: Page): Promise<void> {
  // Look for logout button or menu
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
  
  if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutButton.click();
  } else {
    // Try to find in menu/dropdown
    const menuTrigger = page.locator('[data-testid="user-menu"], button[aria-label="User menu"]').first();
    if (await menuTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuTrigger.click();
      await page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first().click();
    }
  }
  
  // Wait for redirect to login
  await page.waitForURL('**/login', { timeout: 5000 });
}

/**
 * Helper to create a Supabase client for direct DB operations
 */
export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.VITE_REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found in environment');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Helper to create a test user via Supabase API
 */
export async function createTestUser(
  email: string,
  password: string
): Promise<{ userId: string; email: string }> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }
  
  if (!data.user) {
    throw new Error('User creation returned no user data');
  }
  
  return {
    userId: data.user.id,
    email: data.user.email || email,
  };
}

/**
 * Helper to delete a test user via Supabase API
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Note: This requires admin privileges. In a real test environment,
  // you might need to use the Supabase service role key
  // For now, we'll just sign them out
  await supabase.auth.signOut();
}

/**
 * Helper to wait for an element with text content
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout = 5000
): Promise<void> {
  await expect(page.locator(`text=${text}`).first()).toBeVisible({ timeout });
}
