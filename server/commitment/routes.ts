import { Router } from 'express';
import { getCommitmentsByUser, getCommitmentsForMonth, createCommitment, updateCommitment, deleteCommitment, importCommitments } from './controller';

const router = Router();

router.get('/user/:userId', getCommitmentsByUser);
router.get('/user/:userId/month/:month', getCommitmentsForMonth);
router.post('/', createCommitment);
router.post('/import', importCommitments);
router.put('/:id', updateCommitment);
router.delete('/:id', deleteCommitment);

export default router;
