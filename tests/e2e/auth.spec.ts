import { test, expect } from '@playwright/test';
import { loginViaUI, registerViaUI, logoutViaUI } from '../utils/loginHelper';

test.describe('Authentication Flows', () => {
  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      const timestamp = Date.now();
      const testEmail = `test-user-${timestamp}@example.com`;
      const testPassword = 'Test123!@#';
      
      await page.goto('/register');
      
      // Verify we're on the registration page
      await expect(page).toHaveURL(/.*register/);
      
      // Fill in registration form
      await page.fill('input[name="email"], input[type="email"]', testEmail);
      await page.fill('input[name="password"], input[type="password"]', testPassword);
      
      // Handle confirm password if it exists
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
      if (await confirmPasswordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmPasswordInput.fill(testPassword);
      }
      
      // Submit registration
      await page.click('button[type="submit"]');
      
      // Should redirect to login or dashboard
      await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });
    });
    
    test('should show error for invalid email', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('input[name="email"], input[type="email"]', 'invalid-email');
      await page.fill('input[name="password"], input[type="password"]', 'Test123!@#');
      
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
      if (await confirmPasswordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmPasswordInput.fill('Test123!@#');
      }
      
      await page.click('button[type="submit"]');
      
      // Should show error or stay on registration page
      // Check for error message or invalid email feedback
      const hasError = await page.locator('text=/invalid|error/i').isVisible({ timeout: 3000 }).catch(() => false);
      const staysOnRegister = page.url().includes('/register');
      
      expect(hasError || staysOnRegister).toBeTruthy();
    });
    
    test('should show error for weak password', async ({ page }) => {
      const timestamp = Date.now();
      const testEmail = `test-user-${timestamp}@example.com`;
      
      await page.goto('/register');
      
      await page.fill('input[name="email"], input[type="email"]', testEmail);
      await page.fill('input[name="password"], input[type="password"]', '123'); // Weak password
      
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
      if (await confirmPasswordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmPasswordInput.fill('123');
      }
      
      await page.click('button[type="submit"]');
      
      // Should show error about password strength
      const hasError = await page.locator('text=/password|weak|strong|length/i').isVisible({ timeout: 3000 }).catch(() => false);
      const staysOnRegister = page.url().includes('/register');
      
      expect(hasError || staysOnRegister).toBeTruthy();
    });
  });
  
  test.describe('User Login', () => {
    // Create a test user before login tests
    const testEmail = `test-login-${Date.now()}@example.com`;
    const testPassword = 'Test123!@#';
    
    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await registerViaUI(page, testEmail, testPassword);
      } catch (error) {
        console.log('Setup: User might already exist or registration failed', error);
      } finally {
        await context.close();
      }
    });
    
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Verify we're on the login page
      await expect(page).toHaveURL(/.*login/);
      
      // Fill in login form
      await page.fill('input[name="email"], input[type="email"]', testEmail);
      await page.fill('input[name="password"], input[type="password"]', testPassword);
      
      // Submit login
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL(/.*dashboard/);
    });
    
    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[name="email"], input[type="email"]', 'wrong@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'WrongPassword123');
      
      await page.click('button[type="submit"]');
      
      // Should show error message or stay on login page
      await page.waitForTimeout(2000);
      
      const hasError = await page.locator('text=/invalid|error|incorrect|failed/i').isVisible({ timeout: 3000 }).catch(() => false);
      const staysOnLogin = page.url().includes('/login');
      
      expect(hasError || staysOnLogin).toBeTruthy();
    });
  });
  
  test.describe('User Logout', () => {
    const testEmail = `test-logout-${Date.now()}@example.com`;
    const testPassword = 'Test123!@#';
    
    test.beforeEach(async ({ page }) => {
      // Register and login before each logout test
      try {
        await registerViaUI(page, testEmail, testPassword);
      } catch {
        await loginViaUI(page, testEmail, testPassword);
      }
    });
    
    test('should logout successfully', async ({ page }) => {
      // Verify we're logged in
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      
      // If not directly visible, try opening a menu
      if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutButton.click();
      } else {
        // Look for user menu
        const menuButton = page.locator('[aria-label*="menu" i], [data-testid*="menu"]').first();
        if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await menuButton.click();
          await page.waitForTimeout(500);
          await page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first().click();
        }
      }
      
      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 5000 });
      await expect(page).toHaveURL(/.*login/);
    });
    
    test('after logout, should not access protected routes', async ({ page }) => {
      // Logout
      try {
        await logoutViaUI(page);
      } catch (error) {
        // Manual logout if helper fails
        const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
        if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutButton.click();
        }
      }
      
      // Wait for logout to complete
      await page.waitForTimeout(1000);
      
      // Try to access dashboard
      await page.goto('/dashboard');
      
      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 5000 });
      await expect(page).toHaveURL(/.*login/);
    });
  });
  
  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access dashboard without logging in
      await page.goto('/dashboard');
      
      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 5000 });
      await expect(page).toHaveURL(/.*login/);
    });
    
    test('should redirect authenticated users from login to dashboard', async ({ page }) => {
      const testEmail = `test-redirect-${Date.now()}@example.com`;
      const testPassword = 'Test123!@#';
      
      // Register/Login first
      try {
        await registerViaUI(page, testEmail, testPassword);
      } catch {
        await loginViaUI(page, testEmail, testPassword);
      }
      
      // Verify we're on dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Try to navigate to login
      await page.goto('/login');
      
      // Should redirect back to dashboard
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      await expect(page).toHaveURL(/.*dashboard/);
    });
  });
});
