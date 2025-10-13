import React, { useState, useEffect } from 'react';
import { useSession } from '../../hooks/useSession';
import { Layout } from '@/components/Layout';
import { BalanceCard } from './BalanceCard';
import { CommitmentsList } from './CommitmentsList';
import { CommitmentForm } from '../Commitments/CommitmentForm';
import { IncomeModal } from './IncomeModal';
import { FloatingActionButton } from '../ui/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// API helper functions
const apiRequest = async (url: string, options: any = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || 'Request failed');
  }
  return response.json();
};

export const RefactoredDashboard = () => {
  const { user } = useSession();
  const { toast } = useToast();

  // Get current month in YYYY-MM format
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // State
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper functions
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    const newMonth = date.toISOString().slice(0, 7);
    setCurrentMonth(newMonth);
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Load dashboard summary
      const summary = await apiRequest(`/api/dashboard/${user.id}/${currentMonth}`);
      setMonthlyIncome(summary.income || 0);
      setCommitments(summary.commitmentsList || []);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when user or month changes
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line
  }, [user?.id, currentMonth]);

  // Income management
  const handleUpdateIncome = async (income: number) => {
    if (!user?.id) return;
    try {
      await apiRequest('/api/monthly-income', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          month: currentMonth,
          amount: income.toString(),
        }),
      });
      setMonthlyIncome(income);
      setShowIncomeModal(false);
      toast({
        title: 'Income updated!',
        description: `Monthly income set to MYR ${income.toLocaleString()}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update income',
        variant: 'destructive',
      });
    }
  };

  // Commitment management
  const handleAddCommitment = async (newCommitment: {
    title: string;
    amount: number;
    type: 'static' | 'dynamic';
    category: string;
  }) => {
    if (!user?.id) return;
    try {
      await apiRequest('/api/commitments', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          ...newCommitment,
          amount: newCommitment.amount.toString(),
          startDate: new Date().toISOString().split('T')[0],
        }),
      });
      await loadDashboardData();
      setShowCommitmentForm(false);
      toast({
        title: 'Commitment added!',
        description: `${newCommitment.title} has been added to your list`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create commitment',
        variant: 'destructive',
      });
    }
  };

  const handleMarkPaid = async (commitmentId: string, amount: number) => {
    if (!user?.id) return;
    try {
      await apiRequest(`/api/commitments/${commitmentId}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          month: currentMonth,
          amount: amount.toString(),
        }),
      });
      await loadDashboardData();
      toast({
        title: 'Payment recorded!',
        description: `Commitment marked as paid`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark commitment as paid',
        variant: 'destructive',
      });
    }
  };

  const handleMarkUnpaid = async (commitmentId: string) => {
    try {
      await apiRequest(`/api/commitments/${commitmentId}/pay/${currentMonth}`, {
        method: 'DELETE',
      });
      await loadDashboardData();
      toast({
        title: 'Payment removed!',
        description: 'Commitment marked as unpaid',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark commitment as unpaid',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCommitment = async (commitmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this commitment?')) return;
    try {
      await apiRequest(`/api/commitments/${commitmentId}`, {
        method: 'DELETE',
      });
      await loadDashboardData();
      toast({
        title: 'Commitment deleted!',
        description: 'Commitment has been removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete commitment',
        variant: 'destructive',
      });
    }
  };

  // Calculate metrics
  const totalCommitments = commitments.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const paidCommitments = commitments
    .filter(c => c.isPaid)
    .reduce((sum, c) => sum + (parseFloat(c.amountPaid || c.amount) || 0), 0);
  const availableBalance = monthlyIncome - paidCommitments;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout title="FinSync - Financial Dashboard">
      <div className="space-y-6 pb-20 sm:pb-6">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">Welcome to FinSync</h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Track your commitments and stay financially organized
          </p>
        </div>

        {/* Month Navigation */}
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => changeMonth('prev')} className="text-blue-600">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {formatMonth(currentMonth)}
                </h2>
                {currentMonth === getCurrentMonth() && (
                  <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1 ml-2">Current Month</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => changeMonth('next')} className="text-blue-600">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance Overview */}
        <BalanceCard
          income={monthlyIncome}
          commitments={totalCommitments}
          currency="MYR"
          onUpdateIncome={() => setShowIncomeModal(true)}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid This Month</p>
                  <p className="text-xl sm:text-2xl font-bold text-income">MYR {paidCommitments.toLocaleString()}</p>
                </div>
                <div className="p-2 sm:p-3 bg-accent/10 rounded-full">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Commitments</p>
                  <p className="text-xl sm:text-2xl font-bold">{commitments.length}</p>
                </div>
                <div className="p-2 sm:p-3 bg-primary/10 rounded-full">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quick Actions</p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-2 hidden sm:flex"
                    onClick={() => setShowCommitmentForm(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Commitment
                  </Button>
                  <div className="mt-2 text-xs text-muted-foreground sm:hidden">Use the + button to add</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commitments List */}
        <CommitmentsList
          commitments={commitments}
          currency="MYR"
          onMarkPaid={handleMarkPaid}
          onAddNew={() => setShowCommitmentForm(true)}
        />

        {/* Floating Action Button (Mobile Only) */}
        <FloatingActionButton onClick={() => setShowCommitmentForm(true)} />

        {/* Modals */}
        <CommitmentForm
          isVisible={showCommitmentForm}
          onSubmit={handleAddCommitment}
          onCancel={() => setShowCommitmentForm(false)}
        />

        <IncomeModal
          isVisible={showIncomeModal}
          currentIncome={monthlyIncome}
          currency="MYR"
          onSubmit={handleUpdateIncome}
          onCancel={() => setShowIncomeModal(false)}
        />
      </div>
    </Layout>
  );
};
