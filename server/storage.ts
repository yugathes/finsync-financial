import { eq, desc } from 'drizzle-orm';
import { db } from './db';
import { users, commitments, type User, type InsertUser, type Commitment, type InsertCommitment } from "@shared/schema";

// Storage interface for financial commitment tracker
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserIncome(userId: number, income: string): Promise<User>;
  
  // Commitment methods
  getCommitmentsByUser(userId: number): Promise<Commitment[]>;
  createCommitment(commitment: InsertCommitment & { userId: number }): Promise<Commitment>;
  updateCommitment(id: number, updates: Partial<Commitment>): Promise<Commitment>;
  deleteCommitment(id: number): Promise<void>;
  toggleCommitmentPaid(id: number): Promise<Commitment>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserIncome(userId: number, income: string): Promise<User> {
    const result = await db.update(users)
      .set({ monthlyIncome: income, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Commitment methods
  async getCommitmentsByUser(userId: number): Promise<Commitment[]> {
    return await db.select().from(commitments)
      .where(eq(commitments.userId, userId))
      .orderBy(desc(commitments.createdAt));
  }

  async createCommitment(commitment: InsertCommitment & { userId: number }): Promise<Commitment> {
    const result = await db.insert(commitments).values(commitment).returning();
    return result[0];
  }

  async updateCommitment(id: number, updates: Partial<Commitment>): Promise<Commitment> {
    const result = await db.update(commitments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(commitments.id, id))
      .returning();
    return result[0];
  }

  async deleteCommitment(id: number): Promise<void> {
    await db.delete(commitments).where(eq(commitments.id, id));
  }

  async toggleCommitmentPaid(id: number): Promise<Commitment> {
    const [commitment] = await db.select().from(commitments).where(eq(commitments.id, id));
    if (!commitment) {
      throw new Error('Commitment not found');
    }
    
    const result = await db.update(commitments)
      .set({ isPaid: !commitment.isPaid, updatedAt: new Date() })
      .where(eq(commitments.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
