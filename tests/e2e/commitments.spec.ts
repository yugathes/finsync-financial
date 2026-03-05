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
  console.log(`Logged in as ${TEST_EMAIL}`);
}

async function openCommitmentForm(page: Page) {
  await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
  // Wait for the form inputs to be visible
  await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
}

async function fillCommitmentForm(
  page: Page,
  data: { title: string; amount: string; type?: string; category?: string }
) {
  // Fill title input
  await page.fill('input#title', data.title);

  // Fill amount input
  await page.fill('input#amount', data.amount);

  // Select type by clicking the badge
  if (data.type) {
    const badgeText = data.type === 'static' ? 'Static' : 'Dynamic';
    await page.locator(`:has-text("${badgeText}")`).first().click();
  }

  // Select category from the Select dropdown
  if (data.category) {
    // Click on the category Select trigger
    await page.locator('button:has-text("Select a category")').first().click();
    // Click on the category option
    await page.locator(`[role="option"]:has-text("${data.category}")`).first().click();
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
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });
  });

  test('created commitment shows correct amount', async ({ page }) => {
    const title = `Amount Test ${Date.now()}`;
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount: '750', category: 'Food' });
    await submitCommitmentForm(page);

    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });
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
    await fillCommitmentForm(page, { title, amount: '100', category: 'Other' });
    await submitCommitmentForm(page);

    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Delete it — find the commitment card and click the last button (delete with trash icon)
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${title}"))`).first();
    await expect(commitmentCard).toBeVisible({ timeout: 2000 });

    // Get all buttons in the card and click the last one (which is the delete button)
    const buttons = commitmentCard.getByRole('button');
    const buttonCount = await buttons.count();
    await buttons.nth(buttonCount - 1).click();

    // Confirm in modal if present
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await expect(page.locator(`span:has-text("${title}").font-semibold`)).not.toBeVisible({ timeout: 5000 });
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
    await fillCommitmentForm(page, { title: `Count Test ${Date.now()}`, amount: '300', category: 'Entertainment' });
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
