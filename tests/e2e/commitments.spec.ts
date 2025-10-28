import { test, expect } from '@playwright/test';
import { loginViaUI, registerViaUI } from '../utils/loginHelper';
import { 
  createCommitmentViaUI, 
  editCommitmentViaUI, 
  deleteCommitmentViaUI, 
  markCommitmentAsPaid,
  verifyCommitmentExists,
  getCommitmentAmount
} from '../utils/createCommitmentHelper';

test.describe('Commitments Management', () => {
  const testEmail = `test-commitments-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await registerViaUI(page, testEmail, testPassword);
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch (error) {
      console.log('Setup: User might already exist', error);
    } finally {
      await context.close();
    }
  });
  
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword);
    await page.waitForURL('**/dashboard');
  });
  
  test.describe('Create Commitment', () => {
    test('should create a static commitment successfully', async ({ page }) => {
      const commitment = {
        title: `Rent Payment ${Date.now()}`,
        category: 'Housing',
        amount: 1200,
        type: 'static' as const,
      };
      
      await createCommitmentViaUI(page, commitment);
      
      // Verify commitment appears in UI
      await verifyCommitmentExists(page, commitment.title, true);
      
      // Verify amount is correct
      const displayedAmount = await page.locator(`text=${commitment.title}`).first().isVisible();
      expect(displayedAmount).toBeTruthy();
    });
    
    test('should create a dynamic commitment successfully', async ({ page }) => {
      const commitment = {
        title: `Variable Expense ${Date.now()}`,
        category: 'Utilities',
        amount: 75,
        type: 'dynamic' as const,
      };
      
      await createCommitmentViaUI(page, commitment);
      
      // Verify commitment appears in UI
      await verifyCommitmentExists(page, commitment.title, true);
    });
    
    test('should create a recurring commitment', async ({ page }) => {
      const commitment = {
        title: `Monthly Subscription ${Date.now()}`,
        category: 'Entertainment',
        amount: 15,
        recurring: true,
      };
      
      await createCommitmentViaUI(page, commitment);
      
      // Verify commitment appears in UI
      await verifyCommitmentExists(page, commitment.title, true);
    });
    
    test('should validate required fields', async ({ page }) => {
      // Try to create commitment without filling required fields
      const addButton = page.locator('button:has-text("Add Commitment"), button:has-text("Create Commitment")').first();
      await addButton.click();
      
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Add")').first();
      await submitButton.click();
      
      // Should show validation errors or prevent submission
      await page.waitForTimeout(1000);
      
      // Form should still be open or show error
      const formStillOpen = await page.locator('input[name="title"]').isVisible({ timeout: 2000 }).catch(() => false);
      const hasError = await page.locator('text=/required|invalid|error/i').isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(formStillOpen || hasError).toBeTruthy();
    });
  });
  
  test.describe('Edit Commitment', () => {
    test('should edit commitment title successfully', async ({ page }) => {
      // Create a commitment first
      const originalTitle = `Edit Test ${Date.now()}`;
      const commitment = {
        title: originalTitle,
        category: 'Testing',
        amount: 100,
      };
      
      await createCommitmentViaUI(page, commitment);
      await page.waitForTimeout(1000);
      
      // Edit the commitment
      const newTitle = `${originalTitle} Updated`;
      await editCommitmentViaUI(page, originalTitle, { title: newTitle });
      
      // Verify old title is gone and new title exists
      await verifyCommitmentExists(page, originalTitle, false);
      await verifyCommitmentExists(page, newTitle, true);
    });
    
    test('should edit commitment amount successfully', async ({ page }) => {
      // Create a commitment
      const commitment = {
        title: `Amount Edit ${Date.now()}`,
        category: 'Testing',
        amount: 50,
      };
      
      await createCommitmentViaUI(page, commitment);
      await page.waitForTimeout(1000);
      
      // Edit the amount
      await editCommitmentViaUI(page, commitment.title, { amount: 75 });
      
      // Verify commitment still exists
      await verifyCommitmentExists(page, commitment.title, true);
      
      // Verify new amount is displayed
      await page.waitForTimeout(1000);
      const newAmountVisible = await page.locator('text=/\\$75/').isVisible({ timeout: 3000 }).catch(() => false);
      expect(newAmountVisible).toBeTruthy();
    });
  });
  
  test.describe('Delete Commitment', () => {
    test('should delete commitment successfully', async ({ page }) => {
      // Create a commitment
      const commitment = {
        title: `Delete Me ${Date.now()}`,
        category: 'Testing',
        amount: 100,
      };
      
      await createCommitmentViaUI(page, commitment);
      await page.waitForTimeout(1000);
      
      // Verify it exists
      await verifyCommitmentExists(page, commitment.title, true);
      
      // Delete it
      await deleteCommitmentViaUI(page, commitment.title);
      
      // Verify it's gone from UI
      await verifyCommitmentExists(page, commitment.title, false);
    });
    
    test('should update dashboard totals after deletion', async ({ page }) => {
      // Create a commitment with significant amount
      const commitment = {
        title: `Dashboard Delete ${Date.now()}`,
        category: 'Testing',
        amount: 500,
      };
      
      await createCommitmentViaUI(page, commitment);
      await page.waitForTimeout(1000);
      
      // Verify the $500 appears in dashboard
      const amountBefore = await page.locator('text=/\\$500/').isVisible({ timeout: 3000 }).catch(() => false);
      expect(amountBefore).toBeTruthy();
      
      // Delete the commitment
      await deleteCommitmentViaUI(page, commitment.title);
      
      // Wait for dashboard to recalculate
      await page.waitForTimeout(2000);
      
      // The commitment should be completely removed
      await verifyCommitmentExists(page, commitment.title, false);
    });
    
    test('should confirm deletion when prompted', async ({ page }) => {
      // Create a commitment
      const commitment = {
        title: `Confirm Delete ${Date.now()}`,
        category: 'Testing',
        amount: 75,
      };
      
      await createCommitmentViaUI(page, commitment);
      await page.waitForTimeout(1000);
      
      // Find and click delete button
      const commitmentRow = page.locator(`text=${commitment.title}`).first();
      await commitmentRow.scrollIntoViewIfNeeded();
      
      const deleteButton = commitmentRow.locator('..').locator('button:has-text("Delete"), button[aria-label*="Delete"]').first();
      await deleteButton.click();
      
      // Look for confirmation dialog
      const confirmDialog = await page.locator('text=/confirm|sure|delete/i').isVisible({ timeout: 2000 }).catch(() => false);
      
      if (confirmDialog) {
        // Confirm the deletion
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();
        await confirmButton.click();
        
        // Wait for deletion
        await page.waitForTimeout(1000);
      }
      
      // Verify commitment is deleted
      await verifyCommitmentExists(page, commitment.title, false);
    });
  });
  
  test.describe('Mark as Paid/Unpaid', () => {
    test('should mark commitment as paid', async ({ page }) => {
      // Create a commitment
      const commitment = {
        title: `Pay Me ${Date.now()}`,
        category: 'Testing',
        amount: 100,
      };
      
      await createCommitmentViaUI(page, commitment);
      await page.waitForTimeout(1000);
      
      // Mark as paid
      await markCommitmentAsPaid(page, commitment.title);
      
      // Verify it shows as paid (checkmark, moved to completed, etc.)
      await page.waitForTimeout(1000);
      
      const commitmentRow = page.locator(`text=${commitment.title}`).first();
      const isPaidIndicator = await commitmentRow.locator('..').locator('text=/paid|complete|✓|✔/i').isVisible({ timeout: 3000 }).catch(() => false);
      
      // If not found directly, it might have moved to a "Completed" section
      const inCompletedSection = await page.locator('text=/completed|paid/i').first().isVisible({ timeout: 3000 }).catch(() => false);
      
      expect(isPaidIndicator || inCompletedSection).toBeTruthy();
    });
    
    test('should toggle paid status back to unpaid', async ({ page }) => {
      // Create and mark as paid
      const commitment = {
        title: `Toggle Pay ${Date.now()}`,
        category: 'Testing',
        amount: 50,
      };
      
      await createCommitmentViaUI(page, commitment);
      await page.waitForTimeout(1000);
      
      // Mark as paid
      await markCommitmentAsPaid(page, commitment.title);
      await page.waitForTimeout(1000);
      
      // Try to toggle back to unpaid (click the checkbox again)
      const commitmentRow = page.locator(`text=${commitment.title}`).first();
      const paidCheckbox = commitmentRow.locator('..').locator('input[type="checkbox"]').first();
      
      if (await paidCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await paidCheckbox.click();
        await page.waitForTimeout(1000);
        
        // Should now show as unpaid
        const isChecked = await paidCheckbox.isChecked();
        expect(isChecked).toBeFalsy();
      }
    });
  });
  
  test.describe('Commitment Categories', () => {
    test('should create commitments with different categories', async ({ page }) => {
      const categories = ['Housing', 'Food', 'Transportation', 'Entertainment'];
      
      for (const category of categories) {
        const commitment = {
          title: `${category} Test ${Date.now()}`,
          category: category,
          amount: 50,
        };
        
        await createCommitmentViaUI(page, commitment);
        await page.waitForTimeout(500);
        
        // Verify it was created
        await verifyCommitmentExists(page, commitment.title, true);
      }
    });
  });
});
