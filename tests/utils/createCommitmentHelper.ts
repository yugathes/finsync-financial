import { Page, expect } from '@playwright/test';

export interface CommitmentData {
  title: string;
  category: string;
  amount: number;
  type?: 'static' | 'dynamic';
  recurring?: boolean;
  shared?: boolean;
  groupId?: string;
}

/**
 * Helper to create a commitment via the UI
 */
export async function createCommitmentViaUI(
  page: Page,
  commitment: CommitmentData
): Promise<void> {
  // Navigate to dashboard if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes('/dashboard')) {
    await page.goto('/dashboard');
  }
  
  // Look for "Add Commitment" or "Create Commitment" button
  const addButton = page.locator('button:has-text("Add Commitment"), button:has-text("Create Commitment"), button:has-text("New Commitment")').first();
  await addButton.click();
  
  // Fill in the form
  await page.fill('input[name="title"], input[placeholder*="title" i]', commitment.title);
  
  // Handle category (might be a select or input)
  const categoryInput = page.locator('input[name="category"], select[name="category"]').first();
  await categoryInput.fill(commitment.category);
  
  // Handle amount
  await page.fill('input[name="amount"], input[type="number"]', commitment.amount.toString());
  
  // Handle type if specified (static/dynamic)
  if (commitment.type) {
    const typeSelector = page.locator(`input[value="${commitment.type}"], button:has-text("${commitment.type}")`);
    if (await typeSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeSelector.click();
    }
  }
  
  // Handle recurring checkbox
  if (commitment.recurring !== undefined) {
    const recurringCheckbox = page.locator('input[name="recurring"], input[type="checkbox"][id*="recurring"]');
    if (await recurringCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (commitment.recurring) {
        await recurringCheckbox.check();
      } else {
        await recurringCheckbox.uncheck();
      }
    }
  }
  
  // Handle shared checkbox and group selection
  if (commitment.shared !== undefined) {
    const sharedCheckbox = page.locator('input[name="shared"], input[type="checkbox"][id*="shared"]');
    if (await sharedCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (commitment.shared) {
        await sharedCheckbox.check();
        
        // If group ID is specified, select it
        if (commitment.groupId) {
          const groupSelect = page.locator('select[name="groupId"], select[name="group"]');
          if (await groupSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await groupSelect.selectOption(commitment.groupId);
          }
        }
      }
    }
  }
  
  // Submit the form
  await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Save")');
  
  // Wait for success indication (toast, modal close, or new commitment in list)
  await page.waitForTimeout(1000); // Brief wait for UI to update
}

/**
 * Helper to edit a commitment via the UI
 */
export async function editCommitmentViaUI(
  page: Page,
  commitmentTitle: string,
  updates: Partial<CommitmentData>
): Promise<void> {
  // Find the commitment in the list
  const commitmentRow = page.locator(`text=${commitmentTitle}`).first();
  await commitmentRow.scrollIntoViewIfNeeded();
  
  // Look for edit button near the commitment
  const editButton = commitmentRow.locator('..').locator('button:has-text("Edit"), button[aria-label*="Edit"]').first();
  await editButton.click();
  
  // Update fields
  if (updates.title) {
    await page.fill('input[name="title"]', updates.title);
  }
  if (updates.category) {
    await page.fill('input[name="category"], select[name="category"]', updates.category);
  }
  if (updates.amount !== undefined) {
    await page.fill('input[name="amount"]', updates.amount.toString());
  }
  
  // Submit the update
  await page.click('button[type="submit"]:has-text("Update"), button[type="submit"]:has-text("Save")');
  
  await page.waitForTimeout(1000);
}

/**
 * Helper to delete a commitment via the UI
 */
export async function deleteCommitmentViaUI(
  page: Page,
  commitmentTitle: string
): Promise<void> {
  // Find the commitment in the list
  const commitmentRow = page.locator(`text=${commitmentTitle}`).first();
  await commitmentRow.scrollIntoViewIfNeeded();
  
  // Look for delete button near the commitment
  const deleteButton = commitmentRow.locator('..').locator('button:has-text("Delete"), button[aria-label*="Delete"], button:has-text("Remove")').first();
  await deleteButton.click();
  
  // Confirm deletion if there's a confirmation dialog
  const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")');
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click();
  }
  
  // Wait for the commitment to be removed from the list
  await expect(page.locator(`text=${commitmentTitle}`)).toHaveCount(0, { timeout: 5000 });
}

/**
 * Helper to mark a commitment as paid via the UI
 */
export async function markCommitmentAsPaid(
  page: Page,
  commitmentTitle: string
): Promise<void> {
  const commitmentRow = page.locator(`text=${commitmentTitle}`).first();
  await commitmentRow.scrollIntoViewIfNeeded();
  
  // Look for checkbox or "Mark Paid" button
  const paidButton = commitmentRow.locator('..').locator('input[type="checkbox"], button:has-text("Paid"), button:has-text("Mark")').first();
  await paidButton.click();
  
  await page.waitForTimeout(1000);
}

/**
 * Helper to verify a commitment exists in the UI
 */
export async function verifyCommitmentExists(
  page: Page,
  commitmentTitle: string,
  shouldExist = true
): Promise<void> {
  const commitmentLocator = page.locator(`text=${commitmentTitle}`);
  
  if (shouldExist) {
    await expect(commitmentLocator.first()).toBeVisible({ timeout: 5000 });
  } else {
    await expect(commitmentLocator).toHaveCount(0, { timeout: 5000 });
  }
}

/**
 * Helper to get commitment amount from UI
 */
export async function getCommitmentAmount(
  page: Page,
  commitmentTitle: string
): Promise<number> {
  const commitmentRow = page.locator(`text=${commitmentTitle}`).first();
  await commitmentRow.scrollIntoViewIfNeeded();
  
  // Look for amount in the same row
  const amountText = await commitmentRow.locator('..').locator('text=/\\$\\d+(\\.\\d{2})?/').first().textContent();
  
  if (!amountText) {
    throw new Error(`Could not find amount for commitment: ${commitmentTitle}`);
  }
  
  // Parse the amount (remove $ and parse as float)
  const amount = parseFloat(amountText.replace('$', ''));
  return amount;
}
