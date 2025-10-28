# FinSync E2E Test Suite

This directory contains the end-to-end test suite for FinSync using Playwright and TypeScript.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

3. **Set up environment variables:**
   - Copy `.env.test.example` to `.env`
   - Fill in your Supabase and database credentials

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Run tests:**
   ```bash
   npm run test:e2e
   ```

## Test Suites

- **`auth.spec.ts`** - Authentication flows (register, login, logout, protected routes)
- **`dashboard.spec.ts`** - Dashboard functionality and real-time updates
- **`commitments.spec.ts`** - Commitment CRUD operations with deletion support
- **`shared-commitments.spec.ts`** - Group management and shared commitments
- **`import-records.spec.ts`** - Historical data import functionality

## Helper Utilities

- **`loginHelper.ts`** - Authentication and user management helpers
- **`createCommitmentHelper.ts`** - Commitment manipulation helpers
- **`dbHelper.ts`** - Database verification and API interaction helpers

## Available Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests with visible browser
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Record new tests
npm run test:e2e:codegen
```

## Documentation

For comprehensive documentation, see [`/docs/testing.md`](../docs/testing.md)

## Key Features

✅ Comprehensive coverage of all core user flows  
✅ Delete operations with UI and DB verification  
✅ Dashboard recalculation after changes  
✅ Shared commitments sync across users  
✅ Historical import with exclusion from active totals  
✅ GitHub Actions CI/CD integration  
✅ Reusable helper functions  
✅ Detailed test reports and traces  

## CI/CD

Tests automatically run on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/e2e.yml` for workflow configuration.

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### Supabase Connection Issues
- Verify `.env` file exists and contains correct credentials
- Check Supabase project is active
- Ensure service role key is correct

### Browser Installation Issues
```bash
# Install system dependencies
npx playwright install-deps

# Reinstall browsers
npx playwright install chromium --force
```

## Contributing

When adding new tests:
1. Follow existing test patterns
2. Use helper functions for common operations
3. Ensure tests are isolated and independent
4. Add descriptive test names
5. Update documentation

## Support

For issues or questions:
- Check `/docs/testing.md` for detailed documentation
- Review existing tests for examples
- Consult Playwright docs: https://playwright.dev
