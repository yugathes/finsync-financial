import { Request, Response } from 'express';
import GroupService from './services';

export async function createGroup(req: Request, res: Response) {
  try {
    const { name, ownerId } = req.body;
    
    if (!name || !ownerId) {
      return res.status(400).json({ error: 'Missing required fields: name, ownerId' });
    }

    const group = await GroupService.createGroup({ name, ownerId });
    res.json(group);
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group', details: error.message });
  }
}

export async function inviteMember(req: Request, res: Response) {
  try {
    const { groupId, userId, invitedBy } = req.body;
    
    if (!groupId || !userId || !invitedBy) {
      return res.status(400).json({ error: 'Missing required fields: groupId, userId, invitedBy' });
    }

    const member = await GroupService.inviteMember({ groupId, userId, invitedBy });
    res.json(member);
  } catch (error: any) {
    console.error('Error inviting member:', error);
    res.status(400).json({ error: 'Failed to invite member', details: error.message });
  }
}

export async function acceptInvitation(req: Request, res: Response) {
  try {
    const { groupId, userId } = req.body;
    
    if (!groupId || !userId) {
      return res.status(400).json({ error: 'Missing required fields: groupId, userId' });
    }

    const member = await GroupService.acceptInvitation(groupId, userId);
    res.json(member);
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    res.status(400).json({ error: 'Failed to accept invitation', details: error.message });
  }
}

export async function getUserGroups(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const groups = await GroupService.getUserGroups(userId);
    res.json(groups);
  } catch (error: any) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups', details: error.message });
  }
}

export async function getGroupById(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;
    
    if (!groupId || !userId) {
      return res.status(400).json({ error: 'Missing groupId or userId' });
    }

    const group = await GroupService.getGroupById(groupId, userId as string);
    res.json(group);
  } catch (error: any) {
    console.error('Error fetching group:', error);
    res.status(400).json({ error: 'Failed to fetch group', details: error.message });
  }
}

export async function getGroupCommitments(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    const { userId, month } = req.query;
    
    if (!groupId || !userId) {
      return res.status(400).json({ error: 'Missing groupId or userId' });
    }

    const commitments = await GroupService.getGroupCommitments(
      groupId,
      userId as string,
      month as string | undefined
    );
    res.json(commitments);
  } catch (error: any) {
    console.error('Error fetching group commitments:', error);
    res.status(400).json({ error: 'Failed to fetch group commitments', details: error.message });
  }
}

export async function getUserInvitations(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const invitations = await GroupService.getUserInvitations(userId);
    res.json(invitations);
  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations', details: error.message });
  }
}

export async function removeMember(req: Request, res: Response) {
  try {
    const { groupId, memberId } = req.params;
    const { requesterId } = req.body;
    
    if (!groupId || !memberId || !requesterId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await GroupService.removeMember(groupId, memberId, requesterId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing member:', error);
    res.status(400).json({ error: 'Failed to remove member', details: error.message });
  }
}
