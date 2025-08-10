import { start } from 'repl';
import { storage } from '../storage';
import { Request, Response } from 'express';

export async function getCommitmentsByUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const commitments = await storage.getCommitmentsByUser(userId);
    res.json(commitments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commitments' });
  }
}

export async function getCommitmentsForMonth(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    const month = req.params.month;
    console.log('Fetching commitments for user:', userId, 'month:', month);
    const commitments = await storage.getCommitmentsForMonth(userId, month);
    res.json(commitments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commitments for month' });
  }
}

export async function createCommitment(req: Request, res: Response) {
  try {
    const { userId, type, title, category, amount, recurring, shared, groupId, startDate } = req.body;
    if (!userId || !type || !title || !category || !amount || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const commitment = await storage.createCommitment({
      userId,
      type,
      title,
      category,
      amount,
      recurring: recurring ?? true,
      shared: shared ?? false,
      groupId,
      startDate: startDate
    });
    res.json(commitment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create commitment' });
  }
}

export async function updateCommitment(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const updates = req.body;
    const commitment = await storage.updateCommitment(id, updates);
    res.json(commitment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update commitment' });
  }
}

export async function deleteCommitment(req: Request, res: Response) {
  try {
    const id = req.params.id;
    await storage.deleteCommitment(id);
    res.json({ success: true, message: 'Commitment deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete commitment' });
  }
}
