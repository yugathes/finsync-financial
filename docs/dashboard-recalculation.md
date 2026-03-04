# Dashboard Recalculation Workflow

## Overview

The FinSync dashboard displays real-time financial totals derived from the user's commitments and monthly income. This document describes how dashboard totals are calculated, when recalculation is triggered, and how imported records are handled.

## Architecture

```
User Action (create/edit/delete/mark paid/unpaid)
        │
        ▼
API Request (Express route)
        │
        ▼
CommitmentService / PaymentService (Prisma DB mutation)
        │
        ▼
Client calls loadDashboardData()
        │
        ▼
GET /api/commitments/user/:userId/month/:month
        │
        ▼
Dashboard state updated → totals recalculated
```

## Total Calculation Logic

All totals are derived **client-side** from the fetched commitments list. Imported commitments are excluded from all active financial totals:

```ts
// Exclude imported records from active totals
const activeCommitments = commitments.filter(c => !c.isImported);

const totalCommitments = activeCommitments.reduce((sum, c) => sum + parseFloat(c.amount), 0);

const paidCommitments = activeCommitments
  .filter(c => c.isPaid)
  .reduce((sum, c) => sum + parseFloat(c.amountPaid || c.amount), 0);

const availableBalance = monthlyIncome - paidCommitments;
```

### Balance Card

The `BalanceCard` component receives `totalCommitments` (active only) and `monthlyIncome`, displaying:

- **Monthly Balance** = `income − totalCommitments`
- **Paid This Month** = sum of `amountPaid` for all paid active commitments
- **Total Commitments** = count of active (non-imported) commitments

## Recalculation Triggers

Dashboard totals are recalculated after every commitment mutation:

| Operation          | Trigger                                                              | Notes                                           |
| ------------------ | -------------------------------------------------------------------- | ----------------------------------------------- |
| Create commitment  | `loadDashboardData()` after POST `/api/commitments`                  | New commitment appears immediately              |
| Edit commitment    | `loadDashboardData()` after PUT `/api/commitments/:id`               | Amount/category change reflected at once        |
| Delete commitment  | `loadDashboardData()` after DELETE `/api/commitments/:id`            | Permanent delete or month-only delete           |
| Mark as paid       | `loadDashboardData()` after POST `/api/commitments/:id/pay`          | Moves commitment to "paid" bucket               |
| Mark as unpaid     | `loadDashboardData()` after DELETE `/api/commitments/:id/pay/:month` | Restores commitment to "pending" bucket         |
| Import commitments | `loadDashboardData()` after POST `/api/commitments/import`           | Imported items visible but excluded from totals |

## Imported Records

Commitments sourced from external CSV/JSON imports are stored with `isImported: true` in the database. They:

- **Are visible** in the dashboard list when the "Show Imported Records" toggle is enabled.
- **Are NOT counted** in `totalCommitments`, `paidCommitments`, `availableBalance`, or the "Total Commitments" count.
- **Are displayed** in a separate "Imported Records" section with a purple **Imported** badge.
- Can be deleted like any other commitment.

This ensures that historical import data does not distort the user's live financial picture.

## Shared Commitments

Shared commitments (linked to a group) are shown when the "Show Shared Commitments" toggle is enabled. They participate in total calculations like personal commitments (unless they are also imported).

For real-time propagation to other group members, each user's dashboard independently fetches the latest state from the server. Since all mutations are persisted to the database immediately, any group member who loads or refreshes their dashboard will see the current state.

## Server-Side Dashboard Summary

The `/api/dashboard/:userId/:month` endpoint provides a pre-calculated summary. It calls `getCommitmentsForMonth` with default filters (personal only, no imported, no shared), so its totals will always exclude imported commitments.

## Edge Cases

- **Month navigation**: Changing the month re-fetches commitments and income for the new month. Payment status is per-month (`CommitmentPayment` records are scoped by `month`).
- **Recurring commitments**: Appear from their start month onward (future months only). They do NOT appear in months before creation. Payment status is tracked per month independently.
- **Non-recurring commitments**: Only appear in their exact start month (based on `startDate` or `createdAt`). They do not appear in past or future months.
- **Past months**: Commitments never appear in months before their `startDate` or `createdAt`, regardless of recurring status.
- **No income set**: Income defaults to `0` when no `MonthlyIncome` record exists for the selected month.
- **Negative balance**: When `totalCommitments > income`, the balance card shows a "Over Budget" indicator.
