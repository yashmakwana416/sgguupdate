-- Update delete policy to use soft delete (update is_active to false)
-- instead of actual row deletion
DROP POLICY IF EXISTS "Distributors can soft delete own active parties" ON public.parties;

-- Create a more permissive update policy for soft deletes
CREATE POLICY "Distributors can soft delete own active parties" 
ON public.parties 
FOR UPDATE 
USING (is_distributor() AND is_active = true AND created_by = auth.uid())
WITH CHECK (is_distributor() AND created_by = auth.uid());