import { useState } from "react";
import { BalanceCard } from "./BalanceCard";
import { CommitmentsList } from "./CommitmentsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, TrendingUp, Calendar } from "lucide-react";

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
  const monthlyIncome = 5000; // Mock data

  const handleMarkPaid = (id: string) => {
    setCommitments(prev => 
      prev.map(commitment => 
        commitment.id === id 
          ? { ...commitment, isPaid: true }
          : commitment
      )
    );
  };

  const handleAddNew = () => {
    // This will open the commitment form modal/page
    console.log("Add new commitment");
  };

  const totalCommitments = commitments.reduce((sum, c) => sum + c.amount, 0);
  const paidCommitments = commitments.filter(c => c.isPaid).reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Welcome to FinSync</h2>
        <p className="text-muted-foreground text-lg">
          Track your commitments and stay financially organized
        </p>
      </div>

      {/* Balance Overview */}
      <BalanceCard 
        income={monthlyIncome}
        commitments={totalCommitments}
        currency="MYR"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid This Month</p>
                <p className="text-2xl font-bold text-income">
                  MYR {paidCommitments.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-income/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-income" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Commitments</p>
                <p className="text-2xl font-bold">
                  {commitments.length}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quick Actions</p>
                <Button variant="primary" size="sm" className="mt-2">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Commitment
                </Button>
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
    </div>
  );
};