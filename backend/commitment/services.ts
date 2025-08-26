import { Commitment } from '../lib/mock-prisma';
import { prisma } from '../db';
import { InsertCommitment } from 'lib/types';

class CommitmentService {
  async getCommitmentsForMonth(
    userId: string,
    month: string
  ): Promise<(Commitment & { isPaid: boolean; amountPaid?: string })[]> {
    try {
      console.log('Fetching commitments for user:', userId, 'month:', month);

      // Get all commitments for the user with payments
      const commitments = await prisma.commitment.findMany({
        where: { userId: userId },
        include: {
          payments: {
            where: { month: month },
          },
        },
      });

      console.log('Commitments fetched:', commitments);

      // Map commitments with payment status
      const commitmentsWithPayments = commitments.map((commitment: any) => {
        const payment = commitment.payments?.find((p: any) => p.month === month);
        return {
          ...commitment,
          payments: undefined, // Remove the payments array from the result
          isPaid: !!payment,
          amountPaid: payment?.amountPaid?.toString(),
        };
      });

      return commitmentsWithPayments;
    } catch (error) {
      console.error('Error fetching commitments for month:', error);
      return [];
    }
  }
  async getCommitmentsByUser(userId: number): Promise<Commitment[]> {
    try {
      const commitments = await prisma.commitment.findMany({
        where: { userId: String(userId) },
        orderBy: { createdAt: 'desc' },
      });
      return commitments || [];
    } catch (error) {
      console.error('Error fetching commitments:', error);
      return [];
    }
  }
  async createCommitment(commitment: InsertCommitment & { userId: number }): Promise<Commitment> {
    try {
      const { userId, ...commitmentData } = commitment;
      const newCommitment = await prisma.commitment.create({
        data: {
          userId: String(userId),
          ...commitmentData,
        },
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
          updatedAt: new Date(),
        },
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
        where: { id: id },
      });
    } catch (error) {
      console.error('Error deleting commitment:', error);
      throw error;
    }
  }
  async isCommitmentPaidForMonth(commitmentId: string, month: string): Promise<boolean> {
    try {
      const payment = await prisma.commitmentPayment.findFirst({
        where: {
          commitmentId: commitmentId,
          month: month,
        },
      });
      return !!payment;
    } catch (error) {
      return false;
    }
  }
}
export default new CommitmentService();
