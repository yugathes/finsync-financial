import { Request, Response } from 'express';
import PaymentService from './services';

export async function markCommitmentPaid(req: Request, res: Response) {
  try {
    const commitmentId = req.params.id;
    const { userId, month, amount } = req.body;
    if (!userId || !month || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const payment = await PaymentService.markCommitmentPaid(commitmentId, userId, month, amount);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to mark commitment as paid' });
  }
}

export async function markCommitmentUnpaid(req: Request, res: Response) {
  try {
    const commitmentId = req.params.id;
    const month = req.params.month;
    await PaymentService.markCommitmentUnpaid(commitmentId, month);
    res.json({ success: true, message: 'Commitment marked as unpaid' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to mark commitment as unpaid' });
  }
}

export async function getCommitmentPayments(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const month = req.params.month;
    const payments = await PaymentService.getCommitmentPayments(userId, month);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}
