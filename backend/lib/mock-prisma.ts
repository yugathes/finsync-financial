// Mock Prisma client for development when generation is not available
export interface User {
  id: string;
  email: string;
  password?: string;
  monthlyIncome?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyIncome {
  id: string;
  userId: string;
  month: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Commitment {
  id: string;
  userId: string;
  type: string;
  title: string;
  category: string;
  amount: number;
  recurring: boolean;
  shared: boolean;
  groupId?: string;
  startDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommitmentPayment {
  id: string;
  commitmentId: string;
  month: string;
  amount: number;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Mock implementation to satisfy TypeScript compilation
function mockMethod(...args: any[]): Promise<any | null> {
  return Promise.resolve(null);
}

function mockArrayMethod(...args: any[]): Promise<any[]> {
  return Promise.resolve([]);
}

function mockCreateMethod(...args: any[]): Promise<any> {
  return Promise.resolve({ id: 'mock-id' } as any);
}

function mockFindMethod(...args: any[]): Promise<any | null> {
  return Promise.resolve({ id: 'mock-id' } as any);
}

// Mock PrismaClient when the real one isn't available
export class PrismaClient {
  user = {
    findFirst: mockFindMethod,
    findUnique: mockFindMethod,
    findMany: mockArrayMethod,
    create: mockCreateMethod,
    update: mockCreateMethod,
    delete: mockCreateMethod,
  };

  monthlyIncome = {
    findFirst: mockFindMethod,
    findUnique: mockFindMethod,
    findMany: mockArrayMethod,
    create: mockCreateMethod,
    update: mockCreateMethod,
    upsert: mockCreateMethod,
    delete: mockCreateMethod,
  };

  commitment = {
    findFirst: mockFindMethod,
    findUnique: mockFindMethod,
    findMany: mockArrayMethod,
    create: mockCreateMethod,
    update: mockCreateMethod,
    delete: mockCreateMethod,
  };

  commitmentPayment = {
    findFirst: mockFindMethod,
    findUnique: mockFindMethod,
    findMany: mockArrayMethod,
    create: mockCreateMethod,
    update: mockCreateMethod,
    delete: mockCreateMethod,
    deleteMany: mockMethod,
  };

  $disconnect = () => Promise.resolve();
}

export const prisma = new PrismaClient();