import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Simple hash function for test passwords (NOT for production)
 * In production, use bcrypt or similar
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  const testEmail = process.env.TEST_USER_EMAIL || 'testuser@yugathes.online';
  const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword';

  console.log(`Seeding test user: ${testEmail}`);

  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (existingUser) {
      console.log(`Test user already exists with ID: ${existingUser.id}`);
      return;
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashPassword(testPassword), // Simple hash for testing only
        monthlyIncome: 5000, // Default monthly income for testing
      },
    });

    console.log(`✓ Test user created with ID: ${user.id}`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
