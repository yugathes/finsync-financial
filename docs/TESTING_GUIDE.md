# Phase 4 Testing Guide

## Prerequisites
1. Database is migrated with new schema
2. Application is running
3. At least 2 user accounts for testing group features

## Test Plan

### 1. Database Migration Test

**Steps:**
```bash
# Generate Prisma client
npx prisma generate

# If using migrations:
npx prisma migrate dev

# Or push schema directly:
npx prisma db push
```

**Expected:**
- New tables created: `groups`, `group_members`
- New columns in `commitments`: `is_imported`, `imported_at`
- No errors in migration

---

### 2. Import Wizard Test

**Test Case 1: CSV Import**

**Steps:**
1. Login to dashboard
2. Click "Import Commitments" button
3. Select `docs/sample-import.csv`
4. Verify preview shows 10 commitments
5. Click "Import Commitments"
6. Toggle "Show Imported Records" in dashboard

**Expected:**
- ✅ All 10 commitments imported
- ✅ Each has purple "Imported" badge
- ✅ Success toast notification
- ✅ Commitments visible when filter enabled

**Test Case 2: JSON Import**

**Steps:**
1. Click "Import Commitments"
2. Select `docs/sample-import.json`
3. Verify preview matches CSV data
4. Complete import

**Expected:**
- ✅ Same results as CSV import
- ✅ No duplicate entries

**Test Case 3: Invalid File**

**Steps:**
1. Try uploading a .txt or .pdf file
2. Try CSV with missing required columns

**Expected:**
- ❌ Error message shown
- ❌ No data imported
- ✅ User can retry

---

### 3. Groups Feature Test

**Test Case 1: Create Group**

**User A Actions:**
1. Click Users icon in header (navigate to Groups)
2. Click "Create Group"
3. Enter "Test Family" as name
4. Submit

**Expected:**
- ✅ Group created successfully
- ✅ User A is owner (Crown badge)
- ✅ Group appears in "My Groups"

**Test Case 2: Invite Member**

**User A Actions:**
1. Select "Test Family" group
2. Click "Invite Member"
3. Enter User B's email
4. Send invitation

**Expected:**
- ✅ Success toast
- ✅ User B appears in members (status: invited)

**API Check:**
```bash
# Get User B's invitations
curl http://localhost:5000/api/groups/invitations/{userB_id}
```

**Test Case 3: Accept Invitation**

**User B Actions:**
1. Navigate to Groups page
2. See "Pending Invitations" card
3. Click "Accept" on "Test Family"

**Expected:**
- ✅ Invitation disappears
- ✅ Group appears in "My Groups"
- ✅ Can view group details

**Test Case 4: Share Commitment**

**User A Actions:**
1. Go back to Dashboard
2. Create new commitment:
   - Title: "Shared Rent"
   - Category: "Housing"
   - Amount: 1500
   - Enable "Shared" option
   - Select "Test Family" group
3. Submit

**Expected:**
- ✅ Commitment created with shared badge
- ✅ Visible in User A's dashboard

**User B Actions:**
1. Toggle "Show Shared Commitments" in dashboard
2. Look for "Shared Rent"

**Expected:**
- ✅ Commitment visible
- ✅ Has blue "Shared" badge
- ✅ Can mark as paid

**Test Case 5: Mark Shared as Paid**

**User B Actions:**
1. Click checkmark on "Shared Rent"
2. Confirm payment

**Expected:**
- ✅ Marked as paid
- ✅ Appears in "Completed" section

**User A Actions:**
1. Refresh or check dashboard

**Expected:**
- ✅ Sees commitment marked as paid
- ✅ Payment reflected in balance

**Test Case 6: Remove Member (Owner)**

**User A Actions:**
1. Go to Groups → "Test Family"
2. Find User B in members list
3. Click trash icon
4. Confirm removal

**Expected:**
- ✅ User B removed
- ✅ No longer in members list

**User B Actions:**
1. Check Groups page

**Expected:**
- ✅ "Test Family" no longer visible
- ✅ Cannot access shared commitments

---

### 4. Dashboard Filters Test

**Setup:**
Create commitments of each type:
- 3 personal commitments
- 2 shared commitments (in a group)
- 2 imported commitments

**Test Case 1: Default View**

**Steps:**
1. View dashboard with all filters off

**Expected:**
- ✅ Shows only 3 personal commitments
- ❌ Shared commitments hidden
- ❌ Imported commitments hidden

**Test Case 2: Shared Filter**

**Steps:**
1. Toggle "Show Shared Commitments"

**Expected:**
- ✅ Shows 5 commitments (3 personal + 2 shared)
- ✅ Shared ones have blue badge
- ❌ Imported still hidden

**Test Case 3: Imported Filter**

**Steps:**
1. Toggle "Show Imported Records"

**Expected:**
- ✅ Shows 7 commitments (3 personal + 2 shared + 2 imported)
- ✅ Imported ones have purple badge
- ✅ All types visible

**Test Case 4: Filter Combinations**

**Steps:**
1. Turn off shared, keep imported on

**Expected:**
- ✅ Shows 5 commitments (3 personal + 2 imported)

**Steps:**
2. Turn on shared, turn off imported

**Expected:**
- ✅ Shows 5 commitments (3 personal + 2 shared)

---

### 5. API Endpoint Tests

**Test Group Endpoints:**

```bash
# Create group
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Group",
    "ownerId": "user-uuid-here"
  }'

# Get user's groups
curl http://localhost:5000/api/groups/user/{userId}

# Invite member
curl -X POST http://localhost:5000/api/groups/invite \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "group-uuid",
    "userId": "user-uuid",
    "invitedBy": "owner-uuid"
  }'

# Accept invitation
curl -X POST http://localhost:5000/api/groups/accept \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "group-uuid",
    "userId": "user-uuid"
  }'

# Get group commitments
curl "http://localhost:5000/api/groups/{groupId}/commitments?userId={userId}&month=2025-01"
```

**Test Import Endpoint:**

```bash
curl -X POST http://localhost:5000/api/commitments/import \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "commitments": [
      {
        "type": "static",
        "title": "Test Import",
        "category": "Test",
        "amount": 100,
        "recurring": false
      }
    ]
  }'
```

**Test Filter Endpoint:**

```bash
# Personal only (default)
curl "http://localhost:5000/api/commitments/user/{userId}/month/2025-01"

# With shared
curl "http://localhost:5000/api/commitments/user/{userId}/month/2025-01?includeShared=true"

# With imported
curl "http://localhost:5000/api/commitments/user/{userId}/month/2025-01?includeImported=true"

# All types
curl "http://localhost:5000/api/commitments/user/{userId}/month/2025-01?includeShared=true&includeImported=true"
```

---

### 6. Edge Cases & Error Handling

**Test Case 1: Invite Non-Existent User**

**Steps:**
1. Try to invite "nonexistent@email.com"

**Expected:**
- ❌ Error: "User not found"
- ✅ No invitation created

**Test Case 2: Import Invalid Data**

**Steps:**
1. Upload CSV with missing amount column
2. Upload JSON with invalid format

**Expected:**
- ❌ Error messages displayed
- ✅ No partial imports
- ✅ User can fix and retry

**Test Case 3: Non-Member Access**

**Steps:**
1. User C tries to access User A's group URL directly

**Expected:**
- ❌ Error: "You are not a member of this group"
- ❌ No group data exposed

**Test Case 4: Remove Group Owner**

**Steps:**
1. User A tries to remove themselves (owner)

**Expected:**
- ❌ Error or prevented
- ✅ Owner cannot be removed
- ℹ️  (Should implement "Leave Group" for owners separately)

---

### 7. Performance Tests

**Test Case 1: Large Import**

**Steps:**
1. Create CSV with 100+ rows
2. Import and measure time

**Expected:**
- ✅ Completes in reasonable time (< 10s)
- ✅ No timeout errors
- ✅ All records imported

**Test Case 2: Multiple Groups**

**Setup:**
1. Create 5 groups
2. Join 5 groups
3. Each has 10 shared commitments

**Expected:**
- ✅ Dashboard loads quickly
- ✅ Filters work smoothly
- ✅ No UI lag

---

### 8. Browser Compatibility

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

**Check:**
- File upload works
- Modals display correctly
- Filters toggle properly
- Navigation works

---

## Success Criteria

### Must Pass:
- [ ] All 3 personal commitment filters work
- [ ] Group creation and invitation work
- [ ] CSV import completes successfully
- [ ] Shared commitments visible to members
- [ ] No TypeScript errors
- [ ] No console errors in browser

### Nice to Have:
- [ ] JSON import works
- [ ] Large file import (100+ records)
- [ ] Mobile responsive design
- [ ] Smooth animations

---

## Bug Report Template

If issues found:

```markdown
**Feature:** [Groups/Import/Filters]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Console Errors:**

**Browser/Version:**

**Screenshots:**
```

---

## Rollback Plan

If critical issues found:

1. **Disable Features:**
   - Comment out Groups route in App.tsx
   - Hide Import button in Dashboard
   - Remove filter toggles

2. **Database:**
   - New columns have defaults, safe to leave
   - Can drop tables if needed: `DROP TABLE group_members; DROP TABLE groups;`

3. **Code:**
   - Revert to previous commit
   - Redeploy

---

## Sign-Off Checklist

Before marking Phase 4 complete:

- [ ] All test cases pass
- [ ] Documentation reviewed
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Database migrated successfully
- [ ] Sample files tested
- [ ] Multi-user flow tested
- [ ] Performance acceptable
- [ ] UI/UX smooth
- [ ] Error messages clear

---

## Next Steps After Testing

1. Fix any bugs found
2. Add realtime updates (optional)
3. Add email notifications (optional)
4. Create admin panel for group management
5. Add analytics for shared spending
