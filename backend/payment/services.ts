import { CommitmentPayment } from '../lib/mock-prisma';
import { prisma } from '../db';
class PaymentService {
  async markCommitmentPaid(
    commitmentId: string,
    userId: number,
    month: string,
    amount: string
  ): Promise<CommitmentPayment> {
    try {
      const existingPayment = await prisma.commitmentPayment.findFirst({
        where: {
          commitmentId: commitmentId,
          month: month,
        },
      });

      if (existingPayment && existingPayment.id) {
        const payment = await prisma.commitmentPayment.update({
          where: { id: existingPayment.id },
          data: {
            paidBy: String(userId),
            amountPaid: amount,
          },
        });
        return payment;
      } else {
        const payment = await prisma.commitmentPayment.create({
          data: {
            commitmentId: commitmentId,
            paidBy: String(userId),
            month: month,
            amountPaid: amount,
          },
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
          month: month,
        },
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
          month: month,
        },
      });
      return payments || [];
    } catch (error) {
      console.error('Error fetching commitment payments:', error);
      return [];
    }
  }
}
export default new PaymentService();
