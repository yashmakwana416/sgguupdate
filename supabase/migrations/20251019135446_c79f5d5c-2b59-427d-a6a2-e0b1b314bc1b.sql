-- Update RLS policies so imported parties are only visible to superadmin
-- Drop the policy that allows anyone to see parties with no owner
DROP POLICY IF EXISTS "parties_select_no_owner" ON public.parties;
DROP POLICY IF EXISTS "Superadmin can view all parties" ON public.parties;

-- The existing policies already handle this correctly:
-- 1. "Superadmin can manage all parties" - superadmin sees everything
-- 2. "Distributors can manage own parties" - distributors only see where created_by = auth.uid()
-- So imported parties (created_by IS NULL) will only be visible to superadmin