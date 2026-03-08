# Dashboard Unpaid Commitment Indicator

## Overview

The FinSync dashboard includes a real-time **unpaid commitment counter** and **overdue commitment highlighting** to help users quickly understand their outstanding financial obligations.

---

## Unpaid Commitments Counter (Quick Stats)

Located in the **Quick Stats** row on the dashboard, the **Unpaid Commitments** card displays:

- The **total count** of active (non-imported) unpaid commitments for the currently viewed month.
- A **red icon and red text** when there are unpaid items, or green when all commitments are settled.
- An accessible `aria-label` on the count element (e.g., `"3 unpaid commitments"`) for screen readers.

### Behaviour

| State | Display |
|---|---|
| All commitments paid | Count = 0, green text and icon |
| One or more unpaid | Count > 0, red/destructive text and icon |

### Real-time Updates

The counter updates immediately after:
- **Adding** a new commitment (unpaid by default → count increases)
- **Marking a commitment as paid** (count decreases)
- **Marking a commitment as unpaid** (count increases)
- **Deleting** a commitment (count decreases if it was unpaid)

The dashboard re-fetches all commitment data from the server after each of these actions, so the counter always reflects the current database state.

---

## Overdue Commitment Highlighting

A commitment is considered **overdue** when:
- It is **unpaid** (`isPaid === false`), AND
- It belongs to a **past month** (the viewed month is earlier than the current calendar month).

This is surfaced in the **CommitmentsList** component:

### Visual Indicators

| Element | Overdue Appearance |
|---|---|
| Commitment card | `bg-red-50` background, `border-red-300` border |
| Title text | `text-red-700` (red) |
| Amount text | `text-red-700` (red) |
| Inline badge | Red "Overdue" badge with `AlertCircle` icon |
| Section heading | Red "Overdue (N)" heading with `AlertCircle` icon |
| List header badge | Red "N unpaid" badge with `AlertCircle` icon |

For current-month (non-historical) views, unpaid items are displayed with the standard pending style and an amber "N unpaid" badge — no overdue highlight.

### Accessibility

- The **Overdue** badge includes `aria-label="Overdue unpaid commitment"` so screen readers announce it clearly.
- The `AlertCircle` icons are marked `aria-hidden="true"` to prevent redundant icon announcements.
- The unpaid counter in the list header has an `aria-label` with the full count and noun (`"3 unpaid commitments"`).
- Red/amber colour choices meet WCAG AA contrast requirements against their respective backgrounds.

---

## Data Attributes (for testing)

| Selector | Element |
|---|---|
| `[data-testid="unpaid-count"]` | Unpaid count number in Quick Stats card |
| `[data-testid="unpaid-commitments-badge"]` | Unpaid badge in CommitmentsList header |
| `[data-testid="overdue-commitment-item"]` | Individual overdue commitment cards |
| `[data-testid="commitment-item"]` | Individual non-overdue commitment cards |
| `[data-testid="section-pending"]` | The pending/overdue section wrapper |

---

## Test Scenarios

1. **Counter increments on add**: Create a new commitment → `unpaid-count` increases by 1.
2. **Counter decrements on mark paid**: Mark a commitment as paid → `unpaid-count` decreases by 1.
3. **Counter decrements on delete**: Delete an unpaid commitment → `unpaid-count` decreases by 1.
4. **Counter returns to zero**: Pay all commitments → `unpaid-count` shows 0 in green.
5. **Overdue highlight on historical month**: Navigate to a past month with unpaid commitments → items show red border, "Overdue" badge.
6. **No overdue highlight on current month**: Unpaid items in the current month do not show the red overdue style.
