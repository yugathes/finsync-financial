import CommitmentService from './services';
import { Request, Response } from 'express';

export async function getCommitmentsByUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const commitments = await CommitmentService.getCommitmentsByUser(userId);
    res.json(commitments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commitments' });
  }
}

export async function getCommitmentsForMonth(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    const month = req.params.month;
    const includeShared = req.query.includeShared === 'true';
    const includeImported = req.query.includeImported === 'true';
    const includePersonal = req.query.includePersonal !== 'false';
    
    console.log('Fetching commitments for user:', userId, 'month:', month);
    const commitments = await CommitmentService.getCommitmentsForMonth(userId, month, {
      includeShared,
      includeImported,
      includePersonal,
    });
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
    const commitment = await CommitmentService.createCommitment({
      userId,
      type,
      title,
      category,
      amount,
      recurring: recurring ?? false,
      shared: shared ?? false,
      groupId,
      startDate: new Date(startDate),
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
    const commitment = await CommitmentService.updateCommitment(id, updates);
    res.json(commitment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update commitment' });
  }
}

export async function deleteCommitment(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const deleteScope = req.query.scope as 'single' | 'all' | undefined;
    const month = req.query.month as string | undefined;
    
    if (deleteScope === 'single' && month) {
      // Delete only for specific month (delete payment record)
      await CommitmentService.deleteCommitmentForMonth(id, month);
      res.json({ success: true, message: 'Commitment deleted for this month' });
    } else {
      // Delete permanently (commitment and all payments)
      await CommitmentService.deleteCommitment(id);
      res.json({ success: true, message: 'Commitment deleted permanently' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete commitment' });
  }
}

export async function importCommitments(req: Request, res: Response) {
  try {
    const { userId, commitments } = req.body;
    
    if (!userId || !commitments || !Array.isArray(commitments)) {
      return res.status(400).json({ error: 'Missing required fields: userId and commitments array' });
    }

    const importedCommitments = await CommitmentService.importCommitments(userId, commitments);
    res.json({
      success: true,
      count: importedCommitments.length,
      commitments: importedCommitments,
    });
  } catch (error: any) {
    console.error('Error importing commitments:', error);
    res.status(400).json({ error: 'Failed to import commitments', details: error.message });
  }
}
