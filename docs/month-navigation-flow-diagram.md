# Month Navigation Flow Diagram

## Before Fix (Broken Flow)

```
User clicks "Next" button
       ↓
changeMonth('next') called
       ↓
currentMonth state updated (e.g., 2025-10 → 2025-11)
       ↓
React re-renders component
       ↓
useEffect([user?.id, currentMonth]) detects change
       ↓
Calls loadDashboardData()
       ↓
❌ PROBLEM: loadDashboardData is not recreated, still has OLD currentMonth value
       ↓
API request uses STALE month: /api/dashboard/1/2025-10
       ↓
Wrong data loaded, UI shows old month's data
```

## After Fix (Working Flow)

```
User clicks "Next" button
       ↓
changeMonth('next') called
       ↓
currentMonth state updated (e.g., 2025-10 → 2025-11)
       ↓
React re-renders component
       ↓
useCallback dependencies [user?.id, currentMonth, toast] changed
       ↓
✅ loadDashboardData is RECREATED with NEW currentMonth value
       ↓
useEffect([loadDashboardData]) detects function reference changed
       ↓
Calls loadDashboardData()
       ↓
✅ API request uses CORRECT month: /api/dashboard/1/2025-11
       ↓
Correct data loaded, UI updates with new month's data
```

## Key Difference

**Before**: `loadDashboardData` was a regular function that closed over stale values
**After**: `loadDashboardData` is memoized with `useCallback` and recreates when dependencies change

## Component Re-render Cycle

### Without useCallback (Broken)
```
Render 1: currentMonth = "2025-10"
  → loadDashboardData captures "2025-10"
  
User changes month
  
Render 2: currentMonth = "2025-11"  
  → loadDashboardData recreated but NOT tracked by useEffect
  → useEffect sees dependencies [user?.id, "2025-11"] changed
  → Calls OLD loadDashboardData (still has "2025-10" ❌)
```

### With useCallback (Fixed)
```
Render 1: currentMonth = "2025-10"
  → useCallback creates loadDashboardData with "2025-10"
  
User changes month
  
Render 2: currentMonth = "2025-11"  
  → useCallback sees dependency changed
  → Creates NEW loadDashboardData with "2025-11" ✅
  → useEffect sees loadDashboardData reference changed
  → Calls NEW loadDashboardData (has "2025-11" ✅)
```

## React Hooks Dependency Rules

1. **Functions used in useEffect should be dependencies or wrapped in useCallback**
   - ❌ Bad: useEffect(() => myFunc(), [someValue]) where myFunc uses someValue
   - ✅ Good: useEffect(() => myFunc(), [myFunc]) where myFunc = useCallback(() => {...}, [someValue])

2. **useCallback memoizes functions and only recreates them when dependencies change**
   - Purpose: Prevents unnecessary re-creation and ensures fresh values
   - Dependencies: Include ALL values used inside the function

3. **Stale closures occur when functions capture old values**
   - Problem: Function created in Render 1 still references values from Render 1
   - Solution: Use useCallback to ensure function is recreated when values change

## Console Output Example

When working correctly, you should see:
```
[NewDashboard] Changing month from 2025-10 to 2025-11
[NewDashboard] Loading dashboard data for user 1 and month 2025-11
[NewDashboard] Dashboard data loaded successfully for 2025-11: {income: 5000, commitmentsCount: 3}
```

If broken, you would see:
```
[NewDashboard] Changing month from 2025-10 to 2025-11
[NewDashboard] Loading dashboard data for user 1 and month 2025-10  ← Wrong month!
```
