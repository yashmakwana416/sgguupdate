-- Step 1: Ensure superadmin role assignment
INSERT INTO public.user_roles(user_id, role)
SELECT id, 'superadmin'::public.app_role 
FROM auth.users 
WHERE email = 'smitmodi416@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Backfill ownership of all existing parties to superadmin
UPDATE public.parties
SET created_by = (SELECT id FROM auth.users WHERE email = 'smitmodi416@gmail.com')
WHERE created_by IS NULL OR created_by != (SELECT id FROM auth.users WHERE email = 'smitmodi416@gmail.com');

-- Step 3: Make is_superadmin() more resilient (role-first, email-fallback)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'superadmin'::public.app_role)
    OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'smitmodi416@gmail.com')
    OR EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'smitmodi416@gmail.com')
$$;

-- Step 4: Ensure created_by is always set on insert
CREATE TRIGGER parties_set_created_by
BEFORE INSERT ON public.parties
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Step 5: Reset and strengthen RLS policies for parties
DROP POLICY IF EXISTS "parties_select_no_owner" ON public.parties;
DROP POLICY IF EXISTS "Superadmin can manage all parties" ON public.parties;
DROP POLICY IF EXISTS "Distributors can manage own parties" ON public.parties;
DROP POLICY IF EXISTS "superadmin_manage_all_parties" ON public.parties;
DROP POLICY IF EXISTS "distributor_read_own_parties" ON public.parties;
DROP POLICY IF EXISTS "distributor_insert_own_parties" ON public.parties;
DROP POLICY IF EXISTS "distributor_update_own_parties" ON public.parties;
DROP POLICY IF EXISTS "distributor_delete_own_parties" ON public.parties;

-- Superadmin can manage everything
CREATE POLICY "superadmin_manage_all_parties"
ON public.parties FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- Distributors can only read their own parties
CREATE POLICY "distributor_read_own_parties"
ON public.parties FOR SELECT
USING (public.is_distributor() AND created_by = auth.uid());

-- Distributors can only insert their own parties
CREATE POLICY "distributor_insert_own_parties"
ON public.parties FOR INSERT
WITH CHECK (public.is_distributor() AND created_by = auth.uid());

-- Distributors can only update their own parties
CREATE POLICY "distributor_update_own_parties"
ON public.parties FOR UPDATE
USING (public.is_distributor() AND created_by = auth.uid())
WITH CHECK (public.is_distributor() AND created_by = auth.uid());

-- Distributors can only delete their own parties
CREATE POLICY "distributor_delete_own_parties"
ON public.parties FOR DELETE
USING (public.is_distributor() AND created_by = auth.uid());

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS parties_created_by_idx ON public.parties(created_by);
CREATE INDEX IF NOT EXISTS parties_name_idx ON public.parties(name);