import { Router } from 'express';
import { getMonthlyBudget, setMonthlyBudget, deleteMonthlyBudget } from './controller';

const router = Router();

// GET /api/budget/:userId/:month
router.get('/:userId/:month', getMonthlyBudget);
// POST /api/budget  { userId, month, budgetLimit }
router.post('/', setMonthlyBudget);
// DELETE /api/budget/:userId/:month
router.delete('/:userId/:month', deleteMonthlyBudget);

export default router;
