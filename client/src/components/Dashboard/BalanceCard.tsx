import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface BalanceCardProps {
  income: number;
  commitments: number;
  currency?: string;
  onUpdateIncome: () => void;
}

export const BalanceCard = ({ income, commitments, currency = "MYR", onUpdateIncome }: BalanceCardProps) => {
  const balance = income - commitments;
  const isPositive = balance >= 0;

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-white" />
          Monthly Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Balance */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${isPositive ? 'text-green-200' : 'text-red-200'}`}>
            {currency} {balance.toLocaleString()}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-200" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-200" />
            )}
            <span className="text-sm text-blue-100">
              {isPositive ? 'Available' : 'Over Budget'}
            </span>
          </div>
        </div>

        {/* Income & Commitments Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-400">
          <div className="text-center">
            <div className="text-sm text-blue-100">Income</div>
            <div className="text-xl font-semibold text-green-200">
              {currency} {income.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-blue-100">Commitments</div>
            <div className="text-xl font-semibold text-red-200">
              {currency} {commitments.toLocaleString()}
            </div>
          </div>
        </div>

        <Button variant="secondary" className="w-full mt-4 bg-white text-blue-600 hover:bg-blue-50" onClick={onUpdateIncome}>
          Update Income
        </Button>
      </CardContent>
    </Card>
  );
};