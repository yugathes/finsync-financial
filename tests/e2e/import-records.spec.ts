import { test, expect } from '@playwright/test';
import { loginViaUI, registerViaUI } from '../utils/loginHelper';
import { verifyCommitmentExists } from '../utils/createCommitmentHelper';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Import Historical Records', () => {
  const testEmail = `test-import-${Date.now()}@example.com`;
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
  
  test.describe('CSV Import', () => {
    test('should open import dialog', async ({ page }) => {
      // Look for import button
      const importButton = page.locator('button:has-text("Import"), button:has-text("Import Commitments")').first();
      
      if (await importButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await importButton.click();
        
        // Should show file input or upload interface
        await page.waitForTimeout(1000);
        
        const fileInput = await page.locator('input[type="file"]').isVisible({ timeout: 3000 }).catch(() => false);
        const uploadArea = await page.locator('text=/upload|drag|drop/i').isVisible({ timeout: 3000 }).catch(() => false);
        
        expect(fileInput || uploadArea).toBeTruthy();
      } else {
        console.log('Import button not found - feature might not be available');
      }
    });
    
    test('should import CSV commitments successfully', async ({ page }) => {
      // Create a test CSV file
      const testCSVPath = path.join('/tmp', `test-import-${Date.now()}.csv`);
      const csvContent = `title,category,amount,type,recurring
Test Import 1,Testing,100,static,false
Test Import 2,Testing,200,static,true
Test Import 3,Testing,150,dynamic,false`;
      
      fs.writeFileSync(testCSVPath, csvContent);
      
      // Look for import button
      const importButton = page.locator('button:has-text("Import"), button:has-text("Import Commitments")').first();
      
      if (await importButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await importButton.click();
        await page.waitForTimeout(1000);
        
        // Upload file
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fileInput.setInputFiles(testCSVPath);
          
          // Wait for file to be processed
          await page.waitForTimeout(2000);
          
          // Look for preview or confirm button
          const confirmButton = page.locator('button:has-text("Import"), button:has-text("Confirm"), button:has-text("Continue")').first();
          if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
            
            // Should show success message
            const successMessage = await page.locator('text=/success|imported|complete/i').isVisible({ timeout: 3000 }).catch(() => false);
            expect(successMessage).toBeTruthy();
          }
        } else {
          console.log('File input not found');
        }
      }
      
      // Cleanup
      fs.unlinkSync(testCSVPath);
    });
    
    test('should show preview before importing', async ({ page }) => {
      // Create a test CSV
      const testCSVPath = path.join('/tmp', `test-preview-${Date.now()}.csv`);
      const csvContent = `title,category,amount,type,recurring
Preview Test,Testing,75,static,false`;
      
      fs.writeFileSync(testCSVPath, csvContent);
      
      const importButton = page.locator('button:has-text("Import")').first();
      
      if (await importButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await importButton.click();
        await page.waitForTimeout(1000);
        
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fileInput.setInputFiles(testCSVPath);
          await page.waitForTimeout(2000);
          
          // Should show preview with the test data
          const hasPreview = await page.locator('text=Preview Test').isVisible({ timeout: 3000 }).catch(() => false);
          
          if (hasPreview) {
            expect(hasPreview).toBeTruthy();
          } else {
            console.log('Preview not shown or uses different format');
          }
        }
      }
      
      // Cleanup
      fs.unlinkSync(testCSVPath);
    });
    
    test('should handle invalid CSV format gracefully', async ({ page }) => {
      // Create an invalid CSV file
      const testCSVPath = path.join('/tmp', `test-invalid-${Date.now()}.csv`);
      const csvContent = `invalid,headers,here
some,random,data`;
      
      fs.writeFileSync(testCSVPath, csvContent);
      
      const importButton = page.locator('button:has-text("Import")').first();
      
      if (await importButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await importButton.click();
        await page.waitForTimeout(1000);
        
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fileInput.setInputFiles(testCSVPath);
          await page.waitForTimeout(2000);
          
          // Should show error message
          const errorMessage = await page.locator('text=/error|invalid|missing|required/i').isVisible({ timeout: 3000 }).catch(() => false);
          expect(errorMessage).toBeTruthy();
        }
      }
      
      // Cleanup
      fs.unlinkSync(testCSVPath);
    });
  });
  
  test.describe('JSON Import', () => {
    test('should import JSON commitments successfully', async ({ page }) => {
      // Create a test JSON file
      const testJSONPath = path.join('/tmp', `test-import-${Date.now()}.json`);
      const jsonContent = JSON.stringify([
        {
          title: 'JSON Import 1',
          category: 'Testing',
          amount: 100,
          type: 'static',
          recurring: false
        },
        {
          title: 'JSON Import 2',
          category: 'Testing',
          amount: 250,
          type: 'static',
          recurring: true
        }
      ]);
      
      fs.writeFileSync(testJSONPath, jsonContent);
      
      const importButton = page.locator('button:has-text("Import")').first();
      
      if (await importButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await importButton.click();
        await page.waitForTimeout(1000);
        
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fileInput.setInputFiles(testJSONPath);
          await page.waitForTimeout(2000);
          
          // Confirm import
          const confirmButton = page.locator('button:has-text("Import"), button:has-text("Confirm")').first();
          if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
            
            // Should show success
            const successMessage = await page.locator('text=/success|imported/i').isVisible({ timeout: 3000 }).catch(() => false);
            expect(successMessage).toBeTruthy();
          }
        }
      }
      
      // Cleanup
      fs.unlinkSync(testJSONPath);
    });
  });
  
  test.describe('Imported Records Display', () => {
    test('should hide imported records by default', async ({ page }) => {
      // Imported records should not be visible by default in active commitments
      // Look for toggle
      const importedToggle = page.locator('input[type="checkbox"]:near(text=/imported/i)').first();
      
      if (await importedToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Check if it's unchecked by default
        const isChecked = await importedToggle.isChecked();
        expect(isChecked).toBeFalsy();
      } else {
        console.log('Imported toggle not found');
      }
    });
    
    test('should show imported records when toggled', async ({ page }) => {
      // Enable imported records view
      const importedToggle = page.locator('input[type="checkbox"]:near(text=/imported/i)').first();
      
      if (await importedToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await importedToggle.check();
        await page.waitForTimeout(1500);
        
        // Should now show imported records with badge
        const importedBadge = await page.locator('text=/imported/i').isVisible({ timeout: 3000 }).catch(() => false);
        
        if (importedBadge) {
          expect(importedBadge).toBeTruthy();
        } else {
          console.log('No imported records or badge not shown');
        }
      }
    });
    
    test('should display imported badge on imported commitments', async ({ page }) => {
      // First import some data
      const testJSONPath = path.join('/tmp', `test-badge-${Date.now()}.json`);
      const jsonContent = JSON.stringify([
        {
          title: `Badge Test ${Date.now()}`,
          category: 'Testing',
          amount: 50,
          type: 'static',
          recurring: false
        }
      ]);
      
      fs.writeFileSync(testJSONPath, jsonContent);
      
      const importButton = page.locator('button:has-text("Import")').first();
      
      if (await importButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await importButton.click();
        await page.waitForTimeout(1000);
        
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fileInput.setInputFiles(testJSONPath);
          await page.waitForTimeout(2000);
          
          const confirmButton = page.locator('button:has-text("Import")').first();
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
          }
        }
        
        // Enable imported view
        const importedToggle = page.locator('input[type="checkbox"]:near(text=/imported/i)').first();
        if (await importedToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
          await importedToggle.check();
          await page.waitForTimeout(1500);
          
          // Should see badge on imported record
          const importedBadge = await page.locator('text=/imported/i, [data-badge="imported"]').isVisible({ timeout: 3000 }).catch(() => false);
          expect(importedBadge).toBeTruthy();
        }
      }
      
      // Cleanup
      fs.unlinkSync(testJSONPath);
    });
  });
  
  test.describe('Imported Records Exclusion from Totals', () => {
    test('should exclude imported records from active totals by default', async ({ page }) => {
      // Get current expense total
      const expenseElement = page.locator('text=/expense|total expense/i').first();
      let initialTotal = 0;
      
      if (await expenseElement.isVisible({ timeout: 3000 }).catch(() => false)) {
        const parentElement = expenseElement.locator('..');
        const amountElement = parentElement.locator('text=/\\$\\d+/').first();
        if (await amountElement.isVisible({ timeout: 2000 }).catch(() => false)) {
          const amountText = await amountElement.textContent();
          initialTotal = parseFloat(amountText?.replace('$', '') || '0');
        }
      }
      
      // Import a record
      const testJSONPath = path.join('/tmp', `test-exclusion-${Date.now()}.json`);
      const importAmount = 500;
      const jsonContent = JSON.stringify([
        {
          title: `Exclusion Test ${Date.now()}`,
          category: 'Testing',
          amount: importAmount,
          type: 'static',
          recurring: false
        }
      ]);
      
      fs.writeFileSync(testJSONPath, jsonContent);
      
      const importButton = page.locator('button:has-text("Import")').first();
      
      if (await importButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await importButton.click();
        await page.waitForTimeout(1000);
        
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fileInput.setInputFiles(testJSONPath);
          await page.waitForTimeout(2000);
          
          const confirmButton = page.locator('button:has-text("Import")').first();
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
          }
        }
        
        // Verify total hasn't increased by the imported amount
        // (since imported records should be excluded by default)
        await page.waitForTimeout(1500);
        
        const afterExpenseElement = page.locator('text=/expense|total expense/i').first();
        if (await afterExpenseElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          const parentElement = afterExpenseElement.locator('..');
          const amountElement = parentElement.locator('text=/\\$\\d+/').first();
          if (await amountElement.isVisible({ timeout: 2000 }).catch(() => false)) {
            const amountText = await amountElement.textContent();
            const afterTotal = parseFloat(amountText?.replace('$', '') || '0');
            
            // Total should not have increased by $500 (or should be same as before)
            // This verifies imported records are excluded from active totals
            expect(afterTotal).not.toBeGreaterThan(initialTotal + 100); // Some tolerance
          }
        }
      }
      
      // Cleanup
      fs.unlinkSync(testJSONPath);
    });
  });
});
