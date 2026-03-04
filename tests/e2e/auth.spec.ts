import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * These tests verify that login, logout, and registration flows work
 * correctly, including proper error handling for invalid credentials.
 *
 * Prerequisites:
 *   - A running FinSync server (set BASE_URL env variable, default: http://localhost:3000)
 *   - A test user seeded in the database (set TEST_USER_EMAIL / TEST_USER_PASSWORD)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'testuser@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'testpassword';

async function navigateToLogin(page: Page) {
  await page.goto(`${BASE_URL}/`);
  // If already on a protected route, we may be redirected to /login
  await page.waitForLoadState('networkidle');
}

function getLogoutButton(page: Page) {
  return page.locator('button:has(svg[data-lucide="log-out"]), button:has(.lucide-log-out)').first();
}

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToLogin(page);
  });

  test('login page renders correctly', async ({ page }) => {
    // Should show email and password fields
    await expect(page.locator('input[type="email"], input[id="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"], input[id="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.fill('input[type="email"], input[id="email"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // After successful login, should be redirected to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('failed login shows error message', async ({ page }) => {
    await page.fill('input[type="email"], input[id="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on the login page and show an error
    await expect(page.locator('[role="alert"], .text-red-500, .text-destructive').first()).toBeVisible({
      timeout: 8000,
    });
    // Should NOT be redirected to dashboard
    await expect(page).not.toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('login with empty email shows validation error', async ({ page }) => {
    await page.fill('input[type="password"], input[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Browser HTML5 validation or custom error should prevent submission
    const emailInput = page.locator('input[type="email"], input[id="email"]').first();
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('login with empty password shows validation error', async ({ page }) => {
    await page.fill('input[type="email"], input[id="email"]', TEST_EMAIL);
    await page.click('button[type="submit"]');

    // Browser HTML5 validation or custom error should prevent submission
    const passwordInput = page.locator('input[type="password"], input[id="password"]').first();
    const isValid = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });
});

test.describe('Logout flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in first
    await page.goto(`${BASE_URL}/`);
    await page.fill('input[type="email"], input[id="email"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
  });

  test('logout button is visible when logged in', async ({ page }) => {
    // The LogOut icon button should be visible in the header
    const logoutBtn = page.locator('button[title*="logout" i], button:has(svg[data-lucide="log-out"]), button:has(.lucide-log-out)').first();
    await expect(logoutBtn).toBeVisible();
  });

  test('successful logout redirects to login page', async ({ page }) => {
    // Click the logout button (LogOut icon in the header)
    await getLogoutButton(page).click();

    // After logout, should be redirected to login page
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('accessing protected route after logout redirects to login', async ({ page }) => {
    // Log out
    await getLogoutButton(page).click();
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });

    // Try to navigate to the dashboard directly
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Should be redirected back to login
    await expect(page).not.toHaveURL(`${BASE_URL}/dashboard`);
  });
});

test.describe('Registration flow', () => {
  test('register page is accessible from login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // There should be a link or button to navigate to registration
    const registerLink = page.locator('a[href*="register"], button:has-text("Sign up"), button:has-text("Register")').first();
    await expect(registerLink).toBeVisible();
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    // Should show email and password fields
    await expect(page.locator('input[type="email"], input[id="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"], input[id="password"]').first()).toBeVisible();
  });
});
