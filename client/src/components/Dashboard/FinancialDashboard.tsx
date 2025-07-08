import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, DollarSign, CreditCard, CheckCircle2, Circle } from 'lucide-react';
import { MonthlyIncomeForm } from '../Income/MonthlyIncomeForm';
import { NewCommitmentForm, NewCommitmentData } from '../Commitments/NewCommitmentForm';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Commitment {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: 'static' | 'dynamic';
  recurring: boolean;
  shared: boolean;
  isPaid?: boolean;
  amountPaid?: number;
}

interface FinancialDashboardProps {
  userId: number;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ userId }) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const { toast } = useToast();

  // Get current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetchDashboardData();
  }, [userId, currentMonth]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch monthly income
      const { data: incomeData, error: incomeError } = await supabase
        .from('monthly_income')
        .select('amount')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single();

      if (incomeData) {
        setMonthlyIncome(parseFloat(incomeData.amount));
      } else if (incomeError && incomeError.code !== 'PGRST116') {
        console.error('Error fetching income:', incomeError);
      }

      // Fetch commitments
      const { data: commitmentsData, error: commitmentsError } = await supabase
        .from('commitments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (commitmentsError) throw commitmentsError;

      // Fetch payment status for current month
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('commitment_payments')
        .select('*')
        .eq('paid_by', userId)
        .eq('month', currentMonth);

      if (paymentsError) throw paymentsError;

      // Combine commitments with payment status
      const commitmentsWithPayments = (commitmentsData || []).map(commitment => {
        const payment = paymentsData?.find(p => p.commitment_id === commitment.id);
        return {
          ...commitment,
          isPaid: !!payment,
          amountPaid: payment ? parseFloat(payment.amount_paid) : undefined
        };
      });

      setCommitments(commitmentsWithPayments);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommitment = async (commitmentData: NewCommitmentData) => {
    try {
      const { error } = await supabase
        .from('commitments')
        .insert({
          user_id: userId,
          title: commitmentData.title,
          amount: commitmentData.amount,
          category: commitmentData.category,
          type: commitmentData.type,
          recurring: commitmentData.recurring,
          shared: commitmentData.shared,
          start_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commitment created successfully"
      });

      setShowCommitmentForm(false);
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error creating commitment:', error);
      throw new Error('Failed to create commitment');
    }
  };

  const toggleCommitmentPaid = async (commitment: Commitment) => {
    try {
      if (commitment.isPaid) {
        // Mark as unpaid
        const { error } = await supabase
          .from('commitment_payments')
          .delete()
          .eq('commitment_id', commitment.id)
          .eq('month', currentMonth);

        if (error) throw error;
      } else {
        // Mark as paid
        const { error } = await supabase
          .from('commitment_payments')
          .insert({
            commitment_id: commitment.id,
            paid_by: userId,
            month: currentMonth,
            amount_paid: commitment.amount
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${commitment.title} marked as ${commitment.isPaid ? 'unpaid' : 'paid'}`
      });

      fetchDashboardData();
    } catch (error: any) {
      console.error('Error toggling payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  // Calculate totals
  const totalCommitments = commitments.reduce((sum, c) => sum + c.amount, 0);
  const paidCommitments = commitments.filter(c => c.isPaid).reduce((sum, c) => sum + (c.amountPaid || c.amount), 0);
  const remainingBalance = monthlyIncome - paidCommitments;
  const budgetUsedPercentage = monthlyIncome > 0 ? (paidCommitments / monthlyIncome) * 100 : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">Track your income and commitments for {currentMonth}</p>
        </div>
        <Button 
          onClick={() => setShowCommitmentForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Commitment
        </Button>
      </div>

      {/* Income Section */}
      <div className="flex justify-center">
        <MonthlyIncomeForm 
          userId={userId}
          currentMonth={currentMonth}
          onIncomeUpdated={(income) => setMonthlyIncome(income)}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${monthlyIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commitments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalCommitments.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${paidCommitments.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${remainingBalance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      {monthlyIncome > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Usage</CardTitle>
            <CardDescription>
              {budgetUsedPercentage.toFixed(1)}% of monthly income spent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={budgetUsedPercentage} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Commitments List */}
      <Card>
        <CardHeader>
          <CardTitle>Commitments for {currentMonth}</CardTitle>
          <CardDescription>
            {commitments.length} total commitments • {commitments.filter(c => c.isPaid).length} paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commitments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No commitments yet. Add your first commitment to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {commitments.map((commitment) => (
                <div
                  key={commitment.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    commitment.isPaid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCommitmentPaid(commitment)}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      {commitment.isPaid ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                    <div>
                      <div className="font-medium">{commitment.title}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {commitment.category}
                        </Badge>
                        <Badge variant={commitment.type === 'static' ? 'default' : 'secondary'} className="text-xs">
                          {commitment.type}
                        </Badge>
                        {commitment.recurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${commitment.amountPaid?.toLocaleString() || commitment.amount.toLocaleString()}
                    </div>
                    {commitment.isPaid && (
                      <div className="text-sm text-green-600">Paid</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Commitment Form Modal */}
      <NewCommitmentForm
        onSubmit={handleCreateCommitment}
        onCancel={() => setShowCommitmentForm(false)}
        isVisible={showCommitmentForm}
        currency="$"
      />
    </div>
  );
};