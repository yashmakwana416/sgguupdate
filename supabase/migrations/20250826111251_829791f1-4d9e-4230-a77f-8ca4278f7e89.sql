-- Drop existing distributor policies for parties
DROP POLICY IF EXISTS "Distributors can view all active parties" ON public.parties;
DROP POLICY IF EXISTS "Distributors can update active parties" ON public.parties;
DROP POLICY IF EXISTS "Distributors can soft delete active parties" ON public.parties;

-- Create new policies for distributors to only manage their own parties
CREATE POLICY "Distributors can view own active parties" 
ON public.parties 
FOR SELECT 
USING (is_distributor() AND is_active = true AND created_by = auth.uid());

CREATE POLICY "Distributors can update own active parties" 
ON public.parties 
FOR UPDATE 
USING (is_distributor() AND is_active = true AND created_by = auth.uid());

CREATE POLICY "Distributors can soft delete own active parties" 
ON public.parties 
FOR DELETE 
USING (is_distributor() AND is_active = true AND created_by = auth.uid());

-- Add trigger to automatically set created_by when creating parties
CREATE TRIGGER set_parties_created_by
BEFORE INSERT ON public.parties
FOR EACH ROW
EXECUTE FUNCTION public.set_created_by();