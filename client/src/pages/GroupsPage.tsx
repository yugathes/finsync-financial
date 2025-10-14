import React, { useState, useEffect } from 'react';
import { useSession } from '../hooks/useSession';
import { GroupList, Group, Invitation } from '../components/Groups/GroupList';
import { GroupDetail } from '../components/Groups/GroupDetail';
import { CreateGroupModal } from '../components/Groups/CreateGroupModal';
import { InviteMemberModal } from '../components/Groups/InviteMemberModal';
import { CommitmentWithStatus } from '../components/Commitments/CommitmentList';
import { useToast } from '@/hooks/use-toast';

const apiRequest = async (url: string, options: any = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || 'Request failed');
  }
  return response.json();
};

export const GroupsPage = () => {
  const { user } = useSession();
  const { toast } = useToast();

  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupCommitments, setGroupCommitments] = useState<CommitmentWithStatus[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Load groups and invitations
  const loadGroups = async () => {
    if (!user?.id) return;
    
    try {
      const [groupsData, invitationsData] = await Promise.all([
        apiRequest(`/api/groups/user/${user.id}`),
        apiRequest(`/api/groups/invitations/${user.id}`),
      ]);
      
      setGroups(groupsData);
      setInvitations(invitationsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load groups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load group commitments
  const loadGroupCommitments = async (groupId: string) => {
    if (!user?.id) return;
    
    try {
      const data = await apiRequest(
        `/api/groups/${groupId}/commitments?userId=${user.id}&month=${currentMonth}`
      );
      setGroupCommitments(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load group commitments',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user?.id]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupCommitments(selectedGroup.id);
    }
  }, [selectedGroup?.id]);

  const handleCreateGroup = async (name: string) => {
    if (!user?.id) return;
    
    try {
      const newGroup = await apiRequest('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name, ownerId: user.id }),
      });
      
      toast({
        title: 'Success',
        description: 'Group created successfully',
      });
      
      await loadGroups();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create group');
    }
  };

  const handleAcceptInvitation = async (invitation: Invitation) => {
    if (!user?.id) return;
    
    try {
      await apiRequest('/api/groups/accept', {
        method: 'POST',
        body: JSON.stringify({
          groupId: invitation.groupId,
          userId: user.id,
        }),
      });
      
      toast({
        title: 'Success',
        description: 'Invitation accepted',
      });
      
      await loadGroups();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    }
  };

  const handleInviteMember = async (email: string) => {
    if (!user?.id || !selectedGroup) return;
    
    try {
      // First, find user by email (this would need a backend endpoint)
      // For now, we'll need to implement a user search endpoint
      const userResponse = await apiRequest(`/api/user/search?email=${email}`);
      
      if (!userResponse || !userResponse.id) {
        throw new Error('User not found with that email');
      }
      
      await apiRequest('/api/groups/invite', {
        method: 'POST',
        body: JSON.stringify({
          groupId: selectedGroup.id,
          userId: userResponse.id,
          invitedBy: user.id,
        }),
      });
      
      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });
      
      // Reload group details
      const updatedGroup = await apiRequest(
        `/api/groups/${selectedGroup.id}?userId=${user.id}`
      );
      setSelectedGroup(updatedGroup);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user?.id || !selectedGroup) return;
    
    try {
      await apiRequest(`/api/groups/${selectedGroup.id}/members/${memberId}`, {
        method: 'DELETE',
        body: JSON.stringify({ requesterId: user.id }),
      });
      
      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
      
      // Reload group details
      const updatedGroup = await apiRequest(
        `/api/groups/${selectedGroup.id}?userId=${user.id}`
      );
      setSelectedGroup(updatedGroup);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const handleMarkPaid = async (commitmentId: string, amount: number) => {
    if (!user?.id) return;
    
    try {
      await apiRequest('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          commitmentId,
          month: currentMonth,
          paidBy: user.id,
          amountPaid: amount,
        }),
      });
      
      toast({
        title: 'Success',
        description: 'Commitment marked as paid',
      });
      
      if (selectedGroup) {
        await loadGroupCommitments(selectedGroup.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as paid',
        variant: 'destructive',
      });
    }
  };

  const handleMarkUnpaid = async (commitmentId: string) => {
    if (!user?.id) return;
    
    try {
      await apiRequest(`/api/payments/${commitmentId}/${currentMonth}`, {
        method: 'DELETE',
      });
      
      toast({
        title: 'Success',
        description: 'Payment removed',
      });
      
      if (selectedGroup) {
        await loadGroupCommitments(selectedGroup.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove payment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {!selectedGroup ? (
          <GroupList
            groups={groups}
            invitations={invitations}
            onCreateGroup={() => setShowCreateModal(true)}
            onSelectGroup={setSelectedGroup}
            onAcceptInvitation={handleAcceptInvitation}
          />
        ) : (
          <GroupDetail
            group={selectedGroup}
            commitments={groupCommitments}
            currentMonth={currentMonth}
            currentUserId={user?.id || ''}
            onBack={() => setSelectedGroup(null)}
            onInviteMember={() => setShowInviteModal(true)}
            onRemoveMember={handleRemoveMember}
            onMarkPaid={handleMarkPaid}
            onMarkUnpaid={handleMarkUnpaid}
          />
        )}
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateGroup}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
      />
    </div>
  );
};

export default GroupsPage;
