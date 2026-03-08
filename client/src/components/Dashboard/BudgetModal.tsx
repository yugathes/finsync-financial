import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Target } from 'lucide-react';

interface BudgetModalProps {
  currentBudget: number | null;
  onSubmit: (budget: number | null) => void;
  onCancel: () => void;
  isVisible: boolean;
  currency?: string;
}

export const BudgetModal = ({
  currentBudget,
  onSubmit,
  onCancel,
  isVisible,
  currency = 'MYR',
}: BudgetModalProps) => {
  const [budget, setBudget] = useState(currentBudget !== null ? currentBudget.toString() : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // An empty value or explicit '0' is treated as "no limit" — budget is cleared.
    if (budget === '' || budget === '0') {
      onSubmit(null);
    } else {
      const value = parseFloat(budget);
      if (!isNaN(value) && value > 0) {
        onSubmit(value);
      }
    }
  };

  const handleClear = () => {
    onSubmit(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-background animate-slide-up sm:animate-scale-in">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Set Monthly Budget Limit
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-base">
                Monthly Budget Limit ({currency})
              </Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="Leave empty to remove limit"
                className="text-xl text-center py-6"
                autoFocus
              />
              <p className="text-sm text-muted-foreground text-center">
                You will be warned when spending exceeds 80% of this limit.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              {currentBudget !== null && (
                <Button type="button" variant="outline" onClick={handleClear} className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10">
                  Remove Limit
                </Button>
              )}
              <Button type="submit" variant="primary" className="flex-1">
                Save Budget
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
