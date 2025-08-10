import { prisma } from './db';
import {
  type User,
  type InsertUser,
  type Commitment,
  type InsertCommitment,
  type MonthlyIncome,
  type InsertMonthlyIncome,
  type CommitmentPayment,
  type InsertCommitmentPayment
} from "../lib/types";


// Unified storage interface for comprehensive commitment management
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserIncome(userId: number, income: string): Promise<User>;

  // Monthly Income methods
  getMonthlyIncome(userId: string, month: string): Promise<MonthlyIncome | undefined>;
  setMonthlyIncome(userId: number, income: InsertMonthlyIncome): Promise<MonthlyIncome>;
  updateMonthlyIncome(userId: number, month: string, amount: string): Promise<MonthlyIncome>;

  // Commitment methods
  getCommitmentsByUser(userId: number): Promise<Commitment[]>;
  getCommitmentsForMonth(userId: string, month: string): Promise<(Commitment & { isPaid: boolean; amountPaid?: string })[]>;
  createCommitment(commitment: InsertCommitment & { userId: number }): Promise<Commitment>;
  updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment>;
  deleteCommitment(id: string): Promise<void>;

  // Payment methods
  markCommitmentPaid(commitmentId: string, userId: number, month: string, amount: string): Promise<CommitmentPayment>;
  markCommitmentUnpaid(commitmentId: string, month: string): Promise<void>;
  getCommitmentPayments(userId: number, month: string): Promise<CommitmentPayment[]>;

  // Utility methods
  isCommitmentPaidForMonth(commitmentId: string, month: string): Promise<boolean>;
}


// Unified storage implementation
class MainStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: String(id) }
      });
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findFirst({
        where: { email: username } // Assuming username is email
      });
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: insertUser
      });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserIncome(userId: number, income: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: String(userId) },
        data: { 
          monthlyIncome: income,
          updatedAt: new Date()
        }
      });
      return user;
    } catch (error) {
      console.error('Error updating user income:', error);
      throw error;
    }
  }

  // Monthly Income methods
  async getMonthlyIncome(userId: string, month: string): Promise<MonthlyIncome | undefined> {
    try {
      const income = await prisma.monthlyIncome.findFirst({
        where: {
          userId: userId,
          month: month
        }
      });
      return income || undefined;
    } catch (error) {
      console.error('Error fetching monthly income:', error);
      return undefined;
    }
  }

  async setMonthlyIncome(userId: number, income: InsertMonthlyIncome): Promise<MonthlyIncome> {
    try {
      const existingIncome = await prisma.monthlyIncome.findFirst({
        where: {
          userId: String(userId),
          month: income.month
        }
      });

      if (existingIncome) {
        const monthlyIncome = await prisma.monthlyIncome.update({
          where: { id: existingIncome.id },
          data: {
            amount: income.amount,
            updatedAt: new Date()
          }
        });
        return monthlyIncome;
      } else {
        const monthlyIncome = await prisma.monthlyIncome.create({
          data: {
            userId: String(userId),
            month: income.month,
            amount: income.amount
          }
        });
        return monthlyIncome;
      }
    } catch (error) {
      console.error('Error setting monthly income:', error);
      throw error;
    }
  }

  async updateMonthlyIncome(userId: number, month: string, amount: string): Promise<MonthlyIncome> {
    try {
      const existingIncome = await prisma.monthlyIncome.findFirst({
        where: {
          userId: String(userId),
          month: month
        }
      });

      if (existingIncome) {
        const monthlyIncome = await prisma.monthlyIncome.update({
          where: { id: existingIncome.id },
          data: {
            amount: amount,
            updatedAt: new Date()
          }
        });
        return monthlyIncome;
      } else {
        const monthlyIncome = await prisma.monthlyIncome.create({
          data: {
            userId: String(userId),
            month: month,
            amount: amount
          }
        });
        return monthlyIncome;
      }
    } catch (error) {
      console.error('Error updating monthly income:', error);
      throw error;
    }
  }

  // Commitment methods
  async getCommitmentsByUser(userId: number): Promise<Commitment[]> {
    try {
      const commitments = await prisma.commitment.findMany({
        where: { userId: String(userId) },
        orderBy: { createdAt: 'desc' }
      });
      return commitments || [];
    } catch (error) {
      console.error('Error fetching commitments:', error);
      return [];
    }
  }

  async getCommitmentsForMonth(userId: string, month: string): Promise<(Commitment & { isPaid: boolean; amountPaid?: string })[]> {
    try {
      console.log('Fetching commitments for user:', userId, 'month:', month);
      
      // Get all commitments for the user with payments
      const commitments = await prisma.commitment.findMany({
        where: { userId: userId },
        include: {
          payments: {
            where: { month: month }
          }
        }
      });
      
      console.log('Commitments fetched:', commitments);

      // Map commitments with payment status
      const commitmentsWithPayments = commitments.map((commitment: any) => {
        const payment = commitment.payments?.find((p: any) => p.month === month);
        return {
          ...commitment,
          payments: undefined, // Remove the payments array from the result
          isPaid: !!payment,
          amountPaid: payment?.amountPaid?.toString()
        };
      });

      return commitmentsWithPayments;
    } catch (error) {
      console.error('Error fetching commitments for month:', error);
      return [];
    }
  }

  async createCommitment(commitment: InsertCommitment & { userId: number }): Promise<Commitment> {
    try {
      const { userId, ...commitmentData } = commitment;
      const newCommitment = await prisma.commitment.create({
        data: {
          userId: String(userId),
          ...commitmentData
        }
      });
      return newCommitment;
    } catch (error) {
      console.error('Error creating commitment:', error);
      throw error;
    }
  }

  async updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment> {
    try {
      const commitment = await prisma.commitment.update({
        where: { id: id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });
      return commitment;
    } catch (error) {
      console.error('Error updating commitment:', error);
      throw error;
    }
  }

  async deleteCommitment(id: string): Promise<void> {
    try {
      await prisma.commitment.delete({
        where: { id: id }
      });
    } catch (error) {
      console.error('Error deleting commitment:', error);
      throw error;
    }
  }

  // Payment methods
  async markCommitmentPaid(commitmentId: string, userId: number, month: string, amount: string): Promise<CommitmentPayment> {
    try {
      const existingPayment = await prisma.commitmentPayment.findFirst({
        where: {
          commitmentId: commitmentId,
          month: month
        }
      });

      if (existingPayment) {
        const payment = await prisma.commitmentPayment.update({
          where: { id: existingPayment.id },
          data: {
            paidBy: String(userId),
            amountPaid: amount
          }
        });
        return payment;
      } else {
        const payment = await prisma.commitmentPayment.create({
          data: {
            commitmentId: commitmentId,
            paidBy: String(userId),
            month: month,
            amountPaid: amount
          }
        });
        return payment;
      }
    } catch (error) {
      console.error('Error marking commitment as paid:', error);
      throw error;
    }
  }

  async markCommitmentUnpaid(commitmentId: string, month: string): Promise<void> {
    try {
      await prisma.commitmentPayment.deleteMany({
        where: {
          commitmentId: commitmentId,
          month: month
        }
      });
    } catch (error) {
      console.error('Error marking commitment as unpaid:', error);
      throw error;
    }
  }

  async getCommitmentPayments(userId: number, month: string): Promise<CommitmentPayment[]> {
    try {
      const payments = await prisma.commitmentPayment.findMany({
        where: {
          paidBy: String(userId),
          month: month
        }
      });
      return payments || [];
    } catch (error) {
      console.error('Error fetching commitment payments:', error);
      return [];
    }
  }

  async isCommitmentPaidForMonth(commitmentId: string, month: string): Promise<boolean> {
    try {
      const payment = await prisma.commitmentPayment.findFirst({
        where: {
          commitmentId: commitmentId,
          month: month
        }
      });
      return !!payment;
    } catch (error) {
      return false;
    }
  }
}

export const storage = new MainStorage();
