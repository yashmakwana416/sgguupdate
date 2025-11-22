-- Update the distributor create policy to not check created_by during insertion
-- since it will be set by the trigger
DROP POLICY IF EXISTS "Distributors can create parties" ON public.parties;
CREATE POLICY "Distributors can create parties" 
ON public.parties 
FOR INSERT 
WITH CHECK (is_distributor());

-- Ensure the trigger function sets created_by correctly
DROP TRIGGER IF EXISTS set_parties_created_by ON public.parties;
CREATE TRIGGER set_parties_created_by
BEFORE INSERT ON public.parties
FOR EACH ROW
EXECUTE FUNCTION public.set_created_by();