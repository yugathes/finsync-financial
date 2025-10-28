import { Router } from 'express';
import { syncUser, searchUserByEmail } from './controller';

const router = Router();

router.post('/sync', syncUser);
router.get('/search', searchUserByEmail);
// Add more user routes here

export default router;
