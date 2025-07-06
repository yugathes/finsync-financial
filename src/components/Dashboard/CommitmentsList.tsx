import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Users } from "lucide-react";

interface Commitment {
  id: string;
  title: string;
  amount: number;
  type: 'static' | 'dynamic';
  category: string;
  isPaid: boolean;
  isShared: boolean;
  sharedWith?: string[];
}

interface CommitmentsListProps {
  commitments: Commitment[];
  currency?: string;
  onMarkPaid: (id: string) => void;
  onAddNew: () => void;
}

export const CommitmentsList = ({ 
  commitments, 
  currency = "MYR", 
  onMarkPaid, 
  onAddNew 
}: CommitmentsListProps) => {
  const unpaidCommitments = commitments.filter(c => !c.isPaid);
  const totalUnpaid = unpaidCommitments.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            This Month's Commitments
          </CardTitle>
          <Button variant="primary" size="sm" onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </Button>
        </div>
        {totalUnpaid > 0 && (
          <div className="text-sm text-muted-foreground">
            {currency} {totalUnpaid.toLocaleString()} remaining to pay
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {commitments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-lg font-medium mb-2">No commitments yet</div>
            <div className="text-sm">Start by adding your first commitment</div>
          </div>
        ) : (
          commitments.map((commitment) => (
            <div 
              key={commitment.id} 
              className={`flex items-center justify-between p-4 rounded-lg border transition-smooth ${
                commitment.isPaid 
                  ? 'bg-muted/30 border-muted' 
                  : 'bg-background border-border hover:shadow-sm'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${commitment.isPaid ? 'text-muted-foreground line-through' : ''}`}>
                    {commitment.title}
                  </span>
                  {commitment.isShared && (
                    <Users className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={commitment.type === 'static' ? 'secondary' : 'outline'}>
                    {commitment.type}
                  </Badge>
                  <span>{commitment.category}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`text-lg font-semibold ${commitment.isPaid ? 'text-muted-foreground' : ''}`}>
                  {currency} {commitment.amount.toLocaleString()}
                </div>
                <Button
                  variant={commitment.isPaid ? "secondary" : "success"}
                  size="sm"
                  onClick={() => onMarkPaid(commitment.id)}
                  disabled={commitment.isPaid}
                >
                  <Check className="h-4 w-4" />
                  {commitment.isPaid ? 'Paid' : 'Mark Paid'}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};