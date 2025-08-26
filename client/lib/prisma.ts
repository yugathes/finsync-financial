// Mock Prisma client to handle network restrictions during migration
// This should be replaced with actual Prisma client once network is available
import { PrismaClient, Prisma } from '@prisma/client'

// Use the mock prisma client for now
export const prisma = new PrismaClient()
export default prisma;