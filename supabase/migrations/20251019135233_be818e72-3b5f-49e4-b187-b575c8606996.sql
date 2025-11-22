-- Restore RLS policies for parties table so imports work
-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

-- Drop existing parties policies if any (avoid duplicates)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parties' AND policyname='Superadmin can manage all parties') THEN
    DROP POLICY "Superadmin can manage all parties" ON public.parties;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parties' AND policyname='Distributors can manage own parties') THEN
    DROP POLICY "Distributors can manage own parties" ON public.parties;
  END IF;
END $$;

-- Superadmin full access
CREATE POLICY "Superadmin can manage all parties"
ON public.parties
FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Distributor can only manage own rows
CREATE POLICY "Distributors can manage own parties"
ON public.parties
FOR ALL
USING (is_distributor() AND created_by = auth.uid())
WITH CHECK (is_distributor() AND created_by = auth.uid());