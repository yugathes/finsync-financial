import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, TrendingUp } from "lucide-react";

interface IncomeModalProps {
  currentIncome: number;
  onSubmit: (income: number) => void;
  onCancel: () => void;
  isVisible: boolean;
  currency?: string;
}

export const IncomeModal = ({ 
  currentIncome, 
  onSubmit, 
  onCancel, 
  isVisible, 
  currency = "MYR" 
}: IncomeModalProps) => {
  const [income, setIncome] = useState(currentIncome.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incomeValue = parseFloat(income);
    if (incomeValue >= 0) {
      onSubmit(incomeValue);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-background animate-slide-up sm:animate-scale-in">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-income" />
              Update Monthly Income
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="income" className="text-base">
                Monthly Income ({currency})
              </Label>
              <Input
                id="income"
                type="number"
                step="0.01"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="0.00"
                className="text-xl text-center py-6"
                autoFocus
              />
              <p className="text-sm text-muted-foreground text-center">
                Enter your total monthly income from all sources
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Update Income
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};