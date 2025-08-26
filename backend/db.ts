import { PrismaClient } from './lib/mock-prisma';

// Use mock Prisma client when @prisma/client is not available
let prisma: PrismaClient;

try {
  const { PrismaClient: RealPrismaClient } = require('@prisma/client');
  prisma = new RealPrismaClient();
} catch (error) {
  console.warn('Prisma client not available, using mock client');
  const { PrismaClient: MockPrismaClient } = require('./lib/mock-prisma');
  prisma = new MockPrismaClient();
}

export { prisma, prisma as db };