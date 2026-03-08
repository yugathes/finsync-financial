# Budget Warning Feature

This document describes the **Monthly Budget Limit** feature in FinSync, which lets users set an optional spending cap per month and receive visual warnings when approaching or exceeding it.

---

## Overview

Users can set a **monthly budget limit** scoped to their account and a specific calendar month (`YYYY-MM`). When the total value of commitments for that month reaches or exceeds configurable thresholds, the dashboard shows colour-coded indicators:

| State | Threshold | Indicator |
|-------|-----------|-----------|
| Normal | < 80 % of limit | Green progress bar |
| Warning | ≥ 80 % of limit | Amber banner + amber progress bar |
| Over budget | > 100 % of limit | Red alert banner + red progress bar |

No CRUD operations are blocked — the warnings are purely informational.

---

## Setting a Budget Limit

1. Open the **Dashboard**.
2. In the *Monthly Balance* card, click **Set Budget** (or **Edit Budget** if a limit already exists).
3. Enter the desired monthly budget limit in MYR.
4. Click **Save Budget**.

To remove an existing limit, click **Remove Limit** in the same modal.

---

## Dashboard Visual Feedback

### Budget Limit Progress Bar

A dedicated progress bar labelled **Budget Limit** appears in the *Monthly Balance* card whenever a limit is set. It shows the percentage of the limit consumed by total commitments.

### Warning Banner (≥ 80 %)

```
⚠ Approaching limit! You have used 85.0% of your MYR 3,000 budget.
```

Shown as an amber banner at the top of the balance card.

### Over-Budget Alert (> 100 %)

```
🔴 Over budget! Commitments (MYR 3,200) exceed your MYR 3,000 limit.
```

Shown as a red alert banner at the top of the balance card.

### No Limit Set

When no budget limit is configured for a month, no warning banners or budget-limit progress bar are shown. All other dashboard elements behave normally.

---

## Data Model

Budget limits are stored in the `monthly_budget` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK → users) | Owner of this budget limit |
| `month` | TEXT | Calendar month, e.g. `2025-07` |
| `budget_limit` | DECIMAL(10,2) | The spend cap in MYR |
| `created_at` | TIMESTAMP | Row creation time |
| `updated_at` | TIMESTAMP | Last modification time |

A unique index on `(user_id, month)` ensures one limit per user per month.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/budget/:userId/:month` | Retrieve budget limit (404 if not set) |
| `POST` | `/api/budget` | Create or update budget limit |
| `DELETE` | `/api/budget/:userId/:month` | Remove budget limit |

### POST body

```json
{
  "userId": "<uuid>",
  "month": "2025-07",
  "budgetLimit": "3000"
}
```

---

## Edge Cases

- **No budget set** — no warnings are shown; behaviour is identical to before the feature was introduced.
- **Budget = 0** — treated as "no limit" and removed automatically by the modal.
- **Historical months** — budget limits can be viewed (and were editable) for past months; the dashboard historical-view banner still appears normally.
- **Changing month** — the budget limit is re-fetched every time the selected month changes; limits are strictly per-user/per-month.
- **Commitments change** — the warning state updates instantly when a commitment is added, removed, or its paid status changes because `loadDashboardData` is called after every mutation.

---

## Test Cases

| Scenario | Expected Result |
|----------|-----------------|
| No budget limit set | No warning banners; no budget-limit bar shown |
| Budget set, commitments < 80 % | Green progress bar, no banners |
| Budget set, commitments = 80 % | Amber warning banner, amber progress bar |
| Budget set, commitments > 100 % | Red over-budget alert, red progress bar |
| Remove budget limit | Banners and bar disappear |
| Change month | Budget limit re-loaded for new month |
