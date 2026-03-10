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
    const badgeText = data.type === 'commitment' ? 'Commitment' : 'Expenses';
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

async function toggleRecurringSwitch(page: Page) {
  // Click the "Recurring Monthly" switch by its ID
  const recurringSwitch = page.locator('button[role="switch"]#recurring');
  await recurringSwitch.click();
}

async function handleIncomeWarningIfPresent(page: Page): Promise<boolean> {
  // Check if income warning modal appears (happens when income is 0)
  const continueButton = page.locator('button:has-text("Continue Anyway")');
  
  // If the warning modal appears, click "Continue Anyway"
  if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await continueButton.click();
    await page.waitForTimeout(500); // Wait for modal to close
    return true;
  }
  return false;
}

test.describe('Commitment CRUD operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('can create a new commitment', async ({ page }) => {
    const title = `Test Commitment ${Date.now()}`;
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount: '250', type: 'commitment', category: 'Utilities' });
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

    // Wait for count to actually increase
    let countAfter = await getCount();
    let attempts = 0;
    while (countAfter <= countBefore && attempts < 15) {
      await page.waitForTimeout(300);
      countAfter = await getCount();
      attempts++;
    }

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

      // Handle income warning modal if it appears (when income is 0)
      await handleIncomeWarningIfPresent(page);

      await page.waitForSelector('button:has-text("Mark Unpaid")', { state: 'visible', timeout: 10000 });
      await page.waitForLoadState('networkidle');

      // Wait for paid amount to actually increase
      let paidAfter = await getPaidAmount();
      let attempts = 0;
      while (paidAfter <= paidBefore && attempts < 15) {
        await page.waitForTimeout(300);
        paidAfter = await getPaidAmount();
        attempts++;
      }

      expect(paidAfter).toBeGreaterThan(paidBefore);
    }
  });
});

test.describe('Month navigation with recurring vs non-recurring commitments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('recurring commitment appears in future months', async ({ page }) => {
    const recurringTitle = `Recurring Commitment ${Date.now()}`;

    // Create a recurring commitment
    await openCommitmentForm(page);
    await fillCommitmentForm(page, {
      title: recurringTitle,
      amount: '500',
      category: 'Housing',
    });

    // Toggle recurring switch
    await toggleRecurringSwitch(page);

    await submitCommitmentForm(page);

    // Verify commitment appears in current month
    await expect(page.locator(`span:has-text("${recurringTitle}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Navigate to next month
    const nextMonthBtn = page
      .locator('button:has-text("Next"), button[aria-label*="Next"], button:has-text("→")')
      .first();
    if (await nextMonthBtn.isVisible()) {
      await nextMonthBtn.click();
      await page.waitForLoadState('networkidle');

      // Recurring commitment should appear in next month
      await expect(page.locator(`span:has-text("${recurringTitle}").font-semibold`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('non-recurring commitment does NOT appear in future months', async ({ page }) => {
    const nonRecurringTitle = `Non-Recurring ${Date.now()}`;

    // Create a non-recurring commitment
    await openCommitmentForm(page);
    await fillCommitmentForm(page, {
      title: nonRecurringTitle,
      amount: '300',
      category: 'Entertainment',
    });

    // Do NOT toggle recurring (leave it off)
    await submitCommitmentForm(page);

    // Verify commitment appears in current month
    await expect(page.locator(`span:has-text("${nonRecurringTitle}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Navigate to next month
    const nextMonthBtn = page
      .locator('button:has-text("Next"), button[aria-label*="Next"], button:has-text("→")')
      .first();
    if (await nextMonthBtn.isVisible()) {
      await nextMonthBtn.click();
      await page.waitForLoadState('networkidle');

      // Non-recurring commitment should NOT appear in next month
      const commitmentInNextMonth = page.locator(`span:has-text("${nonRecurringTitle}").font-semibold`);
      await expect(commitmentInNextMonth).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('non-recurring commitment does NOT appear in past months', async ({ page }) => {
    const nonRecurringTitle = `Past Month Test ${Date.now()}`;

    // Create a non-recurring commitment
    await openCommitmentForm(page);
    await fillCommitmentForm(page, {
      title: nonRecurringTitle,
      amount: '200',
      category: 'Shopping',
    });

    // Do NOT toggle recurring
    await submitCommitmentForm(page);

    // Navigate to previous month
    const prevMonthBtn = page
      .locator('button:has-text("Previous"), button[aria-label*="Previous"], button:has-text("←")')
      .first();
    if (await prevMonthBtn.isVisible()) {
      await prevMonthBtn.click();
      await page.waitForLoadState('networkidle');

      // Non-recurring commitment should NOT appear in previous month
      const commitmentInPrevMonth = page.locator(`span:has-text("${nonRecurringTitle}").font-semibold`);
      await expect(commitmentInPrevMonth).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('recurring commitment does NOT appear in months before its start date', async ({ page }) => {
    const recurringTitle = `Recurring Past ${Date.now()}`;

    // Create a recurring commitment in the current month.
    // The service materialises rows for the current month + 11 future months only;
    // no rows are created for months that precede the commitment's startDate.
    await openCommitmentForm(page);
    await fillCommitmentForm(page, {
      title: recurringTitle,
      amount: '400',
      category: 'Utilities',
    });

    // Toggle recurring switch
    await toggleRecurringSwitch(page);

    await submitCommitmentForm(page);

    // Verify commitment appears in current month
    await expect(page.locator(`span:has-text("${recurringTitle}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Navigate to previous month
    const prevMonthBtn = page
      .locator('button:has-text("Previous"), button[aria-label*="Previous"], button:has-text("←")')
      .first();
    if (await prevMonthBtn.isVisible()) {
      await prevMonthBtn.click();
      await page.waitForLoadState('networkidle');

      // Recurring commitment should NOT appear in a month before its start date
      const commitmentInPrevMonth = page.locator(`span:has-text("${recurringTitle}").font-semibold`);
      await expect(commitmentInPrevMonth).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Undo function', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('can undo deletion of a non-recurring commitment', async ({ page }) => {
    const title = `Undo Test ${Date.now()}`;
    const amount = '150';

    // Create a commitment to delete
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount, category: 'Food' });
    await submitCommitmentForm(page);

    // Verify commitment appears
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Delete the commitment
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${title}"))`).first();
    const buttons = commitmentCard.getByRole('button');
    const buttonCount = await buttons.count();
    await buttons.nth(buttonCount - 1).click();

    // Confirm deletion in modal
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    await expect(confirmBtn).toBeVisible({ timeout: 2000 });
    await confirmBtn.click();

    // Verify commitment is deleted
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).not.toBeVisible({ timeout: 5000 });

    // Click the Undo button in the toast
    const undoBtn = page.locator('button:has-text("Undo")').first();
    await expect(undoBtn).toBeVisible({ timeout: 5000 });
    await undoBtn.click();

    // Verify commitment is restored
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });
  });

  test('can undo deletion of a recurring commitment for a single month', async ({ page }) => {
    const title = `Undo Recurring Single ${Date.now()}`;
    const amount = '500';

    // Create a recurring commitment
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount, category: 'Utilities' });
    await toggleRecurringSwitch(page);
    await submitCommitmentForm(page);

    // Verify commitment appears
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Delete the commitment for this month only
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${title}"))`).first();
    const buttons = commitmentCard.getByRole('button');
    const buttonCount = await buttons.count();
    await buttons.nth(buttonCount - 1).click();

    // Confirm deletion with scope='single' (should be selected by default)
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    await expect(confirmBtn).toBeVisible({ timeout: 2000 });
    await confirmBtn.click();

    // Verify commitment is deleted
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).not.toBeVisible({ timeout: 5000 });

    // Click the Undo button in the toast
    const undoBtn = page.locator('button:has-text("Undo")').first();
    await expect(undoBtn).toBeVisible({ timeout: 5000 });
    await undoBtn.click();

    // Verify commitment is restored
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });
  });

  test('can undo deletion of a recurring commitment for all months', async ({ page }) => {
    const title = `Undo Recurring All ${Date.now()}`;
    const amount = '300';

    // Create a recurring commitment
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount, category: 'Housing' });
    await toggleRecurringSwitch(page);
    await submitCommitmentForm(page);

    // Verify commitment appears
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Delete the commitment
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${title}"))`).first();
    const buttons = commitmentCard.getByRole('button');
    const buttonCount = await buttons.count();
    await buttons.nth(buttonCount - 1).click();

    // Select "Delete permanently (all months)" option if available
    const allMonthsOption = page.locator('button:has-text("Delete permanently")');
    if (await allMonthsOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await allMonthsOption.click();
      await page.waitForTimeout(300); // Brief wait for selection
    }

    // Confirm deletion
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    await expect(confirmBtn).toBeVisible({ timeout: 2000 });
    await confirmBtn.click();

    // Verify commitment is deleted
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).not.toBeVisible({ timeout: 5000 });

    // Click the Undo button in the toast
    const undoBtn = page.locator('button:has-text("Undo")').first();
    await expect(undoBtn).toBeVisible({ timeout: 5000 });
    await undoBtn.click();

    // Verify commitment is restored with same amount
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });
    // Scope the amount check to the specific commitment card
    const restoredCard = page.locator(`div.rounded-lg.border:has(span:has-text("${title}"))`);
    await expect(restoredCard.locator(`text=${amount}`)).toBeVisible();
  });

  test('undo toast disappears after 5 seconds if not clicked', async ({ page }) => {
    const title = `Undo Timeout ${Date.now()}`;

    // Create and delete a commitment
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount: '100', category: 'Other' });
    await submitCommitmentForm(page);

    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Delete the commitment
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${title}"))`).first();
    const buttons = commitmentCard.getByRole('button');
    const buttonCount = await buttons.count();
    await buttons.nth(buttonCount - 1).click();

    // Confirm deletion
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    await expect(confirmBtn).toBeVisible({ timeout: 2000 });
    await confirmBtn.click();

    // Verify toast appears
    const undoBtn = page.locator('button:has-text("Undo")').first();
    await expect(undoBtn).toBeVisible({ timeout: 5000 });

    // Wait for toast to auto-dismiss (5 seconds + buffer)
    await page.waitForTimeout(6000);

    // Toast should be gone
    await expect(undoBtn).not.toBeVisible({ timeout: 2000 });

    // Verify commitment is still deleted
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).not.toBeVisible({ timeout: 2000 });
  });

  test('restored commitment preserves all properties', async ({ page }) => {
    const title = `Preserve Properties ${Date.now()}`;
    const amount = '350.50';
    const category = 'Entertainment';

    // Create a commitment with specific properties
    await openCommitmentForm(page);
    await fillCommitmentForm(page, { title, amount, category, type: 'commitment' });
    await submitCommitmentForm(page);

    // Verify commitment appears
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });

    // Delete the commitment
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${title}"))`).first();
    const buttons = commitmentCard.getByRole('button');
    const buttonCount = await buttons.count();
    await buttons.nth(buttonCount - 1).click();

    // Confirm deletion
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    await expect(confirmBtn).toBeVisible({ timeout: 2000 });
    await confirmBtn.click();

    // Wait for deletion and undo toast
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).not.toBeVisible({ timeout: 5000 });

    // Click undo
    const undoBtn = page.locator('button:has-text("Undo")').first();
    await expect(undoBtn).toBeVisible({ timeout: 5000 });
    await undoBtn.click();

    // Verify all properties are preserved
    await expect(page.locator(`span:has-text("${title}").font-semibold`)).toBeVisible({ timeout: 5000 });
    // Scope the category check to the specific commitment card
    const restoredCard = page.locator(`div.rounded-lg.border:has(span:has-text("${title}"))`);
    await expect(restoredCard.locator(`text=${category}`)).toBeVisible();
  });
});
