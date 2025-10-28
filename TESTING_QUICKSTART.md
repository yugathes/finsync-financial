# Quick Start Guide for E2E Testing

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Node.js 20.x installed
- Supabase account with a project set up
- Access to the repository

### 2. Clone and Install
```bash
git clone <repository-url>
cd finsync-financial
npm install
```

### 3. Install Playwright Browsers
```bash
npx playwright install chromium
```

### 4. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Or for testing specifically
cp .env.test.example .env
```

Edit `.env` and fill in your credentials:
```env
VITE_REACT_APP_SUPABASE_URL=https://your-project.supabase.co
VITE_REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 5. Generate Database Client
```bash
npm run prisma:generate
```

### 6. Start the Application
```bash
# In one terminal
npm run dev
```

### 7. Run Tests
```bash
# In another terminal
npm run test:e2e
```

## 🎯 What Gets Tested?

### ✅ Authentication (auth.spec.ts)
- User registration with validation
- Login with credentials
- Logout functionality
- Protected route access

### ✅ Dashboard (dashboard.spec.ts)
- Income and expense display
- Real-time updates after CRUD operations
- Filter toggles (shared, imported)
- Month navigation

### ✅ Commitments (commitments.spec.ts)
- Create static/dynamic commitments
- Edit commitment details
- **Delete with DB verification**
- Mark as paid/unpaid
- **Dashboard recalculation after deletion**

### ✅ Shared Commitments (shared-commitments.spec.ts)
- Create groups
- Invite members
- Accept/reject invitations
- Share commitments
- Sync paid status across users

### ✅ Import Records (import-records.spec.ts)
- CSV file import
- JSON file import
- Preview before import
- **Exclusion from active totals**
- Toggle imported visibility

## 🛠 Useful Commands

```bash
# Run specific test file
npx playwright test auth.spec.ts

# Run tests matching a pattern
npx playwright test commitments

# Run in UI mode (recommended for development)
npm run test:e2e:ui

# Run with visible browser (see what's happening)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report

# Record new tests
npm run test:e2e:codegen
```

## 📊 Understanding Test Results

### ✅ All Passed
```
✓ 45 tests passed (2m 30s)
```
Everything works! 🎉

### ❌ Some Failed
```
✓ 40 tests passed
✗ 5 tests failed
```
Check the output for details. Common causes:
- UI changes (update selectors)
- Timing issues (adjust waits)
- Environment issues (check .env)

### ⏭️ Some Skipped
```
✓ 40 tests passed
⊘ 5 tests skipped
```
Tests were intentionally skipped (usually feature not implemented yet)

## 🐛 Common Issues & Solutions

### Issue: "Supabase credentials not found"
**Solution:**
```bash
# Verify .env file exists
ls -la .env

# Check content
cat .env

# Ensure variables are set
echo $VITE_REACT_APP_SUPABASE_URL
```

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Find and kill the process
lsof -i :5000
kill -9 <PID>

# Or use a different port
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

### Issue: "Timeout waiting for element"
**Solution:**
- Element selector might be wrong
- Page might not have loaded
- Feature might not be implemented

```bash
# Run in headed mode to see what's happening
npm run test:e2e:headed

# Or debug mode to step through
npm run test:e2e:debug
```

### Issue: "Browser not installed"
**Solution:**
```bash
# Install all dependencies
npx playwright install-deps

# Reinstall browsers
npx playwright install chromium --force
```

## 📖 Learn More

- **Full Documentation**: [`docs/testing.md`](../docs/testing.md)
- **Test Suite Overview**: [`tests/README.md`](../tests/README.md)
- **Playwright Docs**: https://playwright.dev

## 💡 Pro Tips

1. **Use UI Mode for Development**
   ```bash
   npm run test:e2e:ui
   ```
   Best way to develop and debug tests interactively!

2. **Run One Test at a Time**
   ```bash
   npx playwright test auth.spec.ts
   ```
   Faster feedback when working on specific features.

3. **Check Test Reports**
   ```bash
   npm run test:e2e:report
   ```
   Detailed results with screenshots and traces.

4. **Use Codegen to Record Tests**
   ```bash
   npm run test:e2e:codegen
   ```
   Records your browser interactions as test code!

5. **Update Selectors Carefully**
   If UI changes, update test selectors in helper files for consistency.

## 🎓 Writing Your First Test

1. **Create a new spec file:**
   ```typescript
   // tests/e2e/my-feature.spec.ts
   import { test, expect } from '@playwright/test';
   
   test.describe('My Feature', () => {
     test('should do something', async ({ page }) => {
       await page.goto('/');
       await expect(page.locator('h1')).toBeVisible();
     });
   });
   ```

2. **Use helper functions:**
   ```typescript
   import { loginViaUI } from '../utils/loginHelper';
   
   test('my test', async ({ page }) => {
     await loginViaUI(page, 'test@example.com', 'password');
     // Your test code...
   });
   ```

3. **Run your test:**
   ```bash
   npx playwright test my-feature.spec.ts --headed
   ```

## 🤝 Contributing Tests

1. Follow existing patterns in test files
2. Use helper functions for common operations
3. Make tests independent (don't rely on other tests)
4. Add descriptive test names
5. Update documentation when adding new tests

## ✨ That's It!

You're ready to run and write E2E tests for FinSync! 

For more detailed information, see [`docs/testing.md`](../docs/testing.md).

Happy Testing! 🎉
