import { useState } from "react";
import { BalanceCard } from "./BalanceCard";
import { CommitmentsList } from "./CommitmentsList";
import { CommitmentForm } from "../Commitments/CommitmentForm";
import { IncomeModal } from "./IncomeModal";
import { FloatingActionButton } from "../UI/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - will be replaced with real data from Supabase
const mockCommitments = [
  {
    id: "1",
    title: "Rent",
    amount: 1200,
    type: 'static' as const,
    category: "Housing",
    isPaid: true,
    isShared: false
  },
  {
    id: "2", 
    title: "Groceries",
    amount: 400,
    type: 'dynamic' as const,
    category: "Food",
    isPaid: false,
    isShared: true,
    sharedWith: ["user2", "user3"]
  },
  {
    id: "3",
    title: "Phone Bill",
    amount: 80,
    type: 'static' as const,
    category: "Utilities",
    isPaid: false,
    isShared: false
  }
];

export const Dashboard = () => {
  const [commitments, setCommitments] = useState(mockCommitments);
  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const { toast } = useToast();

  const handleMarkPaid = (id: string) => {
    setCommitments(prev => 
      prev.map(commitment => 
        commitment.id === id 
          ? { ...commitment, isPaid: true }
          : commitment
      )
    );
    
    const commitment = commitments.find(c => c.id === id);
    if (commitment) {
      toast({
        title: "Payment recorded!",
        description: `${commitment.title} marked as paid`,
      });
    }
  };

  const handleAddCommitment = (newCommitment: {
    title: string;
    amount: number;
    type: 'static' | 'dynamic';
    category: string;
  }) => {
    const commitment = {
      id: Date.now().toString(),
      ...newCommitment,
      isPaid: false,
      isShared: false,
      ...(newCommitment.type === 'dynamic' ? { sharedWith: [] } : {})
    };
    
    setCommitments(prev => [...prev, commitment as any]);
    setShowCommitmentForm(false);
    
    toast({
      title: "Commitment added!",
      description: `${commitment.title} has been added to your list`,
    });
  };

  const handleUpdateIncome = (income: number) => {
    setMonthlyIncome(income);
    setShowIncomeModal(false);
    
    toast({
      title: "Income updated!",
      description: `Monthly income set to MYR ${income.toLocaleString()}`,
    });
  };

  const handleAddNew = () => {
    setShowCommitmentForm(true);
  };

  const totalCommitments = commitments.reduce((sum, c) => sum + c.amount, 0);
  const paidCommitments = commitments.filter(c => c.isPaid).reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 space-y-6 pb-20 sm:pb-6">
      {/* Welcome Section */}
      <div className="text-center space-y-2 animate-fade-in">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-800">Welcome to FinSync</h2>
        <p className="text-blue-600 text-base sm:text-lg">
          Track your commitments and stay financially organized
        </p>
      </div>

      {/* Balance Overview */}
      <div className="animate-fade-in">
        <BalanceCard 
          income={monthlyIncome}
          commitments={totalCommitments}
          currency="MYR"
          onUpdateIncome={() => setShowIncomeModal(true)}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid This Month</p>
                <p className="text-xl sm:text-2xl font-bold text-income">
                  MYR {paidCommitments.toLocaleString()}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-income/10 rounded-full">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-income" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Commitments</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {commitments.length}
                </p>
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
                <Button variant="primary" size="sm" className="mt-2 hidden sm:flex">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Commitment
                </Button>
                <div className="mt-2 text-xs text-muted-foreground sm:hidden">
                  Use the + button to add
                </div>
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
        onAddNew={handleAddNew}
      />

      {/* Floating Action Button (Mobile Only) */}
      <FloatingActionButton onClick={handleAddNew} />

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
  );
};