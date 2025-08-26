import { jest } from '@jest/globals';

// Setup test environment
beforeAll(async () => {
  // Setup test database connection
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 'postgresql://postgres:postgres@localhost:5432/finsync_test';
});

afterAll(async () => {
  // Cleanup after tests
});

// Global test helpers - suppress console during tests
if (typeof global !== 'undefined') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error,
  };
}