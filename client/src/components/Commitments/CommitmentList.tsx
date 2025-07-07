import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock, Users, Edit, Trash2, Calendar } from 'lucide-react';

export interface CommitmentWithStatus {
  id: string;
  title: string;
  amount: string;
  type: 'static' | 'dynamic';
  category: string;
  recurring: boolean;
  shared: boolean;
  isPaid: boolean;
  amountPaid?: string;
  startDate: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface CommitmentListProps {
  commitments: CommitmentWithStatus[];
  month: string;
  currency?: string;
  onMarkPaid: (commitmentId: string, amount: number) => Promise<void>;
  onMarkUnpaid: (commitmentId: string) => Promise<void>;
  onEdit?: (commitment: CommitmentWithStatus) => void;
  onDelete?: (commitmentId: string) => Promise<void>;
}

export const CommitmentList: React.FC<CommitmentListProps> = ({
  commitments,
  month,
  currency = "MYR",
  onMarkPaid,
  onMarkUnpaid,
  onEdit,
  onDelete
}) => {
  const unpaidCommitments = commitments.filter(c => !c.isPaid);
  const paidCommitments = commitments.filter(c => c.isPaid);
  
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleTogglePaid = async (commitment: CommitmentWithStatus) => {
    try {
      if (commitment.isPaid) {
        await onMarkUnpaid(commitment.id);
      } else {
        await onMarkPaid(commitment.id, parseFloat(commitment.amount));
      }
    } catch (error) {
      console.error('Error toggling payment status:', error);
    }
  };

  const CommitmentItem: React.FC<{ commitment: CommitmentWithStatus }> = ({ commitment }) => (
    <div 
      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
        commitment.isPaid 
          ? 'bg-green-50 border-green-200 opacity-75' 
          : 'bg-white border-gray-200 hover:shadow-sm'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-medium text-base ${
            commitment.isPaid ? 'text-gray-500 line-through' : 'text-gray-900'
          }`}>
            {commitment.title}
          </span>
          {commitment.shared && (
            <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
          )}
          {commitment.recurring && (
            <Calendar className="h-4 w-4 text-purple-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge 
            variant={commitment.type === 'static' ? 'secondary' : 'outline'} 
            className="text-xs"
          >
            {commitment.type}
          </Badge>
          <span className="text-gray-500">{commitment.category}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <div className={`text-lg font-semibold text-right ${
          commitment.isPaid ? 'text-gray-500' : 'text-gray-900'
        }`}>
          <div className="text-xs text-gray-400">{currency}</div>
          <div>{parseFloat(commitment.amount).toLocaleString()}</div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant={commitment.isPaid ? "secondary" : "default"}
            size="sm"
            onClick={() => handleTogglePaid(commitment)}
            className={`flex-shrink-0 ${
              !commitment.isPaid 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <Check className="h-4 w-4" />
          </Button>
          
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(commitment)}
              className="flex-shrink-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(commitment.id)}
              className="flex-shrink-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-blue-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Commitments for {formatMonth(month)}
        </CardTitle>
        {unpaidCommitments.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-blue-600">
              {unpaidCommitments.length} remaining • {currency} {unpaidCommitments.reduce((sum, c) => sum + parseFloat(c.amount), 0).toLocaleString()} to pay
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {commitments.length === 0 ? (
          <div className="text-center py-12 text-blue-600">
            <Calendar className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <div className="text-lg font-medium mb-2">No commitments for this month</div>
            <div className="text-sm">Add your first commitment to get started</div>
          </div>
        ) : (
          <>
            {unpaidCommitments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-600 uppercase tracking-wide">
                  Pending ({unpaidCommitments.length})
                </h3>
                {unpaidCommitments.map((commitment) => (
                  <CommitmentItem key={commitment.id} commitment={commitment} />
                ))}
              </div>
            )}

            {paidCommitments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-600 uppercase tracking-wide">
                  Completed ({paidCommitments.length})
                </h3>
                {paidCommitments.map((commitment) => (
                  <CommitmentItem key={commitment.id} commitment={commitment} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};