# E2E Testing with Playwright

This guide explains how to set up, run, and debug Playwright end-to-end tests for FinSync.

## Prerequisites

- Node.js 20+
- A running FinSync server (local or remote)
- A test user account in your database

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Install Playwright browsers

```bash
npx playwright install --with-deps chromium
```

### 3. Configure environment variables

Create a `.env.test` file (or set environment variables directly):

```bash
# URL of your running FinSync application
BASE_URL=http://localhost:3000

# Credentials for the test user (must exist in the database)
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=testpassword
```

> **Note:** The test user must exist in your Supabase project. Create one via the Supabase dashboard or the registration page.

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run a specific spec file

```bash
npx playwright test tests/e2e/auth.spec.ts
npx playwright test tests/e2e/commitments.spec.ts
npx playwright test tests/e2e/dashboard.spec.ts
```

### Run tests in headed mode (see the browser)

```bash
npx playwright test --headed
```

### Run tests with the Playwright UI (interactive)

```bash
npx playwright test --ui
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

## Test Structure

```
tests/
└── e2e/
    ├── auth.spec.ts          # Login, logout, and registration flows
    ├── commitments.spec.ts   # CRUD operations and payment toggling
    └── dashboard.spec.ts     # Dashboard recalculation after data changes
```

### auth.spec.ts

Covers:
- Login page renders correctly
- Successful login redirects to dashboard
- Failed login (invalid credentials) shows an error message
- Login form validation (empty email / password)
- Logout button is visible when authenticated
- Successful logout redirects to login page
- Accessing a protected route after logout redirects to login
- Registration page is accessible and renders correctly

### commitments.spec.ts

Covers:
- Creating a new commitment (appears in the list with correct amount)
- Marking a commitment as paid (status changes)
- Marking a paid commitment back to unpaid
- Deleting a commitment
- Imported commitments are excluded from dashboard totals
- Imported records show the "Imported" badge
- Dashboard count updates after each create operation
- Dashboard balance updates after marking paid

### dashboard.spec.ts

Covers:
- Creating a commitment immediately increments dashboard totals
- Marking paid updates "Paid This Month" total
- Marking unpaid decrements "Paid This Month" total
- Deleting a commitment decrements dashboard totals
- Imported commitments do NOT affect dashboard totals
- Dashboard totals are consistent after a page reload

## Playwright Configuration

The Playwright configuration is in `playwright.config.ts`:

```typescript
// Key settings:
testDir: './tests/e2e'   // Where spec files are located
baseURL: 'http://localhost:3000'  // Override with BASE_URL env var
workers: 1               // Sequential execution (auth state isolation)
retries: 1               // One retry on CI
```

## CI/CD

Playwright tests run automatically on every pull request via GitHub Actions (`.github/workflows/playwright.yml`).

### Required GitHub Secrets

Configure these secrets in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `E2E_BASE_URL` | URL of the deployed staging/test environment (maps to the `BASE_URL` env var used by tests; defaults to `http://localhost:3000` if not set) |
| `E2E_TEST_USER_EMAIL` | Email of the test user (maps to `TEST_USER_EMAIL` in tests) |
| `E2E_TEST_USER_PASSWORD` | Password of the test user (maps to `TEST_USER_PASSWORD` in tests) |

If `E2E_BASE_URL` is not set, tests default to `http://localhost:3000`. For CI, you must either:
1. Start the application as a service in the workflow, or
2. Point to an already-deployed staging environment.

### Viewing Test Results

After a CI run, Playwright HTML reports are uploaded as a workflow artifact named `playwright-report` and retained for 30 days.

## Debugging Failed Tests

### View the HTML report locally

```bash
npx playwright show-report
```

### Run with traces enabled

```bash
npx playwright test --trace on
```

### Slow down test execution

```bash
PWDEBUG=1 npx playwright test
```

### Screenshots on failure

Playwright automatically captures a screenshot on test failure when `trace: 'on-first-retry'` is configured.

## Test Isolation

Each test suite logs in via `test.beforeEach`. To avoid test pollution:

- Use unique titles (e.g., `Test Commitment ${Date.now()}`) when creating data
- Delete any test data created during the test at the end (using `test.afterEach` if needed)
- Tests run sequentially (`workers: 1`) to avoid race conditions on shared app state

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ERR_CONNECTION_REFUSED` | Ensure the FinSync server is running on `BASE_URL` |
| Login tests fail | Verify `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` match a real Supabase user |
| Timeout on dashboard | Increase `timeout` in `playwright.config.ts` or check server performance |
| `Duplicate function` TypeScript error | Check `dashboard.spec.ts` for duplicate declarations |
