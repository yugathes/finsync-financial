import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Mail, Plus } from 'lucide-react';

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  owner?: {
    id: string;
    email: string;
  };
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    status: string;
    user: {
      id: string;
      email: string;
    };
  }>;
}

export interface Invitation {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  status: string;
  group: {
    id: string;
    name: string;
    owner: {
      id: string;
      email: string;
    };
  };
}

interface GroupListProps {
  groups: Group[];
  invitations: Invitation[];
  onCreateGroup: () => void;
  onSelectGroup: (group: Group) => void;
  onAcceptInvitation: (invitation: Invitation) => void;
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  invitations,
  onCreateGroup,
  onSelectGroup,
  onAcceptInvitation,
}) => {
  return (
    <div className="space-y-6">
      {/* Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 border-blue-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {invitation.group.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Invited by {invitation.group.owner.email}
                  </div>
                </div>
                <Button
                  onClick={() => onAcceptInvitation(invitation)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Accept
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Groups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-600" />
            My Groups
          </CardTitle>
          <Button
            onClick={onCreateGroup}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Group
          </Button>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <div className="text-lg font-medium mb-2">No groups yet</div>
              <div className="text-sm">Create your first group to start sharing commitments</div>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const isOwner = group.owner?.id === group.ownerId;
                const memberCount = group.members?.length || 0;
                
                return (
                  <div
                    key={group.id}
                    onClick={() => onSelectGroup(group)}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {group.name}
                        </span>
                        {isOwner && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
