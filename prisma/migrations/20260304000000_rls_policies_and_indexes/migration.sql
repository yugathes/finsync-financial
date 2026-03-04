-- ============================================================
-- Migration: RLS Policies & Missing Indexes
-- Date: 2026-03-04
-- Description:
--   1. Enable Row Level Security on all application tables.
--   2. Drop any legacy/permissive policies that expose data
--      across users or groups.
--   3. Add fine-grained RLS policies so that:
--      - Each user can only access their own records.
--      - Group members (status = 'accepted') can read/write
--        shared commitments and related payments in their group.
--      - Only group owners can mutate group metadata and membership.
--   4. Add missing indexes on user_id, group_id, and month columns
--      to improve query performance.
-- ============================================================


-- ============================================================
-- SECTION 1: Enable Row Level Security
-- ============================================================

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_income      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members       ENABLE ROW LEVEL SECURITY;

-- Prevent superuser-bypass of RLS (belt-and-suspenders for service role)
ALTER TABLE public.users               FORCE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_income      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.commitments         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.groups              FORCE ROW LEVEL SECURITY;
ALTER TABLE public.group_members       FORCE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 2: Drop Legacy / Overly-Permissive Policies
-- (Safe to run even if they do not yet exist.)
-- ============================================================

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
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        pol.policyname, tbl
      );
    END LOOP;
  END LOOP;
END $$;


-- ============================================================
-- SECTION 3: RLS Policies
-- ============================================================

-- -----------------------------------------------------------
-- 3a. users
--   Users may only read and update their own profile row.
--   INSERT is handled by Supabase Auth (auth.users trigger).
-- -----------------------------------------------------------

CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- -----------------------------------------------------------
-- 3b. monthly_income
--   Users may only access their own income records.
-- -----------------------------------------------------------

CREATE POLICY monthly_income_select_own
  ON public.monthly_income
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY monthly_income_insert_own
  ON public.monthly_income
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY monthly_income_update_own
  ON public.monthly_income
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY monthly_income_delete_own
  ON public.monthly_income
  FOR DELETE
  USING (auth.uid() = user_id);


-- -----------------------------------------------------------
-- 3c. commitments
--   - Owner (user_id) has full CRUD on their own commitments.
--   - Accepted group members may SELECT and UPDATE shared
--     commitments that belong to a group they are a member of.
-- -----------------------------------------------------------

CREATE POLICY commitments_select_own_or_group
  ON public.commitments
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      shared = true
      AND group_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.group_members gm
        WHERE gm.group_id = commitments.group_id
          AND gm.user_id  = auth.uid()
          AND gm.status   = 'accepted'
      )
    )
  );

CREATE POLICY commitments_insert_own
  ON public.commitments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY commitments_update_own_or_group
  ON public.commitments
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (
      shared = true
      AND group_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.group_members gm
        WHERE gm.group_id = commitments.group_id
          AND gm.user_id  = auth.uid()
          AND gm.status   = 'accepted'
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (
      shared = true
      AND group_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.group_members gm
        WHERE gm.group_id = commitments.group_id
          AND gm.user_id  = auth.uid()
          AND gm.status   = 'accepted'
      )
    )
  );

CREATE POLICY commitments_delete_own
  ON public.commitments
  FOR DELETE
  USING (auth.uid() = user_id);


-- -----------------------------------------------------------
-- 3d. commitment_payments
--   - The paying user (paid_by) has full CRUD on their own
--     payment records.
--   - Accepted group members may SELECT payments for shared
--     commitments within their group.
-- -----------------------------------------------------------

CREATE POLICY commitment_payments_select_own_or_group
  ON public.commitment_payments
  FOR SELECT
  USING (
    auth.uid() = paid_by
    OR EXISTS (
      SELECT 1
      FROM public.commitments c
      JOIN public.group_members gm
        ON gm.group_id = c.group_id
      WHERE c.id        = commitment_payments.commitment_id
        AND c.shared    = true
        AND gm.user_id  = auth.uid()
        AND gm.status   = 'accepted'
    )
  );

CREATE POLICY commitment_payments_insert_own
  ON public.commitment_payments
  FOR INSERT
  WITH CHECK (auth.uid() = paid_by);

CREATE POLICY commitment_payments_update_own
  ON public.commitment_payments
  FOR UPDATE
  USING    (auth.uid() = paid_by)
  WITH CHECK (auth.uid() = paid_by);

CREATE POLICY commitment_payments_delete_own
  ON public.commitment_payments
  FOR DELETE
  USING (auth.uid() = paid_by);


-- -----------------------------------------------------------
-- 3e. groups
--   - Owner has full CRUD.
--   - Accepted members may SELECT the group.
-- -----------------------------------------------------------

CREATE POLICY groups_select_owner_or_member
  ON public.groups
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1
      FROM public.group_members gm
      WHERE gm.group_id = groups.id
        AND gm.user_id  = auth.uid()
        AND gm.status   = 'accepted'
    )
  );

CREATE POLICY groups_insert_owner
  ON public.groups
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY groups_update_owner
  ON public.groups
  FOR UPDATE
  USING    (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY groups_delete_owner
  ON public.groups
  FOR DELETE
  USING (auth.uid() = owner_id);


-- -----------------------------------------------------------
-- 3f. group_members
--   - Group owner can SELECT, INSERT, UPDATE, DELETE any row
--     in their group.
--   - A member can SELECT their own membership row and UPDATE
--     it (e.g., to accept an invitation).
--   - A member can DELETE their own membership row (leave group).
-- -----------------------------------------------------------

CREATE POLICY group_members_select
  ON public.group_members
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id       = group_members.group_id
        AND g.owner_id = auth.uid()
    )
  );

CREATE POLICY group_members_insert
  ON public.group_members
  FOR INSERT
  WITH CHECK (
    -- group owner may invite anyone
    EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id       = group_members.group_id
        AND g.owner_id = auth.uid()
    )
    -- or the user is adding themselves (self-join / accept flow)
    OR auth.uid() = user_id
  );

CREATE POLICY group_members_update
  ON public.group_members
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id       = group_members.group_id
        AND g.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id       = group_members.group_id
        AND g.owner_id = auth.uid()
    )
  );

CREATE POLICY group_members_delete
  ON public.group_members
  FOR DELETE
  USING (
    -- member leaves group
    auth.uid() = user_id
    -- or owner removes member
    OR EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id       = group_members.group_id
        AND g.owner_id = auth.uid()
    )
  );


-- ============================================================
-- SECTION 4: Missing Indexes
-- ============================================================

-- monthly_income
CREATE INDEX IF NOT EXISTS idx_monthly_income_user_id
  ON public.monthly_income (user_id);

CREATE INDEX IF NOT EXISTS idx_monthly_income_month
  ON public.monthly_income (month);

-- commitments
CREATE INDEX IF NOT EXISTS idx_commitments_user_id
  ON public.commitments (user_id);

CREATE INDEX IF NOT EXISTS idx_commitments_group_id
  ON public.commitments (group_id);

-- commitment_payments
CREATE INDEX IF NOT EXISTS idx_commitment_payments_paid_by
  ON public.commitment_payments (paid_by);

CREATE INDEX IF NOT EXISTS idx_commitment_payments_commitment_id
  ON public.commitment_payments (commitment_id);

CREATE INDEX IF NOT EXISTS idx_commitment_payments_month
  ON public.commitment_payments (month);

-- groups
CREATE INDEX IF NOT EXISTS idx_groups_owner_id
  ON public.groups (owner_id);

-- group_members  (composite unique index already covers (group_id, user_id);
-- add a standalone user_id index for queries filtering by user only)
CREATE INDEX IF NOT EXISTS idx_group_members_user_id
  ON public.group_members (user_id);
