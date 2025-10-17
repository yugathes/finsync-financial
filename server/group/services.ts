import { Group, GroupMember } from '@prisma/client';
import { prisma } from '../db';

export interface CreateGroupInput {
  name: string;
  ownerId: string;
}

export interface InviteMemberInput {
  groupId: string;
  userId: string;
  invitedBy: string;
}

class GroupService {
  async createGroup(input: CreateGroupInput): Promise<Group> {
    try {
      // Create group and add owner as accepted member
      const group = await prisma.group.create({
        data: {
          name: input.name,
          ownerId: input.ownerId,
          members: {
            create: {
              userId: input.ownerId,
              role: 'owner',
              status: 'accepted',
            },
          },
        },
        include: {
          members: true,
          owner: true,
        },
      });
      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async inviteMember(input: InviteMemberInput): Promise<GroupMember> {
    try {
      // Verify inviter is owner or member of the group
      const inviterMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: input.groupId,
          userId: input.invitedBy,
          status: 'accepted',
        },
      });

      if (!inviterMembership) {
        throw new Error('You are not authorized to invite members to this group');
      }

      // Check if user is already a member or invited
      const existingMember = await prisma.groupMember.findFirst({
        where: {
          groupId: input.groupId,
          userId: input.userId,
        },
      });

      if (existingMember) {
        throw new Error('User is already a member or has been invited');
      }

      // Create invitation
      const member = await prisma.groupMember.create({
        data: {
          groupId: input.groupId,
          userId: input.userId,
          role: 'member',
          status: 'invited',
        },
        include: {
          user: true,
          group: true,
        },
      });

      return member;
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  }

  async acceptInvitation(groupId: string, userId: string): Promise<GroupMember> {
    try {
      const member = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          status: 'invited',
        },
      });

      if (!member) {
        throw new Error('Invitation not found');
      }

      const updatedMember = await prisma.groupMember.update({
        where: {
          id: member.id,
        },
        data: {
          status: 'accepted',
          updatedAt: new Date(),
        },
        include: {
          user: true,
          group: true,
        },
      });

      return updatedMember;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const memberships = await prisma.groupMember.findMany({
        where: {
          userId,
          status: 'accepted',
        },
        include: {
          group: {
            include: {
              owner: true,
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      return memberships.map((m) => m.group);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  }

  async getGroupById(groupId: string, userId: string): Promise<Group | null> {
    try {
      // Verify user is a member
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          status: 'accepted',
        },
      });

      if (!membership) {
        throw new Error('You are not a member of this group');
      }

      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          owner: true,
          members: {
            include: {
              user: true,
            },
          },
          commitments: {
            include: {
              user: true,
              payments: true,
            },
          },
        },
      });

      return group;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  }

  async getGroupCommitments(groupId: string, userId: string, month?: string) {
    try {
      // Verify user is a member
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId,
          status: 'accepted',
        },
      });

      if (!membership) {
        throw new Error('You are not a member of this group');
      }

      const commitments = await prisma.commitment.findMany({
        where: {
          groupId,
          shared: true,
        },
        include: {
          user: true,
          payments: month
            ? {
                where: { month },
              }
            : true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Map to include payment status
      return commitments.map((commitment: any) => {
        const payment = month
          ? commitment.payments?.find((p: any) => p.month === month)
          : null;
        return {
          ...commitment,
          payments: undefined,
          isPaid: !!payment,
          amountPaid: payment?.amountPaid?.toString(),
        };
      });
    } catch (error) {
      console.error('Error fetching group commitments:', error);
      throw error;
    }
  }

  async getUserInvitations(userId: string): Promise<GroupMember[]> {
    try {
      const invitations = await prisma.groupMember.findMany({
        where: {
          userId,
          status: 'invited',
        },
        include: {
          group: {
            include: {
              owner: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return invitations;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      return [];
    }
  }

  async isGroupOwner(groupId: string, userId: string): Promise<boolean> {
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      return group?.ownerId === userId;
    } catch (error) {
      return false;
    }
  }

  async removeMember(groupId: string, memberId: string, requesterId: string): Promise<void> {
    try {
      const isOwner = await this.isGroupOwner(groupId, requesterId);

      if (!isOwner) {
        throw new Error('Only group owner can remove members');
      }

      await prisma.groupMember.delete({
        where: {
          id: memberId,
        },
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }
}

export default new GroupService();
