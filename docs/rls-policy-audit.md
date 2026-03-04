# RLS Policy Audit – FinSync Financial

> **Migration file:** `prisma/migrations/20260304000000_rls_policies_and_indexes/migration.sql`

---

## 1. Scope

This audit covers all six application tables managed through the Supabase/PostgreSQL
backend:

| Table | Primary access key |
|---|---|
| `users` | `id` (= `auth.uid()`) |
| `monthly_income` | `user_id` |
| `commitments` | `user_id`, `group_id` (shared) |
| `commitment_payments` | `paid_by`, `commitment_id` (via group) |
| `groups` | `owner_id` |
| `group_members` | `user_id`, `group_id` |

---

## 2. Changes Made

### 2.1 Enable Row Level Security

RLS is enabled **and forced** on every table so that even database superusers
(e.g., the Supabase service-role key used in server-side routes) are subject to
policies when going through the `public` schema.

```sql
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.<table> FORCE ROW LEVEL SECURITY;
```

Tables affected: `users`, `monthly_income`, `commitments`, `commitment_payments`,
`groups`, `group_members`.

### 2.2 Remove Legacy / Overly-Permissive Policies

A PL/pgSQL block iterates over `pg_policies` for each table and drops every
existing policy before the new ones are created.  This guarantees a clean slate
and removes any default `PERMISSIVE` policies that may have been auto-generated
(e.g., Supabase Studio's "Allow all" defaults).

### 2.3 New RLS Policies

#### `users`

| Operation | Rule |
|---|---|
| SELECT | `auth.uid() = id` |
| UPDATE | `auth.uid() = id` |

INSERT/DELETE are intentionally omitted – row creation is managed by Supabase
Auth triggers; deletion is an admin operation.

#### `monthly_income`

| Operation | Rule |
|---|---|
| SELECT | `auth.uid() = user_id` |
| INSERT | `auth.uid() = user_id` |
| UPDATE | `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` |

#### `commitments`

| Operation | Rule |
|---|---|
| SELECT | Owner (`auth.uid() = user_id`) **or** accepted group member for shared commitments |
| INSERT | `auth.uid() = user_id` |
| UPDATE | Owner **or** accepted group member for shared commitments |
| DELETE | `auth.uid() = user_id` (owner only) |

The "accepted group member" check uses a correlated sub-query:

```sql
EXISTS (
  SELECT 1 FROM public.group_members gm
  WHERE gm.group_id = commitments.group_id
    AND gm.user_id  = auth.uid()
    AND gm.status   = 'accepted'
)
```

#### `commitment_payments`

| Operation | Rule |
|---|---|
| SELECT | Payer (`auth.uid() = paid_by`) **or** accepted group member for the related shared commitment |
| INSERT | `auth.uid() = paid_by` |
| UPDATE | `auth.uid() = paid_by` |
| DELETE | `auth.uid() = paid_by` |

#### `groups`

| Operation | Rule |
|---|---|
| SELECT | Owner (`auth.uid() = owner_id`) **or** accepted group member |
| INSERT | `auth.uid() = owner_id` |
| UPDATE | `auth.uid() = owner_id` |
| DELETE | `auth.uid() = owner_id` |

#### `group_members`

| Operation | Rule |
|---|---|
| SELECT | Own membership row **or** group owner |
| INSERT | Group owner inviting others, **or** the user adding themselves |
| UPDATE | Own row (to accept invite) **or** group owner |
| DELETE | Own row (to leave) **or** group owner (to remove) |

---

## 3. Indexes Added

Missing indexes were identified by cross-referencing the foreign-key columns used
in RLS policy sub-queries with the existing index list from the migration history.

| Index name | Table | Column(s) | Reason |
|---|---|---|---|
| `idx_monthly_income_user_id` | `monthly_income` | `user_id` | RLS filter, FK |
| `idx_monthly_income_month` | `monthly_income` | `month` | Common WHERE / GROUP BY |
| `idx_commitments_user_id` | `commitments` | `user_id` | RLS filter, FK |
| `idx_commitments_group_id` | `commitments` | `group_id` | RLS sub-query, FK |
| `idx_commitment_payments_paid_by` | `commitment_payments` | `paid_by` | RLS filter, FK |
| `idx_commitment_payments_commitment_id` | `commitment_payments` | `commitment_id` | RLS sub-query, FK |
| `idx_commitment_payments_month` | `commitment_payments` | `month` | Common WHERE |
| `idx_groups_owner_id` | `groups` | `owner_id` | RLS filter, FK |
| `idx_group_members_user_id` | `group_members` | `user_id` | RLS filter, FK |

> The unique index `group_members_group_id_user_id_key` already covers
> `(group_id, user_id)` lookups, so no separate `group_id` index is needed for
> `group_members`.

All indexes use `CREATE INDEX IF NOT EXISTS` so the migration is idempotent.

---

## 4. Verification Steps

### 4.1 Confirm RLS is enabled

```sql
SELECT tablename, rowsecurity, forcerls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users','monthly_income','commitments',
    'commitment_payments','groups','group_members'
  );
```

Expected: `rowsecurity = true`, `forcerls = true` for every row.

### 4.2 Confirm policies exist

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected: only the policies listed in Section 2.3 above.

### 4.3 Unauthorized access test

Connect as user **A** (set `request.jwt.claims` or use `SET LOCAL role`).
Attempt to read a row owned by user **B**.  Result should be zero rows.

```sql
-- Simulate user A's JWT
SET LOCAL "request.jwt.claims" TO '{"sub": "<user_a_uuid>"}';
SELECT * FROM public.monthly_income WHERE user_id = '<user_b_uuid>';
-- Expected: 0 rows
```

### 4.4 Legitimate access test

```sql
SET LOCAL "request.jwt.claims" TO '{"sub": "<user_a_uuid>"}';
SELECT * FROM public.monthly_income WHERE user_id = '<user_a_uuid>';
-- Expected: rows belonging to user A
```

### 4.5 Group commitment access test

1. Create group G owned by user A.
2. Add user B as accepted member of G.
3. Create a shared commitment owned by user A in group G.
4. Connect as user B – SELECT should return the shared commitment.
5. Connect as user C (not in G) – SELECT should return zero rows for that commitment.

```sql
-- As user B (accepted member of group G)
SET LOCAL "request.jwt.claims" TO '{"sub": "<user_b_uuid>"}';
SELECT * FROM public.commitments WHERE group_id = '<group_g_uuid>';
-- Expected: the shared commitment owned by A

-- As user C (not a member)
SET LOCAL "request.jwt.claims" TO '{"sub": "<user_c_uuid>"}';
SELECT * FROM public.commitments WHERE group_id = '<group_g_uuid>';
-- Expected: 0 rows
```

### 4.6 Index usage test (EXPLAIN)

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.monthly_income
WHERE user_id = '<some_uuid>' AND month = '2025-07';
```

Expected: `Index Scan` on `idx_monthly_income_user_id` (or composite).

---

## 5. What Was NOT Changed

- Table schemas remain unchanged (no columns added or removed).
- Authentication logic in the application layer is unmodified.
- Existing Prisma schema and the two earlier migrations are untouched.
- Service-role access patterns used in server-side code are unaffected because
  the Express backend connects via Prisma (bypassing Supabase PostgREST), but
  `FORCE ROW LEVEL SECURITY` ensures the policies are respected if the
  service-role key is ever used directly via the Supabase JS client.

---

## 6. Rollback

To revert this migration, run:

```sql
-- Remove policies
DO $$
DECLARE
  pol RECORD;
  tables TEXT[] := ARRAY[
    'users','monthly_income','commitments',
    'commitment_payments','groups','group_members'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- Disable RLS
ALTER TABLE public.users               DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_income      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members       DISABLE ROW LEVEL SECURITY;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_monthly_income_user_id;
DROP INDEX IF EXISTS public.idx_monthly_income_month;
DROP INDEX IF EXISTS public.idx_commitments_user_id;
DROP INDEX IF EXISTS public.idx_commitments_group_id;
DROP INDEX IF EXISTS public.idx_commitment_payments_paid_by;
DROP INDEX IF EXISTS public.idx_commitment_payments_commitment_id;
DROP INDEX IF EXISTS public.idx_commitment_payments_month;
DROP INDEX IF EXISTS public.idx_groups_owner_id;
DROP INDEX IF EXISTS public.idx_group_members_user_id;
```
