import { MonthlyBudget } from '@prisma/client';
import { prisma } from '../db';

class BudgetService {
  async getMonthlyBudget(userId: string, month: string): Promise<MonthlyBudget | undefined> {
    try {
      const budget = await prisma.monthlyBudget.findUnique({
        where: {
          userId_month: { userId, month },
        },
      });
      return budget || undefined;
    } catch (error) {
      console.error('Error fetching monthly budget:', error);
      return undefined;
    }
  }

  async upsertMonthlyBudget(userId: string, month: string, budgetLimit: string): Promise<MonthlyBudget> {
    try {
      const budget = await prisma.monthlyBudget.upsert({
        where: {
          userId_month: { userId, month },
        },
        update: {
          budgetLimit,
          updatedAt: new Date(),
        },
        create: {
          userId,
          month,
          budgetLimit,
        },
      });
      return budget;
    } catch (error) {
      console.error('Error upserting monthly budget:', error);
      throw error;
    }
  }

  async deleteMonthlyBudget(userId: string, month: string): Promise<void> {
    try {
      await prisma.monthlyBudget.delete({
        where: {
          userId_month: { userId, month },
        },
      });
    } catch (error) {
      console.error('Error deleting monthly budget:', error);
      throw error;
    }
  }
}

export default new BudgetService();
