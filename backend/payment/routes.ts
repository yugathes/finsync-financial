import { Router } from 'express';
import { markCommitmentPaid, markCommitmentUnpaid, getCommitmentPayments } from './controller';

const router = Router();

router.post('/commitments/:id/pay', markCommitmentPaid);
router.delete('/commitments/:id/pay/:month', markCommitmentUnpaid);
router.get('/payments/user/:userId/month/:month', getCommitmentPayments);

export default router;
