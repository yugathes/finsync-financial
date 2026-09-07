import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../hooks/useSession';
import { Layout } from '@/components/Layout';
import { CommitmentsList } from './CommitmentsList';
import { MonthSelector } from './MonthSelector';
import { CommitmentForm } from '../Commitments/CommitmentForm';
import { IncomeModal } from './IncomeModal';
import { BudgetModal } from './BudgetModal';
import { DeleteConfirmationModal } from '../Commitments/DeleteConfirmationModal';
import { IncomeWarningModal } from './IncomeWarningModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CircleDollarSign,
  History,
  Landmark,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { CommitmentWithStatus } from '../Commitments/CommitmentList';

// API helper functions
class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

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
    throw new ApiError(error.details || error.error || 'Request failed', response.status);
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
  const [budgetLimit, setBudgetLimit] = useState<number | null>(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  // COMMENTED OUT: Import functionality disabled
  // const [showImportWizard, setShowImportWizard] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commitmentToDelete, setCommitmentToDelete] = useState<CommitmentWithStatus | null>(null);
  const [showIncomeWarning, setShowIncomeWarning] = useState(false);
  const [commitmentForWarning, setCommitmentForWarning] = useState<{
    id: string;
    title: string;
    amount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [includeShared, setIncludeShared] = useState(false);
  // COMMENTED OUT: Import functionality disabled
  // const [includeImported, setIncludeImported] = useState(false);

  // Helper functions
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

  const isHistoricalMonth = currentMonth < getCurrentMonth();

  const handleMonthChange = (newMonth: string) => {
    console.log(`[RefactoredDashboard] Changing month from ${currentMonth} to ${newMonth}`);
    setCurrentMonth(newMonth);
  };

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      console.log(`[RefactoredDashboard] Loading dashboard data for user ${user.id} and month ${currentMonth}`);

      // Build query parameters for filters
      const params = new URLSearchParams({
        includeShared: includeShared.toString(),
        // COMMENTED OUT: Import functionality disabled
        // includeImported: includeImported.toString(),
      });

      // Load commitments with filters
      const commitmentsData = await apiRequest(`/api/commitments/user/${user.id}/month/${currentMonth}?${params}`);

      // Load income - handle 404 gracefully (no income set for this month)
      let incomeAmount = 0;
      try {
        const incomeData = await apiRequest(`/api/monthly-income/${user.id}/${currentMonth}`);
        incomeAmount = incomeData?.amount ? parseFloat(incomeData.amount) : 0;
      } catch (error: any) {
        // If income not found for this month, default to 0 (no error message)
        if (error.status === 404) {
          console.log(`[RefactoredDashboard] No income record for ${currentMonth}, defaulting to 0`);
          incomeAmount = 0;
        } else {
          // For other errors, re-throw
          throw error;
        }
      }

      console.log(`[RefactoredDashboard] Dashboard data loaded successfully for ${currentMonth}:`, {
        income: incomeAmount,
        commitmentsCount: commitmentsData?.length || 0,
      });

      setMonthlyIncome(incomeAmount);
      setCommitments(commitmentsData || []);

      // Load budget limit for this month – 404 means no limit set
      let budgetAmount: number | null = null;
      try {
        const budgetData = await apiRequest(`/api/budget/${user.id}/${currentMonth}`);
        budgetAmount = budgetData?.budgetLimit ? parseFloat(budgetData.budgetLimit) : null;
      } catch (error: any) {
        if (error.status !== 404) {
          throw error;
        }
      }
      setBudgetLimit(budgetAmount);
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
  }, [user?.id, currentMonth, includeShared, toast]);

  // Load data when user or month changes
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const handleQuickAdd = (event: Event) => {
      const action = (event as CustomEvent<'commitment' | 'expense' | 'income'>).detail;
      if (action === 'income') {
        setShowIncomeModal(true);
      } else {
        setShowCommitmentForm(true);
      }
    };

    window.addEventListener('finsync:quick-add', handleQuickAdd);
    return () => window.removeEventListener('finsync:quick-add', handleQuickAdd);
  }, []);

  // Budget management
  const handleUpdateBudget = async (limit: number | null) => {
    if (!user?.id) return;
    try {
      if (limit === null) {
        // Remove budget limit
        try {
          await apiRequest(`/api/budget/${user.id}/${currentMonth}`, { method: 'DELETE' });
        } catch (error: any) {
          // 404 means no budget was set – that's fine
          if (error.status !== 404) {
            throw error;
          }
        }
        // Reload dashboard data to ensure warnings are removed with fresh data
        await loadDashboardData();
        setShowBudgetModal(false);
        toast({ title: 'Budget limit removed', description: 'No budget limit set for this month.' });
      } else {
        await apiRequest('/api/budget', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id, month: currentMonth, budgetLimit: limit.toString() }),
        });
        // Reload dashboard data to ensure warnings are displayed with fresh data
        await loadDashboardData();
        setShowBudgetModal(false);
        toast({
          title: 'Budget limit updated!',
          description: `Monthly budget set to MYR ${limit.toLocaleString()}`,
        });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update budget', variant: 'destructive' });
    }
  };

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
    type: 'commitment' | 'expenses';
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

  const handleMarkPaid = (commitmentId: string, amount: number) => {
    // Check if income is 0, if so show warning
    if (monthlyIncome === 0) {
      const commitment = commitments.find(c => c.id === commitmentId);
      if (commitment) {
        setCommitmentForWarning({
          id: commitmentId,
          title: commitment.title,
          amount: commitment.amount,
        });
        setShowIncomeWarning(true);
      }
      return;
    }
    // If income is set, proceed directly
    proceedWithMarkPaid(commitmentId, amount);
  };

  const proceedWithMarkPaid = async (commitmentId: string, amount: number) => {
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
    // Find the commitment and show delete modal
    const commitment = commitments.find(c => c.id === commitmentId);
    if (commitment) {
      setCommitmentToDelete(commitment);
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async (deleteScope: 'single' | 'all') => {
    if (!commitmentToDelete) return;

    // Capture snapshot of the commitment before deletion for potential undo
    const deletedCommitment = { ...commitmentToDelete };
    const deletedScope = deleteScope;

    try {
      const params = new URLSearchParams();
      if (deleteScope === 'single' && commitmentToDelete.recurring) {
        params.append('scope', 'single');
        params.append('month', currentMonth);
      } else {
        params.append('scope', 'all');
      }

      await apiRequest(`/api/commitments/${commitmentToDelete.id}?${params}`, {
        method: 'DELETE',
      });

      // Close modal and show the undo toast BEFORE reloading data.
      // loadDashboardData sets loading:true which briefly unmounts the modal;
      // queuing the toast first ensures it is in the Sonner store before any
      // loading-state re-renders occur.
      setShowDeleteModal(false);
      setCommitmentToDelete(null);

      sonnerToast(deletedScope === 'single' ? 'Commitment removed for this month' : 'Commitment deleted permanently', {
        description: `"${deletedCommitment.title}" has been deleted.`,
        duration: 5000,
        action: {
          label: 'Undo',
          // Sonner onClick is (event: MouseEvent) => void — use .then() instead of async/await
          onClick: () => {
            apiRequest('/api/commitments', {
              method: 'POST',
              body: JSON.stringify({
                userId: user?.id,
                title: deletedCommitment.title,
                amount: deletedCommitment.amount,
                type: deletedCommitment.type,
                category: deletedCommitment.category,
                recurring: deletedCommitment.recurring,
                shared: deletedCommitment.shared,
                startDate: deletedCommitment.startDate,
              }),
            })
              .then(() => loadDashboardData())
              .then(() => {
                toast({
                  title: 'Commitment restored!',
                  description: `"${deletedCommitment.title}" has been restored.`,
                });
              })
              .catch((undoError: any) => {
                toast({
                  title: 'Undo failed',
                  description: undoError.message || 'Could not restore the commitment.',
                  variant: 'destructive',
                });
              });
          },
        },
      });

      await loadDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete commitment',
        variant: 'destructive',
      });
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCommitmentToDelete(null);
  };

  // COMMENTED OUT: Import functionality disabled
  // const handleImportCommitments = async (importedCommitments: any[]) => {
  //   if (!user?.id) return;
  //   try {
  //     await apiRequest('/api/commitments/import', {
  //       method: 'POST',
  //       body: JSON.stringify({
  //         userId: user.id,
  //         commitments: importedCommitments,
  //       }),
  //     });
  //     await loadDashboardData();
  //     toast({
  //       title: "Import Successful",
  //       description: `${importedCommitments.length} commitment(s) imported`,
  //     });
  //   } catch (error: any) {
  //     throw new Error(error.message || 'Failed to import commitments');
  //   }
  // };

  // Calculate metrics - exclude imported commitments from active totals
  const activeCommitments = commitments.filter(c => !c.isImported);
  const totalCommitments = activeCommitments.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const paidCommitments = activeCommitments
    .filter(c => c.isPaid)
    .reduce((sum, c) => sum + (parseFloat(c.amountPaid || c.amount) || 0), 0);
  const availableBalance = monthlyIncome - paidCommitments;
  const unpaidCount = activeCommitments.filter(c => !c.isPaid).length;

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
    <Layout title="FinSync - Dashboard">
      <div className="mx-auto max-w-6xl space-y-5 pb-20 sm:pb-6">
        {/* Welcome Section */}
        <div className="flex items-end justify-between gap-4 px-1 pt-1">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Your monthly overview</p>
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">Good to see you</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-primary sm:flex"
            onClick={() => setShowIncomeModal(true)}
          >
            Update income
          </Button>
        </div>

        {/* Month Navigation */}
        <Card className="border-blue-100 bg-white shadow-sm">
          <CardContent className="pb-3 pt-3">
            <MonthSelector currentMonth={currentMonth} onChange={handleMonthChange} userId={user?.id} />
          </CardContent>
        </Card>

        {/* Historical View Banner */}
        {isHistoricalMonth && (
          <div
            className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            data-testid="historical-banner"
            role="status"
          >
            <History className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Historical View</strong> — You are viewing a past month. Editing is disabled in the UI; use the
              current month to make changes.
            </span>
          </div>
        )}

        {/* Financial Snapshot */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Financial snapshot">
          <SummaryCard
            label="Income"
            value={monthlyIncome}
            icon={<Landmark />}
            tone="emerald"
            onClick={() => setShowIncomeModal(true)}
          />
          <SummaryCard label="Committed" value={totalCommitments} icon={<WalletCards />} tone="violet" />
          <SummaryCard label="Remaining" value={availableBalance} icon={<CircleDollarSign />} tone="blue" />
          <SummaryCard
            label="Unpaid"
            value={unpaidCount}
            icon={<AlertCircle />}
            tone={unpaidCount > 0 ? 'rose' : 'emerald'}
            count
            onClick={() =>
              document.getElementById('commitments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          />
        </section>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-primary">Monthly overview</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-primary"
              onClick={() => setShowBudgetModal(true)}
            >
              {budgetLimit === null ? 'Set budget' : 'Edit budget'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" aria-label="Monthly income allocation">
              <div
                className="bg-emerald-500"
                style={{
                  width: `${monthlyIncome > 0 ? Math.min(((monthlyIncome - paidCommitments) / monthlyIncome) * 100, 100) : 0}%`,
                }}
              />
              <div
                className="bg-violet-500"
                style={{ width: `${monthlyIncome > 0 ? Math.min((paidCommitments / monthlyIncome) * 100, 100) : 0}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="mb-1 block h-2 w-2 rounded-full bg-emerald-500" />
                Income <strong className="ml-1 text-slate-700">MYR {monthlyIncome.toLocaleString()}</strong>
              </div>
              <div>
                <span className="mb-1 block h-2 w-2 rounded-full bg-violet-500" />
                Paid <strong className="ml-1 text-slate-700">MYR {paidCommitments.toLocaleString()}</strong>
              </div>
              <div>
                <span className="mb-1 block h-2 w-2 rounded-full bg-slate-300" />
                Total <strong className="ml-1 text-slate-700">MYR {totalCommitments.toLocaleString()}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        {unpaidCount > 0 && (
          <button
            className="flex w-full items-center gap-3 rounded-lg border border-rose-100 bg-rose-50 p-4 text-left"
            onClick={() =>
              document.getElementById('commitments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-rose-800">Needs attention</span>
              <span className="block text-sm text-rose-700">
                {unpaidCount} unpaid commitment{unpaidCount === 1 ? '' : 's'} to review
              </span>
            </span>
            <ArrowRight className="h-5 w-5 text-rose-500" />
          </button>
        )}

        {/* Filters and Actions */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg">View Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Switch id="shared-filter" checked={includeShared} onCheckedChange={setIncludeShared} />
                  <Label htmlFor="shared-filter" className="flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4 text-blue-600" />
                    Show Shared Commitments
                  </Label>
                </div>
                {/* COMMENTED OUT: Import functionality disabled */}
                {/* <div className="flex items-center space-x-2">
                  <Switch id="imported-filter" checked={includeImported} onCheckedChange={setIncludeImported} />
                  <Label htmlFor="imported-filter" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Show Imported Records
                  </Label>
                </div> */}
              </div>
              {/* COMMENTED OUT: Import functionality disabled */}
              {/* <Button
                onClick={() => setShowImportWizard(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Commitments
              </Button> */}
            </div>
          </CardContent>
        </Card>

        {/* Commitments List */}
        <div id="commitments">
          <CommitmentsList
            commitments={commitments}
            currency="MYR"
            onMarkPaid={handleMarkPaid}
            onMarkUnpaid={handleMarkUnpaid}
            onAddNew={() => setShowCommitmentForm(true)}
            onDelete={handleDeleteCommitment}
            isHistorical={isHistoricalMonth}
          />
        </div>

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

        <BudgetModal
          isVisible={showBudgetModal}
          currentBudget={budgetLimit}
          currency="MYR"
          onSubmit={handleUpdateBudget}
          onCancel={() => setShowBudgetModal(false)}
        />

        {/* COMMENTED OUT: Import functionality disabled */}
        {/* <ImportWizardModal
          isOpen={showImportWizard}
          onClose={() => setShowImportWizard(false)}
          onImport={handleImportCommitments}
        /> */}

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          commitment={commitmentToDelete}
          currentMonth={currentMonth}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />

        <IncomeWarningModal
          isOpen={showIncomeWarning}
          commitment={commitmentForWarning}
          onContinue={async () => {
            if (commitmentForWarning) {
              await proceedWithMarkPaid(commitmentForWarning.id, commitmentForWarning.amount);
              setShowIncomeWarning(false);
              setCommitmentForWarning(null);
            }
          }}
          onCancel={() => {
            setShowIncomeWarning(false);
            setCommitmentForWarning(null);
          }}
        />
      </div>
    </Layout>
  );
};

const summaryTones = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
};

const SummaryCard = ({
  label,
  value,
  icon,
  tone,
  count = false,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: keyof typeof summaryTones;
  count?: boolean;
  onClick?: () => void;
}) => {
  const content = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm">{icon}</span>
      <span className="mt-4 block text-xs font-medium opacity-80">{label}</span>
      <span className="mt-1 block text-xl font-bold sm:text-2xl">
        {count ? value : `MYR ${value.toLocaleString()}`}
      </span>
    </>
  );

  const className = `min-h-32 rounded-lg p-4 text-left ring-1 ${summaryTones[tone]} ${onClick ? 'transition-colors hover:brightness-95' : ''}`;
  return onClick ? (
    <button className={className} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
};
