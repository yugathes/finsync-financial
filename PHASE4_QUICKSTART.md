# Phase 4 Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Update Database (1 min)

```bash
# Generate Prisma client with new schema
npx prisma generate

# Push changes to database
npx prisma db push
```

**Expected Output:**

```
✔ Generated Prisma Client
✔ Database schema updated
```

---

### Step 2: Start the Application (1 min)

```bash
# Development mode
npm run dev

# Or production mode
npm run build && npm start
```

**Access at:** http://localhost:5000

---

### Step 3: Test Import Feature (1 min)

1. **Login** to your dashboard
2. **Click** "Import Commitments" button
3. **Upload** `docs/sample-import.csv`
4. **Review** the 10 commitments in preview
5. **Click** "Import Commitments"
6. **Toggle** "Show Imported Records" to see them

**Result:** ✅ 10 historical commitments imported with purple "Imported" badge

---

### Step 4: Test Groups Feature (2 min)

**User A (First Account):**

1. **Click** Users icon in header → Navigate to Groups
2. **Click** "Create Group"
3. **Enter** "Test Family" as name
4. **Submit**
5. **Select** the group
6. **Click** "Invite Member"
7. **Enter** User B's email (need 2nd test account)

**User B (Second Account):**

1. **Navigate** to Groups page
2. **See** invitation in "Pending Invitations"
3. **Click** "Accept"
4. **View** group details

**User A (Back to Dashboard):**

1. **Create** new commitment:
   - Title: "Shared Rent"
   - Amount: 1500
   - Enable "Shared"
   - Select "Test Family"
2. **Submit**

**User B (Dashboard):**

1. **Toggle** "Show Shared Commitments"
2. **See** "Shared Rent" with blue "Shared" badge
3. **Mark** as paid

**Result:** ✅ Commitment shared between users, payment visible to both

---

## 🎯 Quick Feature Overview

### 1. Import Wizard

**What:** Import historical commitments from CSV or JSON
**Access:** Dashboard → "Import Commitments" button
**Formats:** CSV (sample: `docs/sample-import.csv`) or JSON
**Result:** Imported records marked with purple badge

### 2. Groups

**What:** Share commitments with family/roommates
**Access:** Click Users icon in header → Groups page
**Actions:** Create group, invite members, share commitments
**Result:** Shared commitments visible to all members

### 3. Dashboard Filters

**What:** Toggle visibility of different commitment types
**Access:** Dashboard → "View Options" card
**Filters:**

- Show Shared Commitments (blue badge)
- Show Imported Records (purple badge)
  **Result:** Expenses filtering of commitments

---

## 📁 Key Files to Review

### Backend

```
server/group/
├── controller.ts    # Request handlers
├── services.ts      # Business logic
└── routes.ts        # Route definitions

server/commitment/
├── services.ts      # Added: importCommitments(), enhanced filtering
└── controller.ts    # Added: importCommitments()
```

### Frontend

```
client/src/pages/
└── GroupsPage.tsx   # Main groups page

client/src/components/Groups/
├── GroupList.tsx           # Display groups & invitations
├── GroupDetail.tsx         # Show group details
├── CreateGroupModal.tsx    # Create group modal
└── InviteMemberModal.tsx   # Invite member modal

client/src/components/Commitments/
└── ImportWizardModal.tsx   # Import wizard

client/src/components/Dashboard/
└── Dashboard.tsx           # Added filters & import
```

### Database

```
prisma/schema.prisma
- Added: Group model
- Added: GroupMember model
- Updated: Commitment (isImported, importedAt)
```

---

## 🧪 Quick Test Checklist

### Import Feature

- [ ] Upload CSV file
- [ ] See 10 commitments in preview
- [ ] Import completes successfully
- [ ] Imported records show with purple badge
- [ ] Toggle filter works

### Groups Feature

- [ ] Create group succeeds
- [ ] Invite member works
- [ ] Member sees invitation
- [ ] Accept invitation works
- [ ] Shared commitment visible to both
- [ ] Mark as paid updates for both

### Dashboard Filters

- [ ] Personal commitments show by default
- [ ] Shared filter toggle works
- [ ] Imported filter toggle works
- [ ] Badges display correctly

---

## 🔍 Common Issues & Solutions

### Issue: "Prisma Client not generated"

**Solution:**

```bash
npx prisma generate
```

### Issue: "User not found" when inviting

**Solution:** Make sure the email matches an existing user in the database. Create a second test account first.

### Issue: Import file not accepted

**Solution:** Check file format matches sample:

- CSV: `type,title,category,amount`
- JSON: Array of objects with required fields

### Issue: Shared commitments not showing

**Solution:**

1. Toggle "Show Shared Commitments" in Dashboard
2. Verify commitment has `shared: true`
3. Ensure you're in the group

---

## 📊 Visual Guide

### Dashboard - New Features

```
┌─────────────────────────────────────┐
│  Dashboard Header                   │
│  [Users] [Settings] [Logout]        │ ← Click Users to go to Groups
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  View Options                       │
│  ☑ Show Shared Commitments          │ ← Toggle filters
│  ☑ Show Imported Records            │
│  [Import Commitments]               │ ← Click to import
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Commitments                        │
│  • Rent [Shared 👥]                 │ ← Blue badge
│  • Old Data [Imported]              │ ← Purple badge
│  • Groceries [📅]                   │ ← Recurring
└─────────────────────────────────────┘
```

### Groups Page

```
┌─────────────────────────────────────┐
│  Pending Invitations                │
│  • Family (from user@email.com)     │
│    [Accept]                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  My Groups    [Create Group]        │
│                                     │
│  • Test Family                      │
│    👑 Owner • 2 members             │
│                                     │
│  • Roommates                        │
│    Member • 3 members               │
└─────────────────────────────────────┘
```

### Import Wizard

```
Step 1: Upload
┌─────────────────────────────────────┐
│  📁 Upload your file                │
│  Support for CSV and JSON formats   │
│  [Select File]                      │
└─────────────────────────────────────┘

Step 2: Preview
┌─────────────────────────────────────┐
│  Preview Import (10 commitments)    │
│  ┌───────────────────────────────┐  │
│  │ Title    │ Category │ Amount │  │
│  │ Rent     │ Housing  │ 1500   │  │
│  │ Internet │ Utilities│ 80     │  │
│  └───────────────────────────────┘  │
│  [Back]  [Import Commitments]      │
└─────────────────────────────────────┘

Step 3: Complete
┌─────────────────────────────────────┐
│  ✓ Import Successful!               │
│  10 commitments imported            │
│  [Close]                            │
└─────────────────────────────────────┘
```

---

## 🎨 Visual Indicators

| Badge         | Color       | Meaning          | When Shown                  |
| ------------- | ----------- | ---------------- | --------------------------- |
| **Shared 👥** | Blue        | Group commitment | `shared: true` and in group |
| **Imported**  | Purple      | Historical data  | `isImported: true`          |
| **📅**        | Purple icon | Recurring        | `recurring: true`           |
| **👑 Owner**  | Gray        | Group owner      | User created the group      |

---

## 📚 Documentation Links

- **[Full Feature Docs](./docs/PHASE4_FEATURES.md)** - Complete documentation
- **[Testing Guide](./docs/TESTING_GUIDE.md)** - Detailed test cases
- **[Implementation Summary](./docs/PHASE4_SUMMARY.md)** - Technical details

---

## 🤝 Need Help?

1. **Check documentation** in `/docs` folder
2. **Review sample files** in `/docs`
3. **Check browser console** for errors
4. **Verify database migration** ran successfully
5. **Contact team** with error details

---

## ✅ Success Indicators

You'll know Phase 4 is working when:

- ✅ No TypeScript compilation errors
- ✅ Database has `groups` and `group_members` tables
- ✅ Import wizard opens and accepts files
- ✅ Groups page loads without errors
- ✅ Filters toggle commitments visibility
- ✅ Badges appear on commitments
- ✅ Two users can share commitments

---

## 🎉 You're Done!

Phase 4 is ready to use. Enjoy the new features:

- 🗂️ Group collaboration
- 📊 Historical data import
- 🎯 Smart filtering

**Happy tracking! 💰**
