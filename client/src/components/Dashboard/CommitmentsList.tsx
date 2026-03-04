import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Users, Clock, Trash2 } from 'lucide-react';

interface Commitment {
  id: string;
  title: string;
  amount: number;
  type: 'static' | 'dynamic';
  category: string;
  isPaid: boolean;
  shared: boolean;
  sharedWith?: string[];
}

interface CommitmentsListProps {
  commitments: Commitment[];
  currency?: string;
  onMarkPaid: (id: string, amount: number) => void;
  onAddNew: () => void;
  onDelete?: (id: string) => void;
}

export const CommitmentsList = ({
  commitments,
  currency = 'MYR',
  onMarkPaid,
  onAddNew,
  onDelete,
}: CommitmentsListProps) => {
  const unpaidCommitments = commitments.filter(c => !c.isPaid);
  const paidCommitments = commitments.filter(c => c.isPaid);
  const totalUnpaid = unpaidCommitments.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  return (
    <Card className="bg-white shadow-lg border-0 animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-blue-800">This Month's Commitments</CardTitle>
          <Button
            variant="default"
            size="sm"
            onClick={onAddNew}
            className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </Button>
        </div>
        {totalUnpaid > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-blue-600">
              {currency} {totalUnpaid.toLocaleString()} remaining to pay
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {commitments.length === 0 ? (
          <div className="text-center py-12 text-blue-600">
            <div className="text-lg font-medium mb-2">No commitments yet</div>
            <div className="text-sm mb-4">Start by adding your first commitment</div>
            <Button variant="default" onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Commitment
            </Button>
          </div>
        ) : (
          <>
            {/* Unpaid Commitments */}
            {unpaidCommitments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Pending ({unpaidCommitments.length})
                </h3>
                {unpaidCommitments.map(commitment => (
                  <CommitmentItem
                    key={commitment.id}
                    commitment={commitment}
                    currency={currency}
                    onMarkPaid={onMarkPaid}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}

            {/* Divider */}
            {unpaidCommitments.length > 0 && paidCommitments.length > 0 && <div className="border-t my-6"></div>}

            {/* Paid Commitments */}
            {paidCommitments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Completed ({paidCommitments.length})
                </h3>
                {paidCommitments.map(commitment => (
                  <CommitmentItem
                    key={commitment.id}
                    commitment={commitment}
                    currency={currency}
                    onMarkPaid={onMarkPaid}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface CommitmentItemProps {
  commitment: Commitment;
  currency: string;
  onMarkPaid: (id: string, amount: number) => void;
  onDelete?: (id: string) => void;
}

const CommitmentItem = ({ commitment, currency, onMarkPaid, onDelete }: CommitmentItemProps) => {
  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-lg border transition-smooth animate-fade-in ${
        commitment.isPaid
          ? 'bg-muted/30 border-muted opacity-75'
          : 'bg-background border-border hover:shadow-sm hover:border-primary/20'
      }`}
    >
      {/* Header Row: Title, Amount, Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-semibold text-sm leading-tight ${
                commitment.isPaid ? 'text-muted-foreground line-through' : ''
              }`}
            >
              {commitment.title}
            </span>
            {commitment.shared && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                <Users className="h-3 w-3 mr-1" />
                Shared
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-lg font-bold">{currency}</div>
          <span className={`text-lg font-bold ${commitment.isPaid ? 'text-muted-foreground' : ''}`}>
            {commitment.amount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Category and Badge Row */}
      <div className="flex items-center gap-2">
        <Badge variant={commitment.type === 'static' ? 'secondary' : 'outline'} className="text-xs">
          {commitment.type}
        </Badge>
        <span className="text-xs text-muted-foreground">{commitment.category}</span>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          variant={commitment.isPaid ? 'secondary' : 'success'}
          size="sm"
          onClick={() => onMarkPaid(commitment.id, commitment.amount)}
          disabled={commitment.isPaid}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
          <span>{commitment.isPaid ? 'Paid' : 'Mark Paid'}</span>
        </Button>

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(commitment.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
