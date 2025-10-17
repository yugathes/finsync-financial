# Phase 4 Features Documentation

## Overview
Phase 4 introduces three major features to FinSync:
1. **Shared Groups** - Collaborate on commitments with family or roommates
2. **Import Wizard** - Import historical commitment data
3. **Dashboard Enhancements** - Filter and view different commitment types

---

## 1. Shared Groups & Syncing

### Features
- Create private groups (e.g., "Family", "Roommates")
- Invite members via email
- Share commitments within groups
- Mark shared commitments as paid
- Real-time updates across group members

### API Endpoints

#### Create Group
```
POST /api/groups
Body: { name: string, ownerId: string }
```

#### Get User's Groups
```
GET /api/groups/user/:userId
```

#### Invite Member
```
POST /api/groups/invite
Body: { groupId: string, userId: string, invitedBy: string }
```

#### Accept Invitation
```
POST /api/groups/accept
Body: { groupId: string, userId: string }
```

#### Get Group Details
```
GET /api/groups/:groupId?userId=<userId>
```

#### Get Group Commitments
```
GET /api/groups/:groupId/commitments?userId=<userId>&month=<YYYY-MM>
```

#### Remove Member (Owner only)
```
DELETE /api/groups/:groupId/members/:memberId
Body: { requesterId: string }
```

### Usage

1. **Create a Group**
   - Navigate to Groups page (Users icon in header)
   - Click "Create Group"
   - Enter group name (e.g., "Family Budget")

2. **Invite Members**
   - Select a group
   - Click "Invite Member"
   - Enter member's email address
   - Member receives invitation in their Groups page

3. **Share Commitments**
   - When creating a commitment, enable "Shared" option
   - Select the group to share with
   - All group members can view and mark as paid

4. **View Shared Commitments**
   - In Dashboard, toggle "Show Shared Commitments"
   - Shared commitments show a "Shared" badge

---

## 2. Import Wizard (Past Records)

### Features
- Import historical commitments from CSV or JSON
- Preview data before import
- Imported records are marked with special badge
- Excluded from monthly balance by default

### Supported Formats

#### CSV Format
Required columns:
- `type` (static/dynamic)
- `title`
- `category`
- `amount`

Optional columns:
- `recurring` (true/false or 1/0)
- `startDate` (YYYY-MM-DD)
- `createdAt` (YYYY-MM-DD)

Example CSV:
```csv
type,title,category,amount,recurring,startDate
static,Rent,Housing,1500,true,2024-01-01
dynamic,Groceries,Food,300,false,2024-01-15
static,Internet,Utilities,80,true,2024-01-01
```

#### JSON Format
```json
[
  {
    "type": "static",
    "title": "Rent",
    "category": "Housing",
    "amount": 1500,
    "recurring": true,
    "startDate": "2024-01-01"
  },
  {
    "type": "dynamic",
    "title": "Groceries",
    "category": "Food",
    "amount": 300,
    "recurring": false,
    "startDate": "2024-01-15"
  }
]
```

### API Endpoint

```
POST /api/commitments/import
Body: {
  userId: string,
  commitments: Array<{
    type: string,
    title: string,
    category: string,
    amount: number,
    recurring?: boolean,
    startDate?: string,
    createdAt?: string
  }>
}
```

### Usage

1. **Prepare Your Data**
   - Export from your previous system
   - Format as CSV or JSON (see examples above)

2. **Import**
   - In Dashboard, click "Import Commitments"
   - Select your file
   - Review the preview
   - Confirm import

3. **View Imported Data**
   - Toggle "Show Imported Records" in Dashboard
   - Imported commitments show "Imported" badge
   - These are read-only and don't affect monthly calculations by default

---

## 3. Dashboard Enhancements

### New Features
- **Filter Controls** - Toggle personal/shared/imported views
- **Visual Indicators** - Badges for commitment types
- **Expanded Metrics** - Track different commitment categories

### Dashboard Filters

#### Personal Commitments
- Default view
- Your individual commitments

#### Shared Commitments
- Toggle: "Show Shared Commitments"
- Commitments from groups you're in
- Updates in real-time when members mark as paid

#### Imported Records
- Toggle: "Show Imported Records"
- Historical data for reference
- Excluded from active balance calculations

### API Endpoint

```
GET /api/commitments/user/:userId/month/:month?includeShared=<bool>&includeImported=<bool>&includePersonal=<bool>
```

Query Parameters:
- `includeShared` - Include group commitments (default: false)
- `includeImported` - Include imported records (default: false)
- `includePersonal` - Include personal commitments (default: true)

### Visual Indicators

- 👥 **Shared Badge** - Blue badge, indicates group commitment
- 📄 **Imported Badge** - Purple badge, indicates historical record
- 📅 **Calendar Icon** - Indicates recurring commitment

---

## Database Schema

### New Tables

#### `groups`
```sql
id          UUID PRIMARY KEY
name        VARCHAR
owner_id    UUID (foreign key to users)
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

#### `group_members`
```sql
id          UUID PRIMARY KEY
group_id    UUID (foreign key to groups)
user_id     UUID (foreign key to users)
role        VARCHAR ('owner' | 'member')
status      VARCHAR ('invited' | 'accepted')
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Updated Tables

#### `commitments` (new columns)
```sql
is_imported  BOOLEAN DEFAULT false
imported_at  TIMESTAMP
```

---

## Access Control

### Group Permissions
- **Owner**
  - Create group
  - Invite members
  - Remove members
  - Delete group
  
- **Member**
  - View group details
  - View shared commitments
  - Mark commitments as paid
  - Leave group

### Commitment Access
- **Personal**: Only creator can view/edit
- **Shared**: All group members can view, owner can edit
- **Imported**: Read-only, only creator can view

---

## Testing

### Sample Test Scenarios

1. **Group Flow**
   ```
   User A creates group "Family"
   User A invites User B
   User B accepts invitation
   User A shares commitment
   User B views and marks as paid
   User A sees update
   ```

2. **Import Flow**
   ```
   User prepares CSV with 10 commitments
   User imports via wizard
   User toggles "Show Imported Records"
   User verifies data appears with badge
   ```

3. **Filter Flow**
   ```
   User has 5 personal, 3 shared, 2 imported
   Default: Shows 5 personal
   Toggle shared: Shows 8 (personal + shared)
   Toggle imported: Shows 10 (all)
   ```

---

## Future Enhancements

### Realtime Updates (Optional)
Currently, users need to refresh to see updates. Could add Supabase Realtime:

```typescript
// Subscribe to group commitment changes
supabase
  .channel('group-commitments')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'commitments',
      filter: `group_id=eq.${groupId}`
    },
    (payload) => {
      // Update local state
    }
  )
  .subscribe()
```

### Notifications
- Email notifications for invitations
- Push notifications for payment updates
- Weekly summaries

### Enhanced Analytics
- Group spending trends
- Category breakdown per group
- Member contribution tracking

---

## Troubleshooting

### Common Issues

**Q: Invitation not showing up?**
A: Make sure the invited user exists in the system. The email must match their registered email.

**Q: Can't see shared commitments?**
A: Check that:
1. You've accepted the group invitation
2. The commitment has `shared: true`
3. The commitment has the correct `groupId`
4. You've toggled "Show Shared Commitments" in Dashboard

**Q: Import failed?**
A: Verify:
1. CSV/JSON format is correct
2. Required fields are present
3. Amount values are numeric
4. File is not corrupted

---

## Migration Guide

If upgrading from previous version:

1. **Database Migration**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

2. **No Data Loss**
   - Existing commitments unaffected
   - New columns have default values
   - Backward compatible

3. **Optional Cleanup**
   - Review and archive old commitments
   - Import historical data if needed
   - Create initial groups

---

## API Reference Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/groups` | POST | Create group |
| `/api/groups/user/:userId` | GET | Get user's groups |
| `/api/groups/:groupId` | GET | Get group details |
| `/api/groups/invite` | POST | Invite member |
| `/api/groups/accept` | POST | Accept invitation |
| `/api/groups/:groupId/commitments` | GET | Get group commitments |
| `/api/groups/:groupId/members/:memberId` | DELETE | Remove member |
| `/api/commitments/import` | POST | Import commitments |
| `/api/commitments/user/:userId/month/:month` | GET | Get commitments (with filters) |
| `/api/user/search` | GET | Search user by email |

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Contact support with error details
