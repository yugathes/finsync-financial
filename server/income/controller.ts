import { storage } from '../storage';
import { Request, Response } from 'express';

export async function getMonthlyIncome(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    const month = req.params.month;
    const income = await storage.getMonthlyIncome(userId, month);
    if (!income) {
      return res.status(404).json({ error: 'Monthly income not found' });
    }
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly income' });
  }
}

export async function setMonthlyIncome(req: Request, res: Response) {
  try {
    const { userId, month, amount } = req.body;
    if (!userId || !month || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const income = await storage.setMonthlyIncome(userId, { month, amount });
    res.json(income);
  } catch (error) {
    res.status(400).json({ error: 'Failed to set monthly income' });
  }
}

export async function updateMonthlyIncome(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const month = req.params.month;
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }
    const income = await storage.updateMonthlyIncome(userId, month, amount);
    res.json(income);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update monthly income' });
  }
}
