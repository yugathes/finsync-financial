import { Commitment } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../db';
import { InsertCommitment } from 'lib/types';

function getMonthKeyFromDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function addMonths(date: Date, monthsToAdd: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return new Date(Date.UTC(year, month + monthsToAdd, 1));
}

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

      // Filter commitments based on month visibility rules.
      // New recurring commitments are materialized as monthly rows (seriesId set),
      // while legacy recurring rows (no seriesId) still use the old infinite behavior.
      const filteredCommitments = commitments.filter((commitment: any) => {
        const requestedMonth = month; // Format: "YYYY-MM"

        // Determine the commitment's start month
        let commitmentStartMonth: string;
        if (commitment.startDate) {
          // Use startDate if available
          const startDate = new Date(commitment.startDate);
          commitmentStartMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        } else {
          // Fall back to createdAt
          const createdAt = new Date(commitment.createdAt);
          commitmentStartMonth = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        }

        // Commitments should never appear in months before they were created
        if (requestedMonth < commitmentStartMonth) {
          return false;
        }

        // Backward compatibility for legacy recurring rows.
        if (commitment.recurring && !commitment.seriesId) {
          return requestedMonth >= commitmentStartMonth;
        }

        // Materialized rows (including recurring series rows) appear only in their exact month.
        return requestedMonth === commitmentStartMonth;
      });

      console.log('Filtered commitments for month:', filteredCommitments.length);

      // Map commitments with payment status
      const commitmentsWithPayments = filteredCommitments.map((commitment: any) => {
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
  async createCommitment(commitment: InsertCommitment & { userId: number | string }): Promise<Commitment> {
    try {
      const { userId, recurring = false, startDate, ...commitmentData } = commitment;
      const userIdAsString = String(userId);
      const normalizedStartDate = startDate ? new Date(startDate) : new Date();
      const startOfMonth = new Date(
        Date.UTC(normalizedStartDate.getUTCFullYear(), normalizedStartDate.getUTCMonth(), 1)
      );

      if (!recurring) {
        const newCommitment = await prisma.commitment.create({
          data: {
            userId: userIdAsString,
            recurring: false,
            startDate: startOfMonth,
            ...commitmentData,
          },
        });
        return newCommitment;
      }

      const seriesId = randomUUID();
      const recurringRows = await Promise.all(
        Array.from({ length: 12 }).map((_, index) => {
          const monthDate = addMonths(startOfMonth, index);
          return prisma.commitment.create({
            data: {
              userId: userIdAsString,
              recurring: true,
              seriesId,
              startDate: monthDate,
              ...commitmentData,
            },
          });
        })
      );

      return recurringRows[0];
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
      const targetCommitment = await prisma.commitment.findUnique({
        where: { id },
        select: { seriesId: true },
      });

      if (!targetCommitment) {
        return;
      }

      if (targetCommitment.seriesId) {
        const seriesCommitments = await prisma.commitment.findMany({
          where: { seriesId: targetCommitment.seriesId },
          select: { id: true },
        });

        const seriesCommitmentIds = seriesCommitments.map(commitment => commitment.id);
        if (seriesCommitmentIds.length === 0) {
          return;
        }

        await prisma.$transaction([
          prisma.commitmentPayment.deleteMany({
            where: {
              commitmentId: { in: seriesCommitmentIds },
            },
          }),
          prisma.commitment.deleteMany({
            where: {
              id: { in: seriesCommitmentIds },
            },
          }),
        ]);
        return;
      }

      await prisma.$transaction([
        prisma.commitmentPayment.deleteMany({
          where: { commitmentId: id },
        }),
        prisma.commitment.delete({
          where: { id },
        }),
      ]);
    } catch (error) {
      console.error('Error deleting commitment:', error);
      throw error;
    }
  }

  async deleteCommitmentForMonth(id: string, month: string): Promise<void> {
    try {
      const targetCommitment = await prisma.commitment.findUnique({
        where: { id },
        select: {
          id: true,
          recurring: true,
          seriesId: true,
          startDate: true,
          createdAt: true,
        },
      });

      if (!targetCommitment) {
        return;
      }

      const sourceDate = targetCommitment.startDate
        ? new Date(targetCommitment.startDate)
        : new Date(targetCommitment.createdAt);
      const commitmentMonth = getMonthKeyFromDate(sourceDate);

      if (targetCommitment.seriesId && commitmentMonth === month) {
        await prisma.$transaction([
          prisma.commitmentPayment.deleteMany({
            where: {
              commitmentId: id,
            },
          }),
          prisma.commitment.delete({
            where: { id },
          }),
        ]);
        return;
      }

      // Legacy fallback: older recurring commitments without seriesId still use
      // payment deletion for month-level operations.
      await prisma.commitmentPayment.deleteMany({
        where: {
          commitmentId: id,
          month,
        },
      });
    } catch (error) {
      console.error('Error deleting commitment for month:', error);
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

  /**
   * Returns a sorted (ascending) list of YYYY-MM strings for which the user
   * has at least one data record: a commitment row, a commitment payment, or
   * a monthly income entry.  The current calendar month is always included.
   */
  async getMonthsWithData(userId: string): Promise<string[]> {
    try {
      const userIdStr = String(userId);

      // 1. Months derived from commitment startDates owned by the user
      const commitments = await prisma.commitment.findMany({
        where: { userId: userIdStr },
        select: { startDate: true, createdAt: true },
      });

      const commitmentMonths = commitments.map(c => {
        const d = c.startDate ? new Date(c.startDate) : new Date(c.createdAt);
        return getMonthKeyFromDate(d);
      });

      // 2. Months from commitment payments made by the user
      const payments = await prisma.commitmentPayment.findMany({
        where: { paidBy: userIdStr },
        select: { month: true },
      });
      const paymentMonths = payments.map(p => p.month);

      // 3. Months from monthly income records
      const incomes = await prisma.monthlyIncome.findMany({
        where: { userId: userIdStr },
        select: { month: true },
      });
      const incomeMonths = incomes.map(i => i.month);

      // Always include current month so the default view is always selectable
      const now = new Date();
      const currentMonth = getMonthKeyFromDate(now);

      const allMonths = new Set<string>([...commitmentMonths, ...paymentMonths, ...incomeMonths, currentMonth]);

      return Array.from(allMonths).sort();
    } catch (error) {
      console.error('Error fetching months with data:', error);
      return [getMonthKeyFromDate(new Date())];
    }
  }

  // COMMENTED OUT: Import functionality disabled
  // async importCommitments(userId: number, commitments: any[]): Promise<Commitment[]> {
  //   try {
  //     const importedCommitments = await Promise.all(
  //       commitments.map(async commitment => {
  //         return await prisma.commitment.create({
  //           data: {
  //             userId: String(userId),
  //             type: commitment.type || 'commitment',
  //             title: commitment.title,
  //             category: commitment.category,
  //             amount: commitment.amount,
  //             recurring: commitment.recurring ?? false,
  //             shared: false,
  //             isImported: true,
  //             importedAt: new Date(),
  //             startDate: commitment.startDate ? new Date(commitment.startDate) : new Date(),
  //             createdAt: commitment.createdAt ? new Date(commitment.createdAt) : new Date(),
  //           },
  //         });
  //       })
  //     );
  //     return importedCommitments;
  //   } catch (error) {
  //     console.error('Error importing commitments:', error);
  //     throw error;
  //   }
  // }
}
export default new CommitmentService();
