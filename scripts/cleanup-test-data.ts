#!/usr/bin/env tsx
/**
 * Test Data Cleanup Script
 *
 * This script cleans up all test data created during E2E tests.
 * It safely removes:
 * - All commitments and related payments for the test user
 * - All groups and group memberships for the test user
 * - All monthly income records for the test user
 * - Resets the test user's monthly income to default
 *
 * Usage:
 *   npm run test:cleanup
 *   or
 *   tsx scripts/cleanup-test-data.ts
 *
 * Environment:
 *   Reads DATABASE_URL from environment
 *   Reads TEST_USER_EMAIL from .env.test (defaults to testuser@yugathes.online)
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: join(__dirname, '..', '.env.test') });

const prisma = new PrismaClient();

async function cleanupTestData() {
  const testEmail = process.env.TEST_USER_EMAIL || 'testuser@yugathes.online';
  const defaultIncome = 5000; // Match the seed default

  console.log('\n🧹 Starting test data cleanup...');
  console.log(`📧 Test user email: ${testEmail}\n`);

  try {
    // Find the test user
    const testUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (!testUser) {
      console.log('⚠️  Test user not found. Nothing to clean up.');
      return;
    }

    console.log(`✓ Found test user: ${testUser.id}\n`);

    // Delete in order to respect foreign key constraints
    console.log('Deleting test data...');

    // 1. Delete commitment payments (by paidBy field)
    const deletedPayments = await prisma.commitmentPayment.deleteMany({
      where: { paidBy: testUser.id },
    });
    console.log(`  ✓ Deleted ${deletedPayments.count} commitment payments`);

    // 2. Delete commitments
    const deletedCommitments = await prisma.commitment.deleteMany({
      where: { userId: testUser.id },
    });
    console.log(`  ✓ Deleted ${deletedCommitments.count} commitments`);

    // 3. Delete group members (where user is a member)
    const deletedMemberships = await prisma.groupMember.deleteMany({
      where: { userId: testUser.id },
    });
    console.log(`  ✓ Deleted ${deletedMemberships.count} group memberships`);

    // 4. Delete groups owned by the test user
    const deletedGroups = await prisma.group.deleteMany({
      where: { ownerId: testUser.id },
    });
    console.log(`  ✓ Deleted ${deletedGroups.count} groups`);

    // 5. Delete monthly income records
    const deletedIncomes = await prisma.monthlyIncome.deleteMany({
      where: { userId: testUser.id },
    });
    console.log(`  ✓ Deleted ${deletedIncomes.count} monthly income records`);

    // 6. Reset user's monthly income to default
    await prisma.user.update({
      where: { id: testUser.id },
      data: { monthlyIncome: defaultIncome },
    });
    console.log(`  ✓ Reset user monthly income to ${defaultIncome}`);

    console.log('\n✅ Test data cleanup completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupTestData().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

export default cleanupTestData;
