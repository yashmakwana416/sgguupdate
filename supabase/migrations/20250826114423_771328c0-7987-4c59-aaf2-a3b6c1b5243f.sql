-- Add trigger to set created_by for parties
CREATE TRIGGER set_created_by_parties
  BEFORE INSERT ON public.parties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

-- Update the soft delete policy to be more explicit about soft deletes
DROP POLICY IF EXISTS "Distributors can soft delete own active parties" ON public.parties;

CREATE POLICY "Distributors can soft delete own parties" 
ON public.parties 
FOR UPDATE 
TO authenticated
USING (is_distributor() AND created_by = auth.uid())
WITH CHECK (is_distributor() AND created_by = auth.uid());