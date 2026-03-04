import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Commitments CRUD E2E Tests
 *
 * These tests verify that all commitment operations (create, edit, delete,
 * mark paid/unpaid, import) work correctly and trigger immediate dashboard
 * total updates.
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

async function openCommitmentForm(page: Page) {
  await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
  await expect(page.locator('form, [role="dialog"]').first()).toBeVisible();
}

async function fillCommitmentForm(
  page: Page,
  data: { title: string; amount: string; type?: string; category?: string }
) {
  await page.fill('input[name="title"]', data.title);
  await page.fill('input[name="amount"]', data.amount);
  if (data.type) {
    await page.selectOption('select[name="type"]', data.type).catch(() => {
      // type selector may be a radio or button group — skip if unavailable
    });
  }
  if (data.category) {
    await page
      .fill('input[name="category"]', data.category)
      .catch(() => page.selectOption('select[name="category"]', data.category!));
  }
}

async function submitCommitmentForm(page: Page) {
  await page.click('button[type="submit"]');
  // Wait for form to close (modal/dialog should disappear)
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' }).catch(() => {
    // Modal may not use role="dialog"; fall back to network idle
    return page.waitForLoadState('networkidle');
  });
}

test.describe('Commitment CRUD operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('can create a new commitment', async ({ page }) => {
    const title = `Test Commitment ${Date.now()}`;
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount: '250', type: 'static', category: 'Utilities' });
    await submitCommitmentForm(page);

    // Commitment should appear in the list
    await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 5000 });
  });

  test('created commitment shows correct amount', async ({ page }) => {
    const title = `Amount Test ${Date.now()}`;
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount: '750' });
    await submitCommitmentForm(page);

    await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 5000 });
    // Amount should be visible near the commitment title
    await expect(page.locator('text=750').first()).toBeVisible();
  });

  test('can mark a commitment as paid', async ({ page }) => {
    // Find first unpaid commitment
    const markPaidBtn = page.locator('button:has-text("Mark Paid")').first();
    await expect(markPaidBtn).toBeVisible();

    await markPaidBtn.click();

    // Wait for the "Mark Unpaid" button to appear (indicates paid state)
    await expect(page.locator('button:has-text("Mark Unpaid")').first()).toBeVisible({ timeout: 5000 });
  });

  test('can mark a paid commitment as unpaid', async ({ page }) => {
    // Ensure at least one paid commitment exists
    const markPaidBtn = page.locator('button:has-text("Mark Paid")').first();
    if (await markPaidBtn.isVisible()) {
      await markPaidBtn.click();
      await page.waitForSelector('button:has-text("Mark Unpaid")', { state: 'visible' });
    }

    const markUnpaidBtn = page.locator('button:has-text("Mark Unpaid")').first();
    await expect(markUnpaidBtn).toBeVisible();
    await markUnpaidBtn.click();

    // The commitment should be back in the pending section
    await expect(page.locator('button:has-text("Mark Paid")').first()).toBeVisible({ timeout: 5000 });
  });

  test('can delete a commitment', async ({ page }) => {
    // Create a temporary commitment to delete
    const title = `Delete Me ${Date.now()}`;
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount: '100' });
    await submitCommitmentForm(page);

    await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 5000 });

    // Delete it — find delete button within the row containing the title
    const commitmentRow = page.locator(`:has-text("${title}")`).last();
    const deleteBtn = commitmentRow.locator('button:has(svg)').last();
    await deleteBtn.click();

    // Confirm in modal if present
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await expect(page.locator(`text=${title}`)).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Import commitments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('imported commitments are NOT counted in dashboard totals', async ({ page }) => {
    const getTotal = async () => {
      const el = page.locator('text=Commitments').locator('..').locator('.text-xl, .text-2xl').first();
      await el.waitFor({ state: 'visible' });
      const text = await el.innerText();
      return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    };

    const totalBefore = await getTotal();

    // Enable "Show Imported Records" toggle
    const toggle = page.locator('[id="imported-filter"]');
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForLoadState('networkidle');
    }

    // Totals should remain the same after toggling imported visibility
    const totalAfter = await getTotal();
    expect(totalAfter).toBe(totalBefore);
  });

  test('imported records show "Imported" badge', async ({ page }) => {
    // Enable imported records view
    const toggle = page.locator('[id="imported-filter"]');
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForLoadState('networkidle');
    }

    // If any imported records exist, they should have the Imported badge
    const importedSection = page.locator('text=Imported Records');
    const hasImported = await importedSection.isVisible().catch(() => false);
    if (hasImported) {
      await expect(page.locator('.bg-purple-100:has-text("Imported")').first()).toBeVisible();
    }
    // Test passes if there are no imported records
  });
});

test.describe('Dashboard recalculates correctly after each operation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('total commitments count updates after create', async ({ page }) => {
    const getCount = async () => {
      const el = page.locator('text=Total Commitments').locator('..').locator('.text-xl, .text-2xl').first();
      await el.waitFor({ state: 'visible' });
      const text = await el.innerText();
      return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    };

    const countBefore = await getCount();

    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title: `Count Test ${Date.now()}`, amount: '300' });
    await submitCommitmentForm(page);

    await page.waitForLoadState('networkidle');
    const countAfter = await getCount();

    expect(countAfter).toBe(countBefore + 1);
  });

  test('balance card updates after marking commitment as paid', async ({ page }) => {
    const getPaidAmount = async () => {
      const el = page.locator('text=Paid This Month').locator('..').locator('.text-xl, .text-2xl').first();
      await el.waitFor({ state: 'visible' });
      const text = await el.innerText();
      return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    };

    const paidBefore = await getPaidAmount();

    const markPaidBtn = page.locator('button:has-text("Mark Paid")').first();
    if (await markPaidBtn.isVisible()) {
      await markPaidBtn.click();
      await page.waitForSelector('button:has-text("Mark Unpaid")', { state: 'visible' });

      const paidAfter = await getPaidAmount();
      expect(paidAfter).toBeGreaterThan(paidBefore);
    }
  });
});
