import { Router } from 'express';
import { getCommitmentsByUser, getCommitmentsForMonth, createCommitment, updateCommitment, deleteCommitment } from './controller';

const router = Router();

router.get('/user/:userId', getCommitmentsByUser);
router.get('/user/:userId/month/:month', getCommitmentsForMonth);
router.post('/', createCommitment);
router.put('/:id', updateCommitment);
router.delete('/:id', deleteCommitment);

export default router;
