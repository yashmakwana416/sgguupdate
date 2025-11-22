-- Update RLS policies so users only see their own parties
-- Drop existing policies
DROP POLICY IF EXISTS "superadmin_manage_all_parties" ON public.parties;
DROP POLICY IF EXISTS "distributor_read_own_parties" ON public.parties;
DROP POLICY IF EXISTS "distributor_insert_own_parties" ON public.parties;
DROP POLICY IF EXISTS "distributor_update_own_parties" ON public.parties;
DROP POLICY IF EXISTS "distributor_delete_own_parties" ON public.parties;

-- Create simple policies: users can only manage their own parties (superadmin and distributors)
CREATE POLICY "users_read_own_parties"
ON public.parties FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "users_insert_own_parties"
ON public.parties FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_update_own_parties"
ON public.parties FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_delete_own_parties"
ON public.parties FOR DELETE
USING (created_by = auth.uid());