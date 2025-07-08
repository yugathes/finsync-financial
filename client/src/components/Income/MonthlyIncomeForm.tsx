import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MonthlyIncomeFormProps {
  userId: number;
  currentMonth?: string;
  onIncomeUpdated?: (income: number) => void;
}

export const MonthlyIncomeForm: React.FC<MonthlyIncomeFormProps> = ({ 
  userId, 
  currentMonth,
  onIncomeUpdated 
}) => {
  const [income, setIncome] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Get current month in YYYY-MM format
  const month = currentMonth || new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetchCurrentIncome();
  }, [userId, month]);

  const fetchCurrentIncome = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_income')
        .select('amount')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      if (data) {
        setIncome(data.amount.toString());
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error fetching income:', error);
      }
    } catch (error) {
      console.error('Error fetching current income:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!income || parseFloat(income) < 0) {
      toast({
        title: "Invalid Income",
        description: "Please enter a valid income amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('monthly_income')
        .upsert({
          user_id: userId,
          month,
          amount: parseFloat(income),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Income Updated",
        description: `Monthly income for ${month} has been set to $${income}`,
      });

      setIsEditing(false);
      onIncomeUpdated?.(parseFloat(income));
    } catch (error: any) {
      console.error('Error saving income:', error);
      toast({
        title: "Error",
        description: "Failed to update income",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentIncomeAmount = parseFloat(income) || 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Monthly Income - {month}
          {currentIncomeAmount > 0 && !isEditing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {currentIncomeAmount > 0 && !isEditing 
            ? `Current income: $${currentIncomeAmount.toLocaleString()}`
            : "Set your monthly income to track your balance"
          }
        </CardDescription>
      </CardHeader>
      
      {(isEditing || currentIncomeAmount === 0) && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income">Monthly Income</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="income"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Income"}
              </Button>
              {isEditing && currentIncomeAmount > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setIncome(currentIncomeAmount.toString());
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
};