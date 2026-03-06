import { Router } from 'express';
import {
  getCommitmentsByUser,
  getCommitmentsForMonth,
  getMonthsWithData,
  createCommitment,
  updateCommitment,
  deleteCommitment,
} from './controller';
// COMMENTED OUT: Import functionality disabled
// import { importCommitments } from './controller';

const router = Router();

router.get('/user/:userId', getCommitmentsByUser);
router.get('/user/:userId/months-with-data', getMonthsWithData);
router.get('/user/:userId/month/:month', getCommitmentsForMonth);
router.post('/', createCommitment);
// COMMENTED OUT: Import route disabled
// router.post('/import', importCommitments);
router.put('/:id', updateCommitment);
router.delete('/:id', deleteCommitment);

export default router;
