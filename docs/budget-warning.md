# Budget Warning Feature

## Overview

The budget-warning feature adds real-time visual feedback to the FinSync dashboard when a user's spending approaches or exceeds predefined thresholds of their monthly income.

Warnings are displayed directly inside the `BalanceCard` component using colour-coded progress bars and text labels. No persistent storage or scheduled jobs are required.

---

## Does This Require a Prisma Migration?

**No.** The budget-warning feature is implemented entirely on the **client side** and derives all of its data from tables that already exist in the schema:

| Data Needed               | Source Table          | Existing Column(s)             |
| ------------------------- | --------------------- | ------------------------------ |
| Monthly income            | `monthly_income`      | `amount`                       |
| Paid-out amount           | `commitment_payments` | `amount_paid`                  |
| Total committed amount    | `commitments`         | `amount`                       |

All percentage calculations are performed in `BalanceCard.tsx` at render time — nothing is written back to the database.

---

## How It Works

### Warning Thresholds

Two fixed thresholds drive the colour coding:

| Threshold | Meaning                          | Colour | Label                 |
| --------- | -------------------------------- | ------ | --------------------- |
| < 70 %    | Within budget                    | Green  | "Within budget"       |
| 70 – 89 % | Approaching the income limit     | Yellow | "Approaching limit"   |
| 90 – 99 % | Almost entirely spent            | Red    | "Almost maxed out"    |
| ≥ 100 %   | Spending equals or exceeds income | Red    | "Over budget!"        |

### Indicators Rendered

#### 1. Spending Progress Bar

Tracks the **paid-out amount** as a percentage of monthly income.

| Property  | Value                                              |
| --------- | -------------------------------------------------- |
| Formula   | `paidAmount / income × 100`                        |
| Cap       | Capped at 100 % for the visual bar width           |
| Zero case | Shows `0.0% (no income set)` when income is 0     |
| Test ID   | `data-testid="spending-progress-bar"`              |
| Test ID   | `data-testid="spending-percent"`                   |

#### 2. Budget Utilisation Bar

Tracks **total committed spending** (paid + unpaid) as a percentage of income. Only rendered when `commitments > 0`.

| Property  | Value                                              |
| --------- | -------------------------------------------------- |
| Formula   | `commitments / income × 100`                       |
| Component | Radix UI `<Progress>`                              |
| Test ID   | `data-testid="budget-utilisation-bar"`             |
| Test ID   | `data-testid="budget-utilisation-percent"`         |

---

## Data Flow

```
Monthly income  ──────────────────────────────────────────────────┐
                                                                   ▼
CommitmentPayment (amount_paid) ──► paidCommitments ──► spendingPercent ──► colour / label
                                                                   ▲
Commitment (amount) ──────────────► totalCommitments ──► budgetUtilisationPercent
```

All values are passed into `BalanceCard` as **props** from `RefactoredDashboard.tsx`:

```tsx
<BalanceCard
  income={monthlyIncome}          // from MonthlyIncome table
  commitments={totalCommitments}  // sum of active Commitment.amount
  paidAmount={paidCommitments}    // sum of CommitmentPayment.amount_paid
  currency="MYR"
  onUpdateIncome={() => setShowIncomeModal(true)}
/>
```

---

## Files Changed

| File | Change |
| ---- | ------ |
| `client/src/components/Dashboard/BalanceCard.tsx` | Added spending progress bar, budget utilisation bar, colour-threshold helpers, and `paidAmount` prop |
| `client/src/pages/RefactoredDashboard.tsx` | Passed `paidAmount={paidCommitments}` to `BalanceCard` |

> **No server files, no Prisma schema, and no migrations were modified.**

---

## Edge Cases

| Scenario              | Behaviour                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Income = 0            | Spending % shows `0.0% (no income set)`; both bars render at 0 %                            |
| No commitments        | Budget utilisation bar is hidden; spending bar shows 0 %                                    |
| Over-budget spending  | Bar capped at 100 % visually; raw % label may exceed 100                                    |
| All commitments paid  | Spending % reflects full payment                                                            |
| Imported records      | Excluded from `paidAmount` and `totalCommitments`; shown separately in "Imported Records"   |

---

## E2E Tests

New test cases added to `tests/e2e/dashboard.spec.ts` under the suite **"Dashboard — spending progress bar & % indicator"**:

- Progress bar and % indicator are present on the dashboard
- Percent indicator shows `0.0%` when no income / no payments
- Percent indicator increases after marking a commitment as paid
- Budget utilisation bar is visible when commitments exist
