# Month Selector & Historical View

## Overview

The month selector lets users navigate between calendar months directly from the dashboard. It provides both arrow-based step navigation and a direct dropdown picker, making it easy to jump to any past or future month. When a historical month is selected, the dashboard applies a clear visual distinction and restricts write operations to prevent accidental modifications.

---

## UI Controls

### MonthSelector Component

Located at `client/src/components/Dashboard/MonthSelector.tsx`.

| Element | Data-testid | Description |
|---------|-------------|-------------|
| Container | `month-selector` | Root wrapper |
| Previous arrow | `month-prev` | Steps back one month |
| Next arrow | `month-next` | Steps forward one month |
| Dropdown trigger | `month-dropdown-trigger` | Opens the month picker |
| Historical badge | `historical-badge` | Shown when viewing a past month |

The dropdown lists the last **24 months**, the current month (labelled "current"), and the next **3 months**. Both the `pastMonthsCount` and `futureMonthsCount` props are configurable.

### Historical View Banner

When a past month is selected, a banner appears below the month selector:

```tsx
<div data-testid="historical-banner" role="status">
  Historical View — You are viewing a past month. Editing is disabled in the UI; use the current month to make changes.
</div>
```

---

## State Management

`currentMonth` is a `YYYY-MM` string stored in `useState` inside `RefactoredDashboard`. All API requests for commitments and income use this value as a path parameter.

```typescript
// Reactive data loading — triggers whenever currentMonth changes
const loadDashboardData = useCallback(async () => { ... }, [user?.id, currentMonth, ...]);
useEffect(() => { loadDashboardData(); }, [loadDashboardData]);
```

---

## Backend Query Requirements

### Commitments

```
GET /api/commitments/user/:userId/month/:month?includeShared=<bool>
```

Returns all commitments visible for the given month, filtered by the month visibility rules in `CommitmentService.getCommitmentsForMonth`.

### Monthly Income

```
GET  /api/monthly-income/:userId/:month
POST /api/monthly-income        { userId, month, amount }
```

A `404` response for a historical month means no income was recorded; the dashboard defaults to `0`.

### CRUD Operations (Month-Scoped)

| Operation | Endpoint | Month Usage |
|-----------|----------|-------------|
| Mark Paid | `POST /api/commitments/:id/pay` | `month` in request body |
| Mark Unpaid | `DELETE /api/commitments/:id/pay/:month` | Month in URL |
| Delete (single month) | `DELETE /api/commitments/:id?scope=single&month=YYYY-MM` | Month in query string |
| Delete (all) | `DELETE /api/commitments/:id?scope=all` | No month filter |

---

## Historical View Behaviour

| Feature | Current Month | Historical Month |
|---------|--------------|-----------------|
| View commitments | ✅ | ✅ |
| View income | ✅ | ✅ |
| Mark Paid / Unpaid | ✅ | ⚠️ Disabled (buttons greyed out) |
| Delete commitment | ✅ | ⚠️ Disabled |
| Add new commitment | ✅ | ❌ Hidden |
| Visual style | Default | Amber tint on cards, banner shown |

Disabling write actions prevents accidental edits to closed periods. The API itself accepts writes to any month for recovery purposes; the UI restriction is a guard, not an absolute lock.

---

## UI State Cases

| Scenario | Behaviour |
|----------|-----------|
| No income for selected month | Balance card shows `MYR 0` income, spending progress shows `0%` |
| No commitments for selected month | Empty state message — "No commitments recorded" (historical) or CTA to add |
| Month not in dropdown list | User can still navigate via arrows; dropdown only lists ±24/+3 months |
| Invalid month string | `formatMonthLabel` returns an unparseable label; `onChange` is still called with the string |

---

## Test Coverage

End-to-end tests are in `tests/e2e/dashboard.spec.ts` under the **"Dashboard — month selector"** describe block. They cover:

- Arrow navigation (prev/next) updates the displayed month
- Dropdown selection jumps to a specific month
- Historical banner appears for past months
- Write action buttons are disabled in historical view

---

## Future Improvements

- Keyboard shortcuts (`←` / `→`) for month navigation
- Cache previously loaded months to reduce API round-trips
- "Jump to today" button to quickly return to the current month
- Server-side validation to reject writes outside an allowed date range for closed accounting periods
