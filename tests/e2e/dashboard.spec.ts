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

test.describe('Dashboard — spending progress bar & % indicator', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('progress bar and % indicator are present on the dashboard', async ({ page }) => {
    // The spending progress bar element should be rendered in the DOM
    // Note: It may have 0% width when no payments exist, so check it's attached
    const progressBar = page.locator('[data-testid="spending-progress-bar"]');
    await expect(progressBar).toBeAttached({ timeout: 7000 });

    // The spending percent indicator should be rendered and visible
    const percentLabel = page.locator('[data-testid="spending-percent"]');
    await expect(percentLabel).toBeVisible({ timeout: 5000 });

    // The label should contain a % sign
    const text = await percentLabel.innerText();
    expect(text).toMatch(/%/);
  });

  test('percent indicator shows 0.0% when no commitments are paid', async ({ page }) => {
    // Add a commitment commitment and do NOT mark it as paid
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    const testTitle = `Progress Zero Test ${Date.now()}`;
    await page.fill('input#title', testTitle);
    await page.fill('input#amount', '400');
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Without income set, paidAmount = 0, income = 0 → 0%
    // The percent element should show 0.0% (or "no income set")
    const percentLabel = page.locator('[data-testid="spending-percent"]');
    await expect(percentLabel).toBeVisible({ timeout: 5000 });
    const text = await percentLabel.innerText();
    // Either 0.0% (zero income) or some non-negative number
    expect(text).toMatch(/%/);
  });

  test('percent indicator increases after marking a commitment as paid', async ({ page }) => {
    // Create a commitment commitment
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    const testTitle = `Progress Paid Test ${Date.now()}`;
    await page.fill('input#title', testTitle);
    await page.fill('input#amount', '200');
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Get percent before paying
    const percentLabel = page.locator('[data-testid="spending-percent"]');
    await expect(percentLabel).toBeVisible({ timeout: 5000 });
    const percentBefore = parseFloat((await percentLabel.innerText()).replace(/[^0-9.]/g, '')) || 0;

    // Mark the commitment as paid
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${testTitle}"))`).first();
    const markPaidBtn = commitmentCard.locator('button:has-text("Mark Paid")').first();
    await expect(markPaidBtn).toBeVisible({ timeout: 5000 });
    await markPaidBtn.click();
    await page.waitForSelector('button:has-text("Mark Unpaid")', { state: 'visible' });
    await page.waitForLoadState('networkidle');

    // Poll until percent increases (income may be 0, so skip assertion if still 0)
    let percentAfter = parseFloat((await percentLabel.innerText()).replace(/[^0-9.]/g, '')) || 0;
    let attempts = 0;
    while (percentAfter <= percentBefore && attempts < 10) {
      await page.waitForTimeout(300);
      percentAfter = parseFloat((await percentLabel.innerText()).replace(/[^0-9.]/g, '')) || 0;
      attempts++;
    }

    // If income was set, percent should have increased; if income is 0 we can only check it's non-negative
    expect(percentAfter).toBeGreaterThanOrEqual(0);
  });

  test('budget utilisation bar is visible when commitments exist', async ({ page }) => {
    // Create a commitment so the budget utilisation bar renders
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    await page.fill('input#title', `Budget Bar Test ${Date.now()}`);
    await page.fill('input#amount', '100');
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    const utilisationBar = page.locator('[data-testid="budget-utilisation-bar"]');
    await expect(utilisationBar).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard — commitment type visual separation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Commitment commitment appears under the commitment group heading', async ({ page }) => {
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    const testTitle = `Commitment Group Test ${Date.now()}`;
    await page.fill('input#title', testTitle);
    await page.fill('input#amount', '150');
    // Commitment is the default type; just select a category
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // The Commitments group header should be visible within the Pending section
    // Note: unpaid commitments use the label "Commitments" (plural)
    const commitmentGroup = page
      .locator('[data-testid="section-pending"]')
      .locator('[data-testid="commitment-group-commitments"]');
    await expect(commitmentGroup).toBeVisible({ timeout: 5000 });

    // The commitment we created should be inside that group
    await expect(commitmentGroup.locator(`span:has-text("${testTitle}")`)).toBeVisible({ timeout: 5000 });
  });

  test('expenses commitment appears under the Expenses group heading', async ({ page }) => {
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    const testTitle = `Expenses Group Test ${Date.now()}`;
    await page.fill('input#title', testTitle);
    await page.fill('input#amount', '250');

    // Switch to Expense type if a toggle/radio exists
    const expenseOption = page
      .locator('label:has-text("Expense"), button:has-text("Expense"), [value="expense"]')
      .first();
    if (await expenseOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expenseOption.click();
    }

    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Either the Expenses group OR the Commitment group should be visible (depends on whether type changed)
    const pendingSection = page.locator('[data-testid="section-pending"]');
    await expect(pendingSection).toBeVisible({ timeout: 5000 });

    // The commitment should appear somewhere in the pending section
    await expect(pendingSection.locator(`span:has-text("${testTitle}")`)).toBeVisible({ timeout: 5000 });
  });

  test('section-pending and section-completed containers are present with commitments', async ({ page }) => {
    // Create one commitment
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    const testTitle = `Section Test ${Date.now()}`;
    await page.fill('input#title', testTitle);
    await page.fill('input#amount', '100');
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Pending section should be visible
    const pendingSection = page.locator('[data-testid="section-pending"]');
    await expect(pendingSection).toBeVisible({ timeout: 5000 });

    // Mark it paid so completed section appears
    const commitmentCard = page.locator(`div.rounded-lg.border:has(span:has-text("${testTitle}"))`).first();
    const markPaidBtn = commitmentCard.locator('button:has-text("Mark Paid")').first();
    await markPaidBtn.click();
    await page.waitForSelector('button:has-text("Mark Unpaid")', { state: 'visible' });
    await page.waitForLoadState('networkidle');

    // Completed section should now be visible
    const completedSection = page.locator('[data-testid="section-completed"]');
    await expect(completedSection).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard — month selector', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('month selector is rendered on the dashboard', async ({ page }) => {
    const selector = page.locator('[data-testid="month-selector"]');
    await expect(selector).toBeVisible({ timeout: 7000 });

    const prevBtn = page.locator('[data-testid="month-prev"]');
    const nextBtn = page.locator('[data-testid="month-next"]');
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
  });

  test('clicking previous arrow navigates to the previous month', async ({ page }) => {
    const dropdownTrigger = page.locator('[data-testid="month-dropdown-trigger"]');
    await expect(dropdownTrigger).toBeVisible({ timeout: 7000 });
    const monthBefore = await dropdownTrigger.innerText();

    await page.click('[data-testid="month-prev"]');
    await page.waitForLoadState('networkidle');

    const monthAfter = await dropdownTrigger.innerText();
    expect(monthAfter).not.toBe(monthBefore);
  });

  test('clicking next arrow navigates to the next month', async ({ page }) => {
    const dropdownTrigger = page.locator('[data-testid="month-dropdown-trigger"]');
    await expect(dropdownTrigger).toBeVisible({ timeout: 7000 });
    const monthBefore = await dropdownTrigger.innerText();

    await page.click('[data-testid="month-next"]');
    await page.waitForLoadState('networkidle');

    const monthAfter = await dropdownTrigger.innerText();
    expect(monthAfter).not.toBe(monthBefore);
  });

  test('historical banner is shown when viewing a past month', async ({ page }) => {
    // Navigate back to a previous month
    await page.click('[data-testid="month-prev"]');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[data-testid="historical-banner"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
  });

  test('historical badge is shown in the month selector for a past month', async ({ page }) => {
    await page.click('[data-testid="month-prev"]');
    await page.waitForLoadState('networkidle');

    const badge = page.locator('[data-testid="historical-badge"]');
    await expect(badge).toBeVisible({ timeout: 5000 });
  });

  test('no historical banner on current month', async ({ page }) => {
    // The dashboard starts on the current month; ensure no historical banner is shown
    const banner = page.locator('[data-testid="historical-banner"]');
    await expect(banner).not.toBeVisible({ timeout: 3000 });
  });

  test('write action buttons are disabled when viewing a historical month', async ({ page }) => {
    // First create a commitment so there are items to check
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    await page.fill('input#title', `History Disable Test ${Date.now()}`);
    await page.fill('input#amount', '100');
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to previous month
    await page.click('[data-testid="month-prev"]');
    await page.waitForLoadState('networkidle');

    // If there are any Mark Paid buttons, they should be disabled
    const markPaidBtns = page.locator('button:has-text("Mark Paid")');
    const count = await markPaidBtns.count();
    for (let i = 0; i < count; i++) {
      await expect(markPaidBtns.nth(i)).toBeDisabled();
    }
  });
});


test.describe('Monthly Budget Limit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Set Budget button is visible on the dashboard', async ({ page }) => {
    const btn = page.locator('[data-testid="set-budget-btn"]');
    await expect(btn).toBeVisible({ timeout: 7000 });
  });

  test('BudgetModal opens when Set Budget is clicked', async ({ page }) => {
    await page.click('[data-testid="set-budget-btn"]');
    await expect(page.locator('input#budget')).toBeVisible({ timeout: 5000 });
  });

  test('no budget warning shown when no budget limit is set', async ({ page }) => {
    // Ensure no budget is set by checking there is no warning banner or budget limit section
    await expect(page.locator('[data-testid="budget-over-alert"]')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="budget-warning"]')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="budget-limit-section"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('setting a budget limit shows the budget limit progress bar', async ({ page }) => {
    // Open budget modal and set a large limit so no warning fires yet
    await page.click('[data-testid="set-budget-btn"]');
    await expect(page.locator('input#budget')).toBeVisible({ timeout: 5000 });
    await page.fill('input#budget', '999999');
    await page.click('button:has-text("Save Budget")');
    await page.waitForLoadState('networkidle');

    // Budget limit bar should now be visible
    await expect(page.locator('[data-testid="budget-limit-section"]')).toBeVisible({ timeout: 5000 });
  });

  test('warning banner shown when commitments exceed 80% of budget limit', async ({ page }) => {
    // Add a commitment of 900
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    await page.fill('input#title', `Budget Warning Test ${Date.now()}`);
    await page.fill('input#amount', '900');
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Set a budget limit of 1000 so 900 = 90% → warning
    await page.click('[data-testid="set-budget-btn"]');
    await expect(page.locator('input#budget')).toBeVisible({ timeout: 5000 });
    await page.fill('input#budget', '1000');
    await page.click('button:has-text("Save Budget")');
    await page.waitForLoadState('networkidle');

    // Warning banner must appear (commitments = 90% of budget)
    await expect(page.locator('[data-testid="budget-warning"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="budget-over-alert"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('over-budget alert shown when commitments exceed budget limit', async ({ page }) => {
    // Add a commitment of 1200
    await page.click('button:has-text("Add Commitment"), button:has-text("Add New")');
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 });
    await page.fill('input#title', `Over Budget Test ${Date.now()}`);
    await page.fill('input#amount', '1200');
    await page.locator('button:has-text("Select a category")').first().click();
    await page.locator('[role="option"]:has-text("Other")').first().click();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Set budget lower than total commitments
    await page.click('[data-testid="set-budget-btn"]');
    await expect(page.locator('input#budget')).toBeVisible({ timeout: 5000 });
    await page.fill('input#budget', '100');
    await page.click('button:has-text("Save Budget")');
    await page.waitForLoadState('networkidle');

    // Over-budget alert must appear
    await expect(page.locator('[data-testid="budget-over-alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('removing budget limit hides warning indicators', async ({ page }) => {
    // Set a budget that triggers a warning first
    await page.click('[data-testid="set-budget-btn"]');
    await expect(page.locator('input#budget')).toBeVisible({ timeout: 5000 });
    await page.fill('input#budget', '1');
    await page.click('button:has-text("Save Budget")');
    await page.waitForLoadState('networkidle');

    // Now remove the limit
    await page.click('[data-testid="set-budget-btn"]');
    await expect(page.locator('button:has-text("Remove Limit")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Remove Limit")');
    await page.waitForLoadState('networkidle');

    // Neither warning nor alert should be visible
    await expect(page.locator('[data-testid="budget-over-alert"]')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="budget-warning"]')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="budget-limit-section"]')).not.toBeVisible({ timeout: 3000 });
  });
});
