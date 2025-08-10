import { Router } from 'express';
import { syncUser } from './controller';

const router = Router();

router.post('/sync', syncUser);
// Add more user routes here

export default router;
