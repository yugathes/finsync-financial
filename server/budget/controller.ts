import { Request, Response } from 'express';
import BudgetService from './services';

export async function getMonthlyBudget(req: Request, res: Response) {
  try {
    const { userId, month } = req.params;
    const budget = await BudgetService.getMonthlyBudget(userId, month);
    if (!budget) {
      return res.status(404).json({ error: 'Monthly budget not found' });
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly budget' });
  }
}

export async function setMonthlyBudget(req: Request, res: Response) {
  try {
    const { userId, month, budgetLimit } = req.body;
    if (!userId || !month || budgetLimit === undefined || budgetLimit === null) {
      return res.status(400).json({ error: 'Missing required fields: userId, month, budgetLimit' });
    }
    const limit = parseFloat(String(budgetLimit));
    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({ error: 'budgetLimit must be a non-negative number' });
    }
    const budget = await BudgetService.upsertMonthlyBudget(userId, month, String(limit));
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set monthly budget' });
  }
}

export async function deleteMonthlyBudget(req: Request, res: Response) {
  try {
    const { userId, month } = req.params;
    await BudgetService.deleteMonthlyBudget(userId, month);
    res.json({ message: 'Monthly budget deleted' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Monthly budget not found' });
    }
    res.status(500).json({ error: 'Failed to delete monthly budget' });
  }
}
