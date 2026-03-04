import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Dashboard Totals E2E Tests
 *
 * These tests verify that commitment CRUD operations correctly update
 * dashboard totals in real-time, and that imported records are excluded
 * from all active financial totals.
 *
 * Prerequisites:
 *   - A running FinSync server (set BASE_URL env variable, default: http://localhost:3000)
 *   - A test user seeded in the database (set TEST_USER_EMAIL / TEST_USER_PASSWORD)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'testuser@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'testpassword';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

async function getTotalCommitmentsAmount(page: Page): Promise<number> {
  // The BalanceCard shows "Commitments" as a monetary value
  const el = page.locator('text=Commitments').locator('..').locator('.text-xl, .text-2xl').first();
  await el.waitFor({ state: 'visible' });
  const text = await el.innerText();
  return parseFloat(text.replace(/[^0-9.]/g, ''));
}

async function getPaidAmount(page: Page): Promise<number> {
  const el = page.locator('text=Paid This Month').locator('..').locator('.text-xl, .text-2xl').first();
  await el.waitFor({ state: 'visible' });
  const text = await el.innerText();
  return parseFloat(text.replace(/[^0-9.]/g, ''));
}

async function getTotalCommitmentsCount(page: Page): Promise<number> {
  const el = page.locator('text=Total Commitments').locator('..').locator('.text-xl, .text-2xl').first();
  await el.waitFor({ state: 'visible' });
  const text = await el.innerText();
  return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
}

test.describe('Dashboard totals — commitment CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('creating a commitment immediately increments dashboard totals', async ({ page }) => {
    const initialAmount = await getTotalCommitmentsAmount(page);
    const initialCount = await getTotalCommitmentsCount(page);

    // Open commitment form
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await page.fill('input[name="title"]', 'Test Commitment');
    await page.fill('input[name="amount"]', '500');

    await page.click('button[type="submit"]');

    // Wait for the form to close and data to refresh
    await page.waitForSelector('button:has-text("Add Commitment"), button:has-text("Add New")', { state: 'visible' });

    const newAmount = await getTotalCommitmentsAmount(page);
    const newCount = await getTotalCommitmentsCount(page);

    expect(newAmount).toBeGreaterThan(initialAmount);
    expect(newCount).toBe(initialCount + 1);
  });

  test('marking a commitment as paid updates "Paid This Month" total', async ({ page }) => {
    const initialPaid = await getPaidAmount(page);

    // Click "Mark Paid" on first unpaid commitment
    const markPaidBtn = page.locator('button:has-text("Mark Paid")').first();
    await expect(markPaidBtn).toBeVisible();
    await markPaidBtn.click();

    // Wait for "Mark Unpaid" to appear (indicates paid state)
    await page.waitForSelector('button:has-text("Mark Unpaid")', { state: 'visible' });

    const newPaid = await getPaidAmount(page);
    expect(newPaid).toBeGreaterThan(initialPaid);
  });

  test('marking a commitment as unpaid decrements "Paid This Month" total', async ({ page }) => {
    // First ensure there is a paid commitment
    const markPaidBtn = page.locator('button:has-text("Mark Paid")').first();
    if (await markPaidBtn.isVisible()) {
      await markPaidBtn.click();
      await page.waitForSelector('button:has-text("Mark Unpaid")', { state: 'visible' });
    }

    const paidAfterMarking = await getPaidAmount(page);

    // Now mark it as unpaid
    const markUnpaidBtn = page.locator('button:has-text("Mark Unpaid")').first();
    await expect(markUnpaidBtn).toBeVisible();
    await markUnpaidBtn.click();

    // Wait for "Mark Paid" to reappear
    await page.waitForSelector('button:has-text("Mark Paid")', { state: 'visible' });

    const paidAfterUnmarking = await getPaidAmount(page);
    expect(paidAfterUnmarking).toBeLessThan(paidAfterMarking);
  });

  test('deleting a commitment decrements dashboard totals', async ({ page }) => {
    const initialAmount = await getTotalCommitmentsAmount(page);
    const initialCount = await getTotalCommitmentsCount(page);

    // Click delete on the first commitment
    const deleteBtn = page.locator('button:has(svg[data-lucide="trash-2"])').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Confirm deletion
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Wait for list to update
    await page.waitForLoadState('networkidle');

    const newAmount = await getTotalCommitmentsAmount(page);
    const newCount = await getTotalCommitmentsCount(page);

    expect(newAmount).toBeLessThan(initialAmount);
    expect(newCount).toBe(initialCount - 1);
  });
});

test.describe('Dashboard totals — imported records excluded', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('imported commitments are NOT counted in dashboard totals', async ({ page }) => {
    const totalBefore = await getTotalCommitmentsAmount(page);
    const countBefore = await getTotalCommitmentsCount(page);

    // Enable "Show Imported Records" toggle
    const importedToggle = page.locator('[id="imported-filter"]');
    await importedToggle.click();
    await page.waitForLoadState('networkidle');

    // Totals must remain the same after showing imported records
    const totalAfter = await getTotalCommitmentsAmount(page);
    const countAfter = await getTotalCommitmentsCount(page);

    expect(totalAfter).toBe(totalBefore);
    expect(countAfter).toBe(countBefore);
  });

  test('imported commitments are shown in a separate section with "Imported" badge', async ({ page }) => {
    // Enable "Show Imported Records" toggle
    const importedToggle = page.locator('[id="imported-filter"]');
    await importedToggle.click();
    await page.waitForLoadState('networkidle');

    // Check for Imported badge (only if there are imported records)
    const importedSection = page.locator('text=Imported Records');
    if (await importedSection.isVisible()) {
      await expect(page.locator('.bg-purple-100:has-text("Imported")').first()).toBeVisible();
    }
  });
});

test.describe('Dashboard totals — session consistency', () => {
  test('dashboard totals reflect latest commitment state after page reload', async ({ page }) => {
    await login(page);

    const totalBefore = await getTotalCommitmentsAmount(page);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    const totalAfter = await getTotalCommitmentsAmount(page);

    // Totals should be consistent
    expect(totalAfter).toBe(totalBefore);
  });
});
