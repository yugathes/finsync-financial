# E2E Testing Documentation

## Overview

This document provides comprehensive information about the end-to-end (E2E) testing setup for FinSync using Playwright and TypeScript. The E2E test suite covers all core user flows including authentication, dashboard operations, commitment management (with delete support), shared commitments, and historical import functionality.

## Table of Contents

1. [Test Structure](#test-structure)
2. [Environment Setup](#environment-setup)
3. [Running Tests](#running-tests)
4. [Test Suites](#test-suites)
5. [Helper Utilities](#helper-utilities)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

## Test Structure

The E2E test suite is organized as follows:

```
/tests/
├── e2e/                          # End-to-end test suites
│   ├── auth.spec.ts             # Authentication flows
│   ├── dashboard.spec.ts        # Dashboard functionality
│   ├── commitments.spec.ts      # Commitment CRUD operations
│   ├── shared-commitments.spec.ts  # Groups and shared commitments
│   └── import-records.spec.ts   # Historical import functionality
└── utils/                       # Test helper utilities
    ├── loginHelper.ts           # Authentication helpers
    ├── createCommitmentHelper.ts # Commitment manipulation helpers
    └── dbHelper.ts              # Database verification utilities
```

## Environment Setup

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Supabase account with project setup
- PostgreSQL database (via Supabase or local)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_REACT_APP_SUPABASE_URL=your-supabase-url-here
VITE_REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Test Configuration (optional)
PLAYWRIGHT_BASE_URL=http://localhost:5000
```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

## Running Tests

### Local Development

1. **Start the application server:**
   ```bash
   npm run dev
   ```

2. **Run all E2E tests:**
   ```bash
   npx playwright test
   ```

3. **Run specific test suite:**
   ```bash
   npx playwright test auth.spec.ts
   npx playwright test commitments.spec.ts
   ```

4. **Run tests in UI mode (interactive):**
   ```bash
   npx playwright test --ui
   ```

5. **Run tests in headed mode (see browser):**
   ```bash
   npx playwright test --headed
   ```

6. **Run tests in debug mode:**
   ```bash
   npx playwright test --debug
   ```

7. **View test report:**
   ```bash
   npx playwright show-report
   ```

### Production/Staging Testing

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Run tests against production build:
   ```bash
   npx playwright test
   ```

## Test Suites

### 1. Authentication Tests (`auth.spec.ts`)

Tests all authentication-related flows:

- **User Registration:**
  - Successful registration with valid credentials
  - Error handling for invalid email format
  - Error handling for weak passwords
  - Password confirmation validation

- **User Login:**
  - Successful login with valid credentials
  - Error handling for invalid credentials
  - Session persistence

- **User Logout:**
  - Successful logout
  - Session cleanup
  - Redirect to login page

- **Protected Routes:**
  - Redirect unauthenticated users to login
  - Prevent authenticated users from accessing login/register pages

### 2. Dashboard Tests (`dashboard.spec.ts`)

Tests dashboard functionality and real-time updates:

- **Dashboard Display:**
  - Income and expense sections visibility
  - Totals and balance calculations
  - Initial state for new users

- **Real-time CRUD Updates:**
  - Dashboard updates after creating commitment
  - Dashboard updates after deleting commitment
  - Dashboard updates after marking commitment as paid

- **Dashboard Filters:**
  - Personal commitments display (default)
  - Toggle shared commitments visibility
  - Toggle imported records visibility

- **Dashboard Navigation:**
  - Navigation to groups page
  - Month navigation controls

### 3. Commitments Tests (`commitments.spec.ts`)

Tests comprehensive commitment management with emphasis on deletion:

- **Create Commitment:**
  - Create static commitment
  - Create dynamic commitment
  - Create recurring commitment
  - Form validation for required fields

- **Edit Commitment:**
  - Edit commitment title
  - Edit commitment amount
  - Edit commitment category

- **Delete Commitment:**
  - Delete commitment from UI
  - Verify removal from database
  - **Dashboard recalculation after deletion**
  - Confirmation dialog handling

- **Mark as Paid/Unpaid:**
  - Mark commitment as paid
  - Toggle paid status back to unpaid
  - Verify payment status persistence

- **Categories:**
  - Create commitments with different categories

### 4. Shared Commitments Tests (`shared-commitments.spec.ts`)

Tests group functionality and shared commitments:

- **Group Management:**
  - Create new group
  - Display owner with crown badge
  - Group member listing

- **Group Invitations:**
  - Invite member to group
  - View pending invitations
  - Accept group invitation
  - Reject invitation (optional)

- **Shared Commitments:**
  - Create shared commitment
  - View shared commitment as group member
  - Mark shared commitment as paid by member
  - **Sync paid status across users**

- **Group Member Management:**
  - Remove member from group (owner only)
  - Leave group (member)

### 5. Import Records Tests (`import-records.spec.ts`)

Tests historical data import functionality:

- **CSV Import:**
  - Open import dialog
  - Import CSV commitments successfully
  - Preview before importing
  - Handle invalid CSV format gracefully

- **JSON Import:**
  - Import JSON commitments successfully
  - Handle invalid JSON format

- **Imported Records Display:**
  - Hide imported records by default
  - Show imported records when toggled
  - Display "Imported" badge on imported commitments

- **Exclusion from Totals:**
  - **Verify imported records excluded from active totals**
  - Verify correct totals calculation
  - Toggle imported records in/out of calculations

## Helper Utilities

### Login Helper (`loginHelper.ts`)

Provides authentication utilities:

```typescript
// Login via UI
await loginViaUI(page, email, password);

// Register via UI
await registerViaUI(page, email, password);

// Logout via UI
await logoutViaUI(page);

// Create test user via API
const { userId, email } = await createTestUser(email, password);

// Get Supabase client
const supabase = getSupabaseClient();
```

### Commitment Helper (`createCommitmentHelper.ts`)

Provides commitment manipulation utilities:

```typescript
// Create commitment via UI
await createCommitmentViaUI(page, {
  title: 'Rent',
  category: 'Housing',
  amount: 1200,
  type: 'static',
  recurring: true
});

// Edit commitment
await editCommitmentViaUI(page, 'Rent', { amount: 1300 });

// Delete commitment
await deleteCommitmentViaUI(page, 'Rent');

// Mark as paid
await markCommitmentAsPaid(page, 'Rent');

// Verify commitment exists
await verifyCommitmentExists(page, 'Rent', true);
```

### Database Helper (`dbHelper.ts`)

Provides database verification utilities:

```typescript
// Verify commitment in database
const exists = await verifyCommitmentInDB(userId, 'Rent');

// Get commitment from database
const commitment = await getCommitmentFromDB(userId, 'Rent');

// Get dashboard totals
const { income, expenses, balance } = await getDashboardTotals(userId, '2025-01');

// Create commitment via API (bypass UI)
await createCommitmentViaAPI(userId, {
  title: 'Test',
  category: 'Testing',
  amount: 100
});

// Import commitments via API
await importCommitmentsViaAPI(userId, commitments);
```

## Best Practices

### Test Isolation

- Each test should be independent and not rely on other tests
- Use `beforeEach` and `afterEach` hooks for setup and cleanup
- Create unique test data using timestamps to avoid conflicts

```typescript
const testEmail = `test-user-${Date.now()}@example.com`;
const commitmentTitle = `Test Commitment ${Date.now()}`;
```

### Test Data Management

- **Create dedicated test users** for each test suite
- **Clean up test data** after tests complete (when possible)
- **Use isolated test groups** to avoid cross-contamination
- **Never use production data** in tests

### Waiting Strategies

- Use explicit waits instead of arbitrary timeouts:
  ```typescript
  // Good
  await page.waitForURL('**/dashboard');
  await expect(element).toBeVisible();
  
  // Avoid (unless necessary)
  await page.waitForTimeout(5000);
  ```

- Use appropriate timeout values:
  ```typescript
  await expect(element).toBeVisible({ timeout: 5000 });
  ```

### Error Handling

- Always handle potential errors gracefully:
  ```typescript
  if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
    await element.click();
  } else {
    console.log('Element not found - feature might not be available');
  }
  ```

### Assertions

- Use meaningful assertions:
  ```typescript
  // Good
  await expect(page.locator(`text=${commitment.title}`)).toBeVisible();
  
  // Better
  await verifyCommitmentExists(page, commitment.title, true);
  ```

## CI/CD Integration

### GitHub Actions Workflow

The E2E tests are automatically run on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`
- Manual workflow dispatch

### Workflow Configuration

Location: `.github/workflows/e2e.yml`

Key features:
- Runs on `ubuntu-latest`
- Installs Playwright with Chromium browser
- Builds application before testing
- Starts server and verifies health endpoint
- Runs all E2E tests
- Uploads test reports and artifacts

### Required GitHub Secrets

Configure the following secrets in your GitHub repository:

- `VITE_REACT_APP_SUPABASE_URL`
- `VITE_REACT_APP_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

### Viewing Test Results

1. Navigate to **Actions** tab in GitHub repository
2. Select the **E2E Tests** workflow
3. Click on a specific workflow run
4. Download test reports from **Artifacts** section
5. Extract and open `playwright-report/index.html` in a browser

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Errors

**Problem:** Tests fail with "Supabase credentials not found"

**Solution:**
- Verify `.env` file exists and contains correct credentials
- Ensure environment variables are loaded
- Check Supabase project is active and accessible

#### 2. Test Timeouts

**Problem:** Tests timeout waiting for elements

**Solution:**
- Increase timeout values in test configuration
- Verify application server is running
- Check network connectivity
- Use `--headed` mode to see what's happening

#### 3. Element Not Found

**Problem:** Tests fail to find UI elements

**Solution:**
- Verify element selectors match current UI
- Use `page.pause()` to inspect page state
- Check if feature is implemented
- Update selectors if UI has changed

#### 4. Port Already in Use

**Problem:** Cannot start server - port 5000 already in use

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
```

#### 5. Browser Installation Issues

**Problem:** Playwright browsers not installing

**Solution:**
```bash
# Install system dependencies
npx playwright install-deps

# Reinstall browsers
npx playwright install chromium --force
```

### Debug Mode

Run tests in debug mode for detailed troubleshooting:

```bash
# Debug all tests
npx playwright test --debug

# Debug specific test
npx playwright test auth.spec.ts --debug

# Debug with headed browser
npx playwright test --headed --debug
```

### Trace Viewer

View detailed traces of failed tests:

```bash
# Run tests with tracing
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Data Seeding and Teardown

### Test User Management

Test users are created dynamically during test execution:

```typescript
// In beforeAll hook
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await registerViaUI(page, testEmail, testPassword);
  } catch (error) {
    console.log('User might already exist');
  } finally {
    await context.close();
  }
});
```

### Cleanup Strategy

**Recommended approach:**
1. Create unique test users per test suite using timestamps
2. Test users remain in database after tests (for audit)
3. Implement periodic cleanup script for old test data

**Optional cleanup (not recommended for production):**
```typescript
test.afterAll(async () => {
  // Clean up test data
  await deleteAllUserCommitments(userId);
  await deleteTestUser(userId);
});
```

### Test Data Isolation

- Use naming conventions: prefix test data with "Test" or "E2E"
- Use unique identifiers: timestamps, UUIDs
- Create separate test groups for group-related tests
- Never modify non-test data

## Test Conventions

### File Naming

- Test files: `*.spec.ts`
- Helper files: `*Helper.ts`
- Use descriptive names: `auth.spec.ts`, not `test1.spec.ts`

### Test Organization

```typescript
test.describe('Feature Name', () => {
  test.describe('Sub-feature', () => {
    test('should do something specific', async ({ page }) => {
      // Test implementation
    });
  });
});
```

### Test Descriptions

- Use descriptive test names
- Start with "should"
- Be specific about what is being tested

```typescript
// Good
test('should delete commitment and update dashboard totals', ...);

// Bad
test('test delete', ...);
```

## Continuous Improvement

### Adding New Tests

1. Identify the feature to test
2. Create test file in appropriate location
3. Write helper functions if needed
4. Implement tests following existing patterns
5. Run tests locally to verify
6. Update documentation
7. Submit pull request

### Updating Existing Tests

1. Identify failing or outdated tests
2. Update selectors or logic as needed
3. Verify tests pass locally
4. Update documentation if behavior changed
5. Submit pull request with clear description

## Support and Resources

- **Playwright Documentation:** https://playwright.dev
- **FinSync Repository:** [GitHub Repository Link]
- **Issue Tracker:** [GitHub Issues Link]
- **Team Slack:** [Slack Channel]

## Appendix

### Sample Test Data

#### CSV Format
```csv
title,category,amount,type,recurring
Rent,Housing,1200,static,true
Groceries,Food,300,dynamic,false
Internet,Utilities,60,static,true
```

#### JSON Format
```json
[
  {
    "title": "Rent",
    "category": "Housing",
    "amount": 1200,
    "type": "static",
    "recurring": true
  },
  {
    "title": "Groceries",
    "category": "Food",
    "amount": 300,
    "type": "dynamic",
    "recurring": false
  }
]
```

### Useful Commands

```bash
# Run tests
npx playwright test                    # Run all tests
npx playwright test --headed          # Run with visible browser
npx playwright test --debug           # Run in debug mode
npx playwright test --ui              # Run in UI mode

# Test specific files
npx playwright test auth.spec.ts      # Run auth tests
npx playwright test commitments       # Run tests matching 'commitments'

# Reports
npx playwright show-report            # View HTML report
npx playwright show-trace trace.zip   # View trace

# Update snapshots
npx playwright test --update-snapshots

# List tests
npx playwright test --list

# Codegen (record tests)
npx playwright codegen http://localhost:5000
```

---

**Last Updated:** 2025-01-28  
**Version:** 1.0.0  
**Maintainers:** FinSync Development Team
