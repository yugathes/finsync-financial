# UI Delete Confirmation — UX Flow Documentation

## Overview

All destructive delete actions in FinSync are guarded by a two-step safety pattern:

1. **Confirmation Modal** — the user must explicitly confirm before any deletion is executed.
2. **Loading State** — a spinner/disabled state is shown while the async deletion is in progress.
3. **Undo Toast** — after a successful deletion, a temporary sonner toast with an **Undo** action appears for 5 seconds, giving users a brief window to restore the deleted item.

No backend schema or API contracts were altered; all changes are purely in the UI layer.

---

## 1. Commitment Deletion (Dashboard)

### Trigger

Clicking the **trash icon** (🗑) button on any commitment row in the Commitments list.

### Flow

```
User clicks trash icon
        │
        ▼
DeleteConfirmationModal opens
  ├── Shows commitment title, category and amount
  ├── Red "This action cannot be undone" warning
  └── For recurring commitments:
        ├── Option A: Delete for this month only (scope = 'single')
        └── Option B: Delete permanently — all months (scope = 'all')
        │
        ▼
User clicks "Delete for This Month" or "Delete Permanently"
        │
        ▼
Loading state: button text changes to "Deleting…" and is disabled
        │
        ▼
DELETE /api/commitments/:id?scope=<single|all>[&month=<YYYY-MM>]
        │
        ▼
Modal closes, dashboard data refreshed
        │
        ▼
Sonner toast appears (5-second timeout):
  "Commitment removed for this month" / "Commitment deleted permanently"
  Description: "<title> has been deleted."
  Action button: [Undo]
        │
        ├── User clicks Undo within 5 s
        │       │
        │       ▼
        │   POST /api/commitments  (re-creates with original data)
        │   Dashboard refreshed
        │   Success toast: "Commitment restored!"
        │
        └── Toast dismissed / expires → deletion is final
```

### Components Involved

| Component | File | Role |
|---|---|---|
| `DeleteConfirmationModal` | `client/src/components/Commitments/DeleteConfirmationModal.tsx` | Renders modal with scope selector and loading state |
| `RefactoredDashboard` | `client/src/components/Dashboard/RefactoredDashboard.tsx` | Orchestrates modal open/close, API calls, and undo toast |

---

## 2. Group Member Removal (Groups Page)

### Trigger

Group owner clicks the **trash icon** (🗑) next to a non-owner member in the Group Detail view.

### Flow

```
Owner clicks trash icon on a member row
        │
        ▼
AlertDialog opens
  └── "Remove Member" confirmation
      Shows member email
      Warning: they will lose access to shared commitments
        │
        ▼
Owner clicks "Remove Member" (red button)
        │
        ▼
DELETE /api/groups/:groupId/members/:memberId
        │
        ▼
Dialog closes, group detail refreshed
Toast: "Member removed successfully"
```

### Components Involved

| Component | File | Role |
|---|---|---|
| `GroupDetail` | `client/src/components/Groups/GroupDetail.tsx` | Renders member list, manages `memberToRemove` state, AlertDialog |

---

## 3. Accessibility & Mobile Behaviour

- Both confirmation dialogs trap focus and are keyboard-navigable (Tab / Enter / Escape).
- Modals use `z-50` layering and fixed positioning for correct desktop and mobile rendering.
- The Sonner undo toast renders via the global `<Sonner />` in `App.tsx` and is positioned bottom-right on desktop, top on mobile.
- Loading buttons are `disabled` during async operations to prevent double-submission.

---

## 4. Backend Impact

**None.** All changes are confined to React components in `client/src/`. The existing API endpoints and database schema are unchanged.

---

## 5. Related Files

- `client/src/components/Commitments/DeleteConfirmationModal.tsx`
- `client/src/components/Dashboard/RefactoredDashboard.tsx`
- `client/src/components/Groups/GroupDetail.tsx`
- `client/src/components/ui/alert-dialog.tsx`
- `client/src/App.tsx` (hosts `<Sonner />` toast provider)
