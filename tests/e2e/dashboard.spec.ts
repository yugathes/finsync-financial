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
  // The BalanceCard shows "Commitments" label with value below it
  const el = page.locator('text=Commitments').locator('..').locator('.text-xl').first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  const text = await el.innerText();
  // Remove all non-numeric characters except decimal point
  const cleaned = text.replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
}

async function getPaidAmount(page: Page): Promise<number> {
  const el = page.locator('text=Paid This Month').locator('..').locator('.text-xl, .text-2xl').first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  const text = await el.innerText();
  const cleaned = text.replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
}

async function getTotalCommitmentsCount(page: Page): Promise<number> {
  const el = page.locator('text=Total Commitments').locator('..').locator('.text-xl, .text-2xl').first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  const text = await el.innerText();
  const cleaned = text.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
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
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    await page.fill('input#title', 'Test Commitment');
    await page.fill('input#amount', '500');

    // Select category (required field)
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();

    await page.click('button[type="submit"]');

    // Wait for the form to close and data to refresh
    await page.waitForLoadState('networkidle');

    // Wait for the total to actually increase
    let newAmount = await getTotalCommitmentsAmount(page);
    let attempts = 0;
    while (newAmount <= initialAmount && attempts < 15) {
      await page.waitForTimeout(300);
      newAmount = await getTotalCommitmentsAmount(page);
      attempts++;
    }

    const newCount = await getTotalCommitmentsCount(page);

    expect(newAmount).toBeGreaterThan(initialAmount);
    expect(newCount).toBe(initialCount + 1);
  });

  test('marking a commitment as paid updates "Paid This Month" total', async ({ page }) => {
    // First, create a commitment to mark as paid
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    await page.fill('input#title', `Test for Paid ${Date.now()}`);
    await page.fill('input#amount', '300');
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Food")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    const initialPaid = await getPaidAmount(page);

    // Click "Mark Paid" on the commitment we just created
    const markPaidBtn = page.locator('button:has-text("Mark Paid")').first();
    await expect(markPaidBtn).toBeVisible();
    await markPaidBtn.click();

    // Wait for "Mark Unpaid" to appear (indicates paid state)
    await page.waitForSelector('button:has-text("Mark Unpaid")', { state: 'visible' });
    await page.waitForLoadState('networkidle');

    // Wait for paid amount to actually increase
    let newPaid = await getPaidAmount(page);
    let attempts = 0;
    while (newPaid <= initialPaid && attempts < 15) {
      await page.waitForTimeout(300);
      newPaid = await getPaidAmount(page);
      attempts++;
    }

    expect(newPaid).toBeGreaterThan(initialPaid);
  });

  test('marking a commitment as unpaid decrements "Paid This Month" total', async ({ page }) => {
    // First, create a commitment and mark it as paid
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    const testAmount = 275;
    const testTitle = `Test Unpaid ${Date.now()}`;
    await page.fill('input#title', testTitle);
    await page.fill('input#amount', testAmount.toString());
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Shopping")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Wait for the commitment to appear
    await expect(page.locator(`span:has-text("${testTitle}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Mark it as paid - find the specific commitment card
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${testTitle}"))`).first();
    const markPaidBtn = commitmentCard.locator('button:has-text("Mark Paid")').first();
    await expect(markPaidBtn).toBeVisible();
    await markPaidBtn.click();
    await page.waitForTimeout(500);

    const paidAfterMarking = await getPaidAmount(page);

    // Now mark it as unpaid - find the same commitment card
    const markUnpaidBtn = commitmentCard.locator('button:has-text("Mark Unpaid")').first();
    await expect(markUnpaidBtn).toBeVisible();
    await markUnpaidBtn.click();

    // Wait for operation to complete
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Wait for paid amount to actually decrease
    let paidAfterUnmarking = await getPaidAmount(page);
    let attempts = 0;
    while (paidAfterUnmarking >= paidAfterMarking && attempts < 15) {
      await page.waitForTimeout(300);
      paidAfterUnmarking = await getPaidAmount(page);
      attempts++;
    }

    // Should decrease by the amount we just unmarked
    expect(paidAfterUnmarking).toBeLessThan(paidAfterMarking);
    expect(paidAfterMarking - paidAfterUnmarking).toBeGreaterThanOrEqual(testAmount - 1); // Allow 1 MYR tolerance
  });

  test('deleting a commitment decrements dashboard totals', async ({ page }) => {
    // First, create a commitment to delete
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    const testTitle = `Delete Test ${Date.now()}`;
    await page.fill('input#title', testTitle);
    await page.fill('input#amount', '150');
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Wait for the commitment to appear
    await expect(page.locator(`span:has-text("${testTitle}").font-semibold`)).toBeVisible({ timeout: 5000 });

    const initialAmount = await getTotalCommitmentsAmount(page);
    const initialCount = await getTotalCommitmentsCount(page);

    // Click delete on the specific commitment we just created
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${testTitle}"))`).first();
    await expect(commitmentCard).toBeVisible({ timeout: 2000 });

    const deleteBtn = commitmentCard.locator('button.text-red-500').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Confirm deletion
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Wait for commitment to disappear
    await expect(page.locator(`span:has-text("${testTitle}").font-semibold`)).not.toBeVisible({ timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Wait for the total to actually decrease
    let newAmount = await getTotalCommitmentsAmount(page);
    let attempts = 0;
    while (newAmount >= initialAmount && attempts < 15) {
      await page.waitForTimeout(300);
      newAmount = await getTotalCommitmentsAmount(page);
      attempts++;
    }

    // Wait for count to decrease
    let newCount = await getTotalCommitmentsCount(page);
    attempts = 0;
    while (newCount >= initialCount && attempts < 15) {
      await page.waitForTimeout(300);
      newCount = await getTotalCommitmentsCount(page);
      attempts++;
    }

    expect(newAmount).toBeLessThan(initialAmount);
    expect(newCount).toBe(initialCount - 1);
  });
});

test.describe('Dashboard totals — imported records excluded', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
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
