import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, AlertCircle, Target } from "lucide-react";

interface BalanceCardProps {
  income: number;
  commitments: number;
  paidAmount?: number;
  currency?: string;
  onUpdateIncome: () => void;
  budgetLimit?: number | null;
  onUpdateBudget?: () => void;
}

export const BalanceCard = ({ income, commitments, paidAmount = 0, currency = "MYR", onUpdateIncome, budgetLimit = null, onUpdateBudget }: BalanceCardProps) => {
  const balance = income - commitments;
  const isPositive = balance >= 0;

  // Spending progress: paid amount as % of total income (capped at 100 for display)
  const spendingPercent = income > 0 ? Math.min((paidAmount / income) * 100, 100) : 0;
  const spendingPercentRaw = income > 0 ? (paidAmount / income) * 100 : 0;

  // Budget utilisation: total commitments as % of income (may exceed 100 if over-budget)
  const budgetUtilisationPercent = income > 0 ? Math.min((commitments / income) * 100, 100) : 0;
  const budgetUtilisationRaw = income > 0 ? (commitments / income) * 100 : 0;

  // Budget limit progress: total commitments vs budget limit
  const budgetLimitPercent = budgetLimit && budgetLimit > 0 ? Math.min((commitments / budgetLimit) * 100, 100) : 0;
  const budgetLimitRaw = budgetLimit && budgetLimit > 0 ? (commitments / budgetLimit) * 100 : 0;
  const isOverBudget = budgetLimit !== null && budgetLimit > 0 && commitments > budgetLimit;
  const isNearBudget = budgetLimit !== null && budgetLimit > 0 && !isOverBudget && budgetLimitRaw >= 80;

  // Color thresholds for spending progress
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-400";
    if (percent >= 70) return "bg-yellow-400";
    return "bg-green-400";
  };

  const getPercentLabel = (percent: number) => {
    if (percent >= 100) return "Over budget!";
    if (percent >= 90) return "Almost maxed out";
    if (percent >= 70) return "Approaching limit";
    return "Within budget";
  };

  const getBudgetProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 80) return "bg-amber-400";
    return "bg-green-400";
  };

  return (
    <Card className="bg-gradient-primary text-primary-foreground shadow-elevation border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Monthly Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Limit Warnings */}
        {isOverBudget && (
          <div
            data-testid="budget-over-alert"
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-red-500/20 border border-red-400/40 px-3 py-2 text-sm text-red-200"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Over budget!</strong> Commitments ({currency} {commitments.toLocaleString()}) exceed your{' '}
              {currency} {budgetLimit?.toLocaleString()} limit.
            </span>
          </div>
        )}
        {isNearBudget && (
          <div
            data-testid="budget-warning"
            role="status"
            className="flex items-center gap-2 rounded-lg bg-amber-500/20 border border-amber-400/40 px-3 py-2 text-sm text-amber-200"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Approaching limit!</strong> You have used {budgetLimitRaw.toFixed(1)}% of your{' '}
              {currency} {budgetLimit?.toLocaleString()} budget.
            </span>
          </div>
        )}

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

        {/* Spending Progress Bar */}
        <div
          className="space-y-1 pt-2"
          aria-label={`Spending progress: ${spendingPercentRaw.toFixed(1)}% of income spent`}
          title={`Spending progress: ${spendingPercentRaw.toFixed(1)}% of income paid out`}
        >
          <div className="flex items-center justify-between text-xs text-primary-foreground/80">
            <span>Spending Progress</span>
            <span
              data-testid="spending-percent"
              className={`font-semibold ${spendingPercentRaw >= 90 ? 'text-red-300' : spendingPercentRaw >= 70 ? 'text-yellow-300' : 'text-green-300'}`}
            >
              {spendingPercentRaw.toFixed(1)}%
              {income === 0 && <span className="ml-1 font-normal">(no income set)</span>}
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <div
              data-testid="spending-progress-bar"
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(spendingPercentRaw)}`}
              style={{ width: `${spendingPercent}%` }}
              role="progressbar"
              aria-valuenow={Math.round(spendingPercentRaw)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-primary-foreground/60">
            <span>{currency} {paidAmount.toLocaleString()} paid</span>
            <span
              className={`text-xs font-medium ${spendingPercentRaw >= 90 ? 'text-red-300' : spendingPercentRaw >= 70 ? 'text-yellow-300' : 'text-green-300'}`}
            >
              {getPercentLabel(spendingPercentRaw)}
            </span>
          </div>
        </div>

        {/* Budget Limit Progress Bar */}
        {budgetLimit !== null && budgetLimit > 0 && (
          <div
            className="space-y-1"
            data-testid="budget-limit-section"
            aria-label={`Budget limit: ${budgetLimitRaw.toFixed(1)}% of ${currency} ${budgetLimit.toLocaleString()} used`}
          >
            <div className="flex items-center justify-between text-xs text-primary-foreground/80">
              <span>Budget Limit</span>
              <span
                data-testid="budget-limit-percent"
                className={`font-semibold ${isOverBudget ? 'text-red-300' : isNearBudget ? 'text-amber-300' : 'text-green-300'}`}
              >
                {budgetLimitRaw.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-primary-foreground/20">
              <div
                data-testid="budget-limit-bar"
                className={`h-full rounded-full transition-all duration-500 ${getBudgetProgressColor(budgetLimitRaw)}`}
                style={{ width: `${budgetLimitPercent}%` }}
                role="progressbar"
                aria-valuenow={Math.round(budgetLimitRaw)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-primary-foreground/60">
              <span>{currency} {commitments.toLocaleString()} of limit</span>
              <span>{currency} {budgetLimit.toLocaleString()} limit</span>
            </div>
          </div>
        )}

        {/* Budget Utilisation Bar */}
        {commitments > 0 && (
          <div
            className="space-y-1"
            aria-label={`Budget utilisation: ${budgetUtilisationRaw.toFixed(1)}% of income committed`}
            title={`Budget utilisation: ${budgetUtilisationRaw.toFixed(1)}% of income committed`}
          >
            <div className="flex items-center justify-between text-xs text-primary-foreground/80">
              <span>Budget Utilisation</span>
              <span
                data-testid="budget-utilisation-percent"
                className={`font-semibold ${budgetUtilisationRaw >= 90 ? 'text-red-300' : budgetUtilisationRaw >= 70 ? 'text-yellow-300' : 'text-green-300'}`}
              >
                {budgetUtilisationRaw.toFixed(1)}%
              </span>
            </div>
            <Progress
              data-testid="budget-utilisation-bar"
              value={budgetUtilisationPercent}
              className="h-2 bg-primary-foreground/20"
            />
            <div className="text-xs text-primary-foreground/60 text-right">
              {currency} {commitments.toLocaleString()} of {currency} {income.toLocaleString()}
            </div>
          </div>
        )}

        {/* Income & Commitments Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary-foreground/20">
          <div className="text-center">
            <div className="text-sm text-primary-foreground/70">Income</div>
            <div className="text-xl font-semibold text-accent-foreground">
              {currency} {income.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-primary-foreground/70">Commitments</div>
            <div className="text-xl font-semibold text-destructive-foreground">
              {currency} {commitments.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 bg-background text-foreground hover:bg-background/90 transition-smooth"
            onClick={onUpdateIncome}
          >
            Update Income
          </Button>
          {onUpdateBudget && (
            <Button
              variant="secondary"
              className="flex-1 bg-background/80 text-foreground hover:bg-background/90 transition-smooth flex items-center gap-1"
              onClick={onUpdateBudget}
              data-testid="set-budget-btn"
            >
              <Target className="h-4 w-4" />
              {budgetLimit !== null ? 'Edit Budget' : 'Set Budget'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};