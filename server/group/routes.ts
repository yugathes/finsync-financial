import { Router } from 'express';
import {
  createGroup,
  inviteMember,
  acceptInvitation,
  getUserGroups,
  getGroupById,
  getGroupCommitments,
  getUserInvitations,
  removeMember,
} from './controller';

const router = Router();

// Group management
router.post('/', createGroup);
router.get('/user/:userId', getUserGroups);
router.get('/:groupId', getGroupById);
router.get('/:groupId/commitments', getGroupCommitments);

// Member management
router.post('/invite', inviteMember);
router.post('/accept', acceptInvitation);
router.get('/invitations/:userId', getUserInvitations);
router.delete('/:groupId/members/:memberId', removeMember);

export default router;
