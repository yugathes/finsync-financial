import type { Request, Response } from "express";

export async function getDashboardSummary(req: Request, res: Response) {
  try {
    const { storage } = await import("../storage");
    const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
    const userId = req.params.userId;
    console.log('Fetching dashboard summary for user:', userId);
    const month = req.params.month || getCurrentMonth();
    const income = await storage.getMonthlyIncome(userId, month);
    const commitments = await storage.getCommitmentsForMonth(userId, month);
    const totalCommitments = commitments.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const paidCommitments = commitments
      .filter(c => c.isPaid)
      .reduce((sum, c) => sum + (parseFloat(c.amountPaid || c.amount)), 0);
    const unpaidCommitments = commitments.filter(c => !c.isPaid);
    const summary = {
      month,
      income: income ? parseFloat(income.amount) : 0,
      totalCommitments,
      paidCommitments,
      remainingCommitments: totalCommitments - paidCommitments,
      availableBalance: (income ? parseFloat(income.amount) : 0) - paidCommitments,
      commitments: commitments.length,
      unpaidCount: unpaidCommitments.length,
      commitmentsList: commitments
    };
    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: "Failed to fetch dashboard summary", details: error.message });
  }
}
