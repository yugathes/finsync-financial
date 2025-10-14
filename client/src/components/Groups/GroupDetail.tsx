import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import { Group } from './GroupList';
import { CommitmentList, CommitmentWithStatus } from '../Commitments/CommitmentList';

interface GroupDetailProps {
  group: Group;
  commitments: CommitmentWithStatus[];
  currentMonth: string;
  currentUserId: string;
  onBack: () => void;
  onInviteMember: () => void;
  onRemoveMember: (memberId: string) => void;
  onMarkPaid: (commitmentId: string, amount: number) => Promise<void>;
  onMarkUnpaid: (commitmentId: string) => Promise<void>;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({
  group,
  commitments,
  currentMonth,
  currentUserId,
  onBack,
  onInviteMember,
  onRemoveMember,
  onMarkPaid,
  onMarkUnpaid,
}) => {
  const isOwner = group.ownerId === currentUserId;
  const members = group.members || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{group.name}</CardTitle>
                {isOwner && (
                  <Badge variant="secondary">
                    <Crown className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
            </div>
            {isOwner && (
              <Button
                onClick={onInviteMember}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-600" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const isMemberOwner = member.role === 'owner';
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.user.email}
                        {isCurrentUser && (
                          <span className="text-sm text-gray-500 ml-2">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {member.role}
                      </div>
                    </div>
                  </div>
                  {isOwner && !isMemberOwner && !isCurrentUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMember(member.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Shared Commitments */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Shared Commitments
        </h3>
        <CommitmentList
          commitments={commitments}
          month={currentMonth}
          currency="MYR"
          onMarkPaid={onMarkPaid}
          onMarkUnpaid={onMarkUnpaid}
        />
      </div>
    </div>
  );
};
