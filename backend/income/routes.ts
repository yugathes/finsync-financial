import { Router } from 'express';
import { getMonthlyIncome, setMonthlyIncome, updateMonthlyIncome } from './controller';

const router = Router();

router.get('/:userId/:month', getMonthlyIncome);
router.post('/', setMonthlyIncome);
router.put('/:userId/:month', updateMonthlyIncome);

export default router;
