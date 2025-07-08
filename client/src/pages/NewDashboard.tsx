import React, { useState, useEffect } from 'react';
import { useSession } from '../hooks/useSession';
import { BalanceCard } from '../components/Dashboard/BalanceCard';
import { CommitmentList, CommitmentWithStatus } from '../components/Commitments/CommitmentList';
import { NewCommitmentForm, NewCommitmentData } from '../components/Commitments/NewCommitmentForm';
import { MonthlyIncomeForm } from '../components/Income/MonthlyIncomeForm';
import { FloatingActionButton } from '../components/UI/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Target } from 'lucide-react';
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

export const NewDashboard: React.FC = () => {
  const { user } = useSession();
  const { toast } = useToast();
  
  // Get current month in YYYY-MM format
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  
  // State
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [commitments, setCommitments] = useState<CommitmentWithStatus[]>([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper functions
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  
  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1); // month is 0-indexed
    
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
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when user or month changes
  useEffect(() => {
    loadDashboardData();
  }, [user?.id, currentMonth]);

  // Income management
  const handleUpdateIncome = async (amount: number) => {
    if (!user?.id) return;
    
    try {
      await apiRequest('/api/monthly-income', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          month: currentMonth,
          amount: amount.toString()
        })
      });
      
      setMonthlyIncome(amount);
      setShowIncomeForm(false);
      
      toast({
        title: "Income Updated",
        description: `Monthly income set to MYR ${amount.toLocaleString()}`,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update income');
    }
  };

  // Commitment management
  const handleCreateCommitment = async (commitmentData: NewCommitmentData) => {
    if (!user?.id) return;
    
    try {
      const newCommitment = await apiRequest('/api/commitments', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          ...commitmentData,
          amount: commitmentData.amount.toString(),
          startDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        })
      });
      
      // Reload data to get updated commitments with payment status
      await loadDashboardData();
      setShowCommitmentForm(false);
      
      toast({
        title: "Commitment Added",
        description: `${commitmentData.title} has been added to your commitments`,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create commitment');
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
          amount: amount.toString()
        })
      });
      
      // Reload data to reflect payment
      await loadDashboardData();
      
      toast({
        title: "Payment Recorded",
        description: "Commitment marked as paid",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark commitment as paid",
        variant: "destructive"
      });
    }
  };

  const handleMarkUnpaid = async (commitmentId: string) => {
    try {
      await apiRequest(`/api/commitments/${commitmentId}/pay/${currentMonth}`, {
        method: 'DELETE'
      });
      
      // Reload data to reflect change
      await loadDashboardData();
      
      toast({
        title: "Payment Removed",
        description: "Commitment marked as unpaid",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark commitment as unpaid",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCommitment = async (commitmentId: string) => {
    if (!confirm('Are you sure you want to delete this commitment?')) return;
    
    try {
      await apiRequest(`/api/commitments/${commitmentId}`, {
        method: 'DELETE'
      });
      
      // Reload data
      await loadDashboardData();
      
      toast({
        title: "Commitment Deleted",
        description: "Commitment has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete commitment",
        variant: "destructive"
      });
    }
  };

  // Calculate metrics
  const totalCommitments = commitments.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const paidCommitments = commitments
    .filter(c => c.isPaid)
    .reduce((sum, c) => sum + parseFloat(c.amountPaid || c.amount), 0);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">FinSync Dashboard</h1>
        <p className="text-blue-600">
          Comprehensive financial commitment tracking
        </p>
      </div>

      {/* Month Navigation */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changeMonth('prev')}
              className="text-blue-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {formatMonth(currentMonth)}
              </h2>
              {currentMonth === getCurrentMonth() && (
                <Badge variant="secondary" className="text-xs">Current Month</Badge>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changeMonth('next')}
              className="text-blue-600"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Balance Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-white" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Income Section */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-100">Monthly Income</div>
              <div className="text-2xl font-bold text-green-200">
                MYR {monthlyIncome.toLocaleString()}
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowIncomeForm(true)}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              {monthlyIncome > 0 ? 'Update' : 'Set Income'}
            </Button>
          </div>

          {/* Balance Calculation */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-400">
            <div className="text-center">
              <div className="text-sm text-blue-100">Total Commitments</div>
              <div className="text-lg font-semibold text-red-200">
                MYR {totalCommitments.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-100">Paid This Month</div>
              <div className="text-lg font-semibold text-orange-200">
                MYR {paidCommitments.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-100">Available Balance</div>
              <div className={`text-lg font-semibold ${
                availableBalance >= 0 ? 'text-green-200' : 'text-red-300'
              }`}>
                MYR {availableBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {commitments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-white p-4 text-center">
            <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-800">{commitments.length}</div>
            <div className="text-sm text-blue-600">Total Commitments</div>
          </Card>
          <Card className="bg-white p-4 text-center">
            <div className="text-xl font-bold text-green-600">
              {commitments.filter(c => c.isPaid).length}
            </div>
            <div className="text-sm text-green-600">Paid</div>
          </Card>
          <Card className="bg-white p-4 text-center">
            <div className="text-xl font-bold text-orange-600">
              {commitments.filter(c => !c.isPaid).length}
            </div>
            <div className="text-sm text-orange-600">Pending</div>
          </Card>
          <Card className="bg-white p-4 text-center">
            <div className="text-xl font-bold text-purple-600">
              {commitments.filter(c => c.recurring).length}
            </div>
            <div className="text-sm text-purple-600">Recurring</div>
          </Card>
        </div>
      )}

      {/* Commitments List */}
      <CommitmentList
        commitments={commitments}
        month={currentMonth}
        currency="MYR"
        onMarkPaid={handleMarkPaid}
        onMarkUnpaid={handleMarkUnpaid}
        onDelete={handleDeleteCommitment}
      />

      {/* Add New Commitment Button */}
      <div className="text-center pb-8">
        <Button
          onClick={() => setShowCommitmentForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          size="lg"
        >
          Add New Commitment
        </Button>
      </div>

      {/* Floating Action Button for Mobile */}
      <FloatingActionButton onClick={() => setShowCommitmentForm(true)} />

      {/* Modals */}
      {showIncomeForm && user?.id && (
        <MonthlyIncomeForm
          userId={user.id}
          currentMonth={currentMonth}
          onIncomeUpdated={(newIncome) => {
            handleUpdateIncome(newIncome);
            // setShowIncomeForm(false); // handleUpdateIncome already does this
          }}
        />
      )}

      {/*
        The original MonthlyIncomeForm also had an onCancel prop.
        This is now handled by the button that would set showIncomeForm to false.
        The MonthlyIncomeForm itself has a cancel button internally if it's in editing mode
        and an income already exists.
        We might need a dedicated "Close" or "Cancel" button if setShowIncomeForm(true)
        shows a form that doesn't have an income yet (i.e., currentIncomeAmount === 0).
        Let's check the MonthlyIncomeForm logic for the cancel button:
        It shows a cancel button if `isEditing && currentIncomeAmount > 0`.
        If `currentIncomeAmount === 0`, it doesn't show a cancel button, only "Save Income".
        This means if the user opens the form when income is 0, they can only save, not cancel.
        This might be an issue.

        For now, let's add a simple way to close it, perhaps by wrapping it or adding a button
        in NewDashboard.tsx if this becomes an issue.
        The original onCancel was `() => setShowIncomeForm(false)`.
        The "Update" button in the "Financial Overview" card sets `setShowIncomeForm(true)`.
        The `MonthlyIncomeForm` itself has a cancel button that calls `setIsEditing(false)`.
        This doesn't hide the component if it was shown because income was 0.

        Let's refine the logic for displaying and hiding the MonthlyIncomeForm.
        The "Set Income" / "Update" button in NewDashboard controls `showIncomeForm`.
        If the user wants to cancel, they need a way to set `showIncomeForm` to false.
        The internal cancel button of MonthlyIncomeForm only toggles its internal `isEditing` state.

        A simple solution is to provide a way to close it from NewDashboard.
        We can wrap MonthlyIncomeForm in a Dialog-like structure or pass setShowIncomeForm down.
        However, MonthlyIncomeForm is a Card, not a Dialog.

        Let's consider the user flow:
        1. User clicks "Set Income" or "Update Income" -> showIncomeForm = true.
        2. MonthlyIncomeForm appears.
           - If income exists, it shows current income and an "Edit" button. Clicking "Edit" sets its internal `isEditing` to true.
             In edit mode, it has "Save" and "Cancel" (which sets `isEditing` to false).
           - If income is 0, it shows the form directly with a "Save Income" button. No "Cancel" button.

        This means if income is 0, and the form is shown, there's no way to hide it using its internal buttons.
        The `onCancel` prop was essential for this.
        Since MonthlyIncomeForm doesn't accept onCancel, we need to provide this externally if `showIncomeForm` is true.

        Let's re-evaluate. The `MonthlyIncomeForm` is not a modal. It's a card.
        The `NewDashboard` was trying to use it *as if* it were a modal.
        The current structure of `MonthlyIncomeForm` is that it's always visible once rendered and manages its edit state.

        If `NewDashboard` renders `MonthlyIncomeForm` conditionally using `showIncomeForm`,
        then `NewDashboard` needs a way to set `showIncomeForm` to `false` to "close" it.
        The `handleUpdateIncome` (which becomes `onIncomeUpdated`) already sets `setShowIncomeForm(false)`.
        So, after successfully updating income, the form will hide.

        The issue is cancelling when no income is set yet (the form is open for initial setting).
        The `MonthlyIncomeForm` has this structure:
        <Card>
          <CardHeader>...</CardHeader>
          {(isEditing || currentIncomeAmount === 0) && ( // Form content here
            <CardContent>
              <form onSubmit={handleSubmit}>
                 ...
                 {isEditing && currentIncomeAmount > 0 && (<Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>)}
              </form>
            </CardContent>
          )}
        </Card>

        So if `currentIncomeAmount === 0`, the form is shown, but no Cancel button from within the form.
        The `NewDashboard` needs to provide a way to hide it.
        This could be an explicit "Close" button next to where it's rendered, or perhaps the "Set/Update Income" button could toggle `showIncomeForm`.

        Let's assume for now that `handleUpdateIncome` successfully setting `showIncomeForm = false` is the primary way it's hidden.
        The original `onCancel={() => setShowIncomeForm(false)}` prop on the erroneous call suggests this was the intent.
        Since `MonthlyIncomeForm` doesn't take `onCancel`, we need to handle this in `NewDashboard`.

        The simplest approach is to wrap the conditionally rendered `MonthlyIncomeForm`
        with a section that includes a close button if `showIncomeForm` is true.
      */}
      {showIncomeForm && user?.id && (
        <Card className="mt-4"> {/* Added a wrapper Card for consistent styling and to place a close button */}
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Manage Monthly Income</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowIncomeForm(false)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <MonthlyIncomeForm
              userId={user.id}
              currentMonth={currentMonth}
              onIncomeUpdated={(newIncome) => {
                // handleUpdateIncome already calls setShowIncomeForm(false)
                // and sets the monthlyIncome state.
                // We just need to ensure it's called.
                handleUpdateIncome(newIncome);
              }}
            />
          </CardContent>
        </Card>
      )}

      <NewCommitmentForm
        onSubmit={handleCreateCommitment}
        onCancel={() => setShowCommitmentForm(false)}
        isVisible={showCommitmentForm}
        currency="MYR"
      />
    </div>
  );
};