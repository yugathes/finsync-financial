import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Undo2, Users, Clock, Trash2, FileText, Repeat, Sliders } from 'lucide-react';

interface Commitment {
  id: string;
  title: string;
  amount: number;
  type: 'static' | 'dynamic';
  category: string;
  isPaid: boolean;
  amountPaid?: string;
  shared: boolean;
  isImported?: boolean;
  sharedWith?: string[];
}

interface CommitmentsListProps {
  commitments: Commitment[];
  currency?: string;
  onMarkPaid: (id: string, amount: number) => void;
  onMarkUnpaid?: (id: string) => void;
  onAddNew: () => void;
  onDelete?: (id: string) => void;
  /** When true, the view is read-only (historical month) */
  isHistorical?: boolean;
}

/** Group a list of commitments into static, dynamic, and shared buckets. */
function groupByType(items: Commitment[]) {
  return {
    shared: items.filter(c => c.shared),
    static: items.filter(c => !c.shared && c.type === 'static'),
    dynamic: items.filter(c => !c.shared && c.type === 'dynamic'),
  };
}

interface TypeGroupProps {
  label: string;
  icon: React.ReactNode;
  items: Commitment[];
  currency: string;
  onMarkPaid: (id: string, amount: number) => void;
  onMarkUnpaid?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** Additional classes applied to the group wrapper */
  className?: string;
  isHistorical?: boolean;
}

/** Renders a labelled group of commitment items of the same type. */
const TypeGroup = ({ label, icon, items, currency, onMarkPaid, onMarkUnpaid, onDelete, className = '', isHistorical }: TypeGroupProps) => {
  if (items.length === 0) return null;
  return (
    <div className={`space-y-2 ${className}`} data-testid={`commitment-group-${label.toLowerCase()}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {icon}
        <span>{label} ({items.length})</span>
      </div>
      <div className="space-y-2 pl-1 border-l-2 border-muted">
        {items.map(commitment => (
          <CommitmentItem
            key={commitment.id}
            commitment={commitment}
            currency={currency}
            onMarkPaid={onMarkPaid}
            onMarkUnpaid={onMarkUnpaid}
            onDelete={onDelete}
            isHistorical={isHistorical}
          />
        ))}
      </div>
    </div>
  );
};

export const CommitmentsList = ({
  commitments,
  currency = 'MYR',
  onMarkPaid,
  onMarkUnpaid,
  onAddNew,
  onDelete,
  isHistorical = false,
}: CommitmentsListProps) => {
  // Exclude imported commitments from active totals
  const activeCommitments = commitments.filter(c => !c.isImported);
  const unpaidCommitments = activeCommitments.filter(c => !c.isPaid);
  const paidCommitments = activeCommitments.filter(c => c.isPaid);
  const importedCommitments = commitments.filter(c => c.isImported);
  const totalUnpaid = unpaidCommitments.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const unpaidGroups = groupByType(unpaidCommitments);
  const paidGroups = groupByType(paidCommitments);

  return (
    <Card className="bg-white shadow-lg border-0 animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-blue-800">
            {isHistorical ? 'Historical Commitments' : "This Month's Commitments"}
          </CardTitle>
          {!isHistorical && (
            <Button
              variant="default"
              size="sm"
              onClick={onAddNew}
              className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add New
            </Button>
          )}
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
            {isHistorical ? (
              <>
                <div className="text-lg font-medium mb-2">No commitments recorded</div>
                <div className="text-sm text-muted-foreground">No commitments were recorded for this period.</div>
              </>
            ) : (
              <>
                <div className="text-lg font-medium mb-2">No commitments yet</div>
                <div className="text-sm mb-4">Start by adding your first commitment</div>
                <Button variant="default" onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Your First Commitment
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Unpaid Commitments — grouped by type */}
            {unpaidCommitments.length > 0 && (
              <div className="space-y-4" data-testid="section-pending">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Pending ({unpaidCommitments.length})
                </h3>
                <TypeGroup
                  label="Static"
                  icon={<Repeat className="h-3.5 w-3.5 text-blue-500" />}
                  items={unpaidGroups.static}
                  currency={currency}
                  onMarkPaid={onMarkPaid}
                  onMarkUnpaid={onMarkUnpaid}
                  onDelete={onDelete}
                  isHistorical={isHistorical}
                />
                <TypeGroup
                  label="Dynamic"
                  icon={<Sliders className="h-3.5 w-3.5 text-orange-500" />}
                  items={unpaidGroups.dynamic}
                  currency={currency}
                  onMarkPaid={onMarkPaid}
                  onMarkUnpaid={onMarkUnpaid}
                  onDelete={onDelete}
                  isHistorical={isHistorical}
                />
                <TypeGroup
                  label="Shared"
                  icon={<Users className="h-3.5 w-3.5 text-purple-500" />}
                  items={unpaidGroups.shared}
                  currency={currency}
                  onMarkPaid={onMarkPaid}
                  onMarkUnpaid={onMarkUnpaid}
                  onDelete={onDelete}
                  isHistorical={isHistorical}
                />
              </div>
            )}

            {/* Divider */}
            {unpaidCommitments.length > 0 && paidCommitments.length > 0 && <div className="border-t my-6"></div>}

            {/* Paid Commitments — grouped by type */}
            {paidCommitments.length > 0 && (
              <div className="space-y-4" data-testid="section-completed">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Completed ({paidCommitments.length})
                </h3>
                <TypeGroup
                  label="Static"
                  icon={<Repeat className="h-3.5 w-3.5 text-blue-500" />}
                  items={paidGroups.static}
                  currency={currency}
                  onMarkPaid={onMarkPaid}
                  onMarkUnpaid={onMarkUnpaid}
                  onDelete={onDelete}
                  isHistorical={isHistorical}
                />
                <TypeGroup
                  label="Dynamic"
                  icon={<Sliders className="h-3.5 w-3.5 text-orange-500" />}
                  items={paidGroups.dynamic}
                  currency={currency}
                  onMarkPaid={onMarkPaid}
                  onMarkUnpaid={onMarkUnpaid}
                  onDelete={onDelete}
                  isHistorical={isHistorical}
                />
                <TypeGroup
                  label="Shared"
                  icon={<Users className="h-3.5 w-3.5 text-purple-500" />}
                  items={paidGroups.shared}
                  currency={currency}
                  onMarkPaid={onMarkPaid}
                  onMarkUnpaid={onMarkUnpaid}
                  onDelete={onDelete}
                  isHistorical={isHistorical}
                />
              </div>
            )}

            {/* Imported Records (not counted in totals) */}
            {importedCommitments.length > 0 && (
              <>
                <div className="border-t my-6"></div>
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Imported Records ({importedCommitments.length}) — not counted in totals
                  </h3>
                  {importedCommitments.map(commitment => (
                    <CommitmentItem
                      key={commitment.id}
                      commitment={commitment}
                      currency={currency}
                      onMarkPaid={onMarkPaid}
                      onMarkUnpaid={onMarkUnpaid}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </>
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
  onMarkUnpaid?: (id: string) => void;
  onDelete?: (id: string) => void;
  isHistorical?: boolean;
}

const CommitmentItem = ({ commitment, currency, onMarkPaid, onMarkUnpaid, onDelete, isHistorical }: CommitmentItemProps) => {
  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-lg border transition-smooth animate-fade-in ${
        commitment.isPaid
          ? 'bg-muted/30 border-muted opacity-75'
          : commitment.isImported
            ? 'bg-purple-50/30 border-purple-100'
            : isHistorical
              ? 'bg-amber-50/30 border-amber-100'
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
            {commitment.isImported && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                <FileText className="h-3 w-3 mr-1" />
                Imported
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
        {commitment.isPaid ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onMarkUnpaid && onMarkUnpaid(commitment.id)}
            disabled={!onMarkUnpaid || isHistorical}
            title={isHistorical ? 'Cannot modify historical records' : undefined}
            className="flex-1"
          >
            <Undo2 className="h-4 w-4 mr-1" />
            <span>Mark Unpaid</span>
          </Button>
        ) : (
          <Button
            variant="success"
            size="sm"
            onClick={() => onMarkPaid(commitment.id, commitment.amount)}
            disabled={isHistorical}
            title={isHistorical ? 'Cannot modify historical records' : undefined}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            <span>Mark Paid</span>
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(commitment.id)}
            disabled={isHistorical}
            title={isHistorical ? 'Cannot modify historical records' : undefined}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
