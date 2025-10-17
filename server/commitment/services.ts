import { Commitment } from '@prisma/client';
import { prisma } from '../db';
import { InsertCommitment } from 'lib/types';

class CommitmentService {
  async getCommitmentsForMonth(
    userId: string,
    month: string,
    filters?: {
      includeShared?: boolean;
      includeImported?: boolean;
      includePersonal?: boolean;
    }
  ): Promise<(Commitment & { isPaid: boolean; amountPaid?: string })[]> {
    try {
      console.log('Fetching commitments for user:', userId, 'month:', month, 'filters:', filters);

      // Build where clause based on filters
      const whereClause: any = {
        OR: [],
      };

      // Default: include personal commitments
      const includePersonal = filters?.includePersonal !== false;
      const includeShared = filters?.includeShared === true;
      const includeImported = filters?.includeImported === true;

      if (includePersonal) {
        whereClause.OR.push({
          userId: userId,
          shared: false,
          isImported: false,
        });
      }

      if (includeShared) {
        // Get user's group memberships
        const memberships = await prisma.groupMember.findMany({
          where: {
            userId: userId,
            status: 'accepted',
          },
          select: { groupId: true },
        });
        
        const groupIds = memberships.map(m => m.groupId);
        
        if (groupIds.length > 0) {
          whereClause.OR.push({
            groupId: { in: groupIds },
            shared: true,
          });
        }
      }

      if (includeImported) {
        whereClause.OR.push({
          userId: userId,
          isImported: true,
        });
      }

      // If no filters specified, default to personal only
      if (whereClause.OR.length === 0) {
        whereClause.OR.push({
          userId: userId,
          shared: false,
          isImported: false,
        });
      }

      // Get all commitments for the user with payments
      const commitments = await prisma.commitment.findMany({
        where: whereClause,
        include: {
          payments: {
            where: { month: month },
          },
        },
      });

      console.log('Commitments fetched:', commitments.length);

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

  async importCommitments(userId: number, commitments: any[]): Promise<Commitment[]> {
    try {
      const importedCommitments = await Promise.all(
        commitments.map(async (commitment) => {
          return await prisma.commitment.create({
            data: {
              userId: String(userId),
              type: commitment.type || 'static',
              title: commitment.title,
              category: commitment.category,
              amount: commitment.amount,
              recurring: commitment.recurring ?? false,
              shared: false,
              isImported: true,
              importedAt: new Date(),
              startDate: commitment.startDate ? new Date(commitment.startDate) : new Date(),
              createdAt: commitment.createdAt ? new Date(commitment.createdAt) : new Date(),
            },
          });
        })
      );
      return importedCommitments;
    } catch (error) {
      console.error('Error importing commitments:', error);
      throw error;
    }
  }
}
export default new CommitmentService();
