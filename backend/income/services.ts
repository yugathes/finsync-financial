import { MonthlyIncome, User } from '../lib/mock-prisma';
import { prisma } from '../db';
class IncomeService {
  async getMonthlyIncome(userId: string, month: string): Promise<MonthlyIncome | undefined> {
    try {
      const income = await prisma.monthlyIncome.findFirst({
        where: {
          userId: userId,
          month: month,
        },
      });
      return income || undefined;
    } catch (error) {
      console.error('Error fetching monthly income:', error);
      return undefined;
    }
  }

  async updateMonthlyIncome(userId: number, month: string, amount: string): Promise<MonthlyIncome> {
    try {
      const existingIncome = await prisma.monthlyIncome.findFirst({
        where: {
          userId: String(userId),
          month: month,
        },
      });
      let monthlyIncome;
      if (existingIncome && existingIncome.id) {
        monthlyIncome = await prisma.monthlyIncome.update({
          where: { id: existingIncome.id },
          data: {
            amount: amount,
            updatedAt: new Date(),
          },
        });
      } else {
        monthlyIncome = await prisma.monthlyIncome.create({
          data: {
            userId: String(userId),
            month: month,
            amount: amount,
          },
        });
      }
      await this.updateUserIncome(userId, amount);
      return monthlyIncome;
    } catch (error) {
      console.error('Error updating monthly income:', error);
      throw error;
    }
  }

  async updateUserIncome(userId: number, income: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: String(userId) },
        data: {
          monthlyIncome: income,
          updatedAt: new Date(),
        },
      });
      return user;
    } catch (error) {
      console.error('Error updating user income:', error);
      throw error;
    }
  }
}
export default new IncomeService();
