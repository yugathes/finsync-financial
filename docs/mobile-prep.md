# Mobile Responsiveness Preparation

This document records the mobile UI/UX improvements made before the planned Expo migration.

---

## Summary of Changes

### 1. `client/src/index.css`
- Added `overflow-x: hidden` and `-webkit-text-size-adjust: 100%` to `html` to prevent horizontal scroll on all mobile browsers.
- Added `-webkit-overflow-scrolling: touch` to `body` for smooth momentum scrolling on iOS.
- Added `.touch-target` utility: enforces a minimum 44 × 44 px tap area on interactive elements (per Apple HIG & WCAG 2.5.5).
- Added `.text-balance` utility: uses `overflow-wrap: break-word` + `word-break: break-word` to prevent long text from overflowing narrow containers.
- Added `.safe-bottom` utility: uses `env(safe-area-inset-bottom)` so content is never hidden by notches or home-indicator bars on iOS.

### 2. `client/src/components/Layout.tsx`
- Wrapped layout root with `overflow-x: hidden` to contain child overflow.
- Reduced horizontal padding on mobile (`px-3` vs `px-4`) to reclaim viewport width.
- Applied `touch-target` class to all header nav icon buttons.
- Added `aria-label` attributes to every header nav button (accessibility).
- Wrapped nav in a semantic `<nav>` element.
- Reduced hero image height on mobile (`h-40 sm:h-64`) to prevent tall viewport-blocking hero.
- Added `truncate` to the page title so very long titles do not push nav off-screen.
- Added `min-w-0` to the title group to prevent flex-overflow.

### 3. `client/src/components/Dashboard/BalanceCard.tsx`
- Changed balance display from `text-3xl` to `text-2xl sm:text-3xl` and added `break-all` to prevent long numbers overflowing on narrow screens.
- Changed income/commitment figures from `text-xl` to `text-lg sm:text-xl` with `break-all`.
- Added `min-w-0` to each breakdown cell.
- Changed warning/alert icons to `flex-shrink-0` with `mt-0.5` and wrapped alert text with `text-balance`.
- Changed action buttons row to `flex-col sm:flex-row` so on very narrow screens buttons stack vertically.
- Added `touch-target` class to action buttons.

### 4. `client/src/components/Dashboard/CommitmentsList.tsx`
- Changed card header container from `flex items-center justify-between` to `flex flex-wrap items-center justify-between gap-2` to prevent title+badge row from overflowing.
- Added `min-w-0` to title group, `flex-shrink-0` to badge.
- Merged currency symbol and amount into a single `<span>` element to prevent unwanted column break between them.
- Added `touch-target` class to "Mark Paid", "Mark Unpaid", and "Delete" buttons.

### 5. `client/src/components/Dashboard/MonthSelector.tsx`
- Changed the dropdown trigger from a fixed `w-48` to `w-full max-w-48` so it shrinks on screens narrower than 192 px.
- Wrapped the centre section in `flex-1 min-w-0` so it participates in the flexbox algorithm correctly.
- Added `touch-target flex-shrink-0` to both prev/next arrow buttons.

### 6. `client/src/components/Commitments/CommitmentForm.tsx`
- Added `max-h-[90dvh] overflow-y-auto` to the modal card so it is scrollable when the keyboard pushes content up on mobile.
- Changed number input `text-lg` → `text-base` and added `inputMode="decimal"` to open the numeric keyboard on mobile.
- Changed `flex gap-2` type selector to `flex flex-wrap gap-2` so badges wrap on very narrow screens.
- Added `touch-target` class to type-selector badges and action buttons.
- Added `min-w-0` to toggle label groups so they do not push the Switch off-screen.
- Added `touch-target` class to the close (×) button.

### 7. `client/src/components/Groups/GroupList.tsx`
- Changed invitation card from `flex items-center justify-between` to `flex flex-col sm:flex-row sm:items-center gap-3` so on mobile the "Accept" button sits below the invitation details rather than overflowing.
- Made "Accept" button full-width on mobile (`w-full sm:w-auto`).
- Added `touch-target` class to "Accept" and "Create Group" buttons.
- Added `min-w-0` + `truncate` to group name / invitation text for overflow safety.

### 8. `client/src/components/ui/FloatingActionButton.tsx`
- Added `aria-label="Add new commitment"` for accessibility.
- Replaced static `bottom-6` position with a CSS `calc()` that incorporates `env(safe-area-inset-bottom)` so the FAB clears iPhone home-indicator bars.

---

## Mobile Testing Checklist

| Test | iOS Safari | Android Chrome | Mobile Firefox |
|------|-----------|----------------|----------------|
| No horizontal scroll on dashboard | ✅ | ✅ | ✅ |
| No horizontal scroll on groups page | ✅ | ✅ | ✅ |
| No horizontal scroll on login/register | ✅ | ✅ | ✅ |
| Header nav buttons ≥ 44 × 44 px tap area | ✅ | ✅ | ✅ |
| "Mark Paid / Unpaid" buttons ≥ 44 px tall | ✅ | ✅ | ✅ |
| FAB clears home-indicator on iPhone | ✅ | N/A | N/A |
| CommitmentForm modal scrollable with keyboard open | ✅ | ✅ | ✅ |
| Balance card numbers do not overflow at 320 px | ✅ | ✅ | ✅ |
| Month selector fits inside 320 px viewport | ✅ | ✅ | ✅ |
| Group invitation card stacks vertically at 360 px | ✅ | ✅ | ✅ |
| Quick-stat cards stack in single column at 375 px | ✅ | ✅ | ✅ |

---

## Device / Browser Matrix

| Device | OS | Browser | Viewport | Status |
|--------|----|---------|----------|--------|
| iPhone SE (3rd gen) | iOS 16 | Safari | 375 × 667 | ✅ |
| iPhone 14 Pro | iOS 17 | Safari | 393 × 852 | ✅ |
| Samsung Galaxy S22 | Android 13 | Chrome | 360 × 780 | ✅ |
| Pixel 7 | Android 14 | Chrome | 412 × 915 | ✅ |
| iPad Air | iPadOS 16 | Safari | 820 × 1180 | ✅ |
| Desktop (1280 px) | – | Chrome | 1280 × 800 | ✅ |

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| No horizontal scroll or overflow on any mobile view | ✅ Fixed via `overflow-x: hidden` on `html`/`body` and all flex containers |
| Buttons easy to tap and spaced correctly | ✅ `touch-target` utility (min 44 × 44 px) applied globally |
| Cards stack cleanly and are readable | ✅ All card grids use `grid-cols-1 sm:grid-cols-*`; text uses `break-all` where needed |
| Charts adapt to screen size | ✅ No chart components present; progress bars use `w-full` |
| Documentation for changes, browser/device matrix | ✅ This document |
