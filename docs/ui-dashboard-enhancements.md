# UI Dashboard Enhancements

## Overview

This document describes the spending progress bar and percentage indicator added to the FinSync dashboard, as well as the visual separation between commitment types in the commitments list.

---

## Spending Progress Bar & % Indicator

### Location

`client/src/components/Dashboard/BalanceCard.tsx`

### What Was Added

Two progress indicators were added to the `BalanceCard` component:

#### 1. Spending Progress Bar

Tracks **how much of the monthly income has been paid out** across all active (non-imported) commitments.

| Property             | Details                                                                              |
| -------------------- | ------------------------------------------------------------------------------------ |
| Formula              | `paidAmount / income × 100`                                                          |
| Capped at            | 100 % for the visual bar (raw value shown in label)                                  |
| Data source          | `paidCommitments` computed in `RefactoredDashboard.tsx`, passed as `paidAmount` prop |
| Zero-income handling | Shows `0.0% (no income set)` when income is 0                                        |

**Color thresholds:**

| Range     | Color  | Meaning                        |
| --------- | ------ | ------------------------------ |
| 0 – 69 %  | Green  | Within budget                  |
| 70 – 89 % | Yellow | Approaching limit              |
| ≥ 90 %    | Red    | Almost maxed out / Over budget |

**Test IDs:**

- `data-testid="spending-progress-bar"` – the coloured fill bar element
- `data-testid="spending-percent"` – the numeric percentage label

#### 2. Budget Utilisation Bar

Tracks **total committed spending as a percentage of income** (rendered only when `commitments > 0`).

| Property  | Details                                                 |
| --------- | ------------------------------------------------------- |
| Formula   | `commitments / income × 100`                            |
| Component | Radix UI `<Progress>` (from `@radix-ui/react-progress`) |
| Test ID   | `data-testid="budget-utilisation-bar"`                  |
| Test ID   | `data-testid="budget-utilisation-percent"`              |

### Props Change

`BalanceCard` now accepts an optional `paidAmount` prop:

```tsx
interface BalanceCardProps {
  income: number;
  commitments: number;
  paidAmount?: number; // ← new (defaults to 0)
  currency?: string;
  onUpdateIncome: () => void;
}
```

The prop is wired in `RefactoredDashboard.tsx`:

```tsx
<BalanceCard
  income={monthlyIncome}
  commitments={totalCommitments}
  paidAmount={paidCommitments} // ← new
  currency="MYR"
  onUpdateIncome={() => setShowIncomeModal(true)}
/>
```

### Data Wiring

`paidCommitments` was already computed in `RefactoredDashboard.tsx`:

```ts
const paidCommitments = activeCommitments
  .filter(c => c.isPaid)
  .reduce((sum, c) => sum + (parseFloat(c.amountPaid || c.amount) || 0), 0);
```

No new API calls or schema changes were required.

---

## Commitment Type Visual Separation

### Location

`client/src/components/Dashboard/CommitmentsList.tsx`

### What Was Added

Commitments in the **Pending** and **Completed** sections are now grouped by type using a `TypeGroup` sub-component:

| Group          | Criteria                           | Icon colour |
| -------------- | ---------------------------------- | ----------- |
| **Commitment** | `!shared && type === 'commitment'` | Blue        |
| **Expenses**   | `!shared && type === 'expenses'`   | Orange      |
| **Shared**     | `shared === true`                  | Purple      |

Each group renders a labelled header with an icon and a left-border accent line to visually distinguish it from other groups.

### Test IDs

- `data-testid="section-pending"` – wrapper for all unpaid commitment groups
- `data-testid="section-completed"` – wrapper for all paid commitment groups
- `data-testid="commitment-group-commitment"` – Commitment type sub-group
- `data-testid="commitment-group-expenses"` – Expenses type sub-group
- `data-testid="commitment-group-shared"` – Shared type sub-group

Groups that contain no items are not rendered, so the layout remains clean when only some types are present.

---

## Edge Cases

| Scenario             | Behaviour                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Zero income          | Spending % shows `0.0% (no income set)`                                                                        |
| No commitments       | Budget utilisation bar is hidden; commitments list shows empty-state CTA                                       |
| All commitments paid | Spending % reflects full payment; progress bar at or near 100 %                                                |
| Over-budget spending | Progress bar capped at 100 % visually; raw % label may exceed 100                                              |
| Imported records     | Excluded from `paidAmount` and `totalCommitments` calculations; shown in a separate "Imported Records" section |

---

## E2E Tests

New test suites added to `tests/e2e/dashboard.spec.ts`:

- **Dashboard — spending progress bar & % indicator**
  - Progress bar and % indicator are present on the dashboard
  - Percent indicator shows `0.0%` when no income / no payments
  - Percent indicator increases after marking a commitment as paid
  - Budget utilisation bar is visible when commitments exist

- **Dashboard — commitment type visual separation**
  - Commitment appears under the Commitment group heading
  - Expenses appears under the Expenses group heading
  - Shared commitment appears under the Shared group heading
  - `section-pending` and `section-completed` containers are present with commitments
